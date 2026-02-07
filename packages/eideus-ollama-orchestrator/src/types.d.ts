import type { SpatialKey, TemporalKey, EntityCard } from "eideus-memory-lattice-api";
export type ChatRole = "system" | "user" | "assistant" | "tool";
export type ChatMessage = {
    role: ChatRole;
    content: string;
    name?: string;
};
export type EmbeddingVector = number[];
export type ToolcallEnvelope<TPayload> = {
    eventId: string;
    ts: number;
    seq: number;
    sessionId: string;
    turnId?: string;
    payload: TPayload;
    type: string;
};
export type LlmModelSpec = {
    chatModel: string;
    embedModel: string;
};
export type RecipientMode = "gm" | "lyra" | "vizzy" | "nav" | "npc";
export type TurnRecipient = {
    id: string;
    label: string;
    mode: RecipientMode;
    focusEntityId?: string;
};
/**
 * CANONICAL TURN CONTRACT (UI -> server -> engine)
 * This is the only supported request body for POST /turn.
 */
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
    caches?: {
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
export type RetrievedMemory = {
    spatial: any;
    temporal: any;
    faces: {
        "x+"?: string;
        "x-"?: string;
        "y-"?: string[];
        "z-"?: string;
        "z+"?: any[];
    };
    score: number;
};
export type MemorySelection = {
    entryPoint: "DirectVoxelRead" | "DirectSpatialSlice" | "DirectTemporalSlice" | "RangeReadTemporal" | "RangeReadSpatialHierarchy" | "LatestAtLocation" | "FirstAtLocation" | "IndexLookup" | "EmbeddingSearch";
    rationale: string;
    memory: RetrievedMemory[];
};
export type OrchestratorOutput = {
    narration: string;
    outputs?: Array<{
        id: string;
        label: string;
        mode: RecipientMode;
        markdown: string;
    }>;
    memoryWrite?: {
        spatialKey: string;
        temporalKey: string;
        faces: {
            "x+": string;
            "x-": string;
            "y-": string[];
            "z+"?: any[];
            "z-": string;
        };
    };
    debug?: {
        routerPlan: any;
        memorySelection: MemorySelection;
        llmModel: string;
        embedModel: string;
    };
};
//# sourceMappingURL=types.d.ts.map