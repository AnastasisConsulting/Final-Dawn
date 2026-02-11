import { Ollama } from "ollama";
import { CharacterOutputSchema } from "./contracts/contracts.js";
import type { CharacterOutput } from "./contracts/contracts.js";
import { buildCharacterPrompt } from "./templates/templates.js";
import type { VoxelSnapshot } from "./types.js";

export class EideusOrchestrator {
  private ollama: Ollama;
  private model: string;

  constructor(endpoint: string = "http://localhost:11434", model: string = "llama3:8b") {
    this.ollama = new Ollama({ host: endpoint });
    this.model = model;
  }

  /**
   * Runs a sequential pass for multiple recipients (Lyra, Vizzy, NavBot)
   */
  async executeTurn(snapshot: VoxelSnapshot, userIntent: string, recipients: string[]) {
    const results: Record<string, CharacterOutput> = {};
    let runningIntent = userIntent;

    for (const role of recipients) {
      const prompt = buildCharacterPrompt(role, snapshot, runningIntent);
      
      try {
        const response = await this.ollama.generate({
          model: this.model,
          prompt: prompt,
          format: "json",
          options: {
            temperature: 0.4, // Keep it grounded to avoid circular rambling
            stop: ["\n", "User:", "==="],
            num_predict: 128 // Strict token budget
          }
        });

        const parsed = CharacterOutputSchema.parse(JSON.parse(response.response));
        results[role] = parsed;

        // Feed the previous character's output into the next pass to maintain continuity
        runningIntent = `${role}: ${parsed.dialogue}`;
      } catch (err) {
        console.error(`Orchestration failed for ${role}:`, err);
        results[role] = { thought: "Error", dialogue: "SIGNAL LOST", intensity: 1 };
      }
    }

    return results;
  }
}
