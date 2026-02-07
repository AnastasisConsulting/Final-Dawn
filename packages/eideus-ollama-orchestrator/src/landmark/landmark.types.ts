// packages/eideus-ollama-orchestrator/src/landmark/landmark.types.ts
// Type definitions for procedural landmarks

import type { SpatialKey } from "eideus-memory-lattice-api";

/**
 * Landmark types matching the memory lattice LandmarkCard.
 */
export type LandmarkType = "LOCATION" | "OBJECT" | "POI" | "STRUCTURE" | "VEHICLE" | "OTHER";

/**
 * Full landmark profile for procedural generation.
 */
export interface LandmarkProfile {
    id: string;                    // e.g., "G1-S1-O7-C2-CT2-R4-LOC"
    name: string;                  // "The Corroded Terminal"
    type: LandmarkType;
    description: string;           // Detailed description
    shortDescription?: string;     // One-liner for quick reference
    spatial?: SpatialKey;          // Coordinate where it was discovered
    parentLoreKey: string;         // Links to the lore entry it belongs to

    // --- Discoverable Properties ---
    interactionHints?: string[];   // What the player can do here
    connectedLandmarks?: string[]; // IDs of related landmarks
    secrets?: string[];            // Hidden info (unlockable)

    // --- Tags for Search ---
    tags: string[];

    // --- Metadata ---
    isProcedural: boolean;
    createdAt: string;             // ISO timestamp
    discoveredBy?: string;         // Session or player ID
}

/**
 * Minimal landmark reference for memory voxel z- face.
 */
export interface LandmarkRef {
    id: string;
    name: string;
    type: LandmarkType;
    description?: string;
    tags?: string[];
    isProcedural?: boolean;
    parentLoreKey?: string;
}

/**
 * Template for procedural landmark generation.
 */
export interface LandmarkGenerationTemplate {
    locationContext: {
        objectKey: string;
        spatial: SpatialKey;
        locationName: string;
        locationType: string;
    };
    loreKey: string;
    narrativeContext?: string;
}

/**
 * Result of procedural landmark generation.
 */
export interface GeneratedLandmark {
    profile: LandmarkProfile;
    landmarkRef: LandmarkRef;
}

/**
 * Lorebook location/district format (matches existing JSON structure).
 */
export interface LorebookDistrict {
    name: string;
    type: string;
    description: string;
    coordinates: { x: number; y: number };
    isProcedural?: boolean;
    discoveredAt?: string;
}
