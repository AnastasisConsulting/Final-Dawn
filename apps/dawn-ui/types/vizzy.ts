
export interface Vector3 { x: number; y: number; z: number; }

export interface Transform {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
}

export interface SphereConfig {
    radius: number;
    widthSegments: number;
    heightSegments: number;
    color: string;
    wireframe: boolean;
    roughness: number;
    metalness: number;
    pulseSpeed: number;
    pulseAmplitude: number;
    foldAmount: number;
    foldSpeed: number;
    foldNoiseScale: number;
    luminosity: number;
    lumaPatternScale: number;
    lumaPatternSpeed: number;
}

export interface RingConfig {
    ring1Speed: Vector3;
    ring2Speed: Vector3;
    ring3Speed: Vector3;
    baseRadius: number;
    tubeThickness: number;
    segments: number;
    color: string;
    emissive: string;
    metallic: boolean;
    scalePulse: boolean;
    wireframe: boolean;
}

export type ParticleTarget = 'global' | 'sphere' | 'ring1' | 'ring2' | 'ring3';

export interface ParticleConfig {
    count: number;
    size: number;
    radius: number;
    speed: number;
    color: string;
    opacity: number;
    noiseStrength: number;
    target: ParticleTarget;
    twist: number;
    overallScale: number;
    bloom: number;
}

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export interface Keyframe {
    id: string;
    timestamp: number; // in ms
    transforms: {
        sphere: Transform;
        ring1: Transform;
        ring2: Transform;
        ring3: Transform;
    };
    easing: EasingType;
}

export interface AnimationState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    keyframes: Keyframe[];
    loop: boolean;
}

export interface AppState {
    sphere: SphereConfig;
    rings: RingConfig;
    particles: ParticleConfig;
    transforms: {
        sphere: Transform;
        ring1: Transform;
        ring2: Transform;
        ring3: Transform;
    };
    animation: AnimationState;
}

export interface SavedAnimation {
    id: string;
    folder: string;
    name: string;
    state: AppState;
    timestamp: number;
}
