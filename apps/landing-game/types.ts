export type Vector3 = [number, number, number];

export enum GamePhase {
  ORBIT = 'ORBIT',
  ENTRY = 'ENTRY',
  FLIGHT = 'FLIGHT',
  LANDED = 'LANDED',
  CRASHED = 'CRASHED'
}

export interface CinematicState {
  active: boolean;
  targetPosition: [number, number, number] | null;
  message?: string; // The main alert title
  transmission?: string; // The AI generated flavor text
  type?: 'DISTRESS' | 'AMBUSH' | 'SCAN' | 'ACHIEVEMENT' | 'BOSS_INTRO';
}

export interface FlightStatus {
  speed: number;
  altitude: number;
  heading: number;
  position: [number, number, number];
  flightAssist: boolean;
  weaponLevel: number;
  shieldActive: boolean;
}

export interface Target {
  id: string;
  position: [number, number, number];
  health: number;
  maxHealth: number;
  velocity?: [number, number, number];

  targetId?: string; // ID of what they are attacking (Player or Friendly)

  // AI State Logic
  aiState?: number; // 0: Approach, 1: Orbit/Strafe, 2: Retreat/Evade
  aiTimer?: number; // Time remaining in current state
  aiVector?: [number, number, number]; // Cached direction vector for smooth movement
  lastFireTime?: number; // Timestamp of last shot
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
      address?: string; // Add this for the Dawn-UI handoff
    }
  };
  children?: SystemNode[];

  // Runtime Layout Properties
  position?: [number, number, number];
  absolutePosition?: [number, number, number];
  radius?: number;
  color?: string;
}
export type WeaponType = 'laser' | 'missile';
export type PickupType = 'HEALTH' | 'SHIELD' | 'WEAPON' | 'CREDITS';

export interface GameState {
  speed: number;
  altitude: number;
  temperature: number;
  hull: number;
  phase: GamePhase;
  message: string;
  isMessageLoading: boolean;
  score: number;
  sessionId: number;
  landingGearDeployed: boolean;
}

export interface ShipControls {
  forward: boolean; // Throttle Up
  backward: boolean; // Throttle Down
  left: boolean; // Roll Left
  right: boolean; // Roll Right
  rollLeft: boolean;
  rollRight: boolean;
  boost: boolean;
  brake: boolean; // Spacebar - Toggle Gear / Airbrake
  mouse: { x: number; y: number };
}