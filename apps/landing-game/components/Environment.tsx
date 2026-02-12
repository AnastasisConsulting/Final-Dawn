import React, { useRef, useMemo } from 'react';
import { Stars, Line, useTexture, Sparkles, Float } from '@react-three/drei';
import { Vector3, Quaternion, Mesh, AdditiveBlending, BackSide, DoubleSide, Color } from 'three';
import { useFrame } from '@react-three/fiber';
import { getFilePath } from 'eideus-routers';
import * as THREE from 'three';

const PLANET_RADIUS = 8000;
const PLANET_Y = -8500;

export type WorldType = 'EARTH' | 'MOON' | 'CITY';

interface EnvironmentProps {
    landingTarget?: Vector3;
    playerStart?: Vector3;
    pathPoints?: Vector3[];
    worldId: string;
    type?: WorldType;
}

const Atmosphere = ({ color, opacity = 0.15 }: { color: string, opacity?: number }) => {
    return (
        <mesh>
            <sphereGeometry args={[PLANET_RADIUS * 1.05, 64, 64]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                side={BackSide}
                blending={AdditiveBlending}
            />
        </mesh>
    );
};

const Clouds = ({ color, speed = 0.008 }: { color: string, speed?: number }) => {
    const ref = useRef<Mesh>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * speed;
            ref.current.rotation.z += delta * (speed * 0.2);
        }
    });

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[PLANET_RADIUS * 1.02, 64, 64]} />
            <meshStandardMaterial
                color={color}
                transparent
                opacity={0.3}
                alphaTest={0.05}
                blending={AdditiveBlending}
            />
        </mesh>
    );
}

// A component that takes points and adds "dynamic wobble"
const WavyRibbon = ({ points, color }: { points: Vector3[], color: string }) => {
    const ribbonRef = useRef<any>(null);
    const glowRef = useRef<any>(null);

    useFrame((state, delta) => {
        const time = state.clock.getElapsedTime();
        if (ribbonRef.current && ribbonRef.current.geometry) {
            // Update points with dynamic sine wave
            const newPoints = points.map((p, i) => {
                const wave = Math.sin(i * 0.2 + time * 3.0) * 12;
                const wave2 = Math.cos(i * 0.15 + time * 2.0) * 12;
                return p.clone().add(new Vector3(wave, wave2, wave));
            });
            ribbonRef.current.setPoints(newPoints);
            if (glowRef.current) glowRef.current.setPoints(newPoints);
            ribbonRef.current.material.dashOffset -= delta * 4.0;
        }
    });

    return (
        <group>
            <Line
                ref={ribbonRef}
                points={points}
                color={color}
                lineWidth={12}
                dashed
                dashScale={2.0}
                dashSize={10}
                gapSize={5}
                depthTest={false}
                transparent
                opacity={0.8}
            />
            <Line
                ref={glowRef}
                points={points}
                color={color}
                lineWidth={45}
                transparent
                opacity={0.08}
                depthTest={false}
                blending={AdditiveBlending}
            />
        </group>
    );
};

