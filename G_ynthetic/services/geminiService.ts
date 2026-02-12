// G_ynthetic/services/geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";

// Helper to get the AI client with a provided key
const getAI = (apiKey: string) => {
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please enter it in Settings.");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateGeminiChat = async (
  history: {role: string, parts: {text: string}[]}[], 
  prompt: string,
  systemInstruction: string,
  apiKey: string
) => {
  const ai = getAI(apiKey);
  
  // Reconstruct history messages for the chat session
  const historyMessages = history.map(h => ({
      role: h.role,
      parts: h.parts
  }));

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: historyMessages,
    config: {
      temperature: 0.8,
      maxOutputTokens: 1000, 
      systemInstruction: systemInstruction
    }
  });

  const response = await chat.sendMessage({
      message: prompt
  });

  return response.text || "";
};

export const analyzeGeminiMemory = async (inputText: string, outputText: string, apiKey: string) => {
  const ai = getAI(apiKey);
  
  // 1. Generate Embedding
  let embedding: number[] = [];
  try {
    const embedResult = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: { role: 'user', parts: [{ text: `Input: ${inputText}\nOutput: ${outputText}` }] }
    });
    embedding = embedResult.embeddings?.[0]?.values || [];
  } catch (e) {
    console.warn("Gemini embedding failed:", e);
    embedding = new Array(768).fill(0);
  }

  // 2. Extract Metadata
  const analysisPrompt = `Analyze this interaction:\nUser: ${inputText}\nSystem: ${outputText}\n\nExtract the scene summary, associative tags, and proper names.`;
  
  const metaResult = await ai.models.generateContent({ 
      model: 'gemini-2.5-flash',
      contents: { role: 'user', parts: [{ text: analysisPrompt }] },
      config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scene: { type: Type.STRING, description: "A 5-word summary of the narrative arc or scene." },
              tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 abstract thematic tags." },
              names: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Proper names or entities mentioned." }
            },
            required: ["scene", "tags", "names"]
          }
      }
  });

  const metaText = metaResult.text;
  
  let metadata = { scene: "Analysis Failed", tags: [], names: [] };
  if (metaText) {
    try {
        metadata = JSON.parse(metaText);
    } catch (e) {
        console.warn("Failed to parse metadata", e);
    }
  }

  return {
      embedding,
      scene: metadata.scene,
      tags: metadata.tags,
      names: metadata.names
  };
};