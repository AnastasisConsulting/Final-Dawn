import { ChatRequestPayload, ChatResponse, buildSystemPrompt, scanLorebook, createCharacterTool, updateLorebookTool } from './geminiService';
import { Role } from '../types';

// Convert Gemini Tool Definitions to OpenAI/Ollama Schema
const getOllamaTools = () => {
  return [createCharacterTool, updateLorebookTool].map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
};

// --- LOGIC: DECIDE WHICH MODELS GET TOOLS ---
const shouldEnableTools = (modelName: string): boolean => {
    const name = modelName.toLowerCase();

    // 1. HARD BLOCK: Models that crash or hallucinate badly with tools
    const blockList = [
        'dolphin',       // Often older architecture, strictly roleplay
        'smollm',        // Too small to handle JSON schemas
        'deepseek-r1',   // "Thinking" models break when you inject tools
        'mistral-nemo',  // Sometimes flaky in older versions
        'tails',         // Roleplay fine-tune
        'adult-film'     // Roleplay fine-tune
    ];
    if (blockList.some(block => name.includes(block))) return false;

    // 2. ALLOW LIST: Models known to handle Ollama tools well
    const allowList = [
        'llama3',
        'qwen',
        'gemma',
        'mistral',
        'command-r',
        'hermes'
    ];
    
    return allowList.some(allow => name.includes(allow));
};

export const fetchOllamaModels = async (baseUrl: string): Promise<string[]> => {
  try {
    const res = await fetch(`${baseUrl}/api/tags`);
    if (!res.ok) throw new Error("Failed to fetch Ollama tags");
    const data = await res.json();
    return data.models.map((m: any) => m.name);
  } catch (e) {
    console.error("Ollama fetch error:", e);
    return [];
  }
};

export const warmUpOllamaModel = async (baseUrl: string, model: string) => {
    try {
        await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: [],
                keep_alive: '15m'
            })
        });
    } catch(e) {
        console.warn("Warmup failed", e);
    }
};

export const generateOllamaResponse = async (payload: ChatRequestPayload): Promise<ChatResponse> => {
  const { character, chatHistory, lorebook, settings, userMessage } = payload;
  
  // 1. Context Construction
  const recentText = chatHistory.slice(-5).map(m => m.content).join(' ') + (userMessage || '');
  const activeLore = scanLorebook(recentText, lorebook);
  const { systemInstructionText, preambleText } = buildSystemPrompt(character, lorebook, settings, activeLore);

  const messages = [];

  // System Prompt
  if (systemInstructionText) {
    messages.push({ role: 'system', content: systemInstructionText });
  }

  // Context Info
  if (preambleText) {
      messages.push({ role: 'system', content: `Context Info:\n${preambleText}` });
  }

  // Chat History
  chatHistory.forEach(msg => {
      if (msg.role === Role.User) {
          messages.push({ role: 'user', content: msg.content });
      } else if (msg.role === Role.Model) {
          if (msg.toolCalls && msg.toolCalls.length > 0) {
              messages.push({
                  role: 'assistant',
                  content: msg.content || "", 
                  tool_calls: msg.toolCalls.map(tc => ({
                      type: 'function',
                      function: {
                          name: tc.name,
                          arguments: tc.args
                      }
                  }))
              });
          } else {
              messages.push({ role: 'assistant', content: msg.content });
          }
      } else if (msg.role === Role.Function && msg.functionResponse) {
          messages.push({
              role: 'tool',
              content: JSON.stringify(msg.functionResponse.response),
              name: msg.functionResponse.name
          });
      }
  });

  if (userMessage) {
      messages.push({ role: 'user', content: userMessage });
  }

  // --- OPTIONS ---
  // Purely standard options to avoid 400 Bad Request
  const ollamaOptions: any = {
      temperature: Number(settings.temperature) || 0.7,
      top_k: Number(settings.topK) || 40,
      top_p: Number(settings.topP) || 0.9,
      num_predict: Number(settings.maxOutputTokens) || 1024
  };

  const useTools = shouldEnableTools(settings.model || "");

  // Construct Payload
  const finalPayload: any = {
      model: settings.model || "llama3",
      messages: messages,
      stream: false,
      options: ollamaOptions,
      keep_alive: '15m'
  };

  // Only attach tools if the model is on the Safe List
  if (useTools) {
      finalPayload.tools = getOllamaTools();
      console.log(`🔧 Tools ENABLED for model: ${settings.model}`);
  } else {
      console.log(`🚫 Tools DISABLED for model: ${settings.model}`);
  }

  try {
      const response = await fetch(`${settings.ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalPayload)
      });

      if (!response.ok) {
          const errorText = await response.text(); 
          throw new Error(`Ollama API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const msg = data.message;
      
      const toolCalls = msg.tool_calls?.map((tc: any, idx: number) => ({
          name: tc.function.name,
          args: tc.function.arguments,
          id: `ollama_call_${Date.now()}_${idx}`
      }));

      return {
          text: msg.content || "",
          toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined
      };

  } catch (error) {
      console.error("Ollama Generation Error:", error);
      return { text: `[System Error]: ${(error as Error).message}` };
  }
};