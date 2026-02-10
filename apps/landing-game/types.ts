import { Vector3, Quaternion } from 'three';

export type WeaponType = 'laser' | 'missile';

export interface FlightStatus {
  speed: number;
  altitude: number;
  heading: number;
  position: [number, number, number];
  flightAssist: boolean;
  weaponLevel: number;
  shieldActive: boolean;
  distanceToTarget?: number;
  landingGear?: number; // 0 to 1
}

export interface SystemNode {
  id: string;
  radius?: number;
}

export interface CinematicState {
  active: boolean;
  type?: 'BOSS_INTRO' | 'DOCKING';
  targetPosition?: [number, number, number];
}

export interface TargetDynamics {
  position: Vector3;
  velocity: Vector3;
}

export interface Target {
  id: string;
  position: [number, number, number];
  health: number;
}

export interface Projectile {
  id: string;
  position: Vector3;
  quaternion: Quaternion;
  velocity: Vector3;
  type: WeaponType;
  ttl: number; // Time to live
  owner: 'player' | 'enemy';
}

export interface EnemyState {
  id: string;
  position: Vector3;
  quaternion: Quaternion;
  velocity: Vector3;
  health: number;
  nextFireTime: number;
}

export interface LandingContext {
  id: string;
  ship: {
    model: string;
    position: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
    heading: number;
    health: number;
    shieldLevel: number;
  };
  destination: {
    galaxy: string;
    system: string;
    object: string;
    civ: number;
    city: number;
    region: number;
    address?: string;
    name?: string;
  };
  firstVisit: boolean;
  timestamp: number;
}