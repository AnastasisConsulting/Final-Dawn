import React, { useRef } from 'react';
import { Stars, Line, useTexture } from '@react-three/drei';
import { Vector3, Quaternion, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { getFilePath } from 'eideus-routers';

const PLANET_RADIUS = 8000;
const PLANET_Y = -8500;

interface EnvironmentProps {
    landingTarget?: Vector3;
    playerStart?: Vector3;
    pathPoints?: Vector3[];
    worldId: string;
}

export const Environment: React.FC<EnvironmentProps> = ({ landingTarget, playerStart, pathPoints, worldId }) => {
    const planetRef = useRef<Mesh>(null);
    const ribbonRef = useRef<any>(null);

    // Load texture from Galaxies_Folder middleware
    const texturePath = getFilePath(worldId, 'texture.png');
    // Prepend /Galaxies_Folder/ as our Vite middleware expects it
    const fullTextureUrl = texturePath ? `/Galaxies_Folder/${texturePath}` : null;

    // Fallback if texture not found or error
    const planetTexture = fullTextureUrl ? useTexture(fullTextureUrl) : null;

    useFrame((state, delta) => {
        if (planetRef.current) {
            planetRef.current.rotation.y += delta * 0.005;
        }
        if (ribbonRef.current && ribbonRef.current.material) {
            ribbonRef.current.material.dashOffset -= delta * 2.0;
        }
    });

    return (
        <group>
            <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <ambientLight intensity={0.5} color="#ffffff" />
            <directionalLight position={[10000, 10000, 5000]} intensity={1.5} />

            {/* Luminescent Path Ribbon */}
            {pathPoints && pathPoints.length > 0 && (
                <group>
                    {/* Core Line */}
                    <Line
                        ref={ribbonRef}
                        points={pathPoints}
                        color="#22d3ee"
                        lineWidth={6}
                        dashed
                        dashScale={2}
                        dashSize={4}
                        gapSize={2}
                    />
                    {/* Glow/Halo Line */}
                    <Line
                        points={pathPoints}
                        color="#22d3ee"
                        lineWidth={15}
                        transparent
                        opacity={0.3}
                    />
                </group>
            )}

            <group position={[0, PLANET_Y, 0]}>
                {/* Simple Planet Sphere */}
                <mesh ref={planetRef}>
                    <sphereGeometry args={[PLANET_RADIUS, 64, 64]} />
                    <meshStandardMaterial
                        map={planetTexture}
                        color={planetTexture ? undefined : "#22d3ee"}
                        roughness={0.8}
                    />
                </mesh>

                {/* Wireframe Overlay */}
                <mesh>
                    <sphereGeometry args={[PLANET_RADIUS + 10, 32, 32]} />
                    <meshBasicMaterial color="#000000" wireframe transparent opacity={0.1} />
                </mesh>

                {/* Enhanced Landing Pad Geometry */}
                {landingTarget && (
                    <group position={landingTarget.clone().sub(new Vector3(0, PLANET_Y, 0))}>
                        <mesh quaternion={new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), landingTarget.clone().sub(new Vector3(0, PLANET_Y, 0)).normalize())}>
                            <cylinderGeometry args={[200, 220, 20, 32]} />
                            <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.8} />

                            {/* Inner Glowing Ring */}
                            <mesh position={[0, 11, 0]} rotation={[Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[150, 180, 64]} />
                                <meshStandardMaterial
                                    color="#ef4444"
                                    emissive="#ef4444"
                                    emissiveIntensity={10}
                                    transparent
                                    opacity={0.8}
                                />
                            </mesh>

                            {/* Outer Decorative Ring */}
                            <mesh position={[0, 11, 0]} rotation={[Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[190, 200, 64]} />
                                <meshStandardMaterial
                                    color="#22d3ee"
                                    emissive="#22d3ee"
                                    emissiveIntensity={5}
                                />
                            </mesh>

                            {/* Point Light for "Connected" Look */}
                            <pointLight position={[0, 50, 0]} color="#ef4444" intensity={200} distance={1000} decay={2} />
                        </mesh>
                    </group>
                )}
            </group>
        </group>
    );
};