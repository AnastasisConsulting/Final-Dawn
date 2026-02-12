// services/gemini/lore.ts
import { Type } from "@google/genai";
import { getClient } from "./client";
import { Civilization, TransformData, PrimaryAttribute, City, RegionalLocale } from "../../types";
import { buildCivilizationGrid } from "./gridAllocator";

const MAX_RETRIES = 1;

// Define specific schema parts to keep this file cleaner if needed, 
// but strict typing via Google GenAI Type is required here.

const generateHistory = async (prompt: string, seedData?: TransformData | null): Promise<string> => {
  const ai = getClient();
  const seedContext = seedData ? `Based on: ${seedData.Location_Metadata.Description} and Theme: ${seedData.Location_Metadata.System_Theme}` : "";
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a brief, evocative history (max 100 words) for a sci-fi/fantasy world described as: "${prompt}". ${seedContext}`,
    config: {
       responseMimeType: "application/json",
       responseSchema: {
          type: Type.OBJECT,
          properties: { history: { type: Type.STRING } }
       }
    }
  });
  const data = JSON.parse(response.text || '{"history": "Unknown"}');
  return data.history;
};

export const generateSingleCivilization = async (
    worldId: string, slotIndex: number, attribute: PrimaryAttribute,
    priorSummaries: string[], prompt: string, seedData?: TransformData | null
): Promise<Civilization> => {
    const ai = getClient();
    
    // TEMPLATE KEY GENERATION
    // We define the Keys FIRST. Content is assigned TO keys.
    const civId = `${worldId}-C${slotIndex}`;
    
    let seedContext = "";
    if (seedData) {
        seedContext = `SOURCE MATERIAL (Seed): ${seedData.Object_Name} - ${seedData.Location_Metadata.Description}`;
    }

    const systemInstruction = `
    Phase 2: Civilization Generation. World ID: ${worldId}. Slot: ${slotIndex}/3. Attribute: ${attribute}.
    REQUIREMENTS:
    1. Generate ONE Civilization.
    2. Generate exactly 3 Cities.
    3. Generate exactly 21 Regions (Strictly 7 per City).
    
    Do not generate IDs. The system will assign content to pre-allocated keys.
    `;

    const userPrompt = `
    Generate civilization for "${prompt}". ${seedContext}.
    Output JSON: name, summary, themes, conflictDrivers, taboos.
    cities (3): name, summary, tags.
    regions (21): name, summaryStub, tags. (Provide these as a flat list, they will be distributed 7 per city sequentially).
    `;

    // Compact Schema Definition - NO IDs REQUESTED
    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            summary: { type: Type.STRING },
            themes: { type: Type.ARRAY, items: { type: Type.STRING } },
            conflictDrivers: { type: Type.ARRAY, items: { type: Type.STRING } },
            taboos: { type: Type.ARRAY, items: { type: Type.STRING } },
            cities: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["name", "summary", "tags"]
                }
            },
            regions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        summaryStub: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["name", "summaryStub", "tags"]
                }
            }
        },
        required: ["name", "summary", "themes", "conflictDrivers", "taboos", "cities", "regions"]
    };

    let attempts = 0;
    while (attempts <= MAX_RETRIES) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: userPrompt,
                config: { systemInstruction, responseMimeType: "application/json", responseSchema: schema }
            });

            const raw = JSON.parse(response.text || '{}');
            
            // STRICT VALIDATION
            if (raw.cities.length !== 3) throw new Error(`Invalid city count: ${raw.cities.length}. Expected 3.`);
            if (raw.regions.length !== 21) throw new Error(`Invalid region count: ${raw.regions.length}. Expected 21.`);

            // ==========================================
            // SLOT ASSIGNMENT PROTOCOL
            // Keys are Templates. Content is Slotted.
            // ==========================================

            const citiesData: City[] = [];
            const regionsData: RegionalLocale[] = [];

            // Iterate 1..3 for Cities
            for (let cIdx = 0; cIdx < 3; cIdx++) {
                const cityTemplateKey = `${civId}-CT${cIdx + 1}`; // C1-CT1
                const cityContent = raw.cities[cIdx];

                const cityRegions: RegionalLocale[] = [];

                // Iterate 1..7 for Regions for this City
                for (let rIdx = 0; rIdx < 7; rIdx++) {
                    const regionTemplateKey = `${cityTemplateKey}-R${rIdx + 1}`; // C1-CT1-R1
                    const flatRegionIndex = (cIdx * 7) + rIdx;
                    const regionContent = raw.regions[flatRegionIndex];

                    const regionObj: RegionalLocale = {
                        regionId: regionTemplateKey,
                        cityId: cityTemplateKey,
                        name: regionContent.name,
                        description: regionContent.summaryStub, // Map summaryStub to description
                        tags: regionContent.tags || [],
                        type: 'QUEST_LOCALE', // Default, updated in gridAllocator
                        position: { x: 0, y: 0 } // Updated in gridAllocator
                    };
                    
                    cityRegions.push(regionObj);
                    regionsData.push(regionObj);
                }

                citiesData.push({
                    cityId: cityTemplateKey,
                    civId: civId,
                    name: cityContent.name,
                    description: cityContent.summary,
                    tags: cityContent.tags || [],
                    regionalLocales: cityRegions
                });
            }

            // Randomize grid layout client-side using the strictly keyed data
            const { grid, cities } = buildCivilizationGrid(regionsData, citiesData);
            
            return {
                civId: civId,
                name: raw.name,
                primaryAttribute: attribute,
                summary: raw.summary,
                description: raw.summary,
                themes: raw.themes,
                conflictDrivers: raw.conflictDrivers,
                taboos: raw.taboos,
                cities: cities,
                grid: grid,
                ruralZones: [],
                quests: []
            };

        } catch (e) {
            console.warn(`Attempt ${attempts + 1} failed:`, e);
            attempts++;
            if (attempts > MAX_RETRIES) throw e;
        }
    }
    throw new Error("Failed to generate civilization");
};

export const generateHistoryOnly = async (prompt: string, seedData?: TransformData | null): Promise<string> => {
    return generateHistory(prompt, seedData);
};