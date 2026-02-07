/**
 * AI World Generator
 * Uses Ollama to generate world content
 */

import { OllamaClient } from './ollama/client';
import type { Destination, CityMap, LorebookEntry, Quest } from './worldDataWriter';

export class AIWorldGenerator {
  private ollama: OllamaClient;
  private model: string;

  constructor(ollama: OllamaClient, model: string = 'llama3.1') {
    this.ollama = ollama;
    this.model = model;
  }

  /**
   * Parse JSON from Ollama response (handles markdown code blocks)
   */
  private parseJSON(text: string): any {
    const cleanJson = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(cleanJson);
  }

  /**
   * Generate city map using AI
   */
  async generateCityMap(destination: Destination): Promise<CityMap> {
    const prompt = `Generate a detailed sci-fi mega-city JSON for the following location:

**Context:**
- Galaxy: ${destination.galaxy} (industrial/dystopian theme)
- System: ${destination.system}
- Planet: ${destination.object}
- Civilization: ${destination.civ}
- City Name: ${destination.name}

**Requirements:**
1. Create 4-7 districts with types: commercial, residential, industrial, government, entertainment, slums, or tech
2. Create 2-4 landing pads with designations (LP-A, LP-B, etc.)
3. Create 10-15 waypoints (bars, shops, quest hubs, corporate buildings, info panels)
4. Choose a layout style: grid, radial, organic, or vertical
5. Define atmospheric conditions (pollution 0-1, weather, lighting quality)

**Output ONLY valid JSON matching this exact structure:**
{
  "name": "${destination.name}",
  "layout": "grid",
  "atmosphere": {
    "pollution": 0.7,
    "weather": "acid rain",
    "lighting": "neon-saturated"
  },
  "districts": [
    {
      "name": "District name",
      "type": "industrial",
      "position": { "x": 100, "y": 0, "z": 50 },
      "radius": 500,
      "buildingDensity": 0.8
    }
  ],
  "landingPads": [
    {
      "designation": "LP-A",
      "position": { "x": 0, "y": 5, "z": 0 },
      "status": "available",
      "triggerRadius": 50,
      "clearanceSpeed": 20
    }
  ],
  "waypoints": [
    {
      "id": "wp_bar_001",
      "name": "The Rusty Bolt",
      "type": "bar",
      "position": { "x": 120, "y": 0, "z": 45 },
      "description": "A dingy bar frequented by dock workers"
    }
  ]
}

Generate creative, thematic content. Return ONLY the JSON, no markdown formatting.`;

    const response = await this.ollama.generate({
      model: this.model,
      prompt,
    });

    return this.parseJSON(response.response);
  }

  /**
   * Generate lorebook entries using AI
   */
  async generateLorebook(destination: Destination): Promise<LorebookEntry[]> {
    const prompt = `Generate 5-7 lorebook entries for the planet ${destination.object} in the ${destination.galaxy} galaxy.

**Context:**
- Planet: ${destination.object}
- System: ${destination.system}
- Galaxy: ${destination.galaxy}
- Theme: Industrial dystopia, corporate control, resource extraction

**Entry Topics (choose 5-7):**
- Planet history
- Major corporations/factions
- Cultural practices
- Environmental hazards
- Economic activities
- Political situation
- Notable events
- Local legends

**Output ONLY valid JSON array:**
[
  {
    "id": "lore_${destination.object.toLowerCase().replace(/[^a-z0-9]/g, '_')}_001",
    "title": "Entry title",
    "content": "2-4 paragraphs of engaging lore text...",
    "tags": ["history", "corporations"],
    "unlocked": false
  }
]

Make entries atmospheric and world-building focused. Return ONLY the JSON array, no markdown.`;

    const response = await this.ollama.generate({
      model: this.model,
      prompt,
    });

    return this.parseJSON(response.response);
  }

  /**
   * Generate quests using AI
   */
  async generateQuests(destination: Destination, cityMap: CityMap): Promise<Quest[]> {
    const waypointNames = cityMap.waypoints.slice(0, 5).map(w => w.name).join(', ');

    const prompt = `Generate 3-5 starter quests for region ${destination.region} of ${destination.name} on ${destination.object}.

**Context:**
- City: ${destination.name}
- Available Locations: ${waypointNames}
- Theme: Industrial, corporate intrigue, survival

**Quest Types:** delivery, investigation, combat, negotiation, exploration

**Output ONLY valid JSON array:**
[
  {
    "id": "quest_${destination.object.toLowerCase().replace(/[^a-z0-9]/g, '_')}_civ${destination.civ}_001",
    "title": "Quest title",
    "description": "Brief quest hook (2-3 sentences)",
    "questGiver": {
      "name": "NPC Name",
      "location": "${cityMap.waypoints[0]?.name || 'Central Hub'}"
    },
    "objectives": [
      {
        "id": "obj_001",
        "description": "Objective description",
        "completed": false
      }
    ],
    "rewards": {
      "xp": 100,
      "credits": 500,
      "items": [],
      "affinityChanges": {}
    },
    "difficulty": 2,
    "prerequisites": [],
    "status": "available"
  }
]

Make quests engaging and thematic. Return ONLY the JSON array, no markdown.`;

    const response = await this.ollama.generate({
      model: this.model,
      prompt,
    });

    return this.parseJSON(response.response);
  }
}