export const Environment: React.FC<EnvironmentProps> = ({ landingTarget, playerStart, pathPoints, worldId, type = 'EARTH' }) => {
    const planetRef = useRef<Mesh>(null);
    const cityLightsRef = useRef<Mesh>(null);

    // Load texture
    const texturePath = getFilePath(worldId, 'texture.png');
    const fullTextureUrl = texturePath ? `/Galaxies_Folder/${texturePath}` : null;
    const planetTexture = fullTextureUrl ? useTexture(fullTextureUrl) : null;

    useFrame((state, delta) => {
        if (planetRef.current) {
            planetRef.current.rotation.y += delta * 0.015; // Spinning planet
        }
        if (cityLightsRef.current) {
            cityLightsRef.current.rotation.y += delta * 0.015;
        }
    });

    // Determine visual parameters based on type
    const config = useMemo(() => {
        switch (type) {
            case 'MOON':
                return {
                    color: '#94a3b8',
                    atmosphere: false,
                    clouds: false,
                    emission: 0,
                    city: false,
                    ambient: 0.05,
                    lightColor: '#f8fafc'
                };
            case 'CITY':
                return {
                    color: '#1e293b',
                    atmosphere: true,
                    clouds: false,
                    emission: 2.0,
                    city: true,
                    ambient: 0.1,
                    lightColor: '#fbbf24'
                };
            default: // EARTH / ATMOSPHERIC
                return {
                    color: '#22d3ee',
                    atmosphere: true,
                    clouds: true,
                    emission: 0.2,
                    city: false,
                    ambient: 0.2,
                    lightColor: '#ffffff'
                };
        }
    }, [type]);

    return (
        <group>
            {/* Space Context */}
            <Stars radius={5000} depth={50} count={12000} factor={6} saturation={0.5} fade speed={0.5} />
            <ambientLight intensity={config.ambient} />
            <directionalLight position={[10000, 10000, 8000]} intensity={2.5} color={config.lightColor} />

            {/* Wavy Guidance Ribbon */}
            {pathPoints && pathPoints.length > 0 && (
                <WavyRibbon points={pathPoints} color={config.color} />
            )}

            <group position={[0, PLANET_Y, 0]}>
                {/* 1. Core Planet Sphere */}
                <mesh ref={planetRef}>
                    <sphereGeometry args={[PLANET_RADIUS, 128, 128]} />
                    <meshStandardMaterial
                        map={planetTexture}
                        color={planetTexture ? '#ffffff' : config.color}
                        roughness={type === 'MOON' ? 1.0 : 0.8}
                        metalness={type === 'CITY' ? 0.3 : 0.05}
                        emissive={new Color(config.color)}
                        emissiveIntensity={config.emission * 0.1}
                    />
                </mesh>

                {/* 2. City Lights Layer (Overlay for CITY type) */}
                {type === 'CITY' && (
                    <mesh ref={cityLightsRef}>
                        <sphereGeometry args={[PLANET_RADIUS + 5, 128, 128]} />
                        <meshBasicMaterial
                            color="#fbbf24"
                            transparent
                            opacity={0.4}
                            wireframe // Representing massive industrial grid
                        />
                    </mesh>
                )}

                {/* 3. Atmosphere & Clouds */}
                {config.atmosphere && <Atmosphere color={config.color} opacity={type === 'CITY' ? 0.05 : 0.15} />}
                {config.clouds && <Clouds color="#ffffff" />}

                {/* 4. Rim Glow (Helps hide poles) */}
                <mesh scale={[1.008, 1.008, 1.008]}>
                    <sphereGeometry args={[PLANET_RADIUS, 64, 64]} />
                    <meshBasicMaterial
                        color={config.color}
                        transparent
                        opacity={0.1}
                        side={BackSide}
                        blending={AdditiveBlending}
                    />
                </mesh>

                {/* 5. Landing Pad Rendering */}
                {landingTarget && (
                    <group position={landingTarget.clone().sub(new Vector3(0, PLANET_Y, 0))}>
                        <mesh quaternion={new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), landingTarget.clone().sub(new Vector3(0, PLANET_Y, 0)).normalize())}>
                            <cylinderGeometry args={[250, 280, 40, 32]} />
                            <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />

                            <mesh position={[0, 21, 0]} rotation={[Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[180, 240, 64]} />
                                <meshStandardMaterial
                                    color={config.color}
                                    emissive={config.color}
                                    emissiveIntensity={5}
                                    transparent
                                    opacity={0.8}
                                />
                            </mesh>

                            {[0, 90, 180, 270].map(angle => (
                                <group key={angle} rotation={[0, (angle * Math.PI) / 180, 0]} position={[240, 0, 0]}>
                                    <mesh><boxGeometry args={[15, 60, 15]} /><meshStandardMaterial color="#1e293b" /></mesh>
                                    <pointLight position={[0, 30, 0]} color={config.color} intensity={500} distance={400} />
                                </group>
                            ))}
                        </mesh>
                    </group>
                )}
            </group>
        </group>
    );
};