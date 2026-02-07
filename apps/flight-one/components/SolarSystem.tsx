
import React, { useRef, useState, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { SystemNode, TargetDynamics } from '../types';

interface SolarSystemProps {
    system: SystemNode;
    shipPosition: THREE.Vector3;
    onDockingTargetChange: (node: SystemNode | null) => void;
    dockingTargetId: string | null;
    targetDynamicsRef: MutableRefObject<TargetDynamics>;
}

// System Scale Constants
const STAR_RADIUS = 400;
const AU = 6000; 
const ORBIT_SPEED_BASE = 0.014; 
const DOCKING_RANGE = 300; 

const OrbitLine: React.FC<{ radius: number }> = ({ radius }) => {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 4, radius + 4, 256]} />
            <meshBasicMaterial 
                color="#38bdf8" 
                transparent 
                opacity={0.08} 
                side={THREE.DoubleSide} 
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    );
};

const ProximityBody: React.FC<{ 
    node: SystemNode; 
    orbitRadius: number; 
    speed: number; 
    offset: number;
    shipPosition: THREE.Vector3;
    onDockingRange: (node: SystemNode, distance: number) => void;
    parentRef?: React.RefObject<THREE.Group>; 
    inclination: number; 
    isTarget: boolean;
    dockingTargetId: string | null;
    targetDynamicsRef: MutableRefObject<TargetDynamics>;
}> = ({ node, orbitRadius, speed, offset, shipPosition, onDockingRange, parentRef, inclination, isTarget, dockingTargetId, targetDynamicsRef }) => {
    const groupRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Group>(null);
    const lastPosRef = useRef(new THREE.Vector3());
    
    // Random visual properties based on node
    const size = node.type === 'STATION' ? 60 : (node.radius || 100); 
    const color = node.color || '#3b82f6';
    const isStation = node.type === 'STATION';
    const childrenCount = node.children ? node.children.length : 0;

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Orbital mechanics
            const t = state.clock.getElapsedTime() * speed + offset;
            groupRef.current.position.x = Math.cos(t) * orbitRadius;
            groupRef.current.position.z = Math.sin(t) * orbitRadius;
            
            // Proximity Check & Dynamics Calculation
            const worldPos = new THREE.Vector3();
            groupRef.current.getWorldPosition(worldPos);
            
            // Calculate velocity via finite difference for robust handling of nested orbits
            const velocity = worldPos.clone().sub(lastPosRef.current).divideScalar(delta || 0.016);
            lastPosRef.current.copy(worldPos);

            if (isTarget) {
                targetDynamicsRef.current.position.copy(worldPos);
                targetDynamicsRef.current.velocity.copy(velocity);
            }
            
            const dist = worldPos.distanceTo(shipPosition);
            
            if (dist < DOCKING_RANGE) {
                onDockingRange(node, dist);
            }
        }
        if (bodyRef.current) {
            // Local rotation
            bodyRef.current.rotation.y += 0.005;
        }
    });

    return (
        <group rotation={[0, 0, inclination]}>
            {!parentRef && <OrbitLine radius={orbitRadius} />}
            
            <group ref={groupRef}>
                <group ref={bodyRef}>
                    <mesh>
                         {isStation ? (
                            <octahedronGeometry args={[size, 0]} />
                         ) : (
                            <sphereGeometry args={[size, 32, 32]} />
                         )}
                         <meshStandardMaterial 
                            color={color} 
                            roughness={0.7} 
                            metalness={0.2}
                            emissive={isStation ? color : '#000'}
                            emissiveIntensity={isStation ? 0.5 : 0}
                         />
                    </mesh>
                    {/* Atmosphere for planets */}
                    {node.type === 'PLANET' && (
                        <mesh scale={[1.1, 1.1, 1.1]}>
                            <sphereGeometry args={[size, 32, 32]} />
                            <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.BackSide} />
                        </mesh>
                    )}
                </group>

                {/* Label */}
                <Billboard position={[0, size + 100, 0]}>
                    <Text fontSize={80} color="#e2e8f0" outlineWidth={2} outlineColor="#000000">
                        {node.name}
                        <meshBasicMaterial depthTest={false} />
                    </Text>
                    <Text position={[0, -50, 0]} fontSize={30} color="#94a3b8">
                        {Math.round(orbitRadius)}u
                    </Text>
                </Billboard>

                {/* Moons */}
                {node.children && node.children.map((moon, i) => {
                     // Even distribution of moons
                     const moonOffset = (i / childrenCount) * Math.PI * 2;
                     // Significant spacing increase for moons
                     const moonOrbit = size * 4 + (i * size * 2.5);

                     return (
                        <ProximityBody 
                            key={moon.id} 
                            node={moon} 
                            orbitRadius={moonOrbit} 
                            speed={speed * 2.5} 
                            offset={moonOffset}
                            shipPosition={shipPosition}
                            onDockingRange={onDockingRange}
                            parentRef={groupRef}
                            inclination={(i % 2 === 0 ? 0.2 : -0.2) * (i + 1)} // Alternating tilt for moons
                            isTarget={dockingTargetId === moon.id}
                            dockingTargetId={dockingTargetId}
                            targetDynamicsRef={targetDynamicsRef}
                        />
                    );
                })}
            </group>
        </group>
    );
};

