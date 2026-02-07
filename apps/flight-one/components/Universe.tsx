
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, Sparkles, Float, Ring, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { SystemNode } from '../types';

interface UniverseProps {
    data: SystemNode[];
}

// Visual constants
const ORBIT_OPACITY = 0.15;
const ORBIT_COLOR = '#38bdf8'; // Sky blue / Cyan
const LABEL_COLOR_GALAXY = '#d8b4fe';
const LABEL_COLOR_SYSTEM = '#fcd34d';

// --- Helpers ---

const Rotator: React.FC<{ speed?: number; children: React.ReactNode }> = ({ speed = 1, children }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, delta) => {
        if (ref.current) ref.current.rotation.y += delta * 0.1 * speed;
    });
    return <group ref={ref}>{children}</group>;
};

const OrbitLine: React.FC<{ radius: number }> = ({ radius }) => {
    if (radius <= 0) return null;
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.5, radius + 0.5, 128]} />
            <meshBasicMaterial 
                color={ORBIT_COLOR} 
                transparent 
                opacity={ORBIT_OPACITY} 
                side={THREE.DoubleSide} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false}
            />
        </mesh>
    );
};

// --- Appearance Logic ---

const getBodyAppearance = (node: SystemNode) => {
    // Base defaults
    let color = node.color || '#cccccc';
    let emissive = '#000000';
    let emissiveIntensity = 0;
    let particles = false;
    let particleColor = '#ffffff';

    if (node.type === 'GALAXY') {
        particleColor = '#8b5cf6';
        particles = true;
    } else if (node.type === 'SYSTEM') {
        emissive = color;
        emissiveIntensity = 2;
        particles = true; // Corona effect
    }

    return { color, emissive, emissiveIntensity, particles, particleColor };
};

// --- Component: Celestial Body ---

const CelestialBody: React.FC<{ node: SystemNode }> = ({ node }) => {
    const style = useMemo(() => getBodyAppearance(node), [node]);
    const isSystem = node.type === 'SYSTEM';
    const isGalaxy = node.type === 'GALAXY';
    
    return (
        <group>
            {/* Mesh Representation */}
            <Rotator speed={isGalaxy ? 0.05 : 0.1}>
                <mesh>
                    <sphereGeometry args={[node.radius, 32, 32]} />
                    {isSystem ? (
                        <meshBasicMaterial color={style.color} />
                    ) : (
                            <meshStandardMaterial 
                            color={style.color}
                            emissive={style.emissive}
                            emissiveIntensity={style.emissiveIntensity}
                        />
                    )}
                </mesh>
            </Rotator>

            {/* Effects */}
            {isSystem && (
                <>
                    {/* Star Glow */}
                    <mesh>
                        <sphereGeometry args={[node.radius! * 1.5, 16, 16]} />
                        <meshBasicMaterial color={style.color} transparent opacity={0.3} side={THREE.BackSide} />
                    </mesh>
                </>
            )}

            {style.particles && (
                <Sparkles 
                    count={isGalaxy ? 200 : 50} 
                    scale={node.radius! * (isGalaxy ? 8 : 4)} 
                    size={isGalaxy ? 20 : 10} 
                    speed={0.2} 
                    opacity={0.6} 
                    color={style.particleColor} 
                />
            )}

            {/* Labels */}
            <Billboard
                follow={true}
                lockX={false}
                lockY={false}
                lockZ={false}
            >
                <group position={[0, node.radius! * 1.5 + (isGalaxy ? 200 : 60), 0]}>
                    <Text
                        fontSize={isGalaxy ? 300 : 80}
                        color={isGalaxy ? LABEL_COLOR_GALAXY : LABEL_COLOR_SYSTEM}
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={isGalaxy ? 10 : 4}
                        outlineColor="#000000"
                        fillOpacity={0.9}
                    >
                        {node.name}
                    </Text>
                    {/* Connection Line */}
                    <mesh position={[0, isGalaxy ? -100 : -30, 0]}>
                        <cylinderGeometry args={[0.5, 0.5, isGalaxy ? 100 : 60]} />
                        <meshBasicMaterial color={isGalaxy ? LABEL_COLOR_GALAXY : LABEL_COLOR_SYSTEM} opacity={0.5} transparent />
                    </mesh>
                </group>
            </Billboard>
        </group>
    );
};

// --- Recursive Node Renderer ---

const NodeRenderer: React.FC<{ node: SystemNode }> = ({ node }) => {
    // Check if node has local position
    const pos = new THREE.Vector3(...(node.position || [0,0,0]));
    const dist = pos.length();

    return (
        <group>
            {/* Draw Orbit Lines for Systems around Galaxies */}
            {node.type !== 'GALAXY' && dist > 10 && (
                <OrbitLine radius={dist} />
            )}

            {/* Position this object locally */}
            <group position={pos}>
                <CelestialBody node={node} />
                
                {/* Render Children - BUT STOP at System level for Universe View */}
                {/* This prevents rendering Planets/Moons in the macro view which causes text stacking */}
                {node.type === 'GALAXY' && node.children && node.children.map(child => (
                    <NodeRenderer key={child.id} node={child} />
                ))}
            </group>
        </group>
    );
};

export const Universe: React.FC<UniverseProps> = ({ data }) => {
    return (
        <group>
            {data.map(galaxy => (
                <NodeRenderer key={galaxy.id} node={galaxy} />
            ))}
        </group>
    );
};
