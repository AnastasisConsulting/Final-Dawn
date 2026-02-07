/**
 * Reentry Visual Effects
 * Heat glow, plasma sheath, shockwaves, sparks
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';

interface ReentryEffectsProps {
    heat: number;          // 0-100
    speed: number;         // m/s
    phase: string;
}

/**
 * Plasma Sheath - Forms around ship during high-speed entry
 */
export const PlasmaSheath: React.FC<{ intensity: number }> = ({ intensity }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current) {
            // Animate plasma turbulence
            meshRef.current.rotation.z += 0.05;
            meshRef.current.scale.setScalar(0.8 + Math.sin(Date.now() * 0.003) * 0.2);

            const mat = meshRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = Math.max(0, (intensity - 20) / 80) * 0.8;
        }
    });

    return (
        <mesh ref={meshRef} position={[0, 0, -2]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[4, 8, 32, 1, true]} />
            <meshBasicMaterial
                color="#ff4500"
                transparent
                opacity={0}
                side={THREE.BackSide}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </mesh>
    );
};

/**
 * Heat Glow - Orange/red glow on ship hull
 */
export const HeatGlow: React.FC<{ intensity: number }> = ({ intensity }) => {
    const lightRef = useRef<THREE.PointLight>(null);

    useFrame(() => {
        if (lightRef.current) {
            // Pulsing heat glow
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            lightRef.current.intensity = (intensity / 50) * pulse * 5;
        }
    });

    return (
        <pointLight
            ref={lightRef}
            position={[0, 0, -1]}
            color={intensity > 70 ? '#ff0000' : '#ff6600'}
            distance={10}
            decay={2}
        />
    );
};

/**
 * Shockwave Rings - Appear during violent entry
 */
export const ShockwaveRings: React.FC<{ active: boolean }> = ({ active }) => {
    const ringsRef = useRef<THREE.Group>(null);
    const timeRef = useRef(0);

    useFrame((state, delta) => {
        if (!ringsRef.current || !active) return;

        timeRef.current += delta * 2;

        ringsRef.current.children.forEach((ring, i) => {
            const offset = i * 0.5;
            const scale = 1 + ((timeRef.current + offset) % 3);
            ring.scale.setScalar(scale);
            (ring as THREE.Mesh).material = new THREE.MeshBasicMaterial({
                color: '#00ffff',
                transparent: true,
                opacity: Math.max(0, 1 - scale / 3),
                side: THREE.DoubleSide,
            });
        });
    });

    if (!active) return null;

    return (
        <group ref={ringsRef}>
            {[0, 1, 2].map((i) => (
                <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -3]}>
                    <ringGeometry args={[2, 2.2, 32]} />
                </mesh>
            ))}
        </group>
    );
};

/**
 * Atmospheric Sparks - Debris/ionization during entry
 */
export const AtmosphericSparks: React.FC<{ heat: number; count: number }> = ({
    heat,
    count,
}) => {
    if (heat < 30) return null;

    return (
        <group position={[0, 0, -3]}>
            <Sparkles
                count={count}
                scale={[10, 10, 50]}
                color="#ff6600"
                size={5 + heat / 10}
                speed={20 + heat / 5}
                opacity={0.6}
                noise={2}
            />
        </group>
    );
};

/**
 * Combined Reentry Effects Component
 */
export const ReentryEffects: React.FC<ReentryEffectsProps> = ({ heat, speed, phase }) => {
    const isViolentEntry = phase === 'VIOLENT_ENTRY';
    const isEntry = phase === 'ENTRY_INTERFACE' || isViolentEntry;

    return (
        <group>
            {/* Plasma sheath appears at high heat */}
            {heat > 20 && <PlasmaSheath intensity={heat} />}

            {/* Heat glow */}
            {heat > 30 && <HeatGlow intensity={heat} />}

            {/* Shockwaves during violent entry */}
            <ShockwaveRings active={isViolentEntry && heat > 60} />

            {/* Atmospheric sparks/debris */}
            <AtmosphericSparks
                heat={heat}
                count={isEntry ? Math.floor(heat * 3) : Math.floor(heat)}
            />

            {/* Trail particles */}
            {speed > 100 && (
                <group position={[0, 0, 5]}>
                    <Sparkles
                        count={100}
                        scale={[5, 5, 100]}
                        color="#ffffff"
                        size={2}
                        speed={15}
                        opacity={0.3}
                    />
                </group>
            )}
        </group>
    );
};
