import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { Stars, Cloud, Float, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingData, WeatherType, LandingZone, RuralRegion } from '../types';
import { getHeight, getBiome, SEA_LEVEL } from '../utils/terrain';

interface EnvironmentProps {
    isBoosting?: boolean;
    mode?: 'SPACE' | 'ATMOSPHERE';
    atmosphereColor?: string;
    landingZones?: (LandingZone & { ruralRegions: RuralRegion[] })[];
    activeLandingZoneId?: string;
    buildings?: BuildingData[];
    weather?: WeatherType;
}

// --- VISUALS ---

const WindParticles = ({ isBoosting }: { isBoosting: boolean }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.position.y = (state.clock.elapsedTime * -50) % 200;
            ref.current.rotation.x = 1.6; // Align with forward motion visually
        }
    });

    return (
        <group rotation={[0, 0, 0]}>
            <group ref={ref}>
                <Sparkles count={isBoosting ? 500 : 200} scale={[200, 200, 200]} size={6} speed={2} opacity={0.4} color="#fff" />
            </group>
        </group>
    );
};

const MassiveBeacon = ({ position, color = "#10b981" }: { position: number[], color?: string }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (ref.current) {
            const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
            ref.current.scale.set(s, 1, s);
        }
    });

    return (
        <group position={new THREE.Vector3(...position)} ref={ref}>
            {/* Main Beam - Visible from altitude */}
            <mesh position={[0, 5000, 0]}>
                <cylinderGeometry args={[20, 20, 10000, 32, 1, true]} />
                <meshBasicMaterial color={color} transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            {/* Core Beam */}
            <mesh position={[0, 5000, 0]}>
                <cylinderGeometry args={[2, 2, 10000, 32]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            {/* Base Glow */}
            <mesh position={[0, 5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0, 300, 64]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>

            {/* Horizontal Navigation Rays - Angled Upwards to clear terrain */}
            {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
                <group key={`nav-ray-${i}`} rotation={[0, angle, 0]}>
                    <mesh rotation={[Math.PI / 2 - 0.15, 0, 0]} position={[0, 0, 15000]}>
                        <cylinderGeometry args={[2, 10, 30000, 8]} />
                        <meshBasicMaterial color={color} transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
                    </mesh>
                </group>
            ))}

            {/* Guide Arrows pointing down */}
            {[100, 500, 1000, 2000].map((y, i) => (
                <group key={i} position={[0, y, 0]}>
                    <Float speed={2} rotationIntensity={0} floatIntensity={0} floatingRange={[0, 20]}>
                        <mesh rotation={[Math.PI, 0, 0]}>
                            <coneGeometry args={[40, 80, 4]} />
                            <meshBasicMaterial color="#10b981" transparent opacity={0.6} wireframe />
                        </mesh>
                    </Float>
                </group>
            ))}
        </group>
    );
};

const NightCityLights: React.FC<{ landingZones: (LandingZone & { ruralRegions: RuralRegion[] })[] }> = ({ landingZones }) => {
    const points = useMemo(() => {
        const positions: number[] = [];
        landingZones.forEach(lz => {
            // Main City Cluster
            for (let i = 0; i < 2000; i++) {
                const r = Math.random() * 800;
                const a = Math.random() * Math.PI * 2;
                const x = lz.position[0] + Math.cos(a) * r;
                const z = lz.position[2] + Math.sin(a) * r;
                positions.push(x, getHeight(x, z) + 5, z);
            }
            // Rural Region Clusters
            lz.ruralRegions.forEach(rr => {
                for (let i = 0; i < 400; i++) {
                    const r = Math.random() * 300;
                    const a = Math.random() * Math.PI * 2;
                    const x = rr.position[0] + Math.cos(a) * r;
                    const z = rr.position[2] + Math.sin(a) * r;
                    positions.push(x, getHeight(x, z) + 3, z);
                }
            });
        });
        return new Float32Array(positions);
    }, [landingZones]);

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={points.length / 3}
                    array={points}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={2} color="#fbbf24" transparent opacity={0.6} sizeAttenuation={true} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
    );
};

