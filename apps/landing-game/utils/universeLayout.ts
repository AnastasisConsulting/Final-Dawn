
import { SystemNode } from '../types';
import { Vector3 } from 'three';

// Configuration for scales - condensed for easier travel
const SCALE_GALAXY_SEP = 4000; 
const SCALE_SYSTEM_RADIUS = 1000; 
const SCALE_PLANET_RADIUS = 500; // Increased from 200
const SCALE_MOON_RADIUS = 60; // Increased from 40

const COLORS = {
  GALAXY: '#8b5cf6', // Violet
  SYSTEM: '#fbbf24', // Amber/Yellow (Star)
  STATION: '#06b6d4', // Cyan
  PLANET: '#3b82f6', // Blue
  MOON: '#94a3b8',   // Slate
};

const SIZES = {
  GALAXY: 300, 
  SYSTEM: 80, 
  STATION: 15,
  PLANET: 30,
  MOON: 8
};

// Deterministic pseudo-random helper to keep layout stable across reloads
let seed = 1234;
const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

const randomPointOnSphere = (radius: number): [number, number, number] => {
    const u = random();
    const v = random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    return [x, y, z];
};

export const computeUniverseLayout = (nodes: SystemNode[], parentPos: [number, number, number] = [0,0,0]): SystemNode[] => {
    // We are at the Root level (Universe), processing Galaxies
    // Or recursive levels
    
    return nodes.map((node, index) => {
        let localPos: [number, number, number] = [0,0,0];
        let color = '#ffffff';
        let radius = 10;

        if (node.type === 'GALAXY') {
            // Place Galaxies in a triangle around 0,0,0
            const angle = (index / nodes.length) * Math.PI * 2;
            localPos = [
                Math.cos(angle) * SCALE_GALAXY_SEP,
                (random() - 0.5) * SCALE_GALAXY_SEP * 0.2, // Reduced vertical variation
                Math.sin(angle) * SCALE_GALAXY_SEP
            ];
            color = COLORS.GALAXY;
            radius = SIZES.GALAXY;
        } else if (node.type === 'SYSTEM') {
            // Place Systems around the Galaxy center
            // We want them spread out but grouped
            localPos = randomPointOnSphere(SCALE_SYSTEM_RADIUS + (random() * 200));
            color = COLORS.SYSTEM;
            radius = SIZES.SYSTEM;
        } else if (node.type === 'PLANET' || node.type === 'STATION') {
            // Place Planets/Stations around System
            // Stations slightly closer usually
            const dist = node.type === 'STATION' ? 200 : SCALE_PLANET_RADIUS + (index * 400); // Increased spacing
            // Orbit plane variation
            const angle = random() * Math.PI * 2;
            const height = (random() - 0.5) * 150; // Increased vertical spread
            localPos = [
                Math.cos(angle) * dist,
                height,
                Math.sin(angle) * dist
            ];
            color = node.type === 'STATION' ? COLORS.STATION : COLORS.PLANET;
            radius = node.type === 'STATION' ? SIZES.STATION : SIZES.PLANET;
        } else if (node.type === 'MOON') {
             // Place Moons around Planet
             const dist = SCALE_MOON_RADIUS + (index * 25);
             const angle = random() * Math.PI * 2;
             localPos = [
                 Math.cos(angle) * dist,
                 (random() - 0.5) * 20,
                 Math.sin(angle) * dist
             ];
             color = COLORS.MOON;
             radius = SIZES.MOON;
        }

        // Calculate Absolute Position
        const absPos: [number, number, number] = [
            parentPos[0] + localPos[0],
            parentPos[1] + localPos[1],
            parentPos[2] + localPos[2],
        ];

        // Process Children
        const children = node.children ? computeUniverseLayout(node.children, absPos) : [];

        return {
            ...node,
            position: localPos,
            absolutePosition: absPos,
            color,
            radius,
            children
        };
    });
};

export const flattenUniverse = (nodes: SystemNode[]): SystemNode[] => {
    let flat: SystemNode[] = [];
    nodes.forEach(node => {
        flat.push(node);
        if (node.children) {
            flat = flat.concat(flattenUniverse(node.children));
        }
    });
    return flat;
};
