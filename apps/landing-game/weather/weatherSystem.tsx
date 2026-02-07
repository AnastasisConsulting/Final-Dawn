/**
 * Weather System
 * Rain, storms, wind, lightning during atmospheric flight
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Cloud } from '@react-three/drei';

export enum WeatherType {
    CLEAR = 'CLEAR',
    CLOUDY = 'CLOUDY',
    RAIN = 'RAIN',
    STORM = 'STORM',
}

interface WeatherSystemProps {
    type: WeatherType;
    intensity: number; // 0-1
    altitude: number;
}

/**
 * Rain particles
 */
const RainParticles: React.FC<{ intensity: number }> = ({ intensity }) => {
    const particlesRef = useRef<THREE.Points>(null);

    const particleCount = Math.floor(1000 * intensity);
    const positions = useMemo(() => {
        const pos = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 200;
            pos[i * 3 + 1] = Math.random() * 100 - 50;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 200;
        }
        return pos;
    }, [particleCount]);

    useFrame((state, delta) => {
        if (!particlesRef.current) return;

        const posAttr = particlesRef.current.geometry.attributes.position;
        for (let i = 0; i < particleCount; i++) {
            posAttr.array[i * 3 + 1] -= delta * 50; // Fall speed
            if (posAttr.array[i * 3 + 1] < -50) {
                posAttr.array[i * 3 + 1] = 50; // Reset to top
            }
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.5}
                color="#88ccff"
                transparent
                opacity={0.6}
                sizeAttenuation={true}
            />
        </points>
    );
};

/**
 * Lightning flashes
 */
const Lightning: React.FC<{ active: boolean }> = ({ active }) => {
    const lightRef = useRef<THREE.PointLight>(null);
    const flashTimer = useRef(0);
    const flashDuration = useRef(0);

    useFrame((state, delta) => {
        if (!lightRef.current || !active) return;

        flashTimer.current += delta;

        // Random lightning strikes
        if (flashTimer.current > 2 + Math.random() * 3) {
            flashTimer.current = 0;
            flashDuration.current = 0.1 + Math.random() * 0.2;
        }

        // Flash effect
        if (flashDuration.current > 0) {
            lightRef.current.intensity = 20 + Math.random() * 10;
            flashDuration.current -= delta;
        } else {
            lightRef.current.intensity = 0;
        }
    });

    if (!active) return null;

    return (
        <pointLight
            ref={lightRef}
            position={[Math.random() * 100 - 50, 30, Math.random() * 100 - 50]}
            color="#ffffff"
            distance={200}
            decay={2}
        />
    );
};

/**
 * Cloud layers
 */
const CloudLayers: React.FC<{ altitude: number; density: number }> = ({
    altitude,
    density,
}) => {
    // Only show clouds at certain altitudes
    if (altitude < 5000 || altitude > 50000) return null;

    const cloudY = Math.min(50, altitude / 1000);

    return (
        <group position={[0, cloudY, 0]}>
            <Cloud
                opacity={0.3 * density}
                speed={0.5}
                width={800}
                depth={200}
                segments={40}
                color="#e0f2fe"
            />
            <Cloud
                position={[200, -10, 100]}
                opacity={0.25 * density}
                speed={0.3}
                width={600}
                depth={150}
                segments={30}
                color="#d1e7f5"
            />
        </group>
    );
};

/**
 * Atmospheric fog
 */
const AtmosphericFog: React.FC<{ visibility: number }> = ({ visibility }) => {
    const fogDensity = (1 - visibility) * 0.0005;

    return <fog attach="fog" args={['#87ceeb', 100, 2000 / (1 + fogDensity * 10)]} />;
};

/**
 * Complete Weather System
 */
export const WeatherSystem: React.FC<WeatherSystemProps> = ({
    type,
    intensity,
    altitude,
}) => {
    return (
        <group>
            {/* Atmospheric fog */}
            <AtmosphericFog visibility={type === WeatherType.STORM ? 0.4 : 0.7} />

            {/* Cloud layers */}
            <CloudLayers
                altitude={altitude}
                density={type === WeatherType.CLOUDY || type === WeatherType.STORM ? 1 : 0.3}
            />

            {/* Rain */}
            {(type === WeatherType.RAIN || type === WeatherType.STORM) && (
                <RainParticles intensity={intensity} />
            )}

            {/* Lightning */}
            <Lightning active={type === WeatherType.STORM && intensity > 0.5} />

            {/* Ambient sound would go here (handled separately) */}
        </group>
    );
};
