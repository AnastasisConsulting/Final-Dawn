// types.ts
export type QuestStatus = 'QUEUED' | 'ACTIVE' | 'COMPLETED';
export type PrimaryAttribute = 'STR' | 'DEX' | 'INT';

export interface Quest {
  id: string;
  name: string;
  description: string;
  steps: [string, string, string];
  status: QuestStatus;
  currentCheckpoint: 0 | 1 | 2 | 3;
  primaryAttribute: PrimaryAttribute;
  
  // Triad Data
  giverNpcId: string;
  middleNpcId: string;
  completionNpcId: string;
  
  // UI Helpers (hydrated after generation)
  giverName?: string;
  middleName?: string;
  completionName?: string;
}

export interface Lieutenant {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  governorId: string;
  cityId: string;
  regionId: string;
  regionName?: string; // Helper
  quests: Quest[]; // Quests where this NPC is the Giver
  avatarUrl?: string; // Generated Avatar
}

export interface Governor {
  id: string;
  name: string;
  title: string;
  systemPrompt: string;
  cityId: string;
  lieutenants: Lieutenant[];
  avatarUrl?: string; // Generated Avatar
}

export interface Leader {
  id: string;
  name: string;
  title: string;
  traits: string[];
  systemPrompt: string;
  avatarUrl?: string; // Generated Avatar
}

export interface RegionalLocale {
  regionId: string;
  cityId: string;
  name: string;
  type: 'DUNGEON' | 'QUEST_LOCALE';
  description: string; // summaryStub
  tags: string[];
  position: { x: number; y: number };
}

export interface City {
  cityId: string;
  civId: string;
  name: string;
  description: string; // summary
  tags: string[];
  governor?: Governor;
  regionalLocales: RegionalLocale[];
}

export type VoxelType = 'A' | 'B' | 'C' | 'D';

export interface GridVoxel {
  x: number;
  y: number;
  type: VoxelType;
  name: string; // Name of City, Locale, or "Wilderness"
  description: string;
  parentCity?: string;
  parentCityRef?: City; // Optional reference for easier lookup if needed
}

export interface Civilization {
  civId: string;
  name: string;
  primaryAttribute: PrimaryAttribute;
  summary: string;
  description: string; // Helper for UI (same as summary)
  themes: string[];
  conflictDrivers: string[];
  taboos: string[];
  leader?: Leader;
  cities: City[];
  ruralZones: string[]; 
  grid: GridVoxel[];
  quests: Quest[]; // Global index of 7 quests
}

export interface PlanetMetadata {
  history: string;
  civilizations: Civilization[];
}

// --- EIDEUS_PLANET_V1 Export Schema ---

export interface PlanetIds {
  planet_id: string;
  node_key: string; // worldId
  galaxy: number;
  system: number;
  object: number;
}

export interface PlanetRender {
  texture: {
    albedo: string;
  };
  atmosphereColor: string;
  rotationSpeed: number;
}

export interface EideusPlanetExport {
  spec_version: "EIDEUS_PLANET_V1";
  ids: PlanetIds;
  name: string;
  description: string;
  render: PlanetRender;
  metadata: PlanetMetadata;
}

// --- Runtime State ---

export interface PlanetState {
  textureUrl: string | null; // Runtime only (base64 or url)
  ids?: PlanetIds;           // Persisted IDs for export
  name: string;
  description: string;
  atmosphereColor: string;
  rotationSpeed: number;
  metadata?: PlanetMetadata | null;
  isCinematic?: boolean; // Controls auto-rotation (Spaceship view)
}

export interface AtmosphereShaderProps {
  color: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING_VISUALS = 'GENERATING_VISUALS',
  GENERATING_LORE = 'GENERATING_LORE',
  GENERATING_NPCS = 'GENERATING_NPCS',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// --- New Transform / Seed Data Types ---

export interface TransformElement {
  Element: number;
  Lore: string;
}

export interface TransformSection {
  [key: string]: TransformElement[];
}

export interface TransformData {
  Object_Key: string;
  Object_Name: string;
  Location_Metadata: {
    Type: string;
    Subtype: string;
    Description: string;
    System_Theme: string;
  };
  Transforms: {
    T0_World_Transform: TransformSection;
    T1_Cast_Transform: TransformSection;
    T2_Story_Transform: TransformSection;
  };
}

// --- Persistence & Library Types ---

export interface PhaseStatus {
  phase1Done: boolean;
  civ2Done: [boolean, boolean, boolean]; // Slots 1, 2, 3
  civ3Done: [boolean, boolean, boolean]; // Slots 1, 2, 3
}

export interface Workspace {
  worldId: string;
  seedData: TransformData | null;
  lastModified: number;
  phaseStatus: PhaseStatus;
  planetState: PlanetState;
  // textureUrl is saved as "assets/texture.png" in persistence, mapped back to blobUrl on load
}

export interface LibraryEntry {
  worldId: string;
  name: string;
  lastModified: number;
  phaseStatus: PhaseStatus;
}

// --- Settings Types ---

export type LLMProvider = 'gemini' | 'ollama';

export interface AppSettings {
  provider: LLMProvider;
  ollama: {
    baseUrl: string;
    model: string;
  };
}

// --- Terminal / Log Types ---
export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'user' | 'ai';
  message: string;
}