/**
 * Waypoint Navigation System
 * Creates visual markers and guidance for navigation
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, Sphere } from '@react-three/drei';

interface WaypointProps {
    position: THREE.Vector3;
    label: string;
    color?: string;
    size?: number;
    distance: number;
}

/**
 * Waypoint Marker - Visual indicator in 3D space
 */
export const WaypointMarker: React.FC<WaypointProps> = ({
    position,
    label,
    color = '#00ff00',
    size = 20,
    distance,
}) => {
    const markerRef = useRef<THREE.Group>(null);

    useFrame(({ camera }) => {
        if (!markerRef.current) return;
        // Billboard effect - always face camera
        markerRef.current.quaternion.copy(camera.quaternion);
    });

    return (
        <group ref={markerRef} position={position}>
            {/* Pulsing sphere */}
            <Sphere args={[size, 16, 16]}>
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.6}
                    wireframe
                />
            </Sphere>

            {/* Label */}
            <Html distanceFactor={100} center>
                <div className="bg-black/80 text-white px-2 py-1 rounded text-sm whitespace-nowrap border border-green-500">
                    <div className="font-bold">{label}</div>
                    <div className="text-xs text-gray-400">{Math.round(distance)}m</div>
                </div>
            </Html>

            {/* Vertical beam */}
            <mesh>
                <cylinderGeometry args={[size / 4, size / 4, 1000, 8]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.3}
                />
            </mesh>
        </group>
    );
};

interface NavigationArrowProps {
    targetDirection: THREE.Vector3;
    distance: number;
}

/**
 * HUD Navigation Arrow - Points to target in screen space
 */
export const NavigationArrow: React.FC<NavigationArrowProps> = ({
    targetDirection,
    distance,
}) => {
    // Calculate arrow position on screen edge
    const screenPos = targetDirection.clone().normalize();
    const angle = Math.atan2(screenPos.y, screenPos.x);

    return (
        <Html fullscreen>
            <div className="absolute inset-0 pointer-events-none">
                {/* Arrow pointing to target */}
                <div
                    className="absolute"
                    style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(200px)`,
                    }}
                >
                    <div className="relative">
                        {/* Arrow icon */}
                        <div className="text-green-500 text-4xl">▶</div>
                        {/* Distance */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 px-2 py-1 rounded whitespace-nowrap">
                            {distance < 1000
                                ? `${Math.round(distance)}m`
                                : `${(distance / 1000).toFixed(1)}km`}
                        </div>
                    </div>
                </div>
            </div>
        </Html>
    );
};

interface LandingPadIndicatorProps {
    position: THREE.Vector3;
    designation: string;
    available: boolean;
    distance: number;
}

/**
 * Landing Pad Indicator - Special marker for landing pads
 */
export const LandingPadIndicator: React.FC<LandingPadIndicatorProps> = ({
    position,
    designation,
    available,
    distance,
}) => {
    const markerRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!markerRef.current) return;
        // Rotate landing pad marker
        markerRef.current.rotation.y += 0.01;
        // Pulse scale
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        markerRef.current.scale.setScalar(scale);
    });

    const color = available ? '#00ff00' : '#ff0000';

    return (
        <group position={position}>
            <group ref={markerRef}>
                {/* Landing pad circle */}
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[45, 50, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.8} />
                </mesh>

                {/* Cross marker */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
                    <boxGeometry args={[60, 2, 2]} />
                    <meshBasicMaterial color={color} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
                    <boxGeometry args={[2, 2, 60]} />
                    <meshBasicMaterial color={color} />
                </mesh>
            </group>

            {/* Label */}
            <Html distanceFactor={50} center position={[0, 30, 0]}>
                <div
                    className={`px-3 py-2 rounded text-sm font-bold border-2 ${available
                            ? 'bg-green-900/90 text-green-200 border-green-500'
                            : 'bg-red-900/90 text-red-200 border-red-500'
                        }`}
                >
                    <div className="text-lg">{designation}</div>
                    <div className="text-xs">
                        {available ? 'AVAILABLE' : 'OCCUPIED'} • {Math.round(distance)}m
                    </div>
                </div>
            </Html>

            {/* Vertical beam */}
            <mesh>
                <cylinderGeometry args={[5, 5, 500, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} />
            </mesh>
        </group>
    );
};
