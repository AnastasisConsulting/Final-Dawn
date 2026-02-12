// cubex³/ai/tensorTypes.ts

export enum TI {
    // --- BLOCK A: STATE & IDENTITY (0-3) ---
    // [Base Variables]
    STATE_ID = 0,         // [v1] What is here?
    OWNER_ID = 1,         // [v2] Who owns it?
    LAST_CHANGE_TURN = 2, // [v3] When did it last change?
    IS_VALID_MOVE = 3,    // [v4] Can I move here?

    // --- BLOCK B: DYNAMICS (4-11) ---
    // [Tier 1 - Unlocked by Lvl 1 Skills]
    VELOCITY = 4,           
    CHANGE_VELOCITY = 4, // [Alias] used by TensorNode
    
    ENTROPY = 5,
    LOCAL_ENTROPY = 5,   // [Alias] used by TensorNode
    
    INFLUENCE_GRAD = 6,
    INFLUENCE_GRADIENT = 6, // [Alias] used by MoraleSystem
    
    STRUCTURAL_STAB = 7,
    STRUCTURAL_STABILITY = 7, // [Alias] used by MoraleSystem
    
    ATTACK_VECTOR_SUM = 8,
    THREAT_INCOMING = 8,    // [ALIAS] Used by SkillData

    DEFENSE_VECTOR_SUM = 9, 
    SUPPORT_INCOMING = 9,   // [ALIAS] Used by SkillData

    MOBILITY_FLUX = 10,     
    CAUSAL_TRIGGER = 11,    

    // 12-15 RESERVED (Future Dynamics)
    RESERVED_12 = 12,
    RESERVED_13 = 13,
    RESERVED_14 = 14,
    RESERVED_15 = 15,

    // --- BLOCK C: STRATEGIC EVALUATION (16-23) ---
    // [Tier 2 - Unlocked by Lvl 2 Skills]
    DIRECT_THREAT = 16,     
    THREAT_SCORE = 16,      // [ALIAS] Used by SkillData

    OPPORTUNITY = 17,       
    SYNERGY_SCORE = 18,     
    CONTROL_VAL = 19,       
    LOS_OPENNESS = 20,      
    PATH_COST = 21,         
    WIN_CORRELATION = 22,   
    LOSS_CORRELATION = 23,  

    // --- BLOCK D: META & LEARNING (24-31) ---
    // [System Internal - Relocated from 56+]
    DECAY_ACCUM = 24,       
    TIME_DECAY = 24, // [Alias] used by TensorNode

    UPDATE_COUNT = 25,      
    LEARNING_RATE = 26,     
    IMPORTANCE_WT = 27,     
    PATTERN_HASH = 28,      
    LINK_STRENGTH = 29,     
    RESERVED_30 = 30,
    RESERVED_31 = 31,

    // --- BLOCK E: DEEP PATTERNS (32-63) ---
    // [Tier 3 - Embeddings]
    EMBED_START = 32,       
    EMBEDDING_START = 32, // [Alias] used by TensorNode
    
    EMBED_END = 63,
    EMBEDDING_END = 63    // [Alias] used by TensorNode
}

export const TENSOR_SIZE = 64;
export const CUBE_COUNT = 512;
export const EMBEDDING_SIZE = 32;

export interface TensorNode {
    position: { x: number, y: number, z: number };
    data: Float32Array;
}