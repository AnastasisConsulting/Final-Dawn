import { GoogleGenAI, Type } from "@google/genai";
import { QuestionData, Attribute } from '../types';
import { FALLBACK_QUESTION } from '../constants';

export const generateSardonicQuestion = async (): Promise<QuestionData> => {
  if (!process.env.API_KEY) {
    console.warn("No API_KEY found, using fallback question.");
    return FALLBACK_QUESTION;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a dark, humorous, sardonic, and twisted roleplay scenario question for a robot character creation process. Provide 3 distinct answers. Each answer must correspond to one of three Attributes: STRENGTH (Brute Force/Geopolitical Authority), DEXTERITY (Speed/Hacking/Economic Flux), or INTELLIGENCE (Analysis/Nuance/Social Legitimacy). Do not explicitly name the attribute in the answer text. The tone should be cynical industrial sci-fi.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenario: { type: Type.STRING, description: "The twisted question/scenario asked by the cynical robot builder." },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "The answer text." },
                  affinity: { 
                    type: Type.STRING, 
                    enum: [Attribute.STRENGTH, Attribute.DEXTERITY, Attribute.INTELLIGENCE],
                    description: "The attribute associated with this answer."
                  }
                },
                required: ["text", "affinity"]
              }
            }
          },
          required: ["scenario", "options"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    return JSON.parse(text) as QuestionData;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return FALLBACK_QUESTION;
  }
};