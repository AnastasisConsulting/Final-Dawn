// packages/eideus-orchestrator-core/src/TurnEngine.ts
import { Ollama } from 'ollama';
import { buildDynamicSystemPrompt } from './templates/templates.js';
import { AgentOutputSchema } from './validators.js';
import type { TurnContext } from './types.js';

export class TurnEngine {
  private ollama: Ollama;

  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
  }

  async processTurn(context: TurnContext): Promise<any> {
    const systemPrompt = buildDynamicSystemPrompt(context);
    
    // We use a low temperature to force adherence to the JSON schema
    const response = await this.ollama.generate({
      model: 'llama3:8b', // Or your custom finetune
      prompt: `PLAYER INPUT: "${context.userIntent}"`,
      system: systemPrompt,
      format: 'json',
      options: {
        temperature: 0.4,
        num_ctx: 4096, // Ensure we fit the voxel history
        stop: ['PLAYER INPUT:', '###']
      }
    });

    try {
      // Validate the JSON. If it fails, it throws.
      const parsed = AgentOutputSchema.parse(JSON.parse(response.response));
      return parsed;
    } catch (error) {
      console.error("Orchestrator Drift Detected:", error);
      // Fallback or retry logic goes here
      return { thought: "Error", dialogue: "Signal corrupted..." };
    }
  }
}
