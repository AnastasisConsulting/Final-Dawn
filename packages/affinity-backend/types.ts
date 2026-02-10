export type Affinity = "str" | "int" | "dex";

export interface TensionState {
    recent: number;
    longTerm: number;
}

export interface Entity {
    id: string;
    affinity: Affinity;
    tension: TensionState;
}

export interface RelationalLink {
    a: string;        // entity id
    b: string;        // entity id
    score: number;   // -100 to +100
}
