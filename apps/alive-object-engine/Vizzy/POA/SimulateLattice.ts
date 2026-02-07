
import { FractalService, FractalToolPayload } from './FractalService';

// Define the interface for the injected orchestrator
export interface SimulationOrchestrator {
    animateStep(model: string, currentStep: number, latticeType: 'T1' | 'T2' | 'T3'): Promise<FractalToolPayload | null>;
}

let simulationInterval: number | null = null;
let step = 0;

export function runSimulation(orchestrator?: SimulationOrchestrator, modelName?: string) {
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
        console.log("Simulation stopped.");
        return;
    }

    console.log(`Starting Fractal Simulation... (Model: ${modelName || 'Hardcoded'})`);

    simulationInterval = window.setInterval(async () => {
        console.log(`[Sim] Step ${step}`);

        // Determine Lattice Type based on step phase
        let latticeType: 'T1' | 'T2' | 'T3' = 'T1';
        if (step < 7) latticeType = 'T1';
        else if (step < 14) latticeType = 'T2';
        else if (step < 21) latticeType = 'T3';
        else {
            step = -1; // Reset
            step++;
            return;
        }

        // 1. ORCHESTRATED MODE (LLM) WITH FALLBACK
        let success = false;
        if (orchestrator && modelName) {
            try {
                const payload = await orchestrator.animateStep(modelName, step, latticeType);
                if (payload) {
                    FractalService.executeToolCall(payload);
                    success = true;
                } else {
                    console.warn(`[Sim] Orchestrator (Model: ${modelName}) returned null/failed. Falling back to hardcoded.`);
                }
            } catch (err) {
                console.error('[Sim] Orchestrator error, falling back:', err);
            }
        }

        // 2. HARDCODED MODE (Fallback or Default)
        if (!success) {
            let coords: [number, number, number] = [0, 0, 0];

            if (latticeType === 'T1') coords = [step, 0, 0];
            else if (latticeType === 'T2') coords = [0, step - 7, 0];
            else if (latticeType === 'T3') coords = [0, 0, step - 14];

            FractalService.executeToolCall({
                target_lattice: latticeType,
                coordinates: coords
            });
        }

        step++;

    }, 2500); // 2.5s per state
}