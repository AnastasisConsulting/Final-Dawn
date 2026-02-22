import { Vector3, Quaternion } from 'three';

export type WeaponType = 'laser' | 'missile';
export type TargetTier = 'STANDARD' | 'ELITE' | 'BOSS';
export type PickupType = 'HEALTH' | 'SHIELD' | 'CREDITS';
export type EnemyType = 'FIGHTER' | 'DRONE' | 'POLICE';
export type WeatherType = 'CLEAR' | 'STORM' | 'OVERCAST';

export interface RuralRegion {
    id: string;
    position: [number, number, number];
    type: 'FARM' | 'MINING' | 'RESEARCH';
}

export interface Projectile {
    id: string;
    type: WeaponType;
    position: Vector3;
    quaternion: Quaternion;
    velocity: Vector3;
    life: number;
    level: number;
}

export interface Target {
    id: string;
    position: number[];
    health: number;
    maxHealth: number;
    velocity: number[];
    tier: TargetTier;
    enemyType: EnemyType;

    // AI State
    aiState: 'SURROUND' | 'ALIGN' | 'ATTACK_RUN' | 'BREAK_OFF';
    aiTimer: number;
    assignedSlot: number; // Angle offset for surrounding (0 to 2PI)

    lastFireTime?: number;
}

export interface TrafficUnit {
    id: number;
    type: 'HAULER' | 'SPEEDER' | 'DRONE';
    position: Vector3;
    velocity: Vector3;
    active: boolean;
    scale: Vector3;
    rotationOffset: number;
    wobbleSpeed: number;
    regionId?: string; // Track which region this unit belongs to
}

export interface BuildingData {
    position: Vector3; // Center of base
    width: number;
    height: number;
    depth: number;
    rotationY: number;
    regionId?: string;
}

export interface Pickup {
    id: string;
    type: PickupType;
    position: number[];
    active: boolean;
    value?: number;
}

export interface FlightStatus {
    speed: number;
    altitude: number;
    heading: number;
    position: number[];
    flightAssist: boolean;
    weaponLevel: number;
    shieldActive: boolean;
    isLanded?: boolean;
}

export interface LandingAppProps {
    landingContext: any;
    onLandingComplete: (success: boolean) => void;
    onTakeoffComplete?: (handoffData: any) => void;
}

export interface SystemNode {
    id: string;
    name: string;
    type: 'GALAXY' | 'SYSTEM' | 'PLANET' | 'MOON' | 'STATION';
    radius?: number;
    color?: string;
    position?: number[]; // Local position relative to parent
    children?: SystemNode[];
}

export interface MissionState {
    activeQuest: {
        id: string;
        description: string;
        targetCount: number;
        currentCount: number;
        rewardCredits: number;
        completed: boolean;
    } | null;
}

export interface CinematicState {
    active: boolean;
    type: 'BOSS_INTRO' | 'AMBUSH' | 'LANDING' | 'TAKEOFF' | 'NONE';
    targetPosition: number[] | null;
    message?: string;
    transmission?: string;
}

export interface NavBotState {
    active: boolean;
    message: string;
    opacity: number;
}

export interface PlayerData {
    credits: number;
    weaponLevel: number;
    reputation: number;
}

export interface NotificationItem {
    id: string;
    type: 'INFO' | 'WARNING' | 'LOOT' | 'ACHIEVEMENT';
    message: string;
    subtext?: string;
}

export interface TargetDynamics {
    position: Vector3;
    velocity: Vector3;
}

export interface AtmosphericCondition {
    inAtmosphere: boolean;
    planetName: string;
    visibility: number; // 0-1
    windSpeed: number;
    weather: WeatherType;
    landingZones: (LandingZone & { ruralRegions: RuralRegion[] })[];
    activeLandingZoneId: string;
    isSafeToLand: boolean;
}

export interface LandingZone {
    id: string;
    name: string;
    position: [number, number, number];
}