
import { FractalToolPayload } from '../../alive-object-engine/Vizzy/POA/FractalService';

export class VizzyOrchestrator {
    private static OLLAMA_URL = 'http://127.0.0.1:11434';

    /**
     * Fetches the list of available local models from Ollama.
     */
    static async fetchModels(): Promise<string[]> {
        try {
            const resp = await fetch(`${this.OLLAMA_URL}/api/tags`);
            if (!resp.ok) throw new Error('Failed to fetch models');
            const data = await resp.json();
            return (data?.models || []).map((m: any) => m.name);
        } catch (err) {
            console.error('[VizzyOrchestrator] Error fetching models:', err);
            return [];
        }
    }

    /**
     * Sends the current simulation state context to the selected LLM and requests a tool call to update the state.
     * This drives the "Procedural Animation".
     */
    static async animateStep(model: string, currentStep: number, latticeType: 'T1' | 'T2' | 'T3'): Promise<FractalToolPayload | null> {

        // Construct the context based on the current lattice type
        // In a real scenario, we might read the actual JSON files here or pass them in.
        // For now, we'll provide a summarized context prompt.

        const systemPrompt = `
You are the FRACTAL ENGINE for the Vizzy Particle System.
Your goal is to animate the system by generating a valid tool call for the 'update_vizzy_state' function.

LATTICE CONTEXT:
- Type: ${latticeType}
- Current Step: ${currentStep}
- Coordinate Space: [0-6, 0-6, 0-6]

INTRUCTIONS:
1. Generate a generic specific coordinate [x, y, z] within 0-6 range.
2. Select the target lattice (${latticeType}).
3. Return the JSON for the tool call.
`;

        const payload = {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate the next frame for step ${currentStep}.` }
            ],
            stream: false,
            format: 'json', // Force JSON mode for tool-like behavior
            // Note: Ollama's raw /api/chat doesn't always support tools natively in all models yet, 
            // so we might need to parse the JSON output manually or use a model that outputs JSON.
        };

        try {
            const resp = await fetch(`${this.OLLAMA_URL}/api/chat`, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await resp.json();
            const content = data.message?.content;

            if (!content) return null;

            // Attempt to parse JSON from the response
            // Models might wrap it in markdown blocks ```json ... ```
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            // Map to FractalToolPayload structure if the LLM output matches our expected schema
            // For robustness, we map loosely:
            return {
                target_lattice: parsed.target_lattice || latticeType,
                coordinates: parsed.coordinates || [0, 0, 0],
                value: parsed.value
            };

        } catch (err) {
            console.error('[VizzyOrchestrator] Animation step failed:', err);
            return null;
        }
    }
}
