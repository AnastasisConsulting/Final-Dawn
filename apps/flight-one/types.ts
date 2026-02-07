
import { Vector3 } from 'three';
import React from 'react';

export interface FlightStatus {
  speed: number;
  altitude: number;
  heading: number;
  position: [number, number, number];
  flightAssist: boolean;
  weaponLevel: number;
  shieldActive: boolean;
}

export interface NotificationItem {
  id: string;
  message: string;
  subtext?: string;
  type: 'LOOT' | 'ACHIEVEMENT' | 'MISSION' | 'WARNING';
}

export interface Quest {
  id: string;
  type: 'KILL_COUNT' | 'KILL_ELITE' | 'SURVIVE_TIME' | 'COLLECT_SCRAP';
  description: string;
  targetCount: number;
  currentCount: number;
  rewardCredits: number;
  completed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  condition: (stats: PlayerStats) => boolean;
}

export interface PlayerStats {
  totalKills: number;
  totalCreditsEarned: number;
  totalTimePlayed: number;
  highestHeat: number;
}

export interface PlayerData {
  credits: number;
  inventory: {
    repairKits: number;
    shieldCells: number;
  };
  weaponLevel: number;
  stats: PlayerStats;
  unlockedAchievements: string[];
}

export interface MissionState {
  activeQuest: Quest | null;
  messageLog: string[];
}

export enum GameState {
  IDLE = 'IDLE',
  FLYING = 'FLYING',
  PAUSED = 'PAUSED'
}

export type WeaponType = 'laser' | 'missile';
export type PickupType = 'HEALTH' | 'SHIELD' | 'WEAPON' | 'CREDITS';
export type TargetTier = 'STANDARD' | 'ELITE' | 'BOSS';
export type EnemyBehavior = 'PATROL' | 'ATTACK_PLAYER' | 'ATTACK_FRIENDLY';

export interface Projectile {
  id: string;
  type: WeaponType;
  position: [number, number, number];
  rotation: [number, number, number];
  active: boolean;
  level: number;
}

export interface Target {
  id: string;
  position: [number, number, number];
  health: number;
  maxHealth: number;
  velocity?: [number, number, number];
  tier: TargetTier;
  behavior: EnemyBehavior;
  targetId?: string; // ID of what they are attacking (Player or Friendly)

  // AI State Logic
  aiState?: number; // 0: Approach, 1: Orbit/Strafe, 2: Retreat/Evade
  aiTimer?: number; // Time remaining in current state
  aiVector?: [number, number, number]; // Cached direction vector for smooth movement
  lastFireTime?: number; // Timestamp of last shot
}

export interface Pickup {
  id: string;
  type: PickupType;
  position: [number, number, number];
  active: boolean;
  value?: number; // Amount for credits
}

export interface CinematicState {
  active: boolean;
  targetPosition: [number, number, number] | null;
  message?: string; // The main alert title
  transmission?: string; // The AI generated flavor text
  type?: 'DISTRESS' | 'AMBUSH' | 'SCAN' | 'ACHIEVEMENT' | 'BOSS_INTRO';
}

export interface NavBotState {
  active: boolean;
  message: string;
  opacity: number;
}

export interface TargetDynamics {
  position: Vector3;
  velocity: Vector3;
}

export interface SystemNode {
  id: string;
  name: string;
  type: 'GALAXY' | 'SYSTEM' | 'OBJECT' | 'PLANET' | 'MOON' | 'STATION';
  tags?: string[];
  locKey?: string;
  hasHeardOf?: boolean;
  hasTraveled?: boolean;
  isHostile?: boolean;
  marketState?: number;
  securityState?: number;
  civRelation?: number;
  starSys_trade_tic?: number;
  data?: {
    metadata?: {
      Type?: string;
      Subtype?: string;
      Description?: string;
      System_Theme?: string;
    }
  };
  children?: SystemNode[];

  // Runtime Layout Properties
  position?: [number, number, number];
  absolutePosition?: [number, number, number];
  radius?: number;
  color?: string;
}

export interface FlightAppProps {
  handoffToken?: number | null;
  onHandoffComplete?: () => void;
  onReturnToDawn?: (payload: {
    target: { name: string; address?: string };
    landingNarration: string;
    openingScene: string;
  }) => void;
  onLaunchLandingGame?: (target: {
    id: string;
    name: string;
    address?: string;
    position?: [number, number, number];
    velocity?: [number, number, number];
    heading?: number;
  }) => void;
  systemId?: string;
  playerLevel?: number;
  flightStats?: any;
  onLootAcquired?: (item: string, amount?: number) => void;
  onEnemyDestroyed?: (tier: string, enemyId: string) => void;
  onStoryXpAwarded?: (amount: number) => void;
}

// Global JSX namespace augmentation (for React and Three.js elements)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      scene: any;
      sphereGeometry: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      boxGeometry: any;
      coneGeometry: any;
      ambientLight: any;
      pointLight: any;
      directionalLight: any;
      color: any;
      fog: any;
      fogExp2: any;
      torusGeometry: any;
      ringGeometry: any;
      planeGeometry: any;
      cylinderGeometry: any;
      circleGeometry: any;
      capsuleGeometry: any;
      octahedronGeometry: any;
      primitive: any;
      lineSegments: any;
      edgesGeometry: any;
      lineBasicMaterial: any;
      icosahedronGeometry: any;
      meshPhysicalMaterial: any;
      object3D: any;
      perspectiveCamera: any;
      [elemName: string]: any;
    }
  }
}
