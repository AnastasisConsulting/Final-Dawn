// services/gemini/npcs.ts
import { Type } from "@google/genai";
import { getClient } from "./client";
import { Civilization, TransformData } from "../../types";
import { processNpcData } from "./npcProcessing";

export const generateCivilizationNPCs = async (civ: Civilization, seedData?: TransformData | null): Promise<Civilization> => {
  try {
    const ai = getClient();
    
    // We send the existing context so the AI knows what it is populating
    const cityContext = civ.cities.map(c => ({
        cityName: c.name,
        regionNames: c.regionalLocales.map(r => r.name)
    }));

    let seedContext = "";
    if (seedData) {
        seedContext = `Use these archetypes: ${JSON.stringify(seedData.Transforms.T1_Cast_Transform)}`;
    }

    const systemPrompt = `
    Phase 3: Character & Quest Generation for ${civ.name} (ID: ${civ.civId}). Attr: ${civ.primaryAttribute}.
    
    CRITICAL STRUCTURE:
    1. Create 1 Leader.
    2. Create exactly 3 Governors (one for each city provided).
    3. Create exactly 7 Subordinates for EACH Governor (Total 21). These map 1:1 to the 7 Regions in each city.
    4. Create 7 Quests.
    
    CONSTRAINT: For each Quest, you must select 3 DISTINCT Subordinates (Giver, Middle, Completion) from the generated list. Do not use the same NPC twice in a single quest.
    
    Do not skip any slots. The system will fail if counts are incorrect.
    `;

    const userPrompt = `
    Context: ${JSON.stringify(cityContext, null, 2)} ${seedContext}
    
    Generate JSON matching schema:
    - leader: { name, title, traits, systemPrompt }
    - governors: List of 3 objects. Each has { cityName, name, title, systemPrompt, subordinates: [List of 7 objects] }.
    - subordinates object: { name, role, systemPrompt, assignedRegionName }.
    - quests: List of 7 objects.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             leader: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING }, title: { type: Type.STRING },
                    traits: { type: Type.ARRAY, items: { type: Type.STRING } },
                    systemPrompt: { type: Type.STRING }
                }, required: ["name", "title", "traits", "systemPrompt"]
             },
             governors: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        cityName: { type: Type.STRING }, name: { type: Type.STRING },
                        title: { type: Type.STRING }, systemPrompt: { type: Type.STRING },
                        subordinates: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING }, role: { type: Type.STRING },
                                    systemPrompt: { type: Type.STRING }, assignedRegionName: { type: Type.STRING }
                                }, required: ["name", "role", "systemPrompt", "assignedRegionName"]
                            }
                        }
                    }, required: ["cityName", "name", "title", "systemPrompt", "subordinates"]
                }
             },
             quests: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING }, description: { type: Type.STRING },
                        steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                        giverSubordinateName: { type: Type.STRING },
                        middleSubordinateName: { type: Type.STRING },
                        completionSubordinateName: { type: Type.STRING }
                    }, required: ["name", "description", "steps", "giverSubordinateName", "middleSubordinateName", "completionSubordinateName"]
                }
             }
          }, required: ["leader", "governors", "quests"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // VALIDATION
    if (data.governors?.length !== 3) console.warn(`AI returned ${data.governors?.length} governors, expected 3.`);
    
    return processNpcData(civ, data);

  } catch (error) {
    console.error("NPC Generation Error:", error);
    return civ;
  }
};