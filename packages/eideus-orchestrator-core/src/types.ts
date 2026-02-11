// packages/eideus-orchestrator-core/src/types.ts

// --- MEMORY LATTICE TYPES ---
export interface VoxelFaces {
  x_plus: string;    // Input Sum (User Action)
  x_minus: string;   // Output Sum (Narrative Result)
  y_plus: string[];  // Embeddings (Semantic Vectors)
  y_minus: string[]; // Associative Tags (Thematic Links)
  z_plus: string[];  // Entities (Who is here)
  z_minus: string;   // Lore Key (Where we are)
}

export interface VoxelCoordinate {
  galaxy: number;
  system: number;
  object: number;
  city: number;
  district: number;
  room: number;
}

export interface VoxelSnapshot {
  coordinate: string; // "G1.S1.O1..."
  timestamp: string;  // "S1.B1.C1.P15"
  faces: VoxelFaces;
  // Optional legacy field used by older orchestration prototypes.
  input?: string;
  // Computed relevance for this turn
  relevanceScore: number; 
}

// --- AFFINITY (M.O.S.S.) TYPES ---
export interface MossProfile {
  M: number; // Mechanical/Task
  O: number; // Operational/Logic
  S: number; // Social/Emotional
  S_prime: number; // Spiritual/Abstract
}

// --- ORCHESTRATION TYPES ---
export type AgentRole = 'GM' | 'LYRA' | 'VIZZY' | 'NAV' | 'NPC';


export interface TurnContext {
  // Who is speaking?
  agentRole: AgentRole;
  // Where/When are we?
  currentVoxel: VoxelSnapshot;
  // What just happened? (The user's input)
  userIntent: string;
  // What constraints apply?
  activeQuestId?: string;

  // Back-compat for older Pipeline code paths
  questState?: any;
  mossProfile?: MossProfile;
  allowedTools: string[];
}

export interface AgentOutput {
  thought: string;      // Internal reasoning (hidden from user)
  dialogue: string;     // The actual text to display
  state_update?: {      // Optional: Does this turn change the world state?
    new_tags?: string[];
    affinity_shift?: Partial<MossProfile>;
    }
}

export interface NavData {
  hazards: string[];
  waypoints: Array<{
    label: string;
    type: "LOOT" | "EXIT" | "NPC" | "OBJECTIVE";
  }>;
  log_entry: string;
}

export interface PipelineResult {
  gm_narrative: string;         // The World
  lyra_dialogue: string | null; // The Heart
  nav_update: NavData | null;   // The UI/Tactical
  vizzy_interjection: string | null; // The Comic Relief
  state_delta: any;             // The Database Update
}


