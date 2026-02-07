
import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import { CentralConstruct } from './3D/CentralConstruct';
import { MechanicalRings } from './3D/MechanicalRings';
import { ParticleField } from './3D/ParticleField';
import { AppState } from '../../../types/vizzy';
import { AffinityHud } from '../../Affinity/AffinityHud';
import { affinityRuntime, type AffinitySeed } from '../../../stubs/affinity';
import { DEFAULT_VIZZY_STATE, UNIVERSE_DATA } from '../../../constants/vizzy';
import type { AffinityEntityRef, AffinityVector } from '../../../stubs/affinity'; // Use stubbed type

const archetypeSeed = (arch?: string): AffinityVector => {
    switch (arch) {
        case 'STR':
            return { G: 1.2, E: 0.1, S: -0.1 };
        case 'DEX':
            return { G: 0.1, E: 1.2, S: -0.1 };
        case 'INT':
            return { G: -0.1, E: 0.1, S: 1.2 };
        default:
            return { G: 0, E: 0, S: 0 };
    }
};

const buildAffinityIndex = () => {
    const entities: AffinityEntityRef[] = [];
    const seeds: AffinitySeed[] = [];
    const addEntity = (ref: AffinityEntityRef) => entities.push(ref);

    // Using mocked Universe Data
    UNIVERSE_DATA.forEach(galaxy => {
        addEntity({ id: galaxy.id, kind: 'Galaxy', scale: 'Galaxy' });
    });
    return { entities, seeds };
};

export const Vizzy: React.FC = () => {
    // Canvas moved to background App.tsx for "behind UI" layering.
    // This panel now only holds the HUD overlay.

    return (
        <div className="relative w-full h-full overflow-hidden bg-transparent pointer-events-none">
            {/* Overlay Affinity HUD - pointer events auto to allow interaction if needed */}
            <div className="pointer-events-auto w-full h-full">
                <AffinityHud selectedId="Proxima Centauri" />
            </div>
        </div>
    );
};
