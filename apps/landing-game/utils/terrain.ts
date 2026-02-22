import { Vector3 } from 'three';

// --- TERRAIN CONSTANTS ---
export const PLANET_RADIUS = 25000;
export const SEA_LEVEL = -50;
export const MOUNTAIN_HEIGHT = 1500;
export const HILL_HEIGHT = 400;

/**
 * Procedural height function using nested sines to simulate noise
 * This ensures consistency between rendering, physics, and object placement
 * without requiring a heavy noise library.
 */
export function getHeight(x: number, z: number): number {
    // Large scale mountains
    const mountain = Math.sin(x * 0.0002) * Math.cos(z * 0.0002) * MOUNTAIN_HEIGHT;

    // Medium hills
    const hills = Math.sin(x * 0.001) * Math.sin(z * 0.0012) * HILL_HEIGHT;

    // Canyons (sharp negative dips)
    const canyonBase = Math.sin(x * 0.0005 + 1.2) * Math.cos(z * 0.0004 - 0.5);
    const canyon = canyonBase < -0.7 ? -800 : 0;

    const baseHeight = mountain + hills + canyon;

    return baseHeight;
}

/**
 * Returns biome-specific colors and properties
 */
export function getBiome(x: number, z: number): { color: string, name: string } {
    const h = getHeight(x, z);

    if (h < SEA_LEVEL) return { color: '#1e3a8a', name: 'OCEAN' };
    if (h < SEA_LEVEL + 50) return { color: '#fbbf24', name: 'BEACH' };
    if (h > MOUNTAIN_HEIGHT * 0.6) return { color: '#64748b', name: 'MOUNTAIN' };
    if (h > MOUNTAIN_HEIGHT * 0.9) return { color: '#f8fafc', name: 'PEAK' };

    // Plains/Forests
    return { color: '#166534', name: 'PLAINS' };
}

/**
 * Returns a safe position on the terrain for a given x, z
 */
export function getTerrainPoint(x: number, z: number): Vector3 {
    return new Vector3(x, getHeight(x, z), z);
}