export const SolarSystem: React.FC<SolarSystemProps> = ({ system, shipPosition, onDockingTargetChange, dockingTargetId, targetDynamicsRef }) => {
    
    const potentialTargets = useRef<Map<string, {node: SystemNode, dist: number}>>(new Map());
    const childrenCount = system.children ? system.children.length : 0;
    
    useFrame(() => {
        let closest: SystemNode | null = null;
        let minDist = Infinity;
        
        potentialTargets.current.forEach((val) => {
             if (val.dist < minDist) {
                 minDist = val.dist;
                 closest = val.node;
             }
        });
        
        potentialTargets.current.clear();
        onDockingTargetChange(closest);
    });

    const handleDockingReport = (node: SystemNode, distance: number) => {
        potentialTargets.current.set(node.id, { node, dist: distance });
    };

    return (
        <group>
            {/* Central Star */}
            <mesh>
                <sphereGeometry args={[STAR_RADIUS, 64, 64]} />
                <meshBasicMaterial color={system.color || "#fbbf24"} />
            </mesh>
            <mesh>
                <sphereGeometry args={[STAR_RADIUS * 1.2, 32, 32]} />
                <meshBasicMaterial color={system.color || "#fbbf24"} transparent opacity={0.2} side={THREE.BackSide} />
            </mesh>
            <pointLight color={system.color || "#fbbf24"} intensity={2.5} distance={20000} decay={1} />
            <Billboard>
                 <Text position={[0, STAR_RADIUS + 100, 0]} fontSize={120} color={system.color || "#fbbf24"}>
                    {system.name}
                 </Text>
            </Billboard>

            {/* Orbiting Bodies */}
            {system.children?.map((child, index) => {
                const orbitRadius = STAR_RADIUS + 2500 + (index * AU);
                const speed = ORBIT_SPEED_BASE / (1 + index * 0.2); // Less falloff for outer planets so they don't freeze
                
                // Distribute evenly around the circle: 0, 360/n, 720/n...
                const offset = (index / childrenCount) * Math.PI * 2;
                
                // Keep inclination subtle but distinct
                const inclination = (index % 2 === 0 ? 1 : -1) * (0.05 + (index * 0.02));

                return (
                    <ProximityBody 
                        key={child.id} 
                        node={child} 
                        orbitRadius={orbitRadius} 
                        speed={speed} 
                        offset={offset}
                        shipPosition={shipPosition}
                        onDockingRange={handleDockingReport}
                        inclination={inclination}
                        isTarget={dockingTargetId === child.id}
                        dockingTargetId={dockingTargetId}
                        targetDynamicsRef={targetDynamicsRef}
                    />
                );
            })}
        </group>
    );
};
