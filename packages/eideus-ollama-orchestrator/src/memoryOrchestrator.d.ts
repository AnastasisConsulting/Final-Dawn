import { OllamaClient } from "./ollama/client.js";
import { InMemoryLattice, SpatialKey, TemporalKey } from "eideus-memory-lattice-api";
export type MemoryContextPiece = {
    id: string;
    spatial: SpatialKey;
    temporal: TemporalKey;
    xPlus: string;
    xMinus: string;
    tags: string[];
    loreKey: string;
    entities: Array<{
        id: string;
        name: string;
        class?: string;
    }>;
};
export type MemoryOrchestrator = {
    lattice: InMemoryLattice;
    embedText(text: string): Promise<number[]>;
    decideAndRetrieve(args: {
        playerText: string;
        saga: number;
        book: number;
        spatialHint?: SpatialKey;
        tagHints?: string[];
        entityHints?: string[];
    }): Promise<MemoryContextPiece[]>;
};
export declare function createMemoryOrchestrator(ollama: OllamaClient): MemoryOrchestrator;
//# sourceMappingURL=memoryOrchestrator.d.ts.map