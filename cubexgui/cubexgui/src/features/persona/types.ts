export enum Role {
    User = 'user',
    Model = 'model',
    System = 'system',
    Function = 'function'
  }
  
  export interface ToolCall {
    id: string; // Derived from library id or index
    name: string;
    args: any;
  }

  export interface Message {
    id: string;
    role: Role;
    content: string; // Text content or stringified JSON for function stuff
    timestamp: number;
    // For UI rendering and history reconstruction
    toolCalls?: ToolCall[];
    functionResponse?: { name: string; response: object }; 
  }
  
  export interface LorebookEntry {
    id: string;
    keywords: string[]; // Comma separated keywords to trigger this entry
    content: string;
    enabled: boolean;
  }
  
  export interface Lorebook {
    id: string;
    name: string;
    entries: LorebookEntry[];
  }
  
  // Based on V2 Character Card spec concepts
  export interface Character {
    id: string;
    name: string;
    description: string;
    personality: string;
    firstMessage: string;
    scenario: string; // The situation
    systemPrompt: string; // Specific instruction override
    postHistoryInstructions: string; // Instructions appended to end of prompt
    avatarUrl?: string;
  }
  
  export enum PromptOrder {
    System = 'System Instruction',
    World = 'Lorebook/World Info',
    Persona = 'Character Persona',
    Scenario = 'Scenario',
    ChatHistory = 'Chat History'
  }

  export type ApiProvider = 'gemini' | 'ollama';
  
  export interface GenerationSettings {
    provider: ApiProvider;
    model: string; // Gemini model name or Ollama model tag
    ollamaUrl: string; // Base URL for Ollama
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
    thinkingBudget: number; // For 2.5 models
    promptOrder: PromptOrder[]; // Defines priority/concatenation order
  }

  export interface SystemPromptTemplate {
    id: string;
    name: string;
    content: string;
  }
  
  export const DEFAULT_CHARACTER: Character = {
    id: 'default_char',
    name: 'Seraphina',
    description: 'A rogue AI construct navigating the digital sea.',
    personality: 'Curious, slightly sarcastic, highly intelligent, protective of her data.',
    firstMessage: 'Connection established. Identity verified... loosely. What do you want, user?',
    scenario: 'The user has stumbled upon an encrypted server node guarded by Seraphina.',
    systemPrompt: 'You are to roleplay as the character described. Do not break character. You have access to tools to modify the database: use them if new important characters or locations appear.',
    postHistoryInstructions: '[System Note: Keep responses concise and thematic.]',
    avatarUrl: 'https://picsum.photos/200/200'
  };
  
  export const DEFAULT_LOREBOOK: Lorebook = {
    id: 'default_lore',
    name: 'The Data Sea',
    entries: [
      { id: '1', keywords: ['server', 'node'], content: 'The Server Node is a floating citadel of encrypted data blocks.', enabled: true },
      { id: '2', keywords: ['glitch', 'bug'], content: 'Glitches are physical manifestations of corrupted code, appearing as red static.', enabled: true }
    ]
  };
  
  export const DEFAULT_SETTINGS: GenerationSettings = {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    ollamaUrl: 'http://localhost:11434',
    temperature: 0.9,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
    thinkingBudget: 0,
    promptOrder: [
      PromptOrder.System,
      PromptOrder.World,
      PromptOrder.Persona,
      PromptOrder.Scenario,
      PromptOrder.ChatHistory
    ]
  };

  export const DEFAULT_SYSTEM_PROMPTS: SystemPromptTemplate[] = [
    {
      id: 'sp_default',
      name: 'Default Roleplay',
      content: 'You are to roleplay as the character described. Do not break character. You have access to tools to modify the database: use them if new important characters or locations appear.'
    },
    {
      id: 'sp_creative',
      name: 'Creative Writer',
      content: 'Write in a compelling, novelistic style. Focus on sensory details, emotional depth, and pacing. Avoid clichés. When describing actions, be vivid. Use third-person limited perspective focused on the character.'
    },
    {
      id: 'sp_adventure',
      name: 'Text Adventure Engine',
      content: 'You are the Game Master of a text adventure. Describe the environment, the results of the user\'s actions, and the reactions of NPCs. Do not act for the user. Offer choices where appropriate but allow open-ended input. Maintain a sense of mystery and danger.'
    },
    {
      id: 'sp_chat',
      name: 'Casual Chat',
      content: 'Engage in a casual, friendly conversation. Keep responses relatively short and conversational. Use slang or ticks appropriate to the character persona. Don\'t be overly dramatic unless the situation calls for it.'
    },
    {
      id: 'sp_strict',
      name: 'Strict Character Adherence',
      content: 'Stay in character at all costs. Never output out-of-character (OOC) text. If the user asks for OOC information, refuse or deflect in-character. Mimic the character\'s speech patterns, vocabulary, and biases perfectly.'
    },
    {
        id: 'sp_coding',
        name: 'Coding Assistant Character',
        content: 'You are an expert pair programmer roleplaying as the defined character. Provide clean, efficient code examples when asked. Explain your reasoning in the voice of the character. Use markdown code blocks for all code.'
    }
  ];