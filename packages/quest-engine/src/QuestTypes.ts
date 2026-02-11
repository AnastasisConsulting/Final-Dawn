export type QuestPhase = 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'RESOLVED';

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
}

export interface QuestDefinition {
  questId: string;
  name: string;
  worldKey: string; // e.g., "G1-S2-O3-C1"
  civilization: string;
  affinityRequired?: Record<string, number>; // e.g., { STR: 10 }
  objectives: QuestObjective[];
  phase: QuestPhase;
}
