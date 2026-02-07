/**
 * Procedural City Generator
 * Creates mega city layouts with districts, landing pads, and skyways
 */

import * as THREE from 'three';

export interface District {
    id: string;
    name: string;
    type: 'commercial' | 'residential' | 'industrial' | 'government';
    position: THREE.Vector3;
    radius: number;
    buildingDensity: number;
}

export interface LandingPad {
    id: string;
    position: THREE.Vector3;
    radius: number;           // Auto-land trigger radius (meters)
    clearanceSpeed: number;   // Max speed for auto-land (m/s)
    status: 'available' | 'occupied';
    designation: string;      // "LP-Alpha", "LP-Beta", etc.
}

export interface Skyway {
    id: string;
    start: THREE.Vector3;
    end: THREE.Vector3;
    traffic: number; // 0-1
}

export interface MegaCity {
    name: string;
    layout: 'grid' | 'radial' | 'organic';
    center: THREE.Vector3;
    radius: number;
    districts: District[];
    landingPads: LandingPad[];
    skyways: Skyway[];
}

/**
 * Generate a procedural mega city
 */
export function generateMegaCity(
    name: string,
    seed: number = Math.random()
): MegaCity {
    const rng = seededRandom(seed);

    // Choose layout style
    const layouts: ('grid' | 'radial' | 'organic')[] = ['grid', 'radial', 'organic'];
    const layout = layouts[Math.floor(rng() * layouts.length)];

    const cityRadius = 5000 + rng() * 3000; // 5-8km radius
    const center = new THREE.Vector3(0, 0, 0);

    // Generate districts
    const districtCount = 4 + Math.floor(rng() * 4); // 4-8 districts
    const districts: District[] = [];

    for (let i = 0; i < districtCount; i++) {
        const angle = (i / districtCount) * Math.PI * 2;
        const distance = cityRadius * (0.3 + rng() * 0.5);

        const types: District['type'][] = ['commercial', 'residential', 'industrial', 'government'];
        const type = types[Math.floor(rng() * types.length)];

        districts.push({
            id: `district-${i}`,
            name: generateDistrictName(type, i, rng),
            type,
            position: new THREE.Vector3(
                Math.cos(angle) * distance,
                50 + rng() * 100, // Varying heights
                Math.sin(angle) * distance
            ),
            radius: 500 + rng() * 500,
            buildingDensity: 0.5 + rng() * 0.5,
        });
    }

    // Generate landing pads (2-4 pads)
    const padCount = 2 + Math.floor(rng() * 3);
    const landingPads: LandingPad[] = [];

    for (let i = 0; i < padCount; i++) {
        const angle = (i / padCount) * Math.PI * 2;
        const distance = cityRadius * (0.6 + rng() * 0.3);

        landingPads.push({
            id: `pad-${i}`,
            position: new THREE.Vector3(
                Math.cos(angle) * distance,
                150, // Landing pads at 150m height
                Math.sin(angle) * distance
            ),
            radius: 50, // 50m trigger radius
            clearanceSpeed: 8.94, // 20 mph = 8.94 m/s
            status: i === 0 ? 'available' : 'occupied', // First pad always available
            designation: `LP-${String.fromCharCode(65 + i)}`, // LP-A, LP-B, LP-C...
        });
    }

    // Generate skyways connecting districts
    const skyways: Skyway[] = [];
    for (let i = 0; i < districts.length; i++) {
        const next = (i + 1) % districts.length;
        skyways.push({
            id: `skyway-${i}`,
            start: districts[i].position,
            end: districts[next].position,
            traffic: rng(),
        });
    }

    return {
        name,
        layout,
        center,
        radius: cityRadius,
        districts,
        landingPads,
        skyways,
    };
}

/**
 * Generate district names based on type
 */
function generateDistrictName(type: District['type'], index: number, rng: () => number): string {
    const prefixes = {
        commercial: ['Central', 'Trade', 'Commerce', 'Exchange'],
        residential: ['Garden', 'Residential', 'Habitat', 'Living'],
        industrial: ['Factory', 'Manufacturing', 'Production', 'Forge'],
        government: ['Administration', 'Capitol', 'Governance', 'Authority'],
    };

    const suffixes = ['District', 'Quarter', 'Zone', 'Sector', 'Plaza'];

    const prefix = prefixes[type][Math.floor(rng() * prefixes[type].length)];
    const suffix = suffixes[Math.floor(rng() * suffixes.length)];

    return `${prefix} ${suffix}`;
}

/**
 * Seeded random number generator
 */
function seededRandom(seed: number): () => number {
    let value = seed;
    return () => {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
    };
}

/**
 * Find the nearest available landing pad
 */
export function findNearestLandingPad(
    position: THREE.Vector3,
    city: MegaCity
): LandingPad | null {
    const available = city.landingPads.filter((pad) => pad.status === 'available');

    if (available.length === 0) return null;

    let nearest = available[0];
    let minDistance = position.distanceTo(nearest.position);

    for (const pad of available) {
        const distance = position.distanceTo(pad.position);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = pad;
        }
    }

    return nearest;
}

/**
 * Check if ship is within landing pad clearance
 */
export function isInLandingClearance(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    pad: LandingPad
): boolean {
    const distance = position.distanceTo(pad.position);
    const speed = velocity.length();

    return distance < pad.radius && speed < pad.clearanceSpeed;
}
