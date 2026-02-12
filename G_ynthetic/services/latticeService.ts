// G_ynthetic/services/latticeService.ts
import { LatticeNodeData } from '../types';

const LATTICE_PREFIX = 'lattice_';

// Standard offset for 7x7x7 grid (-3 to +3 becomes 0 to 6)
const CENTER_OFFSET = 3;

/**
 * Generates the standardized key for a node.
 * Format: T{transform}-D{x}{y}{z}-S{shell}
 * Example: T0-D333-S0 (Center Node: Neutral Risk, Reward, Relation)
 */
export const makeLatticeKey = (t: number, x: number, y: number, z: number): string | null => {
    try {
        // Boundary checks (-3 to +3)
        if (x < -3 || x > 3) throw new Error(`X coord ${x} out of bounds`);
        if (y < -3 || y > 3) throw new Error(`Y coord ${y} out of bounds`);
        if (z < -3 || z > 3) throw new Error(`Z coord ${z} out of bounds`);
        if (t < 0 || t > 2) throw new Error("Transform must be 0..2");

        // Encode to digits 0-6
        const dx = x + CENTER_OFFSET;
        const dy = y + CENTER_OFFSET;
        const dz = z + CENTER_OFFSET;
        
        // Calculate Shell (Distance from center)
        const s = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));

        return `T${t}-D${dx}${dy}${dz}-S${s}`;
    } catch (e) {
        console.error(`Lattice Key Error:`, e);
        return null;
    }
};

/**
 * Service to interact with the Lattice Memory (The 7x7x7 Grid).
 * Acts as the "Hippocampus" - instant retrieval of spatial context.
 */
export const latticeStore = {
    /**
     * Reads node context.
     * Used by the Fast Path to inject "State of Mind" into the 3B LLM.
     */
    readNode: (key: string): LatticeNodeData | null => {
        try {
            const storedData = localStorage.getItem(`${LATTICE_PREFIX}${key}`);
            if (!storedData) return null;
            return JSON.parse(storedData) as LatticeNodeData;
        } catch (error) {
            console.error(`Error reading node ${key}:`, error);
            return null;
        }
    },

    /**
     * Writes/Updates node data.
     * Used when the system "Populates" a new mental state.
     */
    writeNode: (key: string, data: Partial<LatticeNodeData>, merge: boolean = true): boolean => {
        try {
            let dataToWrite: LatticeNodeData;
            if (merge) {
                const existing = latticeStore.readNode(key);
                dataToWrite = { ...(existing || {} as LatticeNodeData), ...data, key };
            } else {
                dataToWrite = data as LatticeNodeData;
            }
            localStorage.setItem(`${LATTICE_PREFIX}${key}`, JSON.stringify(dataToWrite));
            return true;
        } catch (error) {
            console.error(`Error writing node ${key}:`, error);
            return false;
        }
    },

    /**
     * Retrieves the "Definition" text for a node.
     * If the node is empty, it returns a fallback string based on the coordinates.
     * This ensures the 3B model always has *something* to guide it.
     */
    readNodeContext: (coords: { x: number, y: number, z: number }): { definition: string, exists: boolean } => {
        const key = makeLatticeKey(0, coords.x, coords.y, coords.z);
        if (!key) return { definition: "Invalid State", exists: false };

        const node = latticeStore.readNode(key);
        
        if (node && node.Location_Metadata?.Description) {
            return { 
                definition: node.Location_Metadata.Description, 
                exists: true 
            };
        }

        // Fallback: Synthesize context from raw math if memory doesn't exist yet
        return {
            definition: `Cognitive State: Risk Level ${coords.x}, Reward Potential ${coords.y}, Social Relation ${coords.z}.`,
            exists: false
        };
    }
};