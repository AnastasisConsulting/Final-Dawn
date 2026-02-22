import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const STELLAR_COLORS = [
    '#aabfff', // Deep Blue-White
    '#cad7ff', // Blue-White
    '#f8f7ff', // White
    '#fff4ea', // Yellow-White
    '#ffd2a1', // Pale Orange
    '#ffcc6f', // Orange-Red
];

/**
 * Procedurally generates a very subtle, high-precision radial flare texture.
 * Avoids edge-to-edge lines to prevent visual artifacts.
 */
const createFlareTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw radial gradient - sharp center with soft glow
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.02, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.08, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    // Tiny micro-spikes (only in the very center)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(96, 128);
    ctx.lineTo(160, 128);
    ctx.moveTo(128, 96);
    ctx.lineTo(128, 160);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
};

interface RealisticStarFieldProps {
    count?: number;
    radius?: number;
    clusters?: number;
}

export const RealisticStarField: React.FC<RealisticStarFieldProps> = ({
    count = 12000,
    radius = 15000,
    clusters = 20 // Fewer, larger clusters
}) => {
    const pointsRef = useRef<THREE.Points>(null);

    const [positions, colors, sizes, lensingData] = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const lensingPos: number[] = [];
        const lensingColor: number[] = [];
        const lensingSize: number[] = [];

        // Random Galactic Orientation
        const rotationAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
        const rotationAngle = Math.random() * Math.PI;
        const q = new THREE.Quaternion().setFromAxisAngle(rotationAxis, rotationAngle);

        for (let i = 0; i < count; i++) {
            let vec = new THREE.Vector3();

            // 40% in a Galactic Plane (disk)
            // 50% in sparse sphere
            // 10% in clusters
            const roll = Math.random();
            if (roll < 0.45) {
                // Disk distribution (Galactic Plane)
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * radius * 1.8;
                const thickness = (Math.random() - 0.5) * radius * 0.12;
                vec.set(Math.cos(angle) * dist, thickness, Math.sin(angle) * dist);
                // Rotate to random inclination
                vec.applyQuaternion(q);
            } else if (roll < 0.95) {
                // Uniform Sphere
                const angle1 = Math.random() * Math.PI * 2;
                const angle2 = Math.acos(2 * Math.random() - 1);
                const r = radius * (0.8 + Math.random() * 0.4);
                vec.set(
                    r * Math.sin(angle2) * Math.cos(angle1),
                    r * Math.sin(angle2) * Math.sin(angle1),
                    r * Math.cos(angle2)
                );
            } else {
                // Small random clusters
                const clusterCenter = new THREE.Vector3(
                    (Math.random() - 0.5) * radius * 2,
                    (Math.random() - 0.5) * radius * 2,
                    (Math.random() - 0.5) * radius * 2
                );
                const spread = Math.random() * 800 + 400;
                vec.set(
                    clusterCenter.x + (Math.random() - 0.5) * spread,
                    clusterCenter.y + (Math.random() - 0.5) * spread,
                    clusterCenter.z + (Math.random() - 0.5) * spread
                );
            }

            positions[i * 3] = vec.x;
            positions[i * 3 + 1] = vec.y;
            positions[i * 3 + 2] = vec.z;

            // Enforce sharp points
            sizes[i] = 1.0;

            const colorIdx = Math.floor(Math.random() * STELLAR_COLORS.length);
            const color = new THREE.Color(STELLAR_COLORS[colorIdx]);

            // Desaturate slightly for realism
            color.lerp(new THREE.Color('#ffffff'), 0.3);

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // Brightness factor for lensing subset
            const brightnessRoll = Math.random();
            if (brightnessRoll > 0.998) {
                lensingPos.push(vec.x, vec.y, vec.z);
                lensingColor.push(color.r, color.g, color.b);
                lensingSize.push(6 + Math.random() * 8); // Visible but not overwhelming
            }
        }

        return [
            positions, colors, sizes,
            {
                pos: new Float32Array(lensingPos),
                color: new Float32Array(lensingColor),
                size: new Float32Array(lensingSize),
                count: lensingSize.length
            }
        ];
    }, [count, radius]);

    const flareTexture = useMemo(() => createFlareTexture(), []);
    const lensingRef = useRef<THREE.Points>(null);

    useFrame((state) => {
        if (pointsRef.current) pointsRef.current.position.copy(state.camera.position);
        if (lensingRef.current) lensingRef.current.position.copy(state.camera.position);
    });

    return (
        <group>
            {/* Standard Star Field - Sharp 1px points */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
                    <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
                </bufferGeometry>
                <pointsMaterial
                    size={0.8}
                    vertexColors
                    transparent
                    sizeAttenuation={false}
                    opacity={0.7}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>

            {/* Lensing Stars - Subtle markers for distant giants */}
            <points ref={lensingRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={lensingData.count} array={lensingData.pos} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={lensingData.count} array={lensingData.color} itemSize={3} />
                    <bufferAttribute attach="attributes-size" count={lensingData.count} array={lensingData.size} itemSize={1} />
                </bufferGeometry>
                <pointsMaterial
                    map={flareTexture}
                    size={1}
                    sizeAttenuation={true}
                    vertexColors
                    transparent
                    opacity={0.4}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>
        </group>
    );
};
