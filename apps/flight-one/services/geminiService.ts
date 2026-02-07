
import { GoogleGenAI } from "@google/genai";

export const generateMissionObjective = async (currentSector: string, difficulty: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Generate a short, urgent, sci-fi flight mission objective (1 sentence max).
      Context: The pilot is flying in Sector ${currentSector} at ${difficulty} difficulty.
      
      Generate a mission from one of these categories randomly:
      1. Combat (Intercept, Defend, Destroy)
      2. Escort (Protect friendly vessel, Guide convoy)
      3. Industrial (Scan asteroid field, Locate mining resource)
      4. Recon (Patrol route, Scan anomaly, Investigate crash)

      Examples:
      - Intercept the rogue drone near the northern peaks.
      - Escort the supply hauler through the debris field.
      - Scan the volatile asteroid cluster for rare isotopes.
      - Perform a high-speed reconnaissance flyby of the monolith.
      
      Output ONLY the mission text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Patrol the sector and report anomalies.";
  } catch (error) {
    console.error("Gemini Mission Gen Error:", error);
    return "Communications offline. Proceed with standard patrol.";
  }
};

export const generateDistressSignal = async (): Promise<{type: 'GENERIC' | 'PIRATE', text: string}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            Generate a short sci-fi distress signal transmission.
            It should be 1-2 sentences. 
            Include the vessel ID (e.g., "Transport Alpha", "Freighter 9") and the specific emergency.
            
            10% chance it is a PIRATE BAIT message (seems friendly but slightly off/suspicious).
            
            Return JSON format: { "type": "GENERIC" | "PIRATE", "text": "The message string" }
            
            Examples:
            { "type": "GENERIC", "text": "Mayday! This is Mining Hauler 7. Our navigation drive has ruptured!" }
            { "type": "GENERIC", "text": "Requesting immediate assist. Transport Delta under heavy fire from unknown hostiles." }
            { "type": "PIRATE", "text": "This is... Civilian Liner... we have uh... engine trouble. Come closer for data sync." }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const json = JSON.parse(response.text || '{}');
        return {
            type: json.type || 'GENERIC',
            text: json.text || "Mayday! Systems critical. Requesting assistance."
        };
    } catch (e) {
        return { type: 'GENERIC', text: "Mayday! Signal interference high. Requesting support." };
    }
}

export const generateNavBotComment = async (): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            You are "NavBot", a sardonic, dark-humored AI installed in a fighter ship.
            The pilot just wiped out a group of enemies.
            Generate a single, short, snide, dark humor remark congratulating them but also mocking them or the futility of war.
            Max 12 words.
            Examples:
            "Efficiency is adequate. Your empathy levels are concerningly low."
            "Scrap metal secured. Try not to scratch the paint next time."
            "They had families. I calculated the grief. It's substantial."
            "Targets neutralized. I almost felt something. Almost."
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text?.trim() || "Targets eliminated. How droll.";
    } catch (e) {
        return "Hostiles cleared. My enthusiasm is boundless.";
    }
}
