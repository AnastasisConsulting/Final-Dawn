// G_ynthetic/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import { 
    FaceType, MemoryNode, ContentRegistry, HashKey, 
    RoleplayConfig, AIProvider, CharCardV2, LogItem, SavedCard, LLMConfig 
} from './types';
import { generateHash, getNextCoordinate, cosineSimilarity } from './services/mnemosyneUtils';
import { getOllamaModels, warmupModel } from './services/ollamaService';
import { runLLMGenerationAndAnalysis } from './services/runLLMService';
import { LatticeVisualizer } from './components/LatticeVisualizer';
import { NodeDetail } from './components/NodeDetail';

// Fallback vector if API fails (768 dims zeroed - standard for Gemini/Ollama)
const EMPTY_VECTOR_768 = new Array(768).fill(0);

const DEFAULT_CONFIG: RoleplayConfig = {
    worldName: 'G_ynthetic',
    characterName: 'User',
    persona: 'You are the G_ynthetic. You are a holographic memory system. You answer concisely and philosophically.'
};

// Helper for avatar display
const AvatarDisplay = ({ name, avatar, size = "md", className = "" }: { name: string, avatar?: string, size?: "sm" | "md" | "lg" | "xl", className?: string }) => {
    const sizeClasses = {
        sm: "w-6 h-6 text-[10px]",
        md: "w-10 h-10 text-sm",
        lg: "w-16 h-16 text-lg",
        xl: "w-24 h-24 text-2xl"
    };
    
    const initial = name ? name.charAt(0).toUpperCase() : "?";
    
    // Generate a consistent color based on name hash
    const getColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    if (avatar) {
        return (
            <img 
                src={avatar} 
                alt={name} 
                className={`rounded-md object-cover border border-white/10 ${sizeClasses[size]} ${className}`} 
            />
        );
    }

    return (
        <div 
            className={`rounded-md flex items-center justify-center font-bold text-white/80 border border-white/10 ${sizeClasses[size]} ${className}`}
            style={{ backgroundColor: getColor(name || 'User') }}
        >
            {initial}
        </div>
    );
};

const App = () => {
  // --- State ---
  // Lattices: Array of Arrays. Each inner array is max 343 nodes.
  const [lattices, setLattices] = useState<MemoryNode[][]>([[]]); 
  const [registry, setRegistry] = useState<ContentRegistry>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // View State
  const [isQuantumMode, setIsQuantumMode] = useState(false);
  const [quantumSlice, setQuantumSlice] = useState<MemoryNode[]>([]);
  const [viewLatticeIndex, setViewLatticeIndex] = useState(0);
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null);
  
  // Configuration State
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'library' | 'creator' | 'ollama' | 'cloud'>('general');
  const [rpConfig, setRpConfig] = useState<RoleplayConfig>(DEFAULT_CONFIG);
  const [tempConfig, setTempConfig] = useState<RoleplayConfig>(DEFAULT_CONFIG);
  const [pendingFirstMes, setPendingFirstMes] = useState<string | null>(null);

  // Library State
  const [library, setLibrary] = useState<SavedCard[]>([]);

  // Character Creator State
  const [creatorName, setCreatorName] = useState('');
  const [creatorDesc, setCreatorDesc] = useState('');
  const [creatorPers, setCreatorPers] = useState('');
  const [creatorScen, setCreatorScen] = useState('');
  const [creatorFirstMes, setCreatorFirstMes] = useState('');
  const [creatorExample, setCreatorExample] = useState('');
  const [creatorAvatar, setCreatorAvatar] = useState<string>('');

  // AI Provider State
  const [aiProvider, setAiProvider] = useState<AIProvider>('ollama'); // Default to Ollama for local-first
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('');
  const [availableOllamaModels, setAvailableOllamaModels] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  
  // Cloud API Key States
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenAIApiKey] = useState('');
  const [anthropicApiKey, setAnthropicApiKey] = useState('');

  // Linear Log
  const [linearLog, setLinearLog] = useState<LogItem[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---

  // Load Library from LocalStorage on mount
  useEffect(() => {
      const savedLib = localStorage.getItem('mnemosyne_library');
      if (savedLib) {
          try {
              setLibrary(JSON.parse(savedLib));
          } catch (e) {
              console.error("Failed to load library", e);
          }
      }
  }, []);

  // Save Library to LocalStorage whenever it changes
  useEffect(() => {
      localStorage.setItem('mnemosyne_library', JSON.stringify(library));
  }, [library]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [linearLog, isLoading]);

  // Update View Index if we create a new lattice and we are watching the tail
  useEffect(() => {
    // If we are watching the last lattice, keep watching it when a new one is born
    if (lattices.length - 1 > viewLatticeIndex) {
        // Optional: Auto-switch to new lattice? 
        // Let's stay on current view unless user switches, or if it was empty.
        if (lattices[viewLatticeIndex].length === 343) {
             setViewLatticeIndex(lattices.length - 1);
        }
    }
  }, [lattices.length, viewLatticeIndex]);

  // --- Core Logic: Write to Mnemosyne ---
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const currentUserInput = input;
    setInput('');
    setIsLoading(true);
    
    // Snapshot current persona for history
    const userLogItem: LogItem = { 
        role: 'user', 
        text: currentUserInput,
        name: rpConfig.characterName,
        avatar: rpConfig.avatar
    };

    const newLog = [...linearLog, userLogItem];
    setLinearLog(newLog);

    try {
      // 1. Prepare Universal Configuration
      const systemPrompt = `
        ${rpConfig.persona}
        
        [SYSTEM CONTEXT]
        Current World: ${rpConfig.worldName}
        User's Name: ${rpConfig.characterName}
        
        [INSTRUCTION]
        Engage in the roleplay. Adhere strictly to the persona described.
      `;

      const llmConfig: LLMConfig = {
          aiProvider,
          systemInstruction: systemPrompt,
          geminiApiKey,
          openaiApiKey,
          anthropicApiKey,
          ollamaUrl,
          ollamaModel,
      };

      // 2. DISPATCH to Universal LLM Service
      const { aiResponseText, analysis } = await runLLMGenerationAndAnalysis(
          newLog,
          currentUserInput,
          llmConfig
      );

      // 4. Hash Components (Adaptation for the 6 faces)
      const inputHash = generateHash(currentUserInput);
      const outputHash = generateHash(aiResponseText);
      const sceneHash = generateHash(analysis.scene);
      const embeddingHash = generateHash(analysis.embedding);
      
      // The analysis.tags field contains the normalized content (array or structured object)
      const tagsContent = Array.isArray(analysis.tags) 
                          ? analysis.tags 
                          : JSON.stringify(analysis.tags); 
      const tagsHash = generateHash(tagsContent);
      
      const namesHash = generateHash(analysis.names);

      // 5. Update Registry (Content Layer - Global)
      setRegistry(prev => ({
        ...prev,
        [inputHash]: currentUserInput,
        [outputHash]: aiResponseText,
        [sceneHash]: analysis.scene,
        [embeddingHash]: analysis.embedding, 
        [tagsHash]: tagsContent, // Store the unified content
        [namesHash]: analysis.names
      }));

      // 6. Mint Index Node (Lattice Layer)
      setLattices(prev => {
        // Get current active lattice (last one)
        const activeIndex = prev.length - 1;
        const activeLattice = prev[activeIndex];

        const newNodeFaces = {
            [FaceType.FRONT]: inputHash,
            [FaceType.BACK]: outputHash,
            [FaceType.TOP]: sceneHash,
            [FaceType.BOTTOM]: embeddingHash,
            [FaceType.LEFT]: tagsHash,
            [FaceType.RIGHT]: namesHash
        };

        // Check Capacity
        if (activeLattice.length >= 343) {
            // Create NEW Lattice
            const nextCoord = { x: 0, y: 0, z: 0 };
            const newIndex = activeIndex + 1;
            
            const newNode: MemoryNode = {
                x: nextCoord.x, y: nextCoord.y, z: nextCoord.z,
                latticeIndex: newIndex,
                timestamp: Date.now(),
                faces: newNodeFaces
            };
            return [...prev, [newNode]];
        } else {
            // Append to current
            const nextCoord = getNextCoordinate(activeLattice.length);
            const newNode: MemoryNode = {
                x: nextCoord.x, y: nextCoord.y, z: nextCoord.z,
                latticeIndex: activeIndex,
                timestamp: Date.now(),
                faces: newNodeFaces
            };
            
            const newLattices = [...prev];
            newLattices[activeIndex] = [...activeLattice, newNode];
            return newLattices;
        }
      });

      setLinearLog(prev => [...prev, { role: 'model', text: aiResponseText }]);

    } catch (error) {
      console.error("Mnemosyne Error:", error);
      setLinearLog(prev => [...prev, { role: 'system', text: "Error: Memory Write Failed. " + (error as any).message }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Quantum Retrieval Logic (Global) ---
  const toggleQuantumMode = async () => {
    if (!isQuantumMode) {
        // Get all nodes flattened
        const allNodes = lattices.flat();
        
        if (allNodes.length === 0) {
            setQuantumSlice([]);
            setIsQuantumMode(true);
            return;
        }

        setIsLoading(true);
        // Use the very last node of the last lattice as the query anchor
        const lastNode = allNodes[allNodes.length - 1];
        const lastVectorHash = lastNode.faces[FaceType.BOTTOM];
        const queryVector = registry[lastVectorHash] as number[] || EMPTY_VECTOR_768; // Use 768 fallback

        // Compute similarity across ENTIRE history
        const scoredNodes = allNodes.map(node => {
            const nodeVectorHash = node.faces[FaceType.BOTTOM];
            const nodeVector = registry[nodeVectorHash] as number[] || EMPTY_VECTOR_768;
            
            // NOTE: Vector dimensions must match for an accurate comparison.
            const score = cosineSimilarity(queryVector, nodeVector);
            return { node, score };
        });

        scoredNodes.sort((a, b) => b.score - a.score);
        
        // Take top 49 from ANY lattice
        const top49 = scoredNodes.slice(0, 49).map(sn => sn.node);
        
        setQuantumSlice(top49);
        setIsQuantumMode(true);
        setIsLoading(false);
    } else {
        setIsQuantumMode(false);
    }
  };

  const saveConfig = () => {
      setRpConfig(tempConfig);
      setShowConfig(false);
      
      if (pendingFirstMes) {
          setLinearLog([{ role: 'model', text: pendingFirstMes }]);
          setPendingFirstMes(null);
      }
  };

  // --- Ollama Handlers ---
  const fetchOllamaModels = async () => {
      try {
          const models = await getOllamaModels(ollamaUrl);
          setAvailableOllamaModels(models);
          if (models.length > 0 && !ollamaModel) {
              setOllamaModel(models[0]);
          }
          setOllamaStatus('ok');
      } catch (e) {
          setOllamaStatus('error');
          alert("Could not connect to Ollama. Check URL and CORS.");
      }
  };

  const handleWarmup = async () => {
      if (!ollamaModel) return;
      setIsLoading(true);
      try {
          await warmupModel(ollamaUrl, ollamaModel);
          alert(`Model ${ollamaModel} warmed up.`);
      } catch (e) {
          alert("Warmup failed.");
      } finally {
          setIsLoading(false);
      }
  };

  // --- Character Creator / Library Handlers ---
  
  const handleExportCard = () => {
    const card: CharCardV2 = {
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data: {
            name: creatorName || "Unnamed",
            description: creatorDesc,
            personality: creatorPers,
            scenario: creatorScen,
            first_mes: creatorFirstMes,
            mes_example: creatorExample
        }
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(card, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${creatorName.replace(/\s+/g, '_') || "character"}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleSaveToLibrary = () => {
      if (!creatorName) {
          alert("Character needs a name to be saved.");
          return;
      }
      
      const newCard: SavedCard = {
          id: generateHash(creatorName + Date.now()),
          name: creatorName,
          description: creatorDesc,
          personality: creatorPers,
          scenario: creatorScen,
          first_mes: creatorFirstMes,
          mes_example: creatorExample,
          avatar: creatorAvatar,
          specVersion: '2.0'
      };

      setLibrary(prev => [...prev, newCard]);
      alert("Saved to Library!");
      setActiveTab('library');
  };

  const handleUseCreatedCard = () => {
      if (!creatorName) {
          alert("Character needs a name.");
          return;
      }

      const newPersona = `
Name: ${creatorName}
Description: ${creatorDesc}
Personality: ${creatorPers}
Scenario: ${creatorScen}

Dialog Examples:
${creatorExample}
      `.trim();

      setTempConfig(prev => ({
          ...prev,
          persona: newPersona
      }));
      
      if (creatorFirstMes) {
          setPendingFirstMes(creatorFirstMes);
      }

      alert(`Loaded ${creatorName} into configuration.`);
      setActiveTab('general');
  };

  const handleLoadFromLibrary = (card: SavedCard) => {
      const newPersona = `
Name: ${card.name}
Description: ${card.description}
Personality: ${card.personality}
Scenario: ${card.scenario}

Dialog Examples:
${card.mes_example}
      `.trim();

      setTempConfig(prev => ({
          ...prev,
          persona: newPersona,
          characterName: "User", // Reset user name or keep? Usually user defines their own name in config.
          // Optionally, if the card *is* the user, we'd set it. 
          // But usually cards are the AI. 
      }));
      
      // Wait, if this card is meant to be the AI Persona:
      // Update the Persona field.
      // And if there's a first message, queue it.
      setPendingFirstMes(card.first_mes);

      // Update Creator fields to match so user can edit
      setCreatorName(card.name);
      setCreatorDesc(card.description);
      setCreatorPers(card.personality);
      setCreatorScen(card.scenario);
      setCreatorFirstMes(card.first_mes);
      setCreatorExample(card.mes_example);
      setCreatorAvatar(card.avatar || "");

      alert(`Loaded ${card.name} into configuration.`);
      setActiveTab('general');
  };

  const handleDeleteCard = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm("Delete this card from library?")) {
          setLibrary(prev => prev.filter(c => c.id !== id));
      }
  };

  // --- Import Handlers ---
  const parseJsonCard = (json: any): SavedCard | null => {
      try {
          let name = "", description = "", personality = "", scenario = "", first_mes = "", mes_example = "";
          
          // V2 Spec
          if (json.spec === 'chara_card_v2' && json.data) {
              ({ name, description, personality, scenario, first_mes, mes_example } = json.data);
          } 
          // V1 Spec
          else if (json.name) {
              ({ name, description, personality, scenario, first_mes, mes_example } = json);
          } else {
              return null;
          }

          return {
              id: generateHash(name + Date.now() + Math.random()),
              name: name || "Unknown",
              description: description || "",
              personality: personality || "",
              scenario: scenario || "",
              first_mes: first_mes || "",
              mes_example: mes_example || "",
              specVersion: '2.0',
              avatar: "" // JSON imports typically don't have inline images, handled separately
          };
      } catch (e) {
          return null;
      }
  };

  const handleCardImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              const card = parseJsonCard(json);
              if (card) {
                  setCreatorName(card.name);
                  setCreatorDesc(card.description);
                  setCreatorPers(card.personality);
                  setCreatorScen(card.scenario);
                  setCreatorFirstMes(card.first_mes);
                  setCreatorExample(card.mes_example);
                  setCreatorAvatar("");
                  
                  // Auto-switch to creator tab to let user add avatar or save
                  setActiveTab('creator');
              } else {
                  alert("Invalid Card Format");
              }
          } catch (err) {
              alert("Failed to parse JSON card.");
          }
      };
      reader.readAsText(file);
  };

  const handleFolderImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      
      let count = 0;
      Array.from(files).forEach(file => {
          if (file.name.endsWith('.json')) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                  try {
                      const json = JSON.parse(ev.target?.result as string);
                      const card = parseJsonCard(json);
                      if (card) {
                          setLibrary(prev => {
                              // Deduplicate by name roughly
                              if (prev.some(c => c.name === card.name)) return prev;
                              return [...prev, card];
                          });
                          count++;
                      }
                  } catch (e) {
                      // ignore bad files
                  }
              };
              reader.readAsText(file);
          }
      });
      alert("Scanning folder for .json cards...");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              const result = ev.target?.result as string;
              setCreatorAvatar(result);
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="h-screen w-screen bg-black flex overflow-hidden font-sans text-neutral-200 selection:bg-cyan-500/30">
      
      {/* LEFT: Visualization Pane */}
      <div className="w-1/2 h-full border-r border-white/10 relative flex flex-col bg-gradient-to-br from-neutral-900 via-black to-neutral-900">
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
         </div>

         <LatticeVisualizer 
            lattice={isQuantumMode ? quantumSlice : lattices[viewLatticeIndex] || []}
            totalLattices={lattices.length}
            currentViewIndex={viewLatticeIndex}
            isQuantumMode={isQuantumMode}
            registry={registry}
            onNodeClick={setSelectedNode}
            onChangeLatticeView={setViewLatticeIndex}
         />
      </div>

      {/* RIGHT: Interface Pane */}
      <div className="w-1/2 h-full flex flex-col bg-black/90 relative">
        
        {/* Top Bar */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
                <AvatarDisplay name={rpConfig.characterName} avatar={rpConfig.avatar} size="sm" />
                <div className="flex flex-col">
                    <h1 className="font-bold tracking-widest text-lg text-white leading-none">
                        {rpConfig.worldName.toUpperCase()}
                    </h1>
                    <span className="text-[10px] text-neutral-500 font-mono">
                        TOTAL_MEM: {lattices.flat().length} | {aiProvider.toUpperCase()}
                    </span>
                </div>
            </div>
            <div className="flex gap-2">
                 <button 
                    onClick={() => {
                        setTempConfig(rpConfig);
                        setShowConfig(true);
                    }}
                    className="px-3 py-1 text-xs font-bold tracking-wider border border-neutral-700 text-neutral-400 hover:border-white hover:text-white transition-all"
                 >
                    ⚙ SETTINGS
                 </button>
                 <button 
                    onClick={toggleQuantumMode}
                    className={`px-4 py-1 text-xs font-bold tracking-wider border transition-all duration-300 ${
                        isQuantumMode 
                        ? 'border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)] bg-purple-900/20' 
                        : 'border-neutral-700 text-neutral-500 hover:border-cyan-500 hover:text-cyan-400'
                    }`}
                 >
                    {isQuantumMode ? '⚡ COLLAPSE' : '○ RECALL'}
                 </button>
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide relative">
            {linearLog.length === 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-30 pointer-events-none">
                    <div className="text-6xl mb-4">⌬</div>
                    <p>INITIALIZING NARRATIVE PROTOCOLS...</p>
                </div>
            )}
            
            {linearLog.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar for Chat */}
                    <div className="flex-shrink-0 mt-1">
                        {msg.role === 'user' ? (
                            <AvatarDisplay name={msg.name || 'User'} avatar={msg.avatar} size="md" />
                        ) : (
                             <div className="w-10 h-10 rounded-md bg-cyan-900 flex items-center justify-center border border-cyan-500/30 text-cyan-400">
                                 ⌬
                             </div>
                        )}
                    </div>

                    <div className={`max-w-[80%] p-4 rounded-sm border text-sm leading-relaxed ${
                        msg.role === 'user' 
                        ? 'border-cyan-900/50 bg-cyan-950/10 text-cyan-100' 
                        : msg.role === 'system'
                        ? 'border-red-900/50 text-red-400 font-mono'
                        : 'border-white/10 bg-neutral-900/30 text-gray-300'
                    }`}>
                        <div className="text-[10px] uppercase tracking-widest opacity-40 mb-2 font-mono flex justify-between">
                            <span>{msg.role === 'user' ? (msg.name || 'User') : `MNEMOSYNE`}</span>
                        </div>
                        {msg.text}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start ml-14">
                    <div className="text-cyan-500 text-xs font-mono animate-pulse">
                        GENERATING RESPONSE...
                    </div>
                </div>
            )}
            <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/10 bg-neutral-900/50">
             <div className="relative">
                 <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                    placeholder={`Action for ${rpConfig.characterName}...`}
                    className="w-full bg-black border border-neutral-700 p-4 pr-16 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                 />
                 <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !input}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-white disabled:opacity-30 disabled:hover:text-cyan-500 p-2"
                 >
                    ⏎
                 </button>
             </div>
        </div>

        {/* Detail Overlay */}
        <NodeDetail 
            node={selectedNode} 
            registry={registry} 
            onClose={() => setSelectedNode(null)} 
        />

        {/* CONFIG MODAL */}
        {showConfig && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-10">
                <div className="w-full max-w-3xl border border-white/20 bg-neutral-900 rounded-lg shadow-2xl flex flex-col h-5/6 overflow-hidden">
                    <div className="p-6 border-b border-white/10 bg-black/50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white tracking-widest">NEURAL CONFIGURATION</h2>
                        
                        {/* Tabs */}
                        <div className="flex gap-1 bg-neutral-800 p-1 rounded">
                            <button onClick={() => setActiveTab('general')} className={`px-3 py-1 text-[10px] font-bold rounded ${activeTab === 'general' ? 'bg-cyan-700 text-white' : 'text-neutral-400 hover:text-white'}`}>GENERAL</button>
                            <button onClick={() => setActiveTab('library')} className={`px-3 py-1 text-[10px] font-bold rounded ${activeTab === 'library' ? 'bg-green-700 text-white' : 'text-neutral-400 hover:text-white'}`}>LIBRARY</button>
                            <button onClick={() => setActiveTab('creator')} className={`px-3 py-1 text-[10px] font-bold rounded ${activeTab === 'creator' ? 'bg-purple-700 text-white' : 'text-neutral-400 hover:text-white'}`}>CREATOR</button>
                            <button onClick={() => setActiveTab('ollama')} className={`px-3 py-1 text-[10px] font-bold rounded ${activeTab === 'ollama' ? 'bg-orange-700 text-white' : 'text-neutral-400 hover:text-white'}`}>OLLAMA</button>
                            <button onClick={() => setActiveTab('cloud')} className={`px-3 py-1 text-[10px] font-bold rounded ${activeTab === 'cloud' ? 'bg-blue-700 text-white' : 'text-neutral-400 hover:text-white'}`}>CLOUD KEYS</button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                        
                        {/* GENERAL TAB */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1 font-mono">AI PROVIDER</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        <button onClick={() => setAiProvider('ollama')} className={`py-2 text-xs border ${aiProvider === 'ollama' ? 'bg-cyan-900/40 border-cyan-500 text-white' : 'border-neutral-700 text-neutral-500'}`}>LOCAL OLLAMA</button>
                                        <button onClick={() => setAiProvider('gemini')} className={`py-2 text-xs border ${aiProvider === 'gemini' ? 'bg-cyan-900/40 border-cyan-500 text-white' : 'border-neutral-700 text-neutral-500'}`}>GOOGLE GEMINI</button>
                                        <button onClick={() => setAiProvider('openai')} className={`py-2 text-xs border ${aiProvider === 'openai' ? 'bg-cyan-900/40 border-cyan-500 text-white' : 'border-neutral-700 text-neutral-500'}`}>OPENAI</button>
                                        <button onClick={() => setAiProvider('anthropic')} className={`py-2 text-xs border ${aiProvider === 'anthropic' ? 'bg-cyan-900/40 border-cyan-500 text-white' : 'border-neutral-700 text-neutral-500'}`}>ANTHROPIC</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1 font-mono">WORLD / SETTING NAME</label>
                                        <input type="text" value={tempConfig.worldName} onChange={e => setTempConfig({...tempConfig, worldName: e.target.value})} className="w-full bg-black border border-neutral-700 p-2 text-sm text-white focus:border-cyan-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1 font-mono">USER NAME</label>
                                        <input type="text" value={tempConfig.characterName} onChange={e => setTempConfig({...tempConfig, characterName: e.target.value})} className="w-full bg-black border border-neutral-700 p-2 text-sm text-white focus:border-cyan-500 outline-none" />
                                    </div>
                                </div>
                                
                                {/* Current Session Avatar (Read Only or Basic) */}
                                <div className="flex items-center gap-4 p-4 border border-white/5 bg-white/5 rounded">
                                    <AvatarDisplay name={tempConfig.characterName} avatar={tempConfig.avatar} size="lg" />
                                    <div className="text-xs text-neutral-400">
                                        <p className="font-bold text-white">Current Session Avatar</p>
                                        <p>To change, load a card from Library or use Creator.</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1 font-mono">ACTIVE PERSONA (System Prompt)</label>
                                    <textarea value={tempConfig.persona} onChange={e => setTempConfig({...tempConfig, persona: e.target.value})} rows={8} className="w-full bg-black border border-neutral-700 p-2 text-xs text-neutral-300 focus:border-cyan-500 outline-none resize-none font-mono leading-relaxed" />
                                </div>
                            </div>
                        )}

                        {/* LIBRARY TAB */}
                        {activeTab === 'library' && (
                            <div className="space-y-6">
                                {/* Actions */}
                                <div className="flex gap-4 items-end">
                                     <div className="flex-1">
                                        <label className="block text-xs text-green-500 mb-1 font-mono font-bold">SCAN FOLDER FOR CARDS (.JSON)</label>
                                        {/* Note: webkitdirectory is non-standard but widely supported */}
                                        <input 
                                            type="file" 
                                            // @ts-ignore
                                            webkitdirectory="" 
                                            directory="" 
                                            multiple 
                                            ref={folderInputRef} 
                                            onChange={handleFolderImport} 
                                            className="text-xs text-neutral-500 w-full border border-neutral-800 p-2 rounded bg-black" 
                                        />
                                     </div>
                                </div>

                                {/* Grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    {library.length === 0 && (
                                        <div className="col-span-3 text-center py-10 text-neutral-600 text-xs font-mono">
                                            LIBRARY EMPTY. IMPORT OR CREATE CARDS.
                                        </div>
                                    )}
                                    {library.map(card => (
                                        <div key={card.id} onClick={() => handleLoadFromLibrary(card)} className="group relative border border-neutral-800 bg-black/40 hover:bg-neutral-900 hover:border-green-500/50 p-3 rounded cursor-pointer transition-all flex flex-col items-center gap-3">
                                            <AvatarDisplay name={card.name} avatar={card.avatar} size="lg" />
                                            <div className="text-center">
                                                <div className="font-bold text-sm text-white">{card.name}</div>
                                                <div className="text-[10px] text-neutral-500 line-clamp-2">{card.description}</div>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDeleteCard(card.id, e)}
                                                className="absolute top-2 right-2 text-neutral-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✖
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* OLLAMA TAB */}
                        {activeTab === 'ollama' && (
                            <div className="space-y-4">
                                {/* CORS Hint Box */}
                                <div className="p-3 border border-yellow-900/50 bg-yellow-900/10 rounded">
                                    <h4 className="text-xs font-bold text-yellow-500 mb-1">⚠ CONNECTION SETUP REQUIRED</h4>
                                    <p className="text-[10px] text-neutral-400 mb-2">
                                        Browsers block local requests by default. You must restart Ollama with CORS enabled:
                                    </p>
                                    <code className="block bg-black/50 p-2 rounded text-[10px] font-mono text-green-400 select-all">
                                        OLLAMA_ORIGINS="*" ollama serve
                                    </code>
                                </div>

                                <div className="p-4 bg-black/40 border border-neutral-800 rounded space-y-3">
                                    <div>
                                        <label className="block text-[10px] text-neutral-500 mb-1 font-mono">OLLAMA URL</label>
                                        <input type="text" value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-cyan-500 outline-none font-mono" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <label className="block text-[10px] text-neutral-500 mb-1 font-mono">MODEL</label>
                                            <select value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-cyan-500 outline-none font-mono">
                                                <option value="" disabled>Select Model...</option>
                                                {availableOllamaModels.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <button onClick={fetchOllamaModels} className="px-3 py-2 text-[10px] border border-cyan-700 text-cyan-500 hover:bg-cyan-900/30">FETCH MODELS</button>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className={`text-[10px] ${ollamaStatus === 'ok' ? 'text-green-500' : ollamaStatus === 'error' ? 'text-red-500' : 'text-gray-600'}`}>STATUS: {ollamaStatus.toUpperCase()}</span>
                                        <button onClick={handleWarmup} disabled={!ollamaModel} className="text-[10px] text-orange-400 hover:text-orange-300 disabled:opacity-30">[WARMUP MODEL]</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CREATOR TAB */}
                        {activeTab === 'creator' && (
                            <div className="space-y-4">
                                <div className="p-4 border border-purple-900/30 bg-purple-900/10 rounded space-y-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">Character Constructor</h3>
                                        {/* Import Single */}
                                        <label className="cursor-pointer text-[10px] text-purple-300 hover:text-white border-b border-dashed border-purple-500">
                                            IMPORT SINGLE .JSON
                                            <input type="file" accept=".json" onChange={handleCardImport} className="hidden" />
                                        </label>
                                    </div>

                                    <div className="flex gap-4">
                                        {/* Avatar Upload */}
                                        <div className="flex-shrink-0">
                                            <label className="block text-[10px] text-neutral-500 mb-1">AVATAR</label>
                                            <div className="relative w-24 h-24 bg-black border border-neutral-700 hover:border-purple-500 cursor-pointer rounded overflow-hidden flex items-center justify-center group">
                                                {creatorAvatar ? (
                                                    <img src={creatorAvatar} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-2xl text-neutral-600">+</span>
                                                )}
                                                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white pointer-events-none">UPLOAD</div>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <input type="text" placeholder="Name (e.g. Seraphina)" value={creatorName} onChange={e => setCreatorName(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 p-2 text-sm text-white focus:border-purple-500 outline-none" />
                                            <textarea placeholder="Description (Physical appearance, age, role)" value={creatorDesc} onChange={e => setCreatorDesc(e.target.value)} rows={2} className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-purple-500 outline-none resize-none" />
                                        </div>
                                    </div>
                                    
                                    <textarea placeholder="Personality (Traits, quirks, likes/dislikes)" value={creatorPers} onChange={e => setCreatorPers(e.target.value)} rows={2} className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-purple-500 outline-none resize-none" />
                                    
                                    <textarea placeholder="Scenario (Where does the RP start?)" value={creatorScen} onChange={e => setCreatorScen(e.target.value)} rows={2} className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-purple-500 outline-none resize-none" />
                                    
                                    <textarea placeholder="First Message (The opening line)" value={creatorFirstMes} onChange={e => setCreatorFirstMes(e.target.value)} rows={2} className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-purple-500 outline-none resize-none" />
                                    
                                    <textarea placeholder="Dialogue Examples (Important for style!)" value={creatorExample} onChange={e => setCreatorExample(e.target.value)} rows={3} className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-purple-500 outline-none resize-none font-mono" />

                                    <div className="flex gap-2 pt-2">
                                        <button onClick={handleExportCard} className="flex-1 py-2 bg-black border border-purple-700 text-purple-400 hover:text-white hover:bg-purple-900/50 text-xs font-bold">⬇ EXPORT JSON</button>
                                        <button onClick={handleSaveToLibrary} className="flex-1 py-2 bg-green-900/30 border border-green-700 text-green-400 hover:text-white hover:bg-green-900/50 text-xs font-bold">💾 SAVE TO LIBRARY</button>
                                        <button onClick={handleUseCreatedCard} className="flex-1 py-2 bg-purple-800 text-white hover:bg-purple-700 text-xs font-bold">USE IN SIMULATION</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CLOUD KEYS TAB (NEW) */}
                        {activeTab === 'cloud' && (
                            <div className="space-y-6">
                                <div className="p-4 border border-blue-900/30 bg-blue-900/10 rounded space-y-4">
                                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Cloud Provider API Keys</h3>
                                    <p className="text-[10px] text-neutral-400">These keys are stored only in your browser session's state and are required to use the respective adapters.</p>
                                    
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1 font-mono">GOOGLE GEMINI API KEY</label>
                                        <input 
                                            type="password" 
                                            value={geminiApiKey} 
                                            onChange={e => setGeminiApiKey(e.target.value)} 
                                            className="w-full bg-black border border-neutral-700 p-2 text-sm text-white focus:border-cyan-500 outline-none" 
                                            placeholder="Enter GEMINI_API_KEY..."
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1 font-mono">OPENAI API KEY</label>
                                        <input 
                                            type="password" 
                                            value={openaiApiKey} 
                                            onChange={e => setOpenAIApiKey(e.target.value)} 
                                            className="w-full bg-black border border-neutral-700 p-2 text-sm text-white focus:border-cyan-500 outline-none" 
                                            placeholder="Enter OPENAI_API_KEY..."
                                        />
                                    </div>
                                    
                                    <div className="border-t border-white/5 pt-4">
                                        <label className="block text-xs text-neutral-500 mb-1 font-mono">ANTHROPIC API KEY</label>
                                        <input 
                                            type="password" 
                                            value={anthropicApiKey} 
                                            onChange={e => setAnthropicApiKey(e.target.value)} 
                                            className="w-full bg-black border border-neutral-700 p-2 text-sm text-white focus:border-cyan-500 outline-none" 
                                            placeholder="Enter ANTHROPIC_API_KEY..."
                                        />
                                        <p className="text-[10px] text-yellow-500 mt-2">Note: Anthropic may require a CORS proxy/setup to work client-side.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-white/10 bg-black/50 flex justify-end gap-3">
                        <button onClick={() => setShowConfig(false)} className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-white">CANCEL</button>
                        <button onClick={saveConfig} className="px-6 py-2 text-xs font-bold bg-cyan-900 text-cyan-100 hover:bg-cyan-800 border border-cyan-700">APPLY SETTINGS</button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;