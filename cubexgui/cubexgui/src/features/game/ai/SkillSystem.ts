// src/ai/SkillSystem.ts
import { TI } from './tensorTypes';

export enum EffectType {
    LEARNING_RATE = 'LR',
    DECAY_RATE = 'DECAY',
    IMPORTANCE = 'IMP'
}

export interface SkillEffect {
    targetIndices: number[]; // Array of TI indices
    type: EffectType;
    multiplier: number;
}

export interface Skill {
    id: string;
    name: string;
    tier: number;
    cost: number;
    effects: SkillEffect[];
    description: string;
}

// --- Helper to get Embedding Range ---
const getEmbedRange = () => {
    const indices: number[] = [];
    for (let i = TI.EMBED_START; i <= TI.EMBED_END; i++) indices.push(i);
    return indices;
};

export const SKILL_LIBRARY: Record<string, Skill> = {
    pattern_recognition: {
        id: 'pattern_recognition',
        name: 'Pattern Recognition',
        tier: 1,
        cost: 1,
        description: 'Faster consolidation of recurring patterns.',
        effects: [
            { targetIndices: getEmbedRange(), type: EffectType.LEARNING_RATE, multiplier: 1.25 },
            { targetIndices: [TI.PATTERN_HASH], type: EffectType.IMPORTANCE, multiplier: 1.5 }
        ]
    },
    aggressor: {
        id: 'aggressor',
        name: 'Aggressor',
        tier: 2,
        cost: 2,
        description: 'Prioritizes attack patterns and locks them into memory faster.',
        effects: [
            { targetIndices: [TI.THREAT_SCORE, TI.OPPORTUNITY, TI.THREAT_INCOMING], type: EffectType.LEARNING_RATE, multiplier: 1.6 },
            { targetIndices: [TI.THREAT_SCORE, TI.OPPORTUNITY], type: EffectType.IMPORTANCE, multiplier: 1.5 }
        ]
    },
    tactical_memory: {
        id: 'tactical_memory',
        name: 'Tactical Memory',
        tier: 1,
        cost: 1,
        description: 'Embeddings persist longer.',
        effects: [
            { targetIndices: getEmbedRange(), type: EffectType.DECAY_RATE, multiplier: 0.5 },
            { targetIndices: [TI.WIN_CORRELATION, TI.LOSS_CORRELATION], type: EffectType.DECAY_RATE, multiplier: 0.5 }
        ]
    }
};