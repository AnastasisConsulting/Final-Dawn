/// <reference path="../../three-elements.d.ts" />
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, CatmullRomCurve3, TubeGeometry, Color, AdditiveBlending, DoubleSide, Quaternion, CanvasTexture, RepeatWrapping } from 'three';

interface RibbonGuideProps {
    shipPosition: Vector3;
    targetPosition: Vector3;
    active: boolean;
}

export const RibbonGuide: React.FC<RibbonGuideProps> = ({ shipPosition, targetPosition, active }) => {
    const matRef = useRef<any>(null);
    const glowMatRef = useRef<any>(null);

    const points = useMemo(() => {
        // Generate a smooth curve from ship to target
        const p1 = shipPosition.clone();
        const p4 = targetPosition.clone();

        // Adjust control points based on distance
        const dist = p1.distanceTo(p4);
        const p2 = p1.clone().add(new Vector3(0, -dist * 0.2, 0).applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), p4.clone().sub(p1).normalize())));
        const p3 = p4.clone().add(new Vector3(0, dist * 0.2, 0));

        return [p1, p2, p3, p4];
    }, [shipPosition, targetPosition]);

    const curve = useMemo(() => new CatmullRomCurve3(points), [points]);

    useFrame((state) => {
        if (matRef.current) {
            matRef.current.map.offset.x = -state.clock.elapsedTime * 0.5;
        }
    });

    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const grad = ctx.createLinearGradient(0, 0, 64, 0);
            grad.addColorStop(0, 'rgba(14, 165, 233, 0)');
            grad.addColorStop(0.5, 'rgba(14, 165, 233, 1)');
            grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 64, 64);
        }
        const tex = new CanvasTexture(canvas);
        tex.wrapS = RepeatWrapping;
        return tex;
    }, []);

    return active ? (
        <group>
            <mesh>
                <tubeGeometry args={[curve, 64, 0.8, 8, false]} />
                <meshBasicMaterial
                    ref={matRef}
                    map={texture}
                    transparent
                    opacity={0.6}
                    blending={AdditiveBlending}
                    side={DoubleSide}
                    depthWrite={false}
                />
            </mesh>
            <mesh>
                <tubeGeometry args={[curve, 64, 2.0, 8, false]} />
                <meshBasicMaterial
                    transparent
                    opacity={0.1}
                    color="#0ea5e9"
                    blending={AdditiveBlending}
                    side={DoubleSide}
                    depthWrite={false}
                />
            </mesh>
        </group>
    ) : null;
};
