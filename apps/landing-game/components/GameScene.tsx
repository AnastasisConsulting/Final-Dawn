import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, CatmullRomCurve3, MathUtils, MeshBasicMaterial, AdditiveBlending, DoubleSide } from 'three';
import { SpaceFighter } from './SpaceFighter';
import { Environment } from './Environment';
import { Projectile, FlightStatus, WeaponType } from '../types';
import { playLaserSound, playImpactSound } from '../utils/audio';
import { Sparkles, Float, Trail } from '@react-three/drei';
import * as THREE from 'three';

const PLANET_CENTER = new Vector3(0, -8500, 0);
const PLANET_RADIUS = 8000;

// Re-entry Plasma Effect
const PlasmaEffect = ({ active, speed }: { active: boolean, speed: number }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.visible = active;
            if (active) {
                ref.current.rotation.z += delta * 15;
                const scale = 1.0 + Math.sin(state.clock.elapsedTime * 20) * 0.1;
                ref.current.scale.setScalar(scale);
            }
        }
    });

    return (
        <group ref={ref}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[12, 40, 32, 1, true]} />
                <meshBasicMaterial
                    color="#f97316"
                    transparent
                    opacity={0.4}
                    blending={AdditiveBlending}
                    side={DoubleSide}
                />
            </mesh>
            <Sparkles count={50} scale={[15, 40, 15]} color="#fde047" size={10} speed={4} />
        </group>
    );
};

// Advanced Enemy Interceptor for Atmospheric Dogfighting
const Interceptor = ({ id, startPos, target, targetVel, onHit, onDestroy }: {
    id: string,
    startPos: Vector3,
    target: Vector3,
    targetVel: Vector3,
    onHit: () => void,
    onDestroy: (id: string) => void
}) => {
    const ref = useRef<THREE.Group>(null);
    const health = useRef(30);
    const velocityAI = useRef(new Vector3(0, 0, 50));
    const nextFire = useRef(0);
    const [isExploding, setIsExploding] = useState(false);

    useFrame((state, delta) => {
        if (!ref.current || isExploding) return;
        const time = state.clock.getElapsedTime();

        // 1. AI BEHAVIOR: Pursuit with Shot Leading
        const toTarget = target.clone().sub(ref.current.position);
        const distance = toTarget.length();

        // Lead the shot: Aim where the player is going
        const projectileSpeed = 1500;
        const leadTime = distance / projectileSpeed;
        const leadPos = target.clone().add(targetVel.clone().multiplyScalar(leadTime));
        const leadDir = leadPos.clone().sub(ref.current.position).normalize();

        // 2. Flight Physics (Agile Pursuit)
        const targetQuat = new Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), leadDir);
        ref.current.quaternion.slerp(targetQuat, delta * 2.5);

        // Constant forward thrust
        velocityAI.current.z = MathUtils.lerp(velocityAI.current.z, 400, delta);
        ref.current.translateZ(-velocityAI.current.z * delta);

        // 3. Combat Logic
        if (time > nextFire.current && distance < 3500) {
            nextFire.current = time + 1.2 + Math.random();
            // In a real app we'd emit a projectile, but here we'll just check accuracy for simplicity
            const accuracy = leadDir.dot(new Vector3(0, 0, -1).applyQuaternion(ref.current.quaternion));
            if (accuracy > 0.99) onHit();
        }

        // 4. Evasive Maneuvers (Occasional Barrel Rolls)
        if (Math.sin(time * 0.5) > 0.98) {
            ref.current.rotateZ(delta * Math.PI * 4);
        }
    });

    if (isExploding) {
        return (
            <group position={startPos}>
                <Sparkles count={150} scale={40} color="#f97316" size={20} speed={4} />
            </group>
        );
    }

    return (
        <group ref={ref} position={startPos}>
            {/* Scavenger Interceptor Model Skinned for Dogfighting */}
            <mesh scale={[3, 3, 3]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[2, 10, 4]} />
                <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 4]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1, 3, 2]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={5} />
            </mesh>
            {/* Engine Glow */}
            <pointLight position={[0, 0, 6]} color="#f97316" intensity={200} distance={100} />
        </group>
    );
};

