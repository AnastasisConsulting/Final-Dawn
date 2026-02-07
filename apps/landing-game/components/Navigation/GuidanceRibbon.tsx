/**
 * Guidance Ribbon
 * Luminescent 3D ribbon that guides player to landing pad
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

interface GuidanceRibbonProps {
    startPosition: THREE.Vector3;
    targetPosition: THREE.Vector3;
    color?: string;
    visible?: boolean;
}

/**
 * Luminescent Guidance Ribbon with twists and wobbles
 */
export const GuidanceRibbon: React.FC<GuidanceRibbonProps> = ({
    startPosition,
    targetPosition,
    color = '#00ffff',
    visible = true,
}) => {
    const ribbonRef = useRef<THREE.Group>(null);
    const lineRef = useRef<any>(null);

    // Generate ribbon path points with curves and wobbles
    const points = useMemo(() => {
        const numPoints = 50;
        const pathPoints: THREE.Vector3[] = [];

        for (let i = 0; i < numPoints; i++) {
            const t = i / (numPoints - 1);

            // Base interpolation
            const point = new THREE.Vector3().lerpVectors(startPosition, targetPosition, t);

            // Add smooth curve (catenary-like)
            const curve = Math.sin(t * Math.PI) * 100;
            point.y += curve;

            // Add spiral twist
            const spiral = 30 * Math.sin(t * Math.PI * 4);
            const angle = t * Math.PI * 2;
            point.x += spiral * Math.cos(angle);
            point.z += spiral * Math.sin(angle);

            pathPoints.push(point);
        }

        return pathPoints;
    }, [startPosition, targetPosition]);

    // Animated wobble effect
    useFrame((state) => {
        if (!ribbonRef.current || !visible) return;

        const time = state.clock.elapsedTime;

        // Gentle rotation
        ribbonRef.current.rotation.y = Math.sin(time * 0.2) * 0.1;

        // Pulsing scale
        const pulse = 1 + Math.sin(time * 2) * 0.05;
        ribbonRef.current.scale.setScalar(pulse);
    });

    // Update points with real-time wobble
    const animatedPoints = useMemo(() => {
        return points;
    }, [points]);

    if (!visible) return null;

    return (
        <group ref={ribbonRef}>
            {/* Main ribbon line */}
            <Line
                ref={lineRef}
                points={animatedPoints}
                color={color}
                lineWidth={3}
                transparent
                opacity={0.8}
            />

            {/* Glowing outer ribbon */}
            <Line
                points={animatedPoints}
                color={color}
                lineWidth={8}
                transparent
                opacity={0.3}
            />

            {/* Ribbon segments with glow */}
            {animatedPoints.map((point, i) => {
                if (i % 5 !== 0) return null; // Only every 5th point for performance

                return (
                    <mesh key={i} position={point}>
                        <sphereGeometry args={[2, 8, 8]} />
                        <meshBasicMaterial
                            color={color}
                            transparent
                            opacity={0.6}
                        />
                        {/* Glow effect */}
                        <pointLight
                            color={color}
                            intensity={0.5}
                            distance={20}
                            decay={2}
                        />
                    </mesh>
                );
            })}

            {/* Animated particles along ribbon */}
            <RibbonParticles points={animatedPoints} color={color} />
        </group>
    );
};

interface RibbonParticlesProps {
    points: THREE.Vector3[];
    color: string;
}

/**
 * Flowing particles along the ribbon path
 */
const RibbonParticles: React.FC<RibbonParticlesProps> = ({ points, color }) => {
    const particlesRef = useRef<THREE.Group>(null);
    const numParticles = 10;

    useFrame((state) => {
        if (!particlesRef.current) return;

        const time = state.clock.elapsedTime;

        particlesRef.current.children.forEach((particle, i) => {
            // Calculate position along path
            const offset = (time * 0.3 + i / numParticles) % 1;
            const index = Math.floor(offset * (points.length - 1));
            const nextIndex = Math.min(index + 1, points.length - 1);
            const localT = (offset * (points.length - 1)) - index;

            // Interpolate position
            const pos = new THREE.Vector3().lerpVectors(
                points[index],
                points[nextIndex],
                localT
            );

            particle.position.copy(pos);

            // Pulse scale
            const scale = 1 + Math.sin(time * 3 + i) * 0.3;
            particle.scale.setScalar(scale);
        });
    });

    return (
        <group ref={particlesRef}>
            {Array.from({ length: numParticles }).map((_, i) => (
                <mesh key={i}>
                    <sphereGeometry args={[1.5, 8, 8]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.8}
                    />
                </mesh>
            ))}
        </group>
    );
};
