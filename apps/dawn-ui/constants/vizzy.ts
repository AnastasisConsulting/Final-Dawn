import { AppState } from '../types/vizzy';

const defaultTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
};

export const DEFAULT_VIZZY_STATE: AppState = {
    sphere: {
        radius: 2,
        widthSegments: 128,
        heightSegments: 128,
        color: '#00ffff', // Keep Cyan to match UI Text
        wireframe: true,  // Switch to wireframe for "Tech/UI" look
        roughness: 0.1,
        metalness: 0.9,
        pulseSpeed: 1.0,
        pulseAmplitude: 0.05,
        foldAmount: 0.3,
        foldSpeed: 0.2,
        foldNoiseScale: 0.2,
        luminosity: 2.0, // Increase glow
        lumaPatternScale: 5.0,
        lumaPatternSpeed: 0.2,
    },
    rings: {
        ring1Speed: { x: 0.2, y: 0, z: 0 },
        ring2Speed: { x: 0, y: 0.3, z: 0 },
        ring3Speed: { x: 0, y: 0, z: 0.1 },
        baseRadius: 4.5,
        tubeThickness: 0.05, // Thinner, techy rings
        segments: 64,
        color: '#0f172a', // Dark Slate (Gunmetal)
        emissive: '#06b6d4', // Cyan-600 Glow
        metallic: true,
        scalePulse: false,
        wireframe: false,
    },
    particles: {
        count: 1500,
        size: 0.08,
        radius: 12,
        speed: 0.05,
        color: '#FFD700',
        opacity: 0.8,
        noiseStrength: 0.3,
        target: 'global',
        twist: 0,
        overallScale: 1.0,
        bloom: 0,
    },
    transforms: {
        sphere: { ...defaultTransform },
        ring1: { ...defaultTransform },
        ring2: { ...defaultTransform },
        ring3: { ...defaultTransform },
    },
    animation: {
        isPlaying: false,
        currentTime: 0,
        duration: 5000,
        keyframes: [
            {
                id: 'start',
                timestamp: 0,
                transforms: {
                    sphere: { ...defaultTransform },
                    ring1: { ...defaultTransform },
                    ring2: { ...defaultTransform },
                    ring3: { ...defaultTransform },
                },
                easing: 'linear'
            }
        ],
        loop: true,
    }
};

// Stubbed Universe Data since we are removing the full backend sim
export const UNIVERSE_DATA = [
    {
        id: 'G1',
        name: 'The Core Syndicate',
        description: 'Mocked Universe Data',
        type: 'galaxy',
        systems: []
    }
];
