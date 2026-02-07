import { AppState } from './types';

const defaultTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

export const DEFAULT_STATE: AppState = {
  sphere: {
    radius: 2,
    widthSegments: 128,
    heightSegments: 128,
    color: '#00ffff',
    wireframe: false,
    roughness: 0.2,
    metalness: 0.8,
    pulseSpeed: 1.0,
    pulseAmplitude: 0.05,
    foldAmount: 0.3,
    foldSpeed: 0.2,
    foldNoiseScale: 0.2,
    luminosity: 1.2,
    lumaPatternScale: 5.0,
    lumaPatternSpeed: 0.2,
  },
  rings: {
    ring1Speed: { x: 0.2, y: 0, z: 0 },
    ring2Speed: { x: 0, y: 0.3, z: 0 },
    ring3Speed: { x: 0, y: 0, z: 0.1 },
    baseRadius: 4.5,
    tubeThickness: 0.15,
    segments: 64,
    color: '#cbd5e1',
    emissive: '#1e293b',
    metallic: true,
    scalePulse: false,
    wireframe: false,
  },
  particles: {
    count: 2000,
    size: 0.05,
    radius: 15,
    speed: 0.1,
    color: '#ffffff',
    opacity: 0.6,
    noiseStrength: 0.2,
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