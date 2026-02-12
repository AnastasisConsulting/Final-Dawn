// G_synthetic/types.ts
export enum FaceType {
  FRONT = 'Input',
  BACK = 'Output',
  TOP = 'Scene',
  BOTTOM = 'Embedding',
  LEFT = 'Tags',
  RIGHT = 'Names'
}

export type HashKey = string;

export type AIProvider = 'gemini' | 'ollama' | 'openai' | 'anthropic';

export interface MemoryNode {
  x: number;
  y: number;
  z: number;
  latticeIndex: number; 
  faces: {
    [FaceType.FRONT]: HashKey; 
    [FaceType.BACK]: HashKey;  
    [FaceType.TOP]: HashKey;   
    [FaceType.BOTTOM]: HashKey; 
    [FaceType.LEFT]: HashKey;  
    [FaceType.RIGHT]: HashKey; 
  };
  timestamp: number;
}

export interface ContentRegistry {
  [key: HashKey]: any; 
}

export interface MnemosyneState {
  lattices: MemoryNode[][]; 
  registry: ContentRegistry;
  cursor: { x: number; y: number; z: number };
  isQuantumMode: boolean;
  quantumSlice: MemoryNode[]; 
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

export interface LogItem {
  role: string;
  text: string;
  name?: string;   
  avatar?: string; 
}

export interface MnemosyneAnalysis {
    embedding: number[];
    scene: string;
    tags: string[] | any; 
    names: string[];
}

export interface LLMConfig {
    aiProvider: AIProvider;
    systemInstruction: string;
    geminiApiKey: string;
    openaiApiKey: string;
    anthropicApiKey: string;
    ollamaUrl: string;
    ollamaModel: string; 

    useFractalOrchestration: boolean;
    useFastPath: boolean; 
    useCoralScorer: boolean; 
    usePhaseAgents: boolean; 
    useDecomposerSynthesizer: boolean; 

    ollamaDecomposerModel: string; 
    ollamaPhase1Model: string; 
    ollamaPhase2Model: string; 
    ollamaPhase3Model: string; 
    ollamaSynthesizerModel: string; 
}

// REFACTORED: Split User and AI Identity
export interface RoleplayConfig {
  worldName: string;
  
  // Player Identity
  userName: string;
  userAvatar?: string;

  // AI Identity
  aiName: string; 
  persona: string; // The AI's persona text
  avatar?: string; // The AI's avatar
}

export interface SavedCard {
    id: string;
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    avatar?: string;
    specVersion: string;
}

// --- NEW INTERFACES FOR SAVE/LOAD ---

export interface MemoryState {
  lattices: MemoryNode[][]; 
  registry: ContentRegistry;
  linearLog: LogItem[];
  isQuantumMode: boolean;
  viewLatticeIndex: number;
}

export interface SavedAppState {
    version: string; 
    timestamp: number;
    config: {
        rpConfig: RoleplayConfig;
        llmConfig: Omit<LLMConfig, 'systemInstruction'>;
        library: SavedCard[];
    }
    memory: MemoryState;
}

export interface CharCardV1 {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
}

export interface CharCardV2 {
    spec: string;
    spec_version: string;
    data: {
        name: string;
        description: string;
        personality: string;
        scenario: string;
        first_mes: string;
        mes_example: string;
    }
}

export interface LocationMetadata {
    Type: string;
    Subtype?: string;
    Description: string;
    System_Theme: string;
    name?: string;
}

export interface HistoryEntry {
    timestamp: string;
    memory_text: string;
    tags: string[];
    weight: number;
}

export interface LatticeNodeData {
    key: string;
    tdsKey?: string | null; 
    Object_Key?: string;
    Object_Name?: string;
    Location_Metadata?: LocationMetadata;
    Transforms?: any;
    history?: HistoryEntry[];
    last?: HistoryEntry;
}