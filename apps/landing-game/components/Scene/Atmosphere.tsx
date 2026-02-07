import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cloud, CatmullRomLine } from '@react-three/drei';
import { Vector3, CatmullRomCurve3, Color } from 'three';
import { useGameStore } from '../../store';

const GuideRibbon: React.FC = () => {
    const { landingPadPosition } = useGameStore();
    const [tx, ty, tz] = landingPadPosition;

    // Create a curve from spawn (0, 2500, 0) to landing pad
    const points = useMemo(() => {
        return [
            new Vector3(0, 2500, 0),        // Start
            new Vector3(tx * 0.2, 2000, tz * 0.2), 
            new Vector3(tx * 0.5, 1200, tz * 0.5), // Mid-flight
            new Vector3(tx * 0.8, 400, tz * 0.8),  // Approach
            new Vector3(tx, 50, tz)           // Target (slightly above pad)
        ];
    }, [tx, ty, tz]);

    return (
        <group>
            <CatmullRomLine 
                points={points} 
                closed={false} 
                curveType="centripetal" 
                tension={0.5} 
                lineWidth={3} 
                color="#0ea5e9" 
                transparent
                opacity={0.4}
                segments={100}
            />
            {/* Guide Rings along the path */}
            {points.map((p, i) => i > 0 && (
                <mesh key={i} position={p} rotation={[Math.PI/2, 0, 0]}>
                    <ringGeometry args={[40, 45, 32]} />
                    <meshBasicMaterial color="#0ea5e9" opacity={0.3} transparent side={2} />
                </mesh>
            ))}
        </group>
    );
};

export const Atmosphere: React.FC = () => {
    return (
        <group>
            <GuideRibbon />
            
            {/* Upper Atmosphere Clouds (Entry Phase) */}
            <group position={[500, 1600, -500]}>
                <Cloud opacity={0.5} speed={0.4} width={500} depth={100} segments={20} color="#fb923c" />
            </group>
            <group position={[-500, 1400, -1000]}>
                <Cloud opacity={0.4} speed={0.3} width={500} depth={100} segments={20} color="#fb923c" />
            </group>

            {/* Dense Lower Cloud Deck (Flight Phase) */}
            <group position={[800, 800, -1500]}>
                <Cloud opacity={0.8} speed={0.8} width={1000} depth={200} segments={40} color="#e2e8f0" />
            </group>
            <group position={[-200, 700, -800]}>
                <Cloud opacity={0.7} speed={0.6} width={800} depth={200} segments={30} color="#cbd5e1" />
            </group>
            <group position={[1200, 600, -2200]}>
                <Cloud opacity={0.8} speed={0.9} width={1200} depth={300} segments={40} color="#94a3b8" />
            </group>
        </group>
    );
};