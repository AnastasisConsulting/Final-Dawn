import React, { useRef, useMemo, useEffect, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TrafficUnit, LandingZone, RuralRegion, WeatherType } from '../types';

interface TrafficSystemProps {
    count?: number;
    trafficRef: MutableRefObject<TrafficUnit[]>;
    paused: boolean;
    worldData: { landingZones: (LandingZone & { ruralRegions: RuralRegion[] })[] };
    weather: WeatherType;
}

const TRAFFIC_SPEED_SCALE = 1.0;

export const TrafficSystem: React.FC<TrafficSystemProps> = ({ count = 300, trafficRef, paused, worldData, weather }) => {
    const haulerRef = useRef<THREE.InstancedMesh>(null);
    const speederRef = useRef<THREE.InstancedMesh>(null);
    const droneRef = useRef<THREE.InstancedMesh>(null);
    const roadRef = useRef<THREE.InstancedMesh>(null);

    // Initial Setup of Traffic Data
    useEffect(() => {
        const units: TrafficUnit[] = [];
        const types = ['HAULER', 'SPEEDER', 'DRONE'] as const;
        const regions = worldData.landingZones.flatMap(lz => [lz, ...lz.ruralRegions]);

        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const region = regions[Math.floor(Math.random() * regions.length)];

            const angle = Math.random() * Math.PI * 2;
            const radius = 50 + Math.random() * 400; // Cluster near regions
            const altitude = 50 + Math.random() * 400;

            const startPos = new THREE.Vector3(
                region.position[0] + Math.cos(angle) * radius,
                altitude,
                region.position[2] + Math.sin(angle) * radius
            );

            const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize();
            let speed = 50;
            let scaleVal = 1;

            if (type === 'HAULER') {
                speed = 30 + Math.random() * 20;
                scaleVal = 2 + Math.random() * 1.5;
            } else if (type === 'SPEEDER') {
                speed = 100 + Math.random() * 80;
                scaleVal = 0.8;
            } else {
                speed = 40 + Math.random() * 30;
                scaleVal = 0.4;
            }

            units.push({
                id: i, type, position: startPos,
                velocity: tangent.multiplyScalar(speed * TRAFFIC_SPEED_SCALE),
                active: true, scale: new THREE.Vector3(scaleVal, scaleVal, scaleVal),
                rotationOffset: Math.random() * Math.PI,
                wobbleSpeed: Math.random() * 2,
                regionId: region.id
            });
        }
        trafficRef.current = units;
    }, [count, worldData]);

    useFrame((state, delta) => {
        if (!haulerRef.current || !speederRef.current || !droneRef.current || !roadRef.current) return;
        if (paused) return;

        let hIdx = 0, sIdx = 0, dIdx = 0, rIdx = 0;
        const dummy = new THREE.Object3D();
        const time = state.clock.elapsedTime;
        const units = trafficRef.current;
        const isStorm = weather === 'STORM';

        for (let i = 0; i < units.length; i++) {
            const unit = units[i];
            if (!unit.active) {
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                if (unit.type === 'HAULER') haulerRef.current.setMatrixAt(hIdx++, dummy.matrix);
                else if (unit.type === 'SPEEDER') speederRef.current.setMatrixAt(sIdx++, dummy.matrix);
                else droneRef.current.setMatrixAt(dIdx++, dummy.matrix);
                continue;
            }

            unit.position.add(unit.velocity.clone().multiplyScalar(delta * (isStorm ? 0.5 : 1)));

            // Wobble
            const yOffset = Math.sin(time * unit.wobbleSpeed + unit.rotationOffset) * 2;
            dummy.position.copy(unit.position);
            dummy.position.y += yOffset;
            dummy.lookAt(unit.position.clone().add(unit.velocity));
            dummy.scale.copy(unit.scale);
            dummy.updateMatrix();

            if (unit.type === 'HAULER') haulerRef.current.setMatrixAt(hIdx++, dummy.matrix);
            else if (unit.type === 'SPEEDER') {
                dummy.rotateX(Math.PI / 2);
                dummy.updateMatrix();
                speederRef.current.setMatrixAt(sIdx++, dummy.matrix);
            }
            else droneRef.current.setMatrixAt(dIdx++, dummy.matrix);
        }

        // ROAD TRAFFIC (Simulation of cars between hubs)
        worldData.landingZones.forEach(lz => {
            lz.ruralRegions.forEach((rr, rIdx_local) => {
                const start = new THREE.Vector3(...lz.position);
                const end = new THREE.Vector3(...rr.position);

                // 3 cars per road
                for (let c = 0; c < 3; c++) {
                    const offset = (time * 0.1 + c * 0.33) % 1;
                    dummy.position.lerpVectors(start, end, offset);
                    dummy.position.y += 2; // Above ground
                    dummy.scale.set(1.5, 0.5, 0.5);
                    dummy.lookAt(end);
                    dummy.updateMatrix();
                    roadRef.current!.setMatrixAt(rIdx++, dummy.matrix);
                }
            });
        });

        haulerRef.current.instanceMatrix.needsUpdate = true;
        speederRef.current.instanceMatrix.needsUpdate = true;
        droneRef.current.instanceMatrix.needsUpdate = true;
        roadRef.current.instanceMatrix.needsUpdate = true;
        roadRef.current.count = rIdx;
    });

    return (
        <group>
            <instancedMesh ref={haulerRef} args={[undefined, undefined, count]}>
                <boxGeometry args={[4, 2, 8]} />
                <meshStandardMaterial color="#854d0e" roughness={0.7} />
            </instancedMesh>

            <instancedMesh ref={speederRef} args={[undefined, undefined, count]}>
                <coneGeometry args={[1, 4, 4]} />
                <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.5} />
            </instancedMesh>

            <instancedMesh ref={droneRef} args={[undefined, undefined, count]}>
                <sphereGeometry args={[1.5, 8, 8]} />
                <meshStandardMaterial color="#dc2626" emissive="#991b1b" emissiveIntensity={0.8} />
            </instancedMesh>

            {/* ROAD CARS */}
            <instancedMesh ref={roadRef} args={[undefined, undefined, 100]}>
                <boxGeometry />
                <meshBasicMaterial color="#fbbf24" />
            </instancedMesh>
        </group>
    );
};