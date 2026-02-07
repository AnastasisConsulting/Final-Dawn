// packages/eideus-ollama-orchestrator/src/npc/npc.types.ts
// Adapted from candidates/npc.types.ts

import type { SpatialKey, TemporalKey } from "eideus-memory-lattice-api";

/**
 * Player's current relationship status with an NPC.
 * Drives chat AI persona and available dialogue options.
 */
export enum NpcChatState {
    LOCKED = "LOCKED",         // Player doesn't know this NPC exists
    UNKNOWN = "UNKNOWN",       // Player has the "card" but no rapport (Suspicious)
    NEUTRAL = "NEUTRAL",       // Standard, transactional relationship
    FAVORABLE = "FAVORABLE",   // NPC offers better info
    ALLIED = "ALLIED",         // NPC volunteers secrets, asks for personal help
    HOSTILE = "HOSTILE"        // NPC actively works against the player
}

/**
 * A block of knowledge the NPC has.
 * Can be unlocked by in-game events.
 */
export interface KnowledgeBlock {
    isUnlocked: boolean;
    content: string;
    tags?: string[];
}

/**
 * A single personality trait with description.
 */
export interface NpcPersonality {
    trait: string;
    description: string;
}

/**
 * A relationship entry between NPCs or NPC and player.
 */
export interface NpcRelationship {
    targetId: string;
    type: "ally" | "enemy" | "neutral" | "family" | "rival" | "unknown";
    intensity: number; // -100 to +100
    notes?: string;
}

/**
 * A memory entry for an NPC.
 */
export interface NpcMemory {
    timestamp: string;
    memory: string;
    tags: string[];
}

/**
 * The full Character Card / Dynamic Profile for an NPC.
 * Merges the lorebook format with the dynamic profile system.
 */
export interface NpcProfile {
    // --- Identity ---
    id: string;                    // e.g., "G1-S1-O7-C2-CT2-R4-NPC" or generated UUID
    name: string;                  // "Linker Gantz"
    role: "Leader" | "Governor" | "Subordinate" | "NPC" | "Entity";
    title: string;                 // "Neural Liaison"
    description: string;           // Narrative description

    // --- Location ---
    currentLocation: string;       // Object key or location name
    spatial?: SpatialKey;          // Precise coordinate where entity was created/lives

    // --- Faction & Status ---
    faction: string;               // "Ion-Drifters of Aura-507"
    disposition: number;           // -100 to +100, player relationship
    chatState: NpcChatState;       // Current dialogue state

    // --- Personality & Voice ---
    personality: NpcPersonality[]; // Array of traits
    voice?: string;                // How the NPC "sounds" in text

    // --- Character Card (LLM Prompt) ---
    systemPrompt: string;          // The core system prompt for LLM
    traits: string[];              // Quick-reference trait list

    // --- Knowledge & Memory ---
    knowledge: Record<string, KnowledgeBlock>;
    memory: NpcMemory[];
    relationships: NpcRelationship[];

    // --- Metadata ---
    avatarPath?: string | null;
    isProcedural: boolean;         // true if generated at runtime
    createdAt: string;             // ISO timestamp
    lastInteraction?: string;      // ISO timestamp
}

/**
 * Minimal entity reference for memory voxel z+ face.
 * Compatible with EntityCard from memory-lattice-api.
 */
export interface EntityRef {
    id: string;
    name: string;
    class?: string;       // role/title
    aliases?: string[];
    isProcedural?: boolean;
}

/**
 * Template for procedural NPC generation.
 */
export interface NpcGenerationTemplate {
    roleOptions: Array<{ value: NpcProfile["role"]; weight: number }>;
    factionHint?: string;
    affinityKey?: "STR" | "INT" | "DEX";
    locationContext: {
        objectKey: string;
        spatial: SpatialKey;
        locationName: string;
        locationType: string;  // "QUEST_LOCALE", "DUNGEON", etc.
    };
    narrativeContext?: string;  // The narration that introduced this NPC
}

/**
 * Result of procedural NPC generation.
 */
export interface GeneratedNpc {
    profile: NpcProfile;
    entityRef: EntityRef;
    lorebookEntry: LorebookInhabitant;
}

/**
 * Lorebook inhabitant format (matches existing JSON structure).
 */
export interface LorebookInhabitant {
    name: string;
    role: string;
    title: string;
    avatar_path: string | null;
    character_card: {
        system_prompt: string;
        traits: string[];
        id: string;
    };
    isProcedural?: boolean;
}
