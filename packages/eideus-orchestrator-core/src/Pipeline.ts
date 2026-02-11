// packages/eideus-orchestrator-core/src/Pipeline.ts
import { Ollama } from "ollama";
import { buildGMPrompt } from "./roles/gm.js";
import { buildLyraPrompt } from "./roles/lyra.js";
import { buildNavPrompt } from "./roles/nav.js";
import { buildVizzyPrompt } from "./roles/vizzy.js";
import type { TurnContext, PipelineResult } from "./types.js";

export class OrchestrationPipeline {
  private ollama: Ollama;

  constructor() {
    // We increase concurrency to allow parallel inference if your GPU allows
    this.ollama = new Ollama({ host: "http://localhost:11434" });
  }

  async executeTurn(context: TurnContext): Promise<PipelineResult> {
    const result: PipelineResult = {
      gm_narrative: "",
      lyra_dialogue: null,
      nav_update: null,
      vizzy_interjection: null,
      state_delta: {}
    };

    // 1. GM PASS (The Foundation)
    // Must run first to establish reality.
    const gmPrompt = buildGMPrompt(context.currentVoxel, context.userIntent, context.questState);
    const gmResponse = await this.ollama.generate({
      model: "llama3:8b", 
      prompt: gmPrompt,
      options: { temperature: 0.5, num_predict: 150, stop: ["Player:", "Lyra:"] }
    });
    result.gm_narrative = gmResponse.response.trim();

    // 2. PARALLEL PASS (Lyra & NavBot)
    // NavBot provides UI data while Lyra provides flavor. They don't block each other.
    const lyraPromise = this.runLyra(context, result.gm_narrative);
    const navPromise = this.runNav(context, result.gm_narrative);

    // Wait for both
    const [lyraResult, navResult] = await Promise.all([lyraPromise, navPromise]);
    
    result.lyra_dialogue = lyraResult;
    result.nav_update = navResult;

    // 3. VIZZY PASS (Conditional)
    // Vizzy decides to speak based on the aggregate chaos of the turn.
    // We assume a 30% chance + contextual triggers.
    if (Math.random() > 0.7 || context.currentVoxel.faces.y_minus.includes("GLITCH")) {
        result.vizzy_interjection = await this.runVizzy(context, result.gm_narrative);
    }

    return result;
  }

  // --- Helper Methods to keep main logic clean ---

  private async runLyra(context: TurnContext, gmOutput: string): Promise<string | null> {
    const prompt = buildLyraPrompt(context.currentVoxel, gmOutput, context.mossProfile);
    try {
        const response = await this.ollama.generate({
            model: "llama3:8b",
            prompt: prompt,
            format: "json", 
            options: { temperature: 0.7, num_predict: 100 }
        });
        return JSON.parse(response.response).dialogue;
    } catch { return null; }
  }

  private async runNav(context: TurnContext, gmOutput: string): Promise<any> {
    const prompt = buildNavPrompt(context.currentVoxel, gmOutput);
    try {
        const response = await this.ollama.generate({
            model: "llama3:8b", // Or "phi3:mini" for speed
            prompt: prompt,
            format: "json", // Strict JSON for UI rendering
            options: { temperature: 0.1, num_predict: 128 }
        });
        return JSON.parse(response.response);
    } catch (e) { 
        console.error("NavBot Failed:", e);
        return { hazards: [], waypoints: [], log_entry: "SYSTEM OFFLINE" }; 
    }
  }

  private async runVizzy(context: TurnContext, gmOutput: string): Promise<string | null> {
    const prompt = buildVizzyPrompt(context.currentVoxel, gmOutput, context.questState);
    try {
        const response = await this.ollama.generate({
            model: "llama3:8b",
            prompt: prompt,
            format: "json",
            options: { temperature: 0.9, num_predict: 60 } // High temp for craziness
        });
        const parsed = JSON.parse(response.response);
        return parsed.status === "ACTIVE" ? parsed.dialogue : null;
    } catch { return null; }
  }
}
