import { OllamaClient } from "./ollama/client";
import type { SpatialKey, TemporalKey, EntityCard } from "eideus-memory-lattice-api";
import { TurnRecipient } from "./prompts.js";
import type { RecipientMode } from "./prompts";
export type TurnRequest = {
    playerText: string;
    spatial: SpatialKey;
    temporalBase: Omit<TemporalKey, "page">;
    page: number;
    loreKey: string;
    entitiesPresent?: EntityCard[];
    tagHints?: string[];
    entityHints?: string[];
    focusEntityId?: string;
    recipients?: TurnRecipient[];
    caches: {
        lore: Map<string, any>;
        quests: Map<string, any>;
        cast: Map<string, any>;
    };
};
export type TurnResponse = {
    narration: string;
    outputs: Array<{
        id: string;
        label: string;
        mode: RecipientMode;
        markdown: string;
    }>;
    wroteVoxelId: string;
    usedMemory: Array<{
        id: string;
        spatial: SpatialKey;
        temporal: TemporalKey;
    }>;
};
export declare function createTurnEngine(args: {
    ollama: OllamaClient;
}): {
    processTurn: (req: TurnRequest) => Promise<TurnResponse>;
    memory: import("./memoryOrchestrator.js").MemoryOrchestrator;
};
//# sourceMappingURL=turnEngine.d.ts.map