const City: React.FC<{ buildings: BuildingData[] }> = ({ buildings }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const glowRef = useRef<THREE.InstancedMesh>(null);

    useLayoutEffect(() => {
        if (!meshRef.current || !glowRef.current || !buildings) return;
        const temp = new THREE.Object3D();

        for (let i = 0; i < buildings.length; i++) {
            const b = buildings[i];
            temp.position.copy(b.position);
            temp.scale.set(b.width, b.height, b.depth);
            temp.rotation.y = b.rotationY;
            temp.updateMatrix();
            meshRef.current.setMatrixAt(i, temp.matrix);

            // Window Lights - Much smaller, more like rows of windows
            temp.scale.set(b.width + 0.2, b.height * 0.1, b.depth + 0.2); // Thin strips
            // Offset a bit so they look like floors
            temp.position.y = b.position.y + (b.height * 0.2);
            temp.updateMatrix();
            glowRef.current.setMatrixAt(i, temp.matrix);
        }
        meshRef.current.count = buildings.length;
        glowRef.current.count = buildings.length;
        meshRef.current.instanceMatrix.needsUpdate = true;
        glowRef.current.instanceMatrix.needsUpdate = true;
    }, [buildings]);

    return (
        <group>
            <instancedMesh ref={meshRef} args={[undefined, undefined, buildings.length]} castShadow receiveShadow>
                <boxGeometry />
                <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.9} />
            </instancedMesh>
            <instancedMesh ref={glowRef} args={[undefined, undefined, buildings.length]}>
                <boxGeometry />
                <meshStandardMaterial
                    color="#fcd34d"
                    emissive="#fbbf24"
                    emissiveIntensity={4}
                    transparent
                    opacity={0.3}
                    alphaMap={null} // We'll just rely on the shape for now
                />
            </instancedMesh>
        </group>
    );
};

