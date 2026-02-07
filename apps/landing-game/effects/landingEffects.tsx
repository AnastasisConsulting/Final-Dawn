/**
 * Landing Effects
 * Visual effects for landing sequence
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';

interface LandingGearProps {
    deployed: boolean;
}

/**
 * Landing Gear Animation
 */
export const LandingGear: React.FC<LandingGearProps> = ({ deployed }) => {
    const gearRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (!gearRef.current) return;

        // Animate gear deployment
        const targetRotation = deployed ? -Math.PI / 2 : 0;
        gearRef.current.rotation.x = THREE.MathUtils.lerp(
            gearRef.current.rotation.x,
            targetRotation,
            0.1
        );
    });

    return (
        <group ref={gearRef} position={[0, -1.5, 0]}>
            {/* Left gear */}
            <mesh position={[-0.8, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
                <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Right gear */}
            <mesh position={[0.8, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
                <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Nose gear */}
            <mesh position={[0, 0, -1.2]}>
                <cylinderGeometry args={[0.08, 0.08, 0.4, 8]} />
                <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
            </mesh>
        </group>
    );
};

interface TouchdownEffectsProps {
    active: boolean;
    position: THREE.Vector3;
}

/**
 * Touchdown Dust Cloud
 */
export const TouchdownEffects: React.FC<TouchdownEffectsProps> = ({
    active,
    position,
}) => {
    if (!active) return null;

    return (
        <group position={position}>
            {/* Dust cloud */}
            <Sparkles
                count={200}
                scale={[20, 5, 20]}
                color="#cccccc"
                size={3}
                speed={5}
                opacity={0.4}
            />

            {/* Impact ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <ringGeometry args={[3, 5, 32]} />
                <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.5}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
};

interface AutopilotHUDProps {
    phase: string;
    progress: number;
    gearDeployed: boolean;
}

/**
 * Autopilot HUD Overlay
 */
export const AutopilotHUD: React.FC<AutopilotHUDProps> = ({
    phase,
    progress,
    gearDeployed,
}) => {
    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Center message */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2">
                <div className="bg-green-900/90 border-2 border-green-500 text-green-200 px-8 py-4 rounded">
                    <div className="text-2xl font-bold text-center mb-2">
                        🛬 AUTOPILOT ENGAGED
                    </div>
                    <div className="text-sm uppercase tracking-wider text-center">
                        Phase: {phase.toUpperCase()}
                    </div>
                    <div className="w-64 bg-green-950 h-2 rounded-full mt-3 overflow-hidden">
                        <div
                            className="bg-green-500 h-full rounded-full transition-all"
                            style={{ width: `${progress * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Gear status */}
            {gearDeployed && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2">
                    <div className="bg-blue-900/90 border border-blue-500 text-blue-200 px-4 py-2 rounded">
                        ✓ LANDING GEAR DEPLOYED
                    </div>
                </div>
            )}

            {/* Warning */}
            <div className="absolute bottom-48 left-1/2 -translate-x-1/2">
                <div className="bg-amber-900/90 border border-amber-500 text-amber-200 px-4 py-2 rounded text-center text-sm">
                    ⚠️ DO NOT INTERFERE WITH CONTROLS
                </div>
            </div>
        </div>
    );
};
