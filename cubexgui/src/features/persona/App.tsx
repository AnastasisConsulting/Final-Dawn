import React, { useState, useEffect, useRef } from 'react';
import LibraryPanel from './components/LibraryPanel';
import ChatPanel from './components/ChatPanel';
import ConfigPanel from './components/ConfigPanel';
import BatchGenerator from './components/BatchGenerator';
import { 
  Character, 
  Lorebook, 
  Message, 
  GenerationSettings, 
  DEFAULT_CHARACTER, 
  DEFAULT_LOREBOOK, 
  DEFAULT_SETTINGS,
  DEFAULT_SYSTEM_PROMPTS,
  SystemPromptTemplate,
  Role,
  LorebookEntry
} from './types';
import { generateGeminiResponse, ChatResponse } from './services/geminiService';
import { generateOllamaResponse, fetchOllamaModels, warmUpOllamaModel } from './services/ollamaService';

// Helper for local storage
const loadState = <T,>(key: string, defaultVal: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultVal;
  } catch (e) {
    console.error(`Failed to load ${key}`, e);
    return defaultVal;
  }
};

const App: React.FC = () => {
  // --- STATE WITH PERSISTENCE ---
  
  const [characters, setCharacters] = useState<Character[]>(() => 
    loadState('gemini_rp_chars', [DEFAULT_CHARACTER])
  );
  
  const [lorebooks, setLorebooks] = useState<Lorebook[]>(() => 
    loadState('gemini_rp_lore', [DEFAULT_LOREBOOK])
  );
  
  const [systemPrompts, setSystemPrompts] = useState<SystemPromptTemplate[]>(() => 
    loadState('gemini_rp_prompts', DEFAULT_SYSTEM_PROMPTS)
  );

  const [settings, setSettings] = useState<GenerationSettings>(() => 
    loadState('gemini_rp_settings', DEFAULT_SETTINGS)
  );

  const [activeCharId, setActiveCharId] = useState<string>(() => 
    loadState('gemini_rp_active_char', DEFAULT_CHARACTER.id)
  );

  const [activeLoreId, setActiveLoreId] = useState<string>(() => 
    loadState('gemini_rp_active_lore', DEFAULT_LOREBOOK.id)
  );

  // Chat Sessions (Keyed by Character ID)
  const [chatSessions, setChatSessions] = useState<Record<string, Message[]>>(() => 
    loadState('gemini_rp_sessions', {})
  );

  // --- UI STATE ---
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  // --- DERIVED STATE ---
  const activeCharacter = characters.find(c => c.id === activeCharId) || characters[0];
  const activeLorebook = lorebooks.find(l => l.id === activeLoreId) || lorebooks[0];
  
  // Get current messages for active character, or init if empty
  const messages = chatSessions[activeCharId] || [];

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => localStorage.setItem('gemini_rp_chars', JSON.stringify(characters)), [characters]);
  useEffect(() => localStorage.setItem('gemini_rp_lore', JSON.stringify(lorebooks)), [lorebooks]);
  useEffect(() => localStorage.setItem('gemini_rp_prompts', JSON.stringify(systemPrompts)), [systemPrompts]);
  useEffect(() => localStorage.setItem('gemini_rp_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('gemini_rp_sessions', JSON.stringify(chatSessions)), [chatSessions]);
  useEffect(() => localStorage.setItem('gemini_rp_active_char', activeCharId), [activeCharId]);
  useEffect(() => localStorage.setItem('gemini_rp_active_lore', activeLoreId), [activeLoreId]);

  // --- INITIALIZATION EFFECTS ---
  
  // Ensure current character has a start message if session is empty
  useEffect(() => {
    if ((!chatSessions[activeCharId] || chatSessions[activeCharId].length === 0) && activeCharacter) {
      setChatSessions(prev => ({
        ...prev,
        [activeCharId]: [{
          id: 'init',
          role: Role.Model,
          content: activeCharacter.firstMessage,
          timestamp: Date.now()
        }]
      }));
    }
  }, [activeCharId, activeCharacter, chatSessions]);

  // Ollama Setup
  useEffect(() => {
      if (settings.provider === 'ollama') {
          handleRefreshOllama();
      }
  }, [settings.ollamaUrl, settings.provider]);

  useEffect(() => {
      if (settings.provider === 'ollama' && settings.model) {
          warmUpOllamaModel(settings.ollamaUrl, settings.model);
      }
  }, [settings.model, settings.provider]);


  // --- HANDLERS ---

  const handleSelectCharacter = (id: string) => {
    setActiveCharId(id);
  };

  const handleCreateCharacter = () => {
    const newChar: Character = {
      ...DEFAULT_CHARACTER,
      id: Date.now().toString(),
      name: 'New Character',
      firstMessage: 'Hello.'
    };
    setCharacters([...characters, newChar]);
    setActiveCharId(newChar.id);
  };

  const handleImportCharacter = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);
        
        // Basic validation check
        if (!json.name || !json.description) throw new Error("Invalid character file");

        const newChar: Character = {
            ...DEFAULT_CHARACTER, // Defaults for missing fields
            ...json,
            id: json.id && !characters.find(c => c.id === json.id) ? json.id : `imported_${Date.now()}`
        };
        
        setCharacters(prev => [...prev, newChar]);
        setActiveCharId(newChar.id);
        setStatusMessage(`Imported ${newChar.name}`);
      } catch (err) {
        console.error(err);
        setStatusMessage("Failed to import: Invalid JSON");
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = ''; 
  };

  const handleExportCharacter = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeCharacter, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${activeCharacter.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setStatusMessage(`Exported ${activeCharacter.name}`);
  };

  const handleResetStorage = () => {
      if(window.confirm("Are you sure? This will delete all characters, lorebooks, and chats.")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const handleSaveSystemPrompt = (name: string, content: string) => {
    const newPrompt: SystemPromptTemplate = {
      id: `sp_${Date.now()}`,
      name,
      content
    };
    setSystemPrompts([...systemPrompts, newPrompt]);
    setStatusMessage(`Saved preset: ${name}`);
  };

  const handleRefreshOllama = async () => {
      const models = await fetchOllamaModels(settings.ollamaUrl);
      setOllamaModels(models);
      if (models.length > 0 && !models.includes(settings.model)) {
          setSettings(prev => ({...prev, model: models[0]}));
      }
  };

  const handleBatchGenerate = async (theme: string, count: number, type: 'character' | 'scenario', filters?: any) => {
    setIsBatchGenerating(true);
    setStatusMessage(`Generating ${count} ${type}s...`);
    
    const schema = type === 'character' 
        ? `{ "name": string, "description": string, "personality": string, "firstMessage": string, "scenario": string }`
        : `{ "name": string, "content": string, "keywords": string[] } (for scenario, treat 'content' as the scenario description)`;

    let constraints = "";
    if (filters) {
        if (filters.gender) constraints += `- Gender: ${filters.gender}\n`;
        if (filters.race) constraints += `- Race/Species: ${filters.race}\n`;
        if (filters.ageMin || filters.ageMax) constraints += `- Age: ${filters.ageMin || '0'} to ${filters.ageMax || 'unknown'}\n`;
        if (filters.disposition) constraints += `- Disposition: ${filters.disposition}\n`;
        if (filters.height) constraints += `- Height: ${filters.height}\n`;
        if (filters.weight) constraints += `- Weight: ${filters.weight}\n`;
        if (filters.bodyType) constraints += `- Body Type: ${filters.bodyType}\n`;
    }

    const prompt = `Generate ${count} distinct ${type}s based on the theme: "${theme}". 
    ${constraints ? `MUST FOLLOW THESE CONSTRAINTS:\n${constraints}` : ''}
    Return a JSON ARRAY of objects matching this schema: ${schema}.
    Output ONLY valid JSON. Do not include markdown formatting or explanations.`;

    try {
        const payload = {
            character: activeCharacter, 
            chatHistory: [],
            lorebook: activeLorebook,
            settings: settings,
            userMessage: prompt
        };
        
        let responseText = "";
        if (settings.provider === 'gemini') {
             const res = await generateGeminiResponse(payload);
             responseText = res.text;
        } else {
             const res = await generateOllamaResponse(payload);
             responseText = res.text;
        }

        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (Array.isArray(parsed)) {
            const newChars = parsed.map((c: any) => ({
                ...DEFAULT_CHARACTER,
                id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: c.name || "Unknown",
                description: c.description || (c.content ? c.content : "Generated content"),
                personality: c.personality || "Generated personality",
                firstMessage: c.firstMessage || `You encounter ${c.name}.`,
                scenario: c.scenario || c.content || "Emergent scenario.",
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random`
            }));
            
            setCharacters(prev => [...prev, ...newChars]);
            setStatusMessage(`Generated ${newChars.length} items!`);
            setShowBatchModal(false);
        }

    } catch (e) {
        console.error(e);
        setStatusMessage("Batch generation failed. Check console.");
    } finally {
        setIsBatchGenerating(false);
    }
  };

  // --- TOOL EXECUTORS ---
  const executeTool = (name: string, args: any): string => {
    if (name === 'create_character') {
      const newChar: Character = {
        id: `char_${Date.now()}`,
        name: args.name || "Unknown",
        description: args.description || "",
        personality: args.personality || "",
        firstMessage: args.firstMessage || "Greetings.",
        scenario: args.scenario || "Emergent encounter.",
        systemPrompt: "Roleplay as this character.",
        postHistoryInstructions: "",
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(args.name)}&background=random`
      };
      setCharacters(prev => [...prev, newChar]);
      setStatusMessage(`Created character: ${newChar.name}`);
      return JSON.stringify({ status: "success", message: `Character card '${newChar.name}' created and saved to library.` });
    }

    if (name === 'add_lorebook_entry') {
      const newEntry: LorebookEntry = {
        id: `lore_${Date.now()}`,
        keywords: args.keywords || [],
        content: args.content || "",
        enabled: true
      };
      setLorebooks(prev => {
        const active = prev.find(l => l.id === activeLoreId);
        if (!active) return prev;
        const updated = { ...active, entries: [...active.entries, newEntry] };
        return prev.map(l => l.id === activeLoreId ? updated : l);
      });
      setStatusMessage(`Added lore: ${args.keywords[0]}`);
      return JSON.stringify({ status: "success", message: `Lorebook entry created for keywords: ${args.keywords.join(', ')}` });
    }

    return JSON.stringify({ status: "error", message: "Unknown tool" });
  };

  // --- MAIN CHAT LOOP ---
  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.User,
      content: text,
      timestamp: Date.now()
    };
    
    // Optimistic Update
    const currentSessionMessages = chatSessions[activeCharId] || [];
    let currentHistory = [...currentSessionMessages, userMsg];
    
    // Update session state
    setChatSessions(prev => ({
        ...prev,
        [activeCharId]: currentHistory
    }));

    setIsLoading(true);
    setStatusMessage(settings.provider === 'ollama' ? "Thinking (Local)..." : "Thinking (Cloud)...");

    try {
      let turnFinished = false;
      let loopCount = 0;
      const MAX_LOOPS = 5; 

      while (!turnFinished && loopCount < MAX_LOOPS) {
        loopCount++;
        
        const payload = {
          character: activeCharacter,
          chatHistory: currentHistory,
          lorebook: activeLorebook,
          settings: settings,
          userMessage: undefined 
        };

        let response: ChatResponse;
        if (settings.provider === 'gemini') {
            response = await generateGeminiResponse(payload);
        } else {
            response = await generateOllamaResponse(payload);
        }

        if (response.toolCalls && response.toolCalls.length > 0) {
          const toolCallMsg: Message = {
            id: Date.now().toString(),
            role: Role.Model,
            content: "", 
            timestamp: Date.now(),
            toolCalls: response.toolCalls
          };
          currentHistory = [...currentHistory, toolCallMsg];
          setChatSessions(prev => ({ ...prev, [activeCharId]: currentHistory }));

          for (const call of response.toolCalls) {
            setStatusMessage(`Executing: ${call.name}...`);
            const result = executeTool(call.name, call.args);
            
            const toolResponseMsg: Message = {
              id: Date.now().toString() + "_resp",
              role: Role.Function,
              content: "Tool execution complete",
              timestamp: Date.now(),
              functionResponse: {
                name: call.name,
                response: JSON.parse(result)
              }
            };
            currentHistory = [...currentHistory, toolResponseMsg];
            setChatSessions(prev => ({ ...prev, [activeCharId]: currentHistory }));
          }
        } else {
          if (response.text) {
             const modelMsg: Message = {
              id: Date.now().toString(),
              role: Role.Model,
              content: response.text,
              timestamp: Date.now()
            };
            currentHistory = [...currentHistory, modelMsg];
            setChatSessions(prev => ({ ...prev, [activeCharId]: currentHistory }));
          }
          turnFinished = true;
        }
      }

    } catch (e) {
      console.error(e);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: Role.System,
        content: `Error: ${(e as Error).message}`,
        timestamp: Date.now()
      };
      setChatSessions(prev => ({ ...prev, [activeCharId]: [...currentHistory, errorMsg] }));
    } finally {
      setIsLoading(false);
      setStatusMessage("");
    }
  };

  const handleUpdateCharacter = (updatedChar: Character) => {
    setCharacters(characters.map(c => c.id === updatedChar.id ? updatedChar : c));
  };

  const handleUpdateLorebook = (updatedLore: Lorebook) => {
    setLorebooks(lorebooks.map(l => l.id === updatedLore.id ? updatedLore : l));
  };

  return (
    <div className="flex h-screen w-screen bg-black text-gray-100 font-sans overflow-hidden">
      <BatchGenerator 
        isOpen={showBatchModal} 
        onClose={() => setShowBatchModal(false)}
        onGenerate={handleBatchGenerate}
        isGenerating={isBatchGenerating}
        provider={settings.provider}
      />

      <div className="hidden md:block">
        <LibraryPanel 
          characters={characters}
          activeCharacterId={activeCharId}
          onSelectCharacter={handleSelectCharacter}
          onCreateCharacter={handleCreateCharacter}
          onOpenBatchCreate={() => setShowBatchModal(true)}
          lorebooks={lorebooks}
          activeLorebookId={activeLoreId}
          onSelectLorebook={setActiveLoreId}
          onImportCharacter={handleImportCharacter}
          onExportCharacter={handleExportCharacter}
        />
      </div>

      <div className="flex-1 flex flex-col relative h-full max-w-full">
         <ChatPanel 
           messages={messages}
           onSendMessage={handleSendMessage}
           isLoading={isLoading}
           charName={activeCharacter.name}
         />
         {statusMessage && (
           <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-900/80 text-blue-100 px-4 py-1 rounded-full text-xs backdrop-blur-sm border border-blue-500/30 animate-pulse z-50 pointer-events-none">
             {statusMessage}
           </div>
         )}
      </div>

      <div className="hidden lg:block">
        <ConfigPanel 
          character={activeCharacter}
          onUpdateCharacter={handleUpdateCharacter}
          lorebook={activeLorebook}
          onUpdateLorebook={handleUpdateLorebook}
          settings={settings}
          onUpdateSettings={setSettings}
          systemPrompts={systemPrompts}
          onSaveSystemPrompt={handleSaveSystemPrompt}
          onRefreshOllama={handleRefreshOllama}
          ollamaModels={ollamaModels}
          previewPayload={{
             character: activeCharacter,
             chatHistory: messages,
             lorebook: activeLorebook,
             settings: settings,
             userMessage: "(Next User Message)"
          }}
          onResetStorage={handleResetStorage}
        />
      </div>
    </div>
  );
};

export default App;