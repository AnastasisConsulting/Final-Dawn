// FILE: Vizzy/POA/FractalService.ts
import { FractalInterpreter } from './FractalInterpreter';
import { AppState } from '../types';

export interface FractalToolPayload {
    target_lattice: 'T1' | 'T2' | 'T3';
    coordinates: [number, number, number]; // [0-6, 0-6, 0-6]
    value?: any; // Optional override
}

export class FractalService {
    private static eventTarget = new EventTarget();

    /**
     * THE TOOL CALL HANDLER
     * This is the function you map to your LLM's "update_vizzy_state" tool.
     */
    static async executeToolCall(payload: FractalToolPayload): Promise<{ success: boolean; stateDiff: Partial<AppState> }> {
        console.log(`[FractalService] Processing Lattice Address: ${payload.target_lattice} @ [${payload.coordinates}]`);

        // 1. Map String ID to Numeric ID
        const transformMap: Record<string, 1 | 2 | 3> = {
            'T1': 1, // Structural (Z-Up)
            'T2': 2, // Aesthetic (Y-Up)
            'T3': 3  // Environmental (X-Up)
        };

        const tId = transformMap[payload.target_lattice];
        if (!tId) {
            console.error(`[FractalService] Invalid Lattice ID: ${payload.target_lattice}`);
            return { success: false, stateDiff: {} };
        }

        // 2. Interpret the Fractal Coordinates
        const stateDiff = FractalInterpreter.resolve(tId, payload.coordinates, payload.value);

        // 3. Dispatch to React/Vizzy
        // This allows App.tsx to listen via 'window' or internal bus
        this.dispatchUpdate(stateDiff);

        return { success: true, stateDiff };
    }

    /**
     * Internal Dispatcher - Sends the new state slice to the UI
     */
    private static dispatchUpdate(partialState: Partial<AppState>) {
        // Dispatch standard DOM event for App.tsx to catch
        const event = new CustomEvent('vizzy-procedural-update', {
            detail: partialState,
            bubbles: true
        });

        // Dispatch to window for global access (React usually mounts here)
        if (typeof window !== 'undefined') {
            window.dispatchEvent(event);
        }
    }
}