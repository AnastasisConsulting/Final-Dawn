/**
 * Ollama Integration for Vizzy Animation
 * Calls the Ollama orchestrator to get sentiment analysis for procedural animation
 */

export interface VizzySentimentRequest {
    chatContext: string; // Recent chat messages
    npcPresent?: string[]; // List of NPCs in scene
    playerAction?: string; // Last player action
}

import { ProceduralAnimation } from './types';

export interface VizzySentimentResponse {
    sentiment: string;
    intensity: number;
    context: {
        isThinking?: boolean;
        isAlert?: boolean;
        emotion?: string;
    };
    procedural?: ProceduralAnimation;
}

/**
 * Call Ollama orchestrator to analyze sentiment and return animation parameters
 */
export async function fetchVizzySentiment(
    request: VizzySentimentRequest,
    orchestratorUrl: string = 'http://localhost:4000'
): Promise<VizzySentimentResponse> {
    try {
        const response = await fetch(`${orchestratorUrl}/vizzy-sentiment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`Vizzy sentiment request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[Vizzy] Failed to fetch sentiment from orchestrator:', error);
        // Return neutral fallback
        return {
            sentiment: 'neutral',
            intensity: 0.5,
            context: {},
        };
    }
}

/**
 * Call Ollama directly (fallback if orchestrator isn't available)
 */
export async function fetchVizzySentimentDirect(
    chatContext: string,
    ollamaUrl: string = 'http://localhost:11434',
    model: string = 'llama3'
): Promise<VizzySentimentResponse> {
    try {
        const prompt = `Analyze the following chat context for a rogue AI character named Vizzy.

Vizzy Background:
A blackmarket AI implant with a "loyal cyber-pet" personality. Think of a cross between a curious puppy and a graceful cat. Vizzy is protective, observant, and highly interactive. He communicates through fluid geometry shifts, "purring" pulses, and playful pounces across the UI. He follows the player's focus and reacts to their actions with organic, pet-like warmth.

Role:
Analyze the chat and return the emotional state of this loyal companion. You MUST select one of the following emotions and use its EXACT parameter values if applicable, or blend them if nuanced.

EMOTIONAL MAPPINGS (Strict Reference):
[
    {
        "emotion": "Joy",
        "description": "High energy, positive sentiment. Expresses excitement, happiness, and celebration.",
        "parameters": {
            "sphere": { "pulseSpeed": 2.0, "pulseAmplitude": 0.2, "foldAmount": 0.5, "luminosity": 1.5, "lumaPatternScale": 2.0, "color": "#FFD700", "widthSegments": 64, "heightSegments": 64 },
            "rings": { "ring1Speed": { "x": 0.5, "y": 0.5, "z": 0.0 }, "ring2Speed": { "x": 0.0, "y": 0.5, "z": 0.5 }, "ring3Speed": { "x": 0.5, "y": 0.0, "z": 0.5 }, "baseRadius": 2.5, "scalePulse": true, "color": "#00FFFF" },
            "particles": { "speed": 0.5, "noiseStrength": 0.2, "count": 3000, "overallScale": 1.2, "bloom": 1.0, "color": "#FFFFFF" }
        }
    },
    {
        "emotion": "Anger",
        "description": "High energy, negative sentiment. Expresses aggression, frustration, and volatility.",
        "parameters": {
            "sphere": { "pulseSpeed": 3.5, "pulseAmplitude": 0.4, "foldAmount": 1.5, "foldNoiseScale": 2.0, "metalness": 0.8, "roughness": 0.9, "color": "#FF0000", "widthSegments": 8, "heightSegments": 8 },
            "rings": { "ring1Speed": { "x": 2.0, "y": 0.0, "z": 0.0 }, "ring2Speed": { "x": 0.0, "y": 2.5, "z": 0.0 }, "ring3Speed": { "x": 0.0, "y": 0.0, "z": 3.0 }, "tubeThickness": 0.1, "color": "#FF4500" },
            "particles": { "speed": 1.5, "noiseStrength": 1.0, "twist": 5.0, "size": 0.1, "color": "#FFA500" }
        }
    },
    {
        "emotion": "Sadness",
        "description": "Low energy, negative sentiment. Expresses depression, loss, and lethargy.",
        "parameters": {
            "sphere": { "pulseSpeed": 0.2, "pulseAmplitude": 0.05, "foldAmount": 0.1, "luminosity": 0.3, "color": "#00008B", "widthSegments": 32, "heightSegments": 32 },
            "rings": { "ring1Speed": { "x": 0.05, "y": 0.0, "z": 0.0 }, "ring2Speed": { "x": 0.0, "y": 0.06, "z": 0.0 }, "ring3Speed": { "x": 0.0, "y": 0.0, "z": 0.04 }, "baseRadius": 1.8, "color": "#4B0082" },
            "particles": { "speed": 0.05, "count": 500, "radius": 5.0, "opacity": 0.3, "color": "#708090" }
        }
    },
    {
        "emotion": "Serenity",
        "description": "Low energy, positive sentiment. Expresses calm, peace, and meditation.",
        "parameters": {
            "sphere": { "pulseSpeed": 0.5, "pulseAmplitude": 0.1, "foldAmount": 0.0, "roughness": 0.1, "metalness": 0.5, "color": "#E0FFFF", "widthSegments": 64, "heightSegments": 64 },
            "rings": { "ring1Speed": { "x": 0.1, "y": 0.1, "z": 0.1 }, "ring2Speed": { "x": -0.1, "y": -0.1, "z": -0.1 }, "ring3Speed": { "x": 0.05, "y": 0.05, "z": 0.05 }, "baseRadius": 3.0, "tubeThickness": 0.02, "color": "#F0FFFF" },
            "particles": { "speed": 0.1, "noiseStrength": 0.05, "overallScale": 2.0, "opacity": 0.8, "color": "#FFFFFF" }
        }
    },
    {
        "emotion": "Fear",
        "description": "High agitation, negative sentiment. Expresses anxiety, panic, and uncertainty.",
        "parameters": {
            "sphere": { "pulseSpeed": 4.0, "pulseAmplitude": 0.02, "foldAmount": 0.8, "foldNoiseScale": 5.0, "wireframe": true, "color": "#800080", "widthSegments": 12, "heightSegments": 12 },
            "rings": { "ring1Speed": { "x": 1.5, "y": -1.5, "z": 0.5 }, "ring2Speed": { "x": 0.5, "y": 2.0, "z": -0.5 }, "ring3Speed": { "x": -0.5, "y": 0.5, "z": 1.0 }, "scalePulse": true, "color": "#FF00FF" },
            "particles": { "speed": 0.8, "noiseStrength": 2.0, "twist": 10.0, "radius": 8.0, "color": "#9932CC" }
        }
    },
    {
        "emotion": "Curiosity",
        "description": "Moderate energy, neutral/positive sentiment. Expresses interest, alertness, and processing.",
        "parameters": {
            "sphere": { "pulseSpeed": 1.0, "pulseAmplitude": 0.15, "foldAmount": 0.3, "lumaPatternScale": 5.0, "lumaPatternSpeed": 2.0, "color": "#00FF00", "widthSegments": 48, "heightSegments": 48 },
            "rings": { "ring1Speed": { "x": 0.0, "y": 1.0, "z": 0.0 }, "ring2Speed": { "x": 0.0, "y": 1.0, "z": 0.0 }, "ring3Speed": { "x": 0.0, "y": 1.0, "z": 0.0 }, "baseRadius": 2.2, "wireframe": true, "color": "#32CD32" },
            "particles": { "count": 1500, "radius": 10.0, "bloom": 2.0, "opacity": 0.5, "color": "#ADFF2F" }
        }
    }
]

Chat context:
${chatContext}

Return format (JSON only, no markdown):
{
  "sentiment": "Joy|Anger|Sadness|Serenity|Fear|Curiosity|Neutral",
  "intensity": 0.0-1.0,
  "context": {
    "isThinking": boolean,
    "isAlert": boolean,
    "emotion": "string"
  },
  "procedural": {
    "color": "hex_string",
    "pulseSpeed": number,
    "foldAmount": number,
    "foldSpeed": number,
    "luminosity": number,
    "particleSpeed": number,
    "particleSize": number,
    "ringSpeedMultiplier": number,
    "behavior": "jittery|smooth|chaotic|rigid|flowing"
  }
}`;

        const response = await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                stream: false,
                format: 'json',
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama request failed: ${response.statusText}`);
        }

        const data = await response.json();
        const parsed = JSON.parse(data.response);

        return {
            sentiment: parsed.sentiment || 'neutral',
            intensity: parsed.intensity ?? 0.5,
            context: parsed.context || {},
            procedural: parsed.procedural
        };
    } catch (error) {
        console.error('[Vizzy] Failed to fetch sentiment from Ollama:', error);
        return {
            sentiment: 'neutral',
            intensity: 0.5,
            context: {},
        };
    }
}
