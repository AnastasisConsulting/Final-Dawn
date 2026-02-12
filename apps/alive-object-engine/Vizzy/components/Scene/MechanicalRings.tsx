/// <reference path="../../three-elements.d.ts" />
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RingConfig, Transform, Vector3 } from '../../types';

interface ComplexRingProps {
    name: string;
    radius: number;
    thickness: number;
    segments: number;
    axis: 'x' | 'y' | 'z';
    speed: Vector3;
    config: RingConfig;
    offset: number;
    transform: Transform;
}

const ComplexRing = ({ name, radius, thickness, segments, axis, speed, config, offset, transform }: ComplexRingProps) => {
    const mainGroup = useRef<THREE.Group>(null);
    const innerTrack = useRef<THREE.Mesh>(null);
    const outerRail = useRef<THREE.Group>(null);
    const pistonsRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!mainGroup.current) return;
        const t = state.clock.getElapsedTime();

        // Calculate rotation based on speed vector and initial axis offset
        const initialX = axis === 'x' ? offset : 0;
        const initialY = axis === 'y' ? offset : 0;
        const initialZ = axis === 'z' ? offset : 0;

        mainGroup.current.rotation.x = initialX + t * speed.x;
        mainGroup.current.rotation.y = initialY + t * speed.y;
        mainGroup.current.rotation.z = initialZ + t * speed.z;

        // Internal mechanics animation
        if (innerTrack.current) {
            innerTrack.current.rotation.z = -t * 4;
            // ========================================================================
            // VIZZY PROTECTED BLOCK: The "Purplish Strobe" Effect
            // DO NOT ALTER THIS LOGIC. IT CREATES THE STROBE USER LOVES.
            // ========================================================================
            const blink = Math.sin(t * 15) > 0.8 ? 2.5 : 1.0;
            (innerTrack.current.material as THREE.MeshStandardMaterial).emissiveIntensity = config.emissiveIntensity !== undefined ? config.emissiveIntensity * blink : 1.5 * blink;
            // ========================================================================
        }

        if (outerRail.current) outerRail.current.rotation.z = t * 1.5;
        if (pistonsRef.current) {
            pistonsRef.current.children.forEach((child, i) => {
                const shift = Math.sin(t * 12 + i) * (thickness * 0.8);
                child.position.z = shift * 0.15;
                child.scale.set(1, 1, 1 + Math.sin(t * 20 + i) * 0.2);
            });
        }
    });

    const pistonCount = 12;

    return (
        <group
            name={name}
            position={[transform.position.x, transform.position.y, transform.position.z]}
            rotation={[transform.rotation.x, transform.rotation.y, transform.rotation.z]}
            scale={[transform.scale.x, transform.scale.y, transform.scale.z]}
        >
            {/* The spinning group is nested so manual transform moves the pivot */}
            <group ref={mainGroup}>
                <mesh>
                    <torusGeometry args={[radius, thickness, 16, segments]} />
                    <meshStandardMaterial color={config.color} metalness={0.8} roughness={0.4} flatShading />
                </mesh>
                <mesh ref={innerTrack} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[radius - thickness * 1.5, thickness * 0.4, 8, segments]} />
                    {/* VIZZY PROTECTED: Inner Ring Material (The "Thin Rings" user likes) */}
                    <meshStandardMaterial color={config.emissive} emissive={config.emissive} emissiveIntensity={1.5} wireframe={config.wireframe} />
                </mesh>
                <group ref={outerRail}>
                    <mesh>
                        <torusGeometry args={[radius + thickness * 1.8, thickness * 0.2, 4, segments / 2]} />
                        <meshStandardMaterial color="#444" metalness={1} roughness={0.2} wireframe />
                    </mesh>
                </group>
                <group ref={pistonsRef}>
                    {Array.from({ length: pistonCount }).map((_, i) => {
                        const angle = (i / pistonCount) * Math.PI * 2;
                        return (
                            <group key={i} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]} rotation={[0, 0, angle]}>
                                <mesh position={[0, thickness * 1.2, 0]}>
                                    <boxGeometry args={[thickness * 1.5, thickness, thickness * 2]} />
                                    <meshStandardMaterial color={config.emissive} metalness={0.9} roughness={0.1} />
                                </mesh>
                                <mesh position={[0, -thickness * 0.5, 0]}>
                                    <cylinderGeometry args={[thickness * 0.3, thickness * 0.3, thickness * 3, 8]} />
                                    <meshStandardMaterial color="#222" metalness={1} />
                                </mesh>
                            </group>
                        );
                    })}
                </group>
            </group>
        </group>
    );
};

export const MechanicalRings: React.FC<{ config: RingConfig, transforms: { ring1: Transform, ring2: Transform, ring3: Transform } }> = ({ config, transforms }) => {
    return (
        <group>
            <ComplexRing name="ring1" radius={config.baseRadius} thickness={config.tubeThickness} segments={config.segments} axis="x" speed={config.ring1Speed} config={config} offset={0} transform={transforms.ring1} />
            <ComplexRing name="ring2" radius={config.baseRadius * 1.4} thickness={config.tubeThickness * 1.2} segments={config.segments} axis="y" speed={config.ring2Speed} config={config} offset={2} transform={transforms.ring2} />
            <ComplexRing name="ring3" radius={config.baseRadius * 1.8} thickness={config.tubeThickness} segments={config.segments} axis="z" speed={config.ring3Speed} config={config} offset={4} transform={transforms.ring3} />
        </group>
    );
};