// Simple Bullet
const BulletMesh: React.FC<{ position: Vector3, type: WeaponType }> = ({ position, type }) => (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 8, 8]} />
        <meshBasicMaterial color={type === 'laser' ? '#ef4444' : '#fbbf24'} blending={AdditiveBlending} />
    </mesh>
);

export const GameScene: React.FC<{
    onUpdateHUD: (data: any) => void;
    onGameOver: (score: number) => void;
    isGameActive: boolean;
    worldId: string;
}> = ({ onUpdateHUD, onGameOver, isGameActive, worldId }) => {
    const [projectiles, setProjectiles] = useState<Projectile[]>([]);
    const [enemies, setEnemies] = useState<{ id: string, pos: Vector3 }[]>([]);

    const [status, setStatus] = useState<FlightStatus>({
        speed: 0, altitude: 0, heading: 0, position: [0, 8000, 0],
        flightAssist: true, weaponLevel: 1, shieldActive: true, wave: 0, distanceToTarget: 0
    });

    const [health, setHealth] = useState(100);
    const score = useRef(0);

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
        const curveSteps = 200;
        const startRadius = startRel.length();
        const endRadius = endRel.length();
        const startDir = startRel.clone().normalize();
        const endDir = endRel.clone().normalize();

        let orbitAxis = new Vector3().crossVectors(startDir, endDir).normalize();
        if (orbitAxis.length() < 0.1) orbitAxis = new Vector3(0, 1, 0);

        const orbits = 3.0;
        const totalRotation = Math.PI * 2 * orbits;

        for (let i = 0; i <= curveSteps; i++) {
            const t = i / curveSteps;
            const r = MathUtils.lerp(startRadius, endRadius, Math.pow(t, 1.5));
            const baseDir = new Vector3().copy(startDir).applyAxisAngle(orbitAxis, t * totalRotation);
            const finalDir = new Vector3().copy(baseDir).lerp(endDir, Math.pow(t, 2));
            points.push(finalDir.normalize().multiplyScalar(r).add(PLANET_CENTER));
        }

        const curve = new CatmullRomCurve3(points);
        setRibbonPoints(curve.getPoints(400));

        // Spawn some initial enemies
        const newEnemies = [];
        for (let i = 0; i < 8; i++) {
            newEnemies.push({
                id: Math.random().toString(),
                pos: playerPos.current.clone().add(new Vector3((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, -3000 - i * 1000))
            });
        }
        setEnemies(newEnemies);

    }, []);

    const [landingState, setLandingState] = useState<'FLYING' | 'LANDING' | 'DOCKED'>('FLYING');
    const cameraOrbitAngle = useRef(0);
    const velocity = useRef(new Vector3(0, 0, 0)); // Tracked for AI leading

    const handleFire = (pos: Vector3, quat: Quaternion, type: WeaponType, vel: Vector3) => {
        if (landingState !== 'FLYING') return;
        playLaserSound();
        const speed = type === 'laser' ? 2000 : 1200;
        const bulletVel = new Vector3(0, 0, -1).applyQuaternion(quat).multiplyScalar(speed).add(vel);
        setProjectiles(prev => [...prev, {
            id: Math.random().toString(),
            position: pos,
            quaternion: quat,
            velocity: bulletVel,
            type,
            ttl: 4.0,
            owner: 'player'
        }]);
    };

    const handlePlayerHit = () => {
        setHealth(prev => {
            const next = prev - 8;
            if (next <= 0) onGameOver(score.current);
            return next;
        });
        playImpactSound();
    };

    useFrame((state, delta) => {
        if (!isGameActive) return;
        const pPos = new Vector3(...status.position);
        playerPos.current.copy(pPos);

        // Update velocity for AI leading (approximate from status change)
        const v = new Vector3().copy(pPos).sub(new Vector3(state.camera.position.x, state.camera.position.y - 10, state.camera.position.z + 38)).multiplyScalar(1 / delta); // This is crude, better used from SpaceFighter directly
        velocity.current.lerp(new Vector3(0, 0, status.speed * 0.1), delta * 5); // Approximate

        let distToTarget = 0;
        if (landingTarget) {
            distToTarget = playerPos.current.distanceTo(landingTarget);
        }

        // GTA-STYLE EVASION MECHANIC
        // Cannot land if enemies are within 2500 units (Search radius)
        const nearbyEnemies = enemies.filter(e => e.pos.distanceTo(playerPos.current) < 2500);
        const enemiesNearby = nearbyEnemies.length > 0;
        const isReentering = status.altitude < 2000 && status.speed > 400 && landingState === 'FLYING';

        // Detect Landing Initialization (Only if evaded)
        if (landingState === 'FLYING' && distToTarget < 600 && status.speed < 250) {
            if (!enemiesNearby) {
                setLandingState('LANDING');
            }
        }

        // Detect Final Docking
        if (landingState === 'LANDING' && distToTarget < 15) {
            setLandingState('DOCKED');
            score.current += 5000;
            setTimeout(() => onGameOver(score.current), 6000);
        }

        // Camera Orbit logic for DOCKED state
        if (landingState === 'DOCKED') {
            cameraOrbitAngle.current += delta * 0.5;
            const radius = 120;
            const x = Math.sin(cameraOrbitAngle.current) * radius;
            const z = Math.cos(cameraOrbitAngle.current) * radius;
            state.camera.position.set(x + status.position[0], status.position[1] + 50, z + status.position[2]);
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
            score: score.current,
            health: health,
            wave: status.wave,
            targetLocked: false,
            distanceToTarget: Math.round(distToTarget),
            activeTargets: enemies.length,
            landingGear: status.landingGear,
            landingState: landingState,
            isReentering: isReentering,
            isEvading: enemiesNearby // Used for GTA-style "Wanted" flash
        });
    });

    // World rotation/skin logic
    const worldType = useMemo(() => {
        const types: ('EARTH' | 'MOON' | 'CITY')[] = ['EARTH', 'MOON', 'CITY'];
        return types[status.wave % types.length];
    }, [status.wave]);

    // AI Updates: Projectile vs Enemy Collision
    useFrame((state, delta) => {
        if (!isGameActive) return;

        // Collision Check: Projectiles vs Enemies
        setEnemies(prevEnemies => {
            const hitEnemies = new Set<string>();
            projectiles.forEach(p => {
                if (p.owner === 'player') {
                    prevEnemies.forEach(e => {
                        if (p.position.distanceTo(e.pos) < 60) {
                            hitEnemies.add(e.id);
                            score.current += 100;
                        }
                    });
                }
            });

            if (hitEnemies.size > 0) {
                return prevEnemies.filter(e => !hitEnemies.has(e.id));
            }
            return prevEnemies;
        });
    });

    const handleDestroyEnemy = (id: string) => {
        setEnemies(prev => prev.filter(e => e.id !== id));
    };

    return (
        <>
            <Environment
                landingTarget={landingTarget}
                playerStart={playerPos.current}
                pathPoints={ribbonPoints}
                worldId={worldId}
                type={worldType}
            />

            <group position={status.position}>
                <PlasmaEffect active={status.altitude < 1800 && status.speed > 450} speed={status.speed} />
            </group>

            <SpaceFighter
                status={status}
                onUpdateStatus={setStatus}
                onFire={handleFire}
                navTarget={landingTarget || null}
                autopilot={landingState === 'LANDING'}
                onAutopilotDisengage={() => { }}
                activeSystem={{ id: 'Sector-1' }}
                playerHealth={health}
                cinematicMode={{ active: landingState !== 'FLYING' }}
                onChaff={() => { }}
                targetingStatus={{ locked: false, missileTracking: false }}
                activeTargets={[]}
            />

            {enemies.map(e => (
                <Interceptor
                    key={e.id}
                    id={e.id}
                    startPos={e.pos}
                    target={playerPos.current}
                    targetVel={velocity.current}
                    onHit={handlePlayerHit}
                    onDestroy={handleDestroyEnemy}
                />
            ))}

            {projectiles.map(p => <BulletMesh key={p.id} position={p.position} type={p.type} />)}
        </>
    );
};