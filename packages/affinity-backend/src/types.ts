
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

export interface RelationalDelta {
  source: string;
  target: string;
  delta: number;
}
