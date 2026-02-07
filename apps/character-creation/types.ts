// apps/character-creation/types.ts

export enum Attribute {
  STR = 'STR',
  DEX = 'DEX',
  INT = 'INT',
  NONE = 'NONE'
}

// Canonical affinity triad for identity progression.
export enum Affinity {
  STR = 'STR',
  INT = 'INT',
  DEX = 'DEX'
}

// Core identity is equivalent to core affinity.
export enum CoreClass {
  REBEL = 'Rebel',
  ACOLYTE = 'Acolyte',
  HACKER = 'Hacker'
}

export type CrossId = `${Affinity}_${Affinity}`;

export interface QuestionOption {
  text: string;
  affinity: Attribute;
}

export interface QuestionData {
  scenario: string;
  options: QuestionOption[];
}

export interface LevelData {
  level: number;
  xpFromPrevious: number;
  totalXpToReach: number;
  unlock: 'CORE' | 'SUB' | 'CROSS' | 'MASTERY' | '—';
}

export interface Character {
  name: string;
  affinity: Attribute;
  coreClass: CoreClass | null;
  subAffinity: Affinity | null;
  crossId: CrossId | null;
  level: number;
  xp: number;
}

export enum AppStage {
  SPLASH = 'SPLASH',
  START = 'START',
  INTRO = 'INTRO',
  QUESTION_LOADING = 'QUESTION_LOADING',
  QUESTION = 'QUESTION',
  CLASS_SELECTION = 'CLASS_SELECTION',
  SUB_SELECTION = 'SUB_SELECTION',
  SUMMARY = 'SUMMARY'
}