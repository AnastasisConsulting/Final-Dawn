import { GoogleGenAI, Type, FunctionDeclaration, Tool, FunctionCall } from "@google/genai";
import { Character, GenerationSettings, Lorebook, Message, PromptOrder, Role } from '../types';

// FIX: Access environment variables via import.meta.env for Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// --- Tool Definitions ---

export const createCharacterTool: FunctionDeclaration = {
  name: "create_character",
  description: "Create a new permanent Character Card for a NEW NPC that has entered the story. Do NOT use this for the user or the main character. Use this only when a new, named, persistent character is introduced.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Name of the character" },
      description: { type: Type.STRING, description: "Physical description and role" },
      personality: { type: Type.STRING, description: "Personality traits and quirks" },
      firstMessage: { type: Type.STRING, description: "The first thing they say (optional)" },
      scenario: { type: Type.STRING, description: "Where they are currently located" }
    },
    required: ["name", "description", "personality"]
  }
};

export const updateLorebookTool: FunctionDeclaration = {
  name: "add_lorebook_entry",
  description: "Add a new World Info entry to the Lorebook. Use this when a NEW location, important object, faction, or concept is established and needs to be remembered for future context.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      keywords: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of keywords (case-insensitive) that will trigger this entry to be injected into context."
      },
      content: { type: Type.STRING, description: "The factual information about the entry." }
    },
    required: ["keywords", "content"]
  }
};

export const appTools: Tool[] = [
  {
    functionDeclarations: [createCharacterTool, updateLorebookTool]
  }
];

// --- Context Helpers ---

export const scanLorebook = (text: string, lorebook: Lorebook): string[] => {
  const triggeredContent: string[] = [];
  const lowerText = text.toLowerCase();
  
  lorebook.entries.forEach(entry => {
    if (!entry.enabled) return;
    const hit = entry.keywords.some(k => {
      const keyword = k.trim().toLowerCase();
      return keyword.length > 0 && lowerText.includes(keyword);
    });
    if (hit) {
      triggeredContent.push(entry.content);
    }
  });

  return triggeredContent;
};

export interface ChatRequestPayload {
  character: Character;
  chatHistory: Message[];
  lorebook: Lorebook;
  settings: GenerationSettings;
  userMessage?: string; // Optional, might be just processing history
}

export interface ChatResponse {
  text: string;
  toolCalls?: { name: string, args: any, id: string }[];
}

export const buildSystemPrompt = (character: Character, lorebook: Lorebook, settings: GenerationSettings, activeLore: string[]) => {
  const blocks: Record<PromptOrder, string> = {
    [PromptOrder.System]: character.systemPrompt ? `### System Instructions\n${character.systemPrompt}\n` : '',
    [PromptOrder.Persona]: `### Character Persona\nName: ${character.name}\nDescription: ${character.description}\nPersonality: ${character.personality}\n`,
    [PromptOrder.World]: activeLore.length > 0 ? `### World Info (Lorebook Active Entries)\n${activeLore.join('\n')}\n` : '',
    [PromptOrder.Scenario]: character.scenario ? `### Scenario\n${character.scenario}\n` : '',
    [PromptOrder.ChatHistory]: ''
  };

  let systemInstructionText = "";
  let preambleText = "";

  settings.promptOrder.forEach(order => {
    if (order === PromptOrder.ChatHistory) return;
    const content = blocks[order];
    if (!content) return;
    if (order === PromptOrder.System || order === PromptOrder.Persona) {
      systemInstructionText += content + "\n";
    } else {
      preambleText += content + "\n";
    }
  });
  
  if (character.postHistoryInstructions) {
    preambleText += `\n### Special Instructions\n${character.postHistoryInstructions}`;
  }

  return { systemInstructionText, preambleText };
};

export const generateGeminiResponse = async (payload: ChatRequestPayload): Promise<ChatResponse> => {
  const { character, chatHistory, lorebook, settings, userMessage } = payload;

  // 1. Lorebook Scanning (Context Window)
  // Scan recent history to activate World Info
  const recentText = chatHistory.slice(-5).map(m => m.content).join(' ') + (userMessage || '');
  const activeLore = scanLorebook(recentText, lorebook);

  // 2. System Instruction Construction
  const { systemInstructionText, preambleText } = buildSystemPrompt(character, lorebook, settings, activeLore);

  // 3. Build Content History
  const contents: any[] = [];

  // Inject Context Preamble
  if (preambleText.trim()) {
    contents.push({
      role: 'user',
      parts: [{ text: `[Context Info]:\n${preambleText}\n\n[Conversation Start]` }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: "Understood." }]
    });
  }

  // Map internal history to Gemini format
  chatHistory.forEach(msg => {
    if (msg.role === Role.User) {
      contents.push({ role: 'user', parts: [{ text: msg.content }] });
    } else if (msg.role === Role.Model) {
       if (msg.toolCalls && msg.toolCalls.length > 0) {
         const functionCalls = msg.toolCalls.map(tc => ({
             name: tc.name,
             args: tc.args
         }));
         contents.push({ role: 'model', parts: functionCalls.map(fc => ({ functionCall: fc })) });
       } else {
         contents.push({ role: 'model', parts: [{ text: msg.content }] });
       }
    } else if (msg.role === Role.Function && msg.functionResponse) {
      contents.push({
        role: 'user', 
        parts: [{
          functionResponse: {
            name: msg.functionResponse.name,
            response: { result: msg.functionResponse.response } 
          }
        }]
      });
    }
  });

  if (userMessage) {
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });
  }

  // 4. API Call
  try {
    const response = await ai.models.generateContent({
      model: settings.model,
      contents: contents,
      config: {
        systemInstruction: systemInstructionText,
        temperature: settings.temperature,
        topK: settings.topK,
        topP: settings.topP,
        maxOutputTokens: settings.maxOutputTokens,
        tools: appTools,
        thinkingConfig: settings.thinkingBudget > 0 
          ? { thinkingBudget: settings.thinkingBudget } 
          : undefined
      }
    });

    const result = response.candidates?.[0]?.content;
    const parts = result?.parts || [];
    
    // Check for function calls
    const toolCalls = parts
      .filter(p => p.functionCall)
      .map((p, index) => ({
         name: p.functionCall?.name ?? "unknown_function", // [FIX] Added fallback
         args: p.functionCall?.args ?? {},                 // [FIX] Added fallback
         id: `call_${Date.now()}_${index}`
      }));

    // Check for text
    const textPart = parts.find(p => p.text);
    const text = textPart ? textPart.text : "";

    return {
      text: text || "",
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: `[System Error]: ${(error as Error).message}` };
  }
};

export const getPromptPreview = (payload: ChatRequestPayload): string => {
   const { character, chatHistory, lorebook, settings, userMessage } = payload;
   const recentContext = chatHistory.slice(-3).map(m => m.content).join(' ') + ' ' + (userMessage || '');
   const activeLore = scanLorebook(recentContext, lorebook);
   
   const { systemInstructionText, preambleText } = buildSystemPrompt(character, lorebook, settings, activeLore);

   return `--- SYSTEM INSTRUCTION ---\n${systemInstructionText}\n\n` + 
          `--- CONTEXT PREAMBLE ---\n${preambleText}\n\n` +
          `--- TOOLS ---\nEnabled: create_character, add_lorebook_entry\n\n` +
          `--- LAST MESSAGE ---\n${userMessage || "(Processing Tool Response)"}`;
};