const PlanetSurface: React.FC<{ landingZones?: (LandingZone & { ruralRegions: RuralRegion[] })[], buildings: BuildingData[], activeLandingZoneId?: string, weather?: WeatherType }> = ({ landingZones, buildings, activeLandingZoneId, weather }) => {
    const sunRef = useRef<THREE.Group>(null);
    const terrainRef = useRef<THREE.Mesh>(null);
    const radius = 25000;
    const isStorm = weather === 'STORM';

    // Roadways Visualization
    const roadways = useMemo(() => {
        const paths: THREE.Vector3[][] = [];
        landingZones?.forEach(lz => {
            const start = new THREE.Vector3(...lz.position);
            lz.ruralRegions.forEach(rr => {
                const end = new THREE.Vector3(...rr.position);
                paths.push([start, end]);
            });
        });
        return paths;
    }, [landingZones]);

    // Apply displacement to terrain geometry
    useLayoutEffect(() => {
        if (terrainRef.current) {
            const geo = terrainRef.current.geometry as THREE.BufferGeometry;
            const posAttr = geo.getAttribute('position');
            const v3 = new THREE.Vector3();
            for (let i = 0; i < posAttr.count; i++) {
                v3.fromBufferAttribute(posAttr, i);
                const h = getHeight(v3.x, v3.y); // Plane is rotated -PI/2, so y is z
                posAttr.setZ(i, h); // Displacement along local Z (which is world Y)
            }
            geo.computeVertexNormals();
            posAttr.needsUpdate = true;
        }
    }, []);

    useFrame((state) => {
        if (sunRef.current) {
            const speed = isStorm ? 0.01 : 0.05;
            // Move Sun MUCH further away (20k radius) for proper horizon occlusion
            const angle = state.clock.elapsedTime * speed;
            sunRef.current.position.x = Math.sin(angle) * 20000;
            sunRef.current.position.y = Math.cos(angle) * 10000; // Curve into the sky
            sunRef.current.position.z = Math.cos(angle) * 20000;
        }
    });

    return (
        <group>
            {/* TOPOGRAPHICAL TERRAIN - Increased size for sun occlusion */}
            <mesh ref={terrainRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[100000, 100000, 256, 256]} />
                <meshStandardMaterial
                    color={isStorm ? "#1e293b" : "#166534"}
                    roughness={1}
                    metalness={0.0}
                />
            </mesh>

            {/* WATER - Increased size */}
            <mesh position={[0, SEA_LEVEL, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[100000, 100000]} />
                <meshStandardMaterial color="#1d4ed8" transparent opacity={0.6} metalness={0.8} roughness={0.2} />
            </mesh>

            {/* ISS-STYLE CITY LIGHTS */}
            {landingZones && <NightCityLights landingZones={landingZones} />}

            {/* City Buildings */}
            <City buildings={buildings} />

            {/* Sun */}
            <group ref={sunRef}>
                <mesh>
                    <sphereGeometry args={[300, 32, 32]} />
                    <meshBasicMaterial color="#fbbf24" />
                </mesh>
                <pointLight intensity={2} distance={15000} color="#fbbf24" castShadow />
                <ambientLight intensity={0.5} color="#fed7aa" />
            </group>

            {/* Clouds */}
            <group visible={!isStorm}>
                <Cloud position={[0, 1500, -2000]} opacity={0.6} speed={0.2} bounds={[4000, 1000, 1000]} segments={60} color="white" />
                <Cloud position={[2000, 1200, 1000]} opacity={0.6} speed={0.2} bounds={[4000, 1000, 1000]} segments={60} color="white" />
                <Cloud position={[-2000, 1800, 0]} opacity={0.6} speed={0.2} bounds={[4000, 1000, 1000]} segments={60} color="white" />
            </group>

            {/* Storm Clouds */}
            {isStorm && (
                <group>
                    <Cloud position={[0, 1000, 0]} opacity={0.8} speed={1} bounds={[10000, 500, 10000]} segments={100} color="#475569" />
                    <Sparkles count={2000} scale={[10000, 1000, 10000]} size={2} speed={5} color="#cbd5e1" />
                </group>
            )}

            {/* ROADWAYS */}
            {roadways.map((path, i) => (
                <line key={i}>
                    <bufferGeometry attach="geometry" onUpdate={self => self.setFromPoints(path)} />
                    <lineBasicMaterial attach="material" color="#3b82f6" transparent opacity={0.3} />
                </line>
            ))}

            {/* Landing Pads */}
            {landingZones?.map(lz => (
                <group key={lz.id} position={new THREE.Vector3(...lz.position)}>
                    {/* Concrete Base */}
                    <mesh position={[0, 1, 0]} receiveShadow>
                        <cylinderGeometry args={[120, 130, 2, 64]} />
                        <meshStandardMaterial color="#1e293b" roughness={0.7} />
                    </mesh>

                    {/* Glowing Ring */}
                    <mesh position={[0, 2.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[90, 100, 64]} />
                        <meshBasicMaterial color={lz.id === activeLandingZoneId ? "#10b981" : "#3b82f6"} toneMapped={false} />
                    </mesh>

                    {/* H Mark */}
                    <group position={[0, 2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <mesh position={[-20, 0, 0]}>
                            <planeGeometry args={[10, 60]} />
                            <meshBasicMaterial color="#fbbf24" />
                        </mesh>
                        <mesh position={[20, 0, 0]}>
                            <planeGeometry args={[10, 60]} />
                            <meshBasicMaterial color="#fbbf24" />
                        </mesh>
                        <mesh>
                            <planeGeometry args={[50, 10]} />
                            <meshBasicMaterial color="#fbbf24" />
                        </mesh>
                    </group>

                    {/* Runway lights */}
                    {[...Array(8)].map((_, i) => {
                        const angle = (i / 8) * Math.PI * 2;
                        return (
                            <mesh key={i} position={[Math.cos(angle) * 110, 2, Math.sin(angle) * 110]}>
                                <boxGeometry args={[4, 1, 4]} />
                                <meshBasicMaterial color="#ef4444" toneMapped={false} />
                            </mesh>
                        );
                    })}

                    {/* MASSIVE BEACON */}
                    <MassiveBeacon position={[0, 0, 0]} color={lz.id === activeLandingZoneId ? "#10b981" : "#3b82f6"} />
                </group>
            ))}
        </group>
    );
};

export const Environment: React.FC<EnvironmentProps> = ({ isBoosting = false, mode = 'SPACE', atmosphereColor = '#38bdf8', landingZones, activeLandingZoneId, buildings = [], weather }) => {
    return (
        <group>
            {mode === 'SPACE' ? (
                <>
                    <fogExp2 attach="fog" args={['#000105', 0.0001]} />
                    <Stars radius={5000} depth={50} count={7000} factor={4} saturation={0.5} fade speed={0.5} />
                    <ambientLight intensity={0.4} />
                    <directionalLight position={[0, 10, 0]} intensity={0.8} color="#1e3a8a" />
                </>
            ) : (
                <>
                    {/* Bright Atmosphere Fog */}
                    <fogExp2 attach="fog" args={[atmosphereColor, 0.0004]} />

                    {/* Sky Sphere */}
                    <mesh>
                        <sphereGeometry args={[26000, 32, 32]} />
                        <meshBasicMaterial color={weather === 'STORM' ? "#1e293b" : atmosphereColor} side={THREE.BackSide} fog={false} />
                    </mesh>

                    <WindParticles isBoosting={isBoosting} />

                    <PlanetSurface landingZones={landingZones} buildings={buildings} activeLandingZoneId={activeLandingZoneId} weather={weather} />
                </>
            )}
        </group>
    );
};