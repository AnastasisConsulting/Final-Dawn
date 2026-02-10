import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, CatmullRomCurve3, MathUtils } from 'three';
import { Aircraft } from './Aircraft';
import { Environment } from './Environment';
import { Projectile, FlightStatus, WeaponType } from '../types';
import { playLaserSound } from '../utils/audio';

const PLANET_CENTER = new Vector3(0, -8500, 0);
const PLANET_RADIUS = 8000;

// Simple Bullet
const BulletMesh: React.FC<{ position: Vector3, type: WeaponType }> = ({ position, type }) => (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 4, 8]} />
        <meshBasicMaterial color={type === 'laser' ? '#ef4444' : '#fbbf24'} />
    </mesh>
);

export const GameScene: React.FC<{
    onUpdateHUD: (data: any) => void;
    onGameOver: (score: number) => void;
    isGameActive: boolean;
    worldId: string;
}> = ({ onUpdateHUD, onGameOver, isGameActive, worldId }) => {
    const [projectiles, setProjectiles] = useState<Projectile[]>([]);

    const [status, setStatus] = useState<FlightStatus>({
        speed: 0, altitude: 0, heading: 0, position: [0, 0, 0],
        flightAssist: true, weaponLevel: 1, shieldActive: true, distanceToTarget: 0
    });

    const health = useRef(100);

    // START POSITION: High Orbit
    const playerPos = useRef(new Vector3(0, 3000, 4000));
    const [landingTarget, setLandingTarget] = useState<Vector3 | undefined>(undefined);
    const [ribbonPoints, setRibbonPoints] = useState<Vector3[]>([]);

    useEffect(() => {
        // Generate Landing Target
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);

        const x = PLANET_RADIUS * Math.sin(phi) * Math.cos(theta);
        const z = PLANET_RADIUS * Math.sin(phi) * Math.sin(theta);
        const y = PLANET_RADIUS * Math.cos(phi);

        const targetPos = new Vector3(x, y, z).add(PLANET_CENTER);
        setLandingTarget(targetPos);

        // Generate Path
        const startRel = playerPos.current.clone().sub(PLANET_CENTER);
        const endRel = targetPos.clone().sub(PLANET_CENTER);

        const points: Vector3[] = [];
        const curveSteps = 150; // More steps for longer path
        const startRadius = startRel.length();
        const endRadius = endRel.length();
        const startDir = startRel.clone().normalize();
        const endDir = endRel.clone().normalize();

        // Calculate an orbital axis perpendicular to start and end
        let orbitAxis = new Vector3().crossVectors(startDir, endDir).normalize();
        if (orbitAxis.length() < 0.1) orbitAxis = new Vector3(0, 1, 0); // Fallback if nearly collinear

        const orbits = 2.5; // Full 2.5 orbits
        const totalRotation = Math.PI * 2 * orbits;

        for (let i = 0; i <= curveSteps; i++) {
            const t = i / curveSteps;

            // Stay at high orbit for longer, then descend more steeply at the end
            const r = MathUtils.lerp(startRadius, endRadius, Math.pow(t, 2));

            // Orbit around the generated axis
            const baseDir = new Vector3().copy(startDir).applyAxisAngle(orbitAxis, t * totalRotation);

            // Gradually blend towards the final target direction
            const finalDir = new Vector3().copy(baseDir).lerp(endDir, Math.pow(t, 3));
            points.push(finalDir.normalize().multiplyScalar(r).add(PLANET_CENTER));
        }

        const curve = new CatmullRomCurve3(points);
        setRibbonPoints(curve.getPoints(300));

    }, []);

    const [landingState, setLandingState] = useState<'FLYING' | 'LANDING' | 'DOCKED'>('FLYING');
    const cameraOrbitAngle = useRef(0);

    const handleFire = (pos: Vector3, quat: Quaternion, type: WeaponType, vel: Vector3) => {
        if (landingState !== 'FLYING') return; // Disable shooting during landing
        playLaserSound();
        const speed = type === 'laser' ? 600 : 400;
        const bulletVel = new Vector3(0, 0, -1).applyQuaternion(quat).multiplyScalar(speed).add(vel);
        setProjectiles(prev => [...prev, {
            id: Math.random().toString(),
            position: pos,
            quaternion: quat,
            velocity: bulletVel,
            type,
            ttl: 3.0,
            owner: 'player'
        }]);
    };

    useFrame((state, delta) => {
        if (!isGameActive) return;
        playerPos.current.set(...status.position);

        let distToTarget = 0;
        if (landingTarget) {
            distToTarget = playerPos.current.distanceTo(landingTarget);
        }

        // Detect Landing Initialization
        if (landingState === 'FLYING' && distToTarget < 400 && status.speed < 200) {
            setLandingState('LANDING');
        }

        // Detect Final Docking
        if (landingState === 'LANDING' && distToTarget < 5 && status.speed < 10) {
            setLandingState('DOCKED');
        }

        // Camera Orbit logic for DOCKED state
        if (landingState === 'DOCKED' && cameraOrbitAngle.current < Math.PI * 2) {
            cameraOrbitAngle.current += delta * 0.5; // Slow orbit
            const radius = 60;
            const x = Math.sin(cameraOrbitAngle.current) * radius;
            const z = Math.cos(cameraOrbitAngle.current) * radius;
            state.camera.position.set(x + status.position[0], status.position[1] + 20, z + status.position[2]);
            state.camera.lookAt(status.position[0], status.position[1], status.position[2]);
        }

        // Projectiles Update
        setProjectiles(prev => prev.map(p => ({
            ...p,
            position: p.position.clone().add(p.velocity.clone().multiplyScalar(delta)),
            ttl: p.ttl - delta
        })).filter(p => p.ttl > 0));

        // HUD Update
        onUpdateHUD({
            score: 0,
            health: health.current,
            wave: 1,
            targetLocked: false,
            distanceToTarget: Math.round(distToTarget),
            activeTargets: [],
            landingGear: status.landingGear,
            landingState: landingState
        });
    });

    return (
        <>
            <Environment
                landingTarget={landingTarget}
                playerStart={playerPos.current}
                pathPoints={ribbonPoints}
                worldId={worldId}
            />
            <Aircraft
                status={status}
                onUpdateStatus={setStatus}
                onFire={handleFire}
                navTarget={landingTarget || null}
                autopilot={landingState === 'LANDING'}
                onAutopilotDisengage={() => { }}
                activeSystem={{ id: 'Sector-1' }}
                playerHealth={health.current}
                cinematicMode={{ active: landingState !== 'FLYING' }}
                onChaff={() => { }}
                targetingStatus={{ locked: false, missileTracking: false }}
                activeTargets={[]}
            />
            {projectiles.map(p => <BulletMesh key={p.id} position={p.position} type={p.type} />)}
        </>
    );
};