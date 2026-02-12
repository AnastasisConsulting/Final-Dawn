// G_ynthetic/hooks/useConfig.ts
import React, { useState, useEffect } from 'react'; 
import { 
    AIProvider, RoleplayConfig, SavedCard, MemoryNode, ContentRegistry, LogItem, SavedAppState 
} from '../types';
import { getOllamaModels, warmupModel, generateOllamaChat } from '../services/ollamaService';
import { generateHash } from '../services/mnemosyneUtils';

const DEFAULT_CONFIG: RoleplayConfig = {
    worldName: 'G_synthetic',
    userName: 'User', 
    aiName: 'System', 
    persona: 'You are the G_synthetic. You are a holographic memory system. You answer concisely and philosophically.'
};

// ... (MemorySetters and MemoryState interfaces remain the same)
export interface MemorySetters {
    setLattices: React.Dispatch<React.SetStateAction<MemoryNode[][]>>;
    setRegistry: React.Dispatch<React.SetStateAction<ContentRegistry>>;
    setLinearLog: React.Dispatch<React.SetStateAction<LogItem[]>>;
    setIsQuantumMode: React.Dispatch<React.SetStateAction<boolean>>;
    setViewLatticeIndex: React.Dispatch<React.SetStateAction<number>>;
}

export interface MemoryState {
    lattices: MemoryNode[][];
    registry: ContentRegistry;
    linearLog: LogItem[];
    isQuantumMode: boolean;
    viewLatticeIndex: number;
}

export interface ConfigAPI {
    // ... (Existing state properties)
    rpConfig: RoleplayConfig;
    setRpConfig: React.Dispatch<React.SetStateAction<RoleplayConfig>>;
    tempConfig: RoleplayConfig;
    setTempConfig: React.Dispatch<React.SetStateAction<RoleplayConfig>>;
    pendingFirstMes: string | null;
    setPendingFirstMes: React.Dispatch<React.SetStateAction<string | null>>;

    showConfig: boolean;
    setShowConfig: React.Dispatch<React.SetStateAction<boolean>>;
    activeTab: 'persona' | 'simulation' | 'llm' | 'library' | 'creator'; 
    setActiveTab: React.Dispatch<React.SetStateAction<'persona' | 'simulation' | 'llm' | 'library' | 'creator'>>;

    aiProvider: AIProvider;
    setAiProvider: React.Dispatch<React.SetStateAction<AIProvider>>;
    geminiApiKey: string;
    setGeminiApiKey: React.Dispatch<React.SetStateAction<string>>;
    openaiApiKey: string;
    setOpenAIApiKey: React.Dispatch<React.SetStateAction<string>>;
    anthropicApiKey: string;
    setAnthropicApiKey: React.Dispatch<React.SetStateAction<string>>;

    ollamaUrl: string;
    setOllamaUrl: React.Dispatch<React.SetStateAction<string>>;
    ollamaModel: string;
    setOllamaModel: React.Dispatch<React.SetStateAction<string>>;
    availableOllamaModels: string[];
    ollamaStatus: 'idle' | 'checking' | 'online' | 'error';
    fetchOllamaModels: () => Promise<void>;
    handleWarmup: () => Promise<void>;

    useFractalOrchestration: boolean;
    setUseFractalOrchestration: React.Dispatch<React.SetStateAction<boolean>>;
    useFastPath: boolean;
    setUseFastPath: React.Dispatch<React.SetStateAction<boolean>>;
    useCoralScorer: boolean;
    setUseCoralScorer: React.Dispatch<React.SetStateAction<boolean>>;
    usePhaseAgents: boolean;
    setUsePhaseAgents: React.Dispatch<React.SetStateAction<boolean>>;
    useDecomposerSynthesizer: boolean;
    setUseDecomposerSynthesizer: React.Dispatch<React.SetStateAction<boolean>>;

    ollamaDecomposerModel: string;
    setOllamaDecomposerModel: React.Dispatch<React.SetStateAction<string>>;
    ollamaPhase1Model: string;
    setOllamaPhase1Model: React.Dispatch<React.SetStateAction<string>>;
    ollamaPhase2Model: string;
    setOllamaPhase2Model: React.Dispatch<React.SetStateAction<string>>;
    ollamaPhase3Model: string;
    setOllamaPhase3Model: React.Dispatch<React.SetStateAction<string>>;
    ollamaSynthesizerModel: string;
    setOllamaSynthesizerModel: React.Dispatch<React.SetStateAction<string>>;

    library: SavedCard[];
    setLibrary: React.Dispatch<React.SetStateAction<SavedCard[]>>;
    handleLoadFromLibrary: (card: SavedCard) => void;
    handleDeleteCard: (id: string) => void;
    parseJsonCard: (file: File) => void;
    parseJsonCardToSavedCard: (json: any) => SavedCard | null;

    creatorName: string;
    setCreatorName: React.Dispatch<React.SetStateAction<string>>;
    creatorDesc: string;
    setCreatorDesc: React.Dispatch<React.SetStateAction<string>>;
    creatorPers: string;
    setCreatorPers: React.Dispatch<React.SetStateAction<string>>;
    creatorScen: string;
    setCreatorScen: React.Dispatch<React.SetStateAction<string>>;
    creatorFirstMes: string;
    setCreatorFirstMes: React.Dispatch<React.SetStateAction<string>>;
    creatorMesEx: string;
    setCreatorMesEx: React.Dispatch<React.SetStateAction<string>>;
    creatorAvatar: string;
    setCreatorAvatar: React.Dispatch<React.SetStateAction<string>>;
    
    handleSaveToLibrary: () => void;
    handleExportCard: () => void;
    handleUseCreatedCard: () => void;
    handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleExportState: (memory: MemoryState) => void;
    handleImportState: (file: File, setters: MemorySetters) => void;

    // --- NEW GENERATION API ---
    isGeneratingCharacter: boolean;
    handleAiGeneration: (prompt: string) => Promise<void>;
}

export const useConfig = (): ConfigAPI => {
    // ... (Existing state declarations)
    const [rpConfig, setRpConfig] = useState<RoleplayConfig>(DEFAULT_CONFIG);
    const [tempConfig, setTempConfig] = useState<RoleplayConfig>(DEFAULT_CONFIG);
    const [pendingFirstMes, setPendingFirstMes] = useState<string | null>(null);
    
    const [showConfig, setShowConfig] = useState(false);
    const [activeTab, setActiveTab] = useState<'persona' | 'simulation' | 'llm' | 'library' | 'creator'>('persona');

    const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [openaiApiKey, setOpenAIApiKey] = useState('');
    const [anthropicApiKey, setAnthropicApiKey] = useState('');

    const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
    const [ollamaModel, setOllamaModel] = useState('');
    const [availableOllamaModels, setAvailableOllamaModels] = useState<string[]>([]);
    const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'checking' | 'online' | 'error'>('idle');

    // F.R.A.C.C. State
    const [useFractalOrchestration, setUseFractalOrchestration] = useState(false);
    const [useFastPath, setUseFastPath] = useState(false);
    const [useCoralScorer, setUseCoralScorer] = useState(false);
    const [usePhaseAgents, setUsePhaseAgents] = useState(false);
    const [useDecomposerSynthesizer, setUseDecomposerSynthesizer] = useState(false);

    const [ollamaDecomposerModel, setOllamaDecomposerModel] = useState('');
    const [ollamaPhase1Model, setOllamaPhase1Model] = useState('');
    const [ollamaPhase2Model, setOllamaPhase2Model] = useState('');
    const [ollamaPhase3Model, setOllamaPhase3Model] = useState('');
    const [ollamaSynthesizerModel, setOllamaSynthesizerModel] = useState('');

    const [library, setLibrary] = useState<SavedCard[]>([]);

    // Creator State
    const [creatorName, setCreatorName] = useState('');
    const [creatorDesc, setCreatorDesc] = useState('');
    const [creatorPers, setCreatorPers] = useState('');
    const [creatorScen, setCreatorScen] = useState('');
    const [creatorFirstMes, setCreatorFirstMes] = useState('');
    const [creatorMesEx, setCreatorMesEx] = useState('');
    const [creatorAvatar, setCreatorAvatar] = useState('');
    
    // NEW: Loading state for generation
    const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) setGeminiApiKey(savedKey);
        const savedOpenAIKey = localStorage.getItem('openai_api_key');
        if (savedOpenAIKey) setOpenAIApiKey(savedOpenAIKey);
        const savedAnthropicKey = localStorage.getItem('anthropic_api_key');
        if (savedAnthropicKey) setAnthropicApiKey(savedAnthropicKey);
        const savedLib = localStorage.getItem('mnemosyne_library');
        if (savedLib) setLibrary(JSON.parse(savedLib));
        fetchOllamaModels();
    }, []);

    useEffect(() => { localStorage.setItem('gemini_api_key', geminiApiKey); }, [geminiApiKey]);
    useEffect(() => { localStorage.setItem('openai_api_key', openaiApiKey); }, [openaiApiKey]);
    useEffect(() => { localStorage.setItem('anthropic_api_key', anthropicApiKey); }, [anthropicApiKey]);
    useEffect(() => { localStorage.setItem('mnemosyne_library', JSON.stringify(library)); }, [library]);

    const fetchOllamaModels = async () => {
        setOllamaStatus('checking');
        try {
            const models = await getOllamaModels(ollamaUrl);
            setAvailableOllamaModels(models);
            if (models.length > 0 && !ollamaModel) setOllamaModel(models[0]);
            setOllamaStatus('online');
        } catch (e) {
            setOllamaStatus('error');
            setAvailableOllamaModels([]);
        }
    };

    const handleWarmup = async () => {
        if (!ollamaModel) return;
        try {
            await warmupModel(ollamaUrl, ollamaModel);
            alert(`Warmup signal sent to ${ollamaModel}`);
        } catch (e) {
            alert("Warmup failed. Check console.");
        }
    };

    const handleLoadFromLibrary = (card: SavedCard) => {
        setRpConfig(prev => ({
            ...prev,
            worldName: card.scenario || "Unknown World",
            aiName: card.name, 
            persona: `${card.description}\n${card.personality}\n${card.mes_example}`,
            avatar: card.avatar
        }));
        setTempConfig(prev => ({
            ...prev,
            worldName: card.scenario || "Unknown World",
            aiName: card.name,
            persona: `${card.description}\n${card.personality}\n${card.mes_example}`,
            avatar: card.avatar
        }));
        if (card.first_mes) setPendingFirstMes(card.first_mes);
        setShowConfig(false);
    };

    const handleDeleteCard = (id: string) => {
        const newLib = library.filter(c => c.id !== id);
        setLibrary(newLib);
    };

    const handleSaveToLibrary = () => {
        if (!creatorName) {
            alert("Please enter a character name first.");
            return;
        }
        const newCard: SavedCard = {
            id: generateHash(creatorName + Date.now()),
            name: creatorName,
            description: creatorDesc,
            personality: creatorPers,
            scenario: creatorScen,
            first_mes: creatorFirstMes,
            mes_example: creatorMesEx,
            avatar: creatorAvatar,
            specVersion: '2.0' 
        };
        setLibrary([...library, newCard]);
        setCreatorName(''); setCreatorDesc(''); setCreatorPers('');
        setCreatorScen(''); setCreatorFirstMes(''); setCreatorMesEx(''); setCreatorAvatar('');
        alert("Character Saved to Library!");
    };

    const handleExportCard = () => {
        if (!creatorName) {
            alert("Nothing to export. Create a character first.");
            return;
        }
        const newCard: SavedCard = {
            id: generateHash(creatorName + Date.now()),
            name: creatorName,
            description: creatorDesc,
            personality: creatorPers,
            scenario: creatorScen,
            first_mes: creatorFirstMes,
            mes_example: creatorMesEx,
            avatar: creatorAvatar,
            specVersion: '2.0' 
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(newCard, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${creatorName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || "character"}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleUseCreatedCard = () => {
         if (!creatorName) {
            alert("Please define a character first.");
            return;
        }
        setTempConfig(prev => ({
            ...prev,
            worldName: creatorScen || "Custom World",
            aiName: creatorName,
            persona: `${creatorDesc}\n${creatorPers}\n${creatorMesEx}`,
            avatar: creatorAvatar
        }));
        if (creatorFirstMes) {
            setPendingFirstMes(creatorFirstMes);
        }
        alert(`Loaded ${creatorName} into Simulation Settings.`);
        setActiveTab('simulation');
    };

    const parseJsonCardToSavedCard = (json: any): SavedCard | null => {
        let cardData: any = {};
        if (json.spec === 'chara_card_v2' && json.data) {
             cardData = json.data;
         } else if (json.name) {
             cardData = json;
         } else {
             return null;
         }
         if (!cardData.name) return null;
         return {
            id: generateHash(cardData.name + Date.now()),
            name: cardData.name || '',
            description: cardData.description || '',
            personality: cardData.personality || '',
            scenario: cardData.scenario || '',
            first_mes: cardData.first_mes || '',
            mes_example: cardData.mes_example || '',
            avatar: cardData.avatar || '',
            specVersion: json.spec_version || '2.0' 
         }
    }

    const parseJsonContentToCreator = (json: any) => {
         if (json.spec === 'chara_card_v2' && json.data) {
            setCreatorName(json.data.name || '');
            setCreatorDesc(json.data.description || '');
            setCreatorPers(json.data.personality || '');
            setCreatorScen(json.data.scenario || '');
            setCreatorFirstMes(json.data.first_mes || '');
            setCreatorMesEx(json.data.mes_example || '');
            setCreatorAvatar(json.data.avatar || '');
        } else {
            setCreatorName(json.name || '');
            setCreatorDesc(json.description || '');
            setCreatorPers(json.personality || '');
            setCreatorScen(json.scenario || '');
            setCreatorFirstMes(json.first_mes || '');
            setCreatorMesEx(json.mes_example || '');
            setCreatorAvatar(json.avatar || '');
        }
    }

    const parseJsonCard = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                parseJsonContentToCreator(json);
                setActiveTab('creator');
            } catch (err) {
                alert("Failed to parse character card JSON.");
            }
        };
        reader.readAsText(file);
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCreatorAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleExportState = (memory: MemoryState) => {
        const llmConfig = {
            aiProvider, geminiApiKey, openaiApiKey, anthropicApiKey,
            ollamaUrl, ollamaModel, 
            useFractalOrchestration, useFastPath, useCoralScorer, usePhaseAgents, useDecomposerSynthesizer,
            ollamaDecomposerModel, ollamaPhase1Model, ollamaPhase2Model, ollamaPhase3Model, ollamaSynthesizerModel
        };
        const stateToSave: SavedAppState = {
            version: '0.2.0-F.R.A.C.C. Alpha',
            timestamp: Date.now(),
            config: { rpConfig, llmConfig, library },
            memory: memory
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stateToSave, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `G_synthetic_state_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert("G_synthetic state exported!");
    };

    const handleImportState = (file: File, setters: MemorySetters) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json: SavedAppState = JSON.parse(e.target?.result as string);
                if (json.version !== '0.2.0-F.R.A.C.C. Alpha') {
                    if (!window.confirm("State file version mismatch. Attempt import anyway?")) return;
                }
                const configData = json.config;
                setRpConfig(configData.rpConfig);
                setTempConfig(configData.rpConfig);
                
                const llm = configData.llmConfig;
                setAiProvider(llm.aiProvider);
                setGeminiApiKey(llm.geminiApiKey);
                setOpenAIApiKey(llm.openaiApiKey);
                setAnthropicApiKey(llm.anthropicApiKey);
                setOllamaUrl(llm.ollamaUrl);
                setOllamaModel(llm.ollamaModel);
                setUseFractalOrchestration(llm.useFractalOrchestration);
                setUseFastPath(llm.useFastPath);
                setUseCoralScorer(llm.useCoralScorer);
                setUsePhaseAgents(llm.usePhaseAgents);
                setUseDecomposerSynthesizer(llm.useDecomposerSynthesizer);
                setOllamaDecomposerModel(llm.ollamaDecomposerModel);
                setOllamaPhase1Model(llm.ollamaPhase1Model);
                setOllamaPhase2Model(llm.ollamaPhase2Model);
                setOllamaPhase3Model(llm.ollamaPhase3Model);
                setOllamaSynthesizerModel(llm.ollamaSynthesizerModel);
                setLibrary(configData.library);

                const memoryData = json.memory;
                setters.setLattices(memoryData.lattices);
                setters.setRegistry(memoryData.registry);
                setters.setLinearLog(memoryData.linearLog);
                setters.setIsQuantumMode(memoryData.isQuantumMode);
                setters.setViewLatticeIndex(memoryData.viewLatticeIndex);

                alert("G_synthetic state loaded successfully!");
                setShowConfig(false);
            } catch (err) {
                console.error("Import Failed:", err);
                alert("Failed to load state file. Check console for details.");
            }
        };
        reader.readAsText(file);
    };

    // --- NEW: AI Character Generation ---
    const handleAiGeneration = async (prompt: string) => {
        if (!prompt) return;
        setIsGeneratingCharacter(true);
        try {
            const systemPrompt = `
                You are a character generator.
                Generate a creative roleplay character based on the user's prompt.
                You MUST respond with ONLY a valid JSON object. Do not add markdown blocks.
                
                The JSON schema is:
                {
                    "name": "Character Name",
                    "description": "Short physical and background description.",
                    "personality": "Detailed personality traits and quirks.",
                    "scenario": "The setting or situation where the user meets them.",
                    "first_mes": "The opening line of dialogue to start the roleplay.",
                    "mes_example": "Example dialogue. <START> User: Hello. Char: Hi."
                }
            `;

            const modelToUse = ollamaModel || availableOllamaModels[0] || 'llama3';
            
            const result = await generateOllamaChat(
                [], // No history
                prompt,
                systemPrompt,
                ollamaUrl,
                modelToUse
            );

            // Attempt to parse
            let jsonString = result;
            const match = result.match(/\{[\s\S]*\}/);
            if (match) jsonString = match[0];

            const data = JSON.parse(jsonString);
            
            setCreatorName(data.name || "Unknown");
            setCreatorDesc(data.description || "");
            setCreatorPers(data.personality || "");
            setCreatorScen(data.scenario || "");
            setCreatorFirstMes(data.first_mes || "");
            setCreatorMesEx(data.mes_example || "");
            
            alert(`Generated character: ${data.name}`);

        } catch (e) {
            console.error(e);
            alert("AI Generation Failed. Ensure Ollama is running and model is loaded.");
        } finally {
            setIsGeneratingCharacter(false);
        }
    };

    return {
        rpConfig, setRpConfig, tempConfig, setTempConfig, pendingFirstMes, setPendingFirstMes,
        showConfig, setShowConfig, activeTab, setActiveTab,
        aiProvider, setAiProvider, geminiApiKey, setGeminiApiKey, openaiApiKey, setOpenAIApiKey, anthropicApiKey, setAnthropicApiKey,
        ollamaUrl, setOllamaUrl, ollamaModel, setOllamaModel, availableOllamaModels, ollamaStatus, fetchOllamaModels, handleWarmup,
        useFractalOrchestration, setUseFractalOrchestration, useFastPath, setUseFastPath, useCoralScorer, setUseCoralScorer,
        usePhaseAgents, setUsePhaseAgents, useDecomposerSynthesizer, setUseDecomposerSynthesizer,
        ollamaDecomposerModel, setOllamaDecomposerModel, ollamaPhase1Model, setOllamaPhase1Model, ollamaPhase2Model, setOllamaPhase2Model,
        ollamaPhase3Model, setOllamaPhase3Model, ollamaSynthesizerModel, setOllamaSynthesizerModel,
        library, setLibrary, handleLoadFromLibrary, handleDeleteCard, parseJsonCard, parseJsonCardToSavedCard,
        creatorName, setCreatorName, creatorDesc, setCreatorDesc, creatorPers, setCreatorPers, creatorScen, setCreatorScen, 
        creatorFirstMes, setCreatorFirstMes, creatorMesEx, setCreatorMesEx, creatorAvatar, setCreatorAvatar, 
        handleSaveToLibrary, handleExportCard, handleUseCreatedCard, handleAvatarUpload,
        handleExportState, handleImportState,
        isGeneratingCharacter, handleAiGeneration // New exports
    };
};