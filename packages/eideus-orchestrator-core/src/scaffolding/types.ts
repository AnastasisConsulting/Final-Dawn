import type { VoxelCoordinate, EntityCard, LandmarkCard } from "../types.js";

export interface GeneratedNpc {
    profile: any;
    entityRef: EntityCard;
}

export interface GeneratedLandmark {
    profile: any;
    landmarkRef: LandmarkCard;
}

export type LandmarkType = "STRUCTURE" | "LOCATION" | "POI" | "OBJECT" | "VEHICLE";

export interface NpcGenerationTemplate {
    locationContext: {
        objectKey: string;
        spatial: VoxelCoordinate;
        locationName: string;
        locationType: string;
    };
    factionHint?: string;
    affinityKey?: "STR" | "INT" | "DEX";
    narrativeContext?: string;
}

export interface LandmarkGenerationTemplate {
    locationContext: {
        spatial: VoxelCoordinate;
        locationName: string;
        locationType: string;
        objectKey: string;
    };
    loreKey: string;
    narrativeContext?: string;
}
