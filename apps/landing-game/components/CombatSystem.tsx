import React, { useRef, useState, useEffect, MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, TextureLoader, Texture, Color, Matrix4 } from 'three';
import { Html, Sparkles, Trail, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Projectile, Target, WeaponType, Pickup, PickupType, TargetTier, CinematicState, EnemyType, TrafficUnit } from '../types';
import { playLaserSound, playMissileSound, playImpactSound, playThrusterIgnitionSound } from '../utils/audio';

interface CombatSystemProps {
    registerFireFn: (fn: (pos: Vector3, quat: Quaternion, type: WeaponType, level: number, initialVel: Vector3) => void) => void;
    targetTextureUrl: string | null;
    onTargetsUpdate?: (targets: Target[]) => void;
    playerPos: Vector3;
    onPickup: (type: PickupType, value?: number) => void;
    onDistressSignal: (position: Vector3, isAmbush: boolean) => void;
    chaffActive: boolean;
    onEnemyDestroyed: (target: Target) => void;
    onTargetingStatusChange: (isLocked: boolean, isMissileTracking: boolean) => void;
    weaponLevel: number;
    onHeatChange: (heat: number) => void;
    onPlayerHit: (damage: number) => void;
    setCinematic: (state: CinematicState) => void;
    inAtmosphere: boolean;
    paused: boolean;
    trafficRef?: MutableRefObject<TrafficUnit[]>;
    onCivilianKilled?: () => void;
    heatLevel?: number;
}

// --- VISUAL COMPONENTS ---

const DroneModel = ({ tier }: { tier: TargetTier }) => {
    const color = tier === 'BOSS' ? '#a855f7' : (tier === 'ELITE' ? '#f59e0b' : '#ef4444');
    const bladeColor = '#38bdf8';

    // Rotating blades effect
    const Blade = ({ position }: { position: [number, number, number] }) => {
        const ref = useRef<THREE.Group>(null);
        useFrame((_, delta) => {
            if (ref.current) ref.current.rotation.y += delta * 20;
        });
        return (
            <group position={position} ref={ref}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[1, 10]} /> {/* Larger Blades */}
                    <meshBasicMaterial color={bladeColor} transparent opacity={0.6} side={THREE.DoubleSide} />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}>
                    <planeGeometry args={[1, 10]} />
                    <meshBasicMaterial color={bladeColor} transparent opacity={0.6} side={THREE.DoubleSide} />
                </mesh>
            </group>
        );
    };

    return (
        <group scale={[6, 6, 6]}> {/* Doubled Scale from 2.5 */}
            {/* Center Body */}
            <mesh>
                <boxGeometry args={[1.5, 0.8, 1.5]} />
                <meshStandardMaterial color="#334155" roughness={0.1} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
                <sphereGeometry args={[0.6, 16, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
            </mesh>

            {/* Arms */}
            <mesh rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[10, 0.3, 0.6]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
            <mesh rotation={[0, -Math.PI / 4, 0]}>
                <boxGeometry args={[10, 0.3, 0.6]} />
                <meshStandardMaterial color="#475569" />
            </mesh>

            {/* Rotors */}
            <Blade position={[3.5, 0.5, 3.5]} />
            <Blade position={[-3.5, 0.5, 3.5]} />
            <Blade position={[3.5, 0.5, -3.5]} />
            <Blade position={[-3.5, 0.5, -3.5]} />

            {/* Sensor Eye */}
            <mesh position={[0, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.5, 8]} />
                <meshBasicMaterial color="red" />
            </mesh>
        </group>
    );
};

const FighterModel = ({ tier, isPolice }: { tier: TargetTier, isPolice?: boolean }) => {
    const color = isPolice ? '#3b82f6' : (tier === 'BOSS' ? '#a855f7' : (tier === 'ELITE' ? '#f59e0b' : '#ef4444'));

    return (
        <group scale={[8, 8, 8]}> {/* Doubled Scale from 3 */}
            <Trail width={2} length={12} color={color} attenuation={(t) => t * t} target={undefined}>
                {/* Fuselage */}
                <mesh position={[0, 0, 0.5]}>
                    <boxGeometry args={[1.5, 1.2, 5]} />
                    <meshStandardMaterial color="#334155" roughness={0.1} metalness={0.9} />
                </mesh>

                {/* Cockpit */}
                <mesh position={[0, 0.8, 0]}>
                    <boxGeometry args={[1.2, 0.6, 3]} />
                    <meshStandardMaterial color="#000" roughness={0} metalness={1} />
                </mesh>

                {/* Wings */}
                <group position={[0, 0, 0]}>
                    <mesh rotation={[0, 0.4, 0]} position={[2.5, 0, 0.5]}>
                        <boxGeometry args={[4, 0.2, 2]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
                    </mesh>
                    <mesh rotation={[0, -0.4, 0]} position={[-2.5, 0, 0.5]}>
                        <boxGeometry args={[4, 0.2, 2]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
                    </mesh>
                </group>
            </Trail>
        </group>
    );
};

const EnemyShipGeometry = ({ tier, type, id }: { tier: TargetTier, type: EnemyType, id: string }) => {
    return (
        <group rotation={[0, Math.PI, 0]}>
            {type === 'DRONE' ? <DroneModel tier={tier} /> : <FighterModel tier={tier} isPolice={type === 'POLICE'} />}
        </group>
    );
};

// --- HUD COMPONENT ---
const TacticalHUD: React.FC<{ target: Target; playerPos: Vector3; camera: THREE.Camera }> = ({ target, playerPos, camera }) => {
    const screenPos = new Vector3(target.position[0], target.position[1], target.position[2]);
    screenPos.project(camera);

    const isBehind = screenPos.z > 1;
    const pad = 0.9;
    let x = screenPos.x;
    let y = screenPos.y;

    if (isBehind || Math.abs(x) > pad || Math.abs(y) > pad) {
        const angle = Math.atan2(y, x);
        x = Math.cos(angle) * pad;
        y = Math.sin(angle) * pad;
    }

    const left = (x * 50) + 50;
    const top = (-y * 50) + 50;
    const dist = playerPos.distanceTo(new Vector3(target.position[0], target.position[1], target.position[2]));

    const color = target.enemyType === 'POLICE' ? 'border-blue-500' : (target.tier === 'BOSS' ? 'border-purple-500' : (target.tier === 'ELITE' ? 'border-yellow-500' : 'border-red-500'));
    const textColor = target.enemyType === 'POLICE' ? 'text-blue-400' : (target.tier === 'BOSS' ? 'text-purple-400' : (target.tier === 'ELITE' ? 'text-yellow-400' : 'text-red-400'));

    return (
        <Html fullscreen style={{ pointerEvents: 'none', zIndex: 10 }}>
            <div
                className={`absolute w-12 h-12 border-2 ${color} rounded-sm opacity-80 flex items-center justify-center transition-all duration-75`}
                style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
            >
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                    <div className={`text-[10px] font-bold ${textColor} bg-black/50 px-1`}>
                        {target.enemyType} [{dist.toFixed(0)}m]
                    </div>
                </div>
            </div>
        </Html>
    );
};

// --- LOGIC ---

class ProjectileObject {
    id: string;
    type: WeaponType;
    position: Vector3;
    velocity: Vector3;
    quaternion: Quaternion;
    launchDirection: Vector3;
    life: number;
    level: number;
    targetId: string | null = null;
    owner: 'PLAYER' | 'ENEMY';
    phase: 'EJECT' | 'IGNITED' = 'EJECT';
    timeAlive: number = 0;
    maxSpeed: number;
    angularVelocity: Vector3 = new Vector3();

    constructor(id: string, type: WeaponType, pos: Vector3, quat: Quaternion, level: number, initialShipVel: Vector3, owner: 'PLAYER' | 'ENEMY', targetId: string | null) {
        this.id = id;
        this.type = type;
        this.position = pos.clone();
        this.quaternion = quat.clone();
        this.launchDirection = new Vector3(0, 0, -1).applyQuaternion(quat);
        this.level = level;
        this.owner = owner;
        this.targetId = targetId;

        if (type === 'missile') {
            const ejectionDir = new Vector3(1.0, -0.5, 0).normalize().applyQuaternion(quat);
            const ejectionSpeed = 15;

            this.velocity = initialShipVel.clone().add(ejectionDir.multiplyScalar(ejectionSpeed));
            this.angularVelocity = new Vector3(Math.random(), Math.random(), Math.random()).normalize().multiplyScalar(2.0);

            this.life = 10.0;
            this.maxSpeed = 2500;
            this.phase = 'EJECT';
        } else {
            const forward = new Vector3(0, 0, -1).applyQuaternion(quat);
            let speed = 1500; if (owner === 'ENEMY') speed = 800; if (level > 0) speed += (level * 100);
            this.velocity = forward.multiplyScalar(speed);
            this.phase = 'IGNITED';
            this.life = 5.0;
        }
    }
}

// --- INSTANCED PROJECTILES ---

const MAX_PROJECTILES = 500;

const ProjectileSystem: React.FC<{ items: ProjectileObject[] }> = ({ items }) => {
    const laserMeshRef = useRef<THREE.InstancedMesh>(null);
    const missileMeshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = new THREE.Object3D();

    useFrame(() => {
        if (!laserMeshRef.current || !missileMeshRef.current) return;

        let lIdx = 0, mIdx = 0;

        items.forEach(p => {
            dummy.position.copy(p.position);
            dummy.quaternion.copy(p.quaternion);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();

            if (p.type === 'laser') {
                if (lIdx < MAX_PROJECTILES) {
                    laserMeshRef.current!.setMatrixAt(lIdx++, dummy.matrix);
                }
            } else {
                if (mIdx < MAX_PROJECTILES) {
                    missileMeshRef.current!.setMatrixAt(mIdx++, dummy.matrix);
                }
            }
        });

        laserMeshRef.current.count = lIdx;
        missileMeshRef.current.count = mIdx;
        laserMeshRef.current.instanceMatrix.needsUpdate = true;
        missileMeshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            {/* Friendly/Neutral lasers */}
            <instancedMesh ref={laserMeshRef} args={[undefined, undefined, MAX_PROJECTILES]}>
                <boxGeometry args={[0.6, 0.6, 12]} />
                <meshBasicMaterial color="#93c5fd" toneMapped={false} />
            </instancedMesh>

            {/* Missiles */}
            <instancedMesh ref={missileMeshRef} args={[undefined, undefined, MAX_PROJECTILES]}>
                <cylinderGeometry args={[0.4, 0.4, 3, 8]} />
                <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
            </instancedMesh>
        </group>
    );
};

const TargetView: React.FC<{ item: Target; texture: Texture | null; playerPos: Vector3; camera: THREE.Camera }> = ({ item, playerPos, camera }) => {
    const ref = useRef<THREE.Group>(null);
    const tiltRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (ref.current) {
            const currentPos = new Vector3(...item.position);
            ref.current.position.copy(currentPos);

            // Banking logic based on velocity
            const vel = new Vector3(...item.velocity);
            const speed = vel.length();
            if (speed > 1) {
                const targetRot = new Matrix4().lookAt(currentPos, currentPos.clone().add(vel), new Vector3(0, 1, 0));
                const targetQuat = new Quaternion().setFromRotationMatrix(targetRot);
                ref.current.quaternion.slerp(targetQuat, delta * 5); // Smooth turning

                // Tilt logic for strafing
                if (tiltRef.current) {
                    const localVel = vel.clone().applyQuaternion(ref.current.quaternion.clone().invert());
                    const bankAngle = -localVel.x * 0.005; // Bank based on sideways movement
                    tiltRef.current.rotation.z = THREE.MathUtils.lerp(tiltRef.current.rotation.z, bankAngle, delta * 3);
                }
            }
        }
    });

    return (
        <group ref={ref} position={new Vector3(item.position[0], item.position[1], item.position[2])}>
            <group ref={tiltRef}>
                <EnemyShipGeometry tier={item.tier} type={item.enemyType} id={item.id} />
            </group>
            <TacticalHUD target={item} playerPos={playerPos} camera={camera} />
        </group>
    );
};

export const CombatSystem: React.FC<CombatSystemProps> = ({
    registerFireFn,
    targetTextureUrl,
    onTargetsUpdate,
    playerPos,
    onPickup,
    chaffActive,
    onEnemyDestroyed,
    onTargetingStatusChange,
    onPlayerHit,
    inAtmosphere,
    onHeatChange,
    paused,
    trafficRef,
    onCivilianKilled,
    heatLevel = 0
}) => {
    const projectilesRef = useRef<ProjectileObject[]>([]);
    const [projVersion, setProjVersion] = useState(0);

    const [targets, setTargets] = useState<Target[]>([]);
    const targetsRef = useRef<Target[]>([]);
    const [pickups, setPickups] = useState<Pickup[]>([]);
    const pickupsRef = useRef<Pickup[]>([]);
    const [targetTexture, setTargetTexture] = useState<Texture | null>(null);
    const { camera } = useThree();

    // Enemy Spawning Logic
    const spawnTimer = useRef(0);
    const enemiesKilled = useRef(0);

    // Tracking Player Motion for AI Prediction
    const prevPlayerPos = useRef(playerPos.clone());
    const playerVel = useRef(new Vector3());

    useEffect(() => {
        if (targetTextureUrl) {
            new TextureLoader().load(targetTextureUrl, (tex) => { tex.colorSpace = THREE.SRGBColorSpace; setTargetTexture(tex); });
        }
    }, [targetTextureUrl]);

    // Finds the best target (closest to screen center)
    const findLockTarget = (shipPos: Vector3, shipQuat: Quaternion) => {
        const forward = new Vector3(0, 0, -1).applyQuaternion(shipQuat);
        let bestTargetId = null;
        let maxDot = 0.9; // Require being somewhat in front

        targetsRef.current.forEach(t => {
            const tPos = new Vector3(t.position[0], t.position[1], t.position[2]);
            const dir = tPos.clone().sub(shipPos).normalize();
            const dot = forward.dot(dir);
            if (dot > maxDot) {
                maxDot = dot;
                bestTargetId = t.id;
            }
        });
        return bestTargetId;
    };

    useEffect(() => {
        registerFireFn((pos: Vector3, quat: Quaternion, type: WeaponType, level: number, initialVel: Vector3) => {
            const id = Math.random().toString(36).substr(2, 9);

            // Determine target lock
            let targetId = null;
            if (type === 'missile') {
                targetId = findLockTarget(pos, quat);
            }

            const proj = new ProjectileObject(id, type, pos, quat, level, initialVel, 'PLAYER', targetId);

            if (type === 'laser') playLaserSound(false);
            if (type === 'missile') playMissileSound();

            projectilesRef.current.push(proj);
            onHeatChange(5);
            setProjVersion(v => v + 1);
        });
    }, [registerFireFn, onHeatChange]);

    useFrame((state, delta) => {
        if (paused) return; // Stop all logic when paused

        const time = state.clock.getElapsedTime();
        const activeProjectiles = projectilesRef.current;
        let targetsChanged = false;

        // Calculate player velocity for AI prediction
        playerVel.current.copy(playerPos).sub(prevPlayerPos.current).divideScalar(delta || 0.016);
        prevPlayerPos.current.copy(playerPos);

        // --- HEAT DECAY ---
        if (heatLevel > 0) {
            onHeatChange(-delta * 1.5); // Decay heat slowly over time
        }

        // --- SPAWN LOGIC ---
        if (inAtmosphere) {
            spawnTimer.current += delta;

            // Spawning is now reactive to heat level
            let desiredCount = 0;
            if (heatLevel > 5) {
                desiredCount = 2 + Math.floor(heatLevel / 15) + Math.floor(enemiesKilled.current / 5);
            }

            if (targetsRef.current.length < desiredCount && spawnTimer.current > 3.0) {
                spawnTimer.current = 0;

                // Spawn logic: Spawn on perimeter
                const angle = Math.random() * Math.PI * 2;
                const r = 1000 + Math.random() * 800; // Farther spawn
                const spawnHeight = Math.max(playerPos.y + 400, 600);
                const spawnPos = new Vector3(
                    playerPos.x + Math.cos(angle) * r,
                    spawnHeight,
                    playerPos.z + Math.sin(angle) * r
                );

                // Determine Type
                let type: EnemyType = Math.random() > 0.6 ? 'DRONE' : 'FIGHTER';

                // Police Override
                if (heatLevel > 20 && Math.random() < 0.7) {
                    type = 'POLICE';
                }

                targetsRef.current.push({
                    id: `enemy-${Math.random()}`,
                    position: spawnPos.toArray(),
                    health: type === 'POLICE' ? 200 : (type === 'DRONE' ? 80 : 150),
                    maxHealth: type === 'POLICE' ? 200 : (type === 'DRONE' ? 80 : 150),
                    velocity: [0, 0, 0],
                    tier: type === 'POLICE' ? 'ELITE' : (Math.random() > 0.9 ? 'ELITE' : 'STANDARD'),
                    enemyType: type,
                    aiState: 'SURROUND',
                    assignedSlot: Math.random() * Math.PI * 2, // Random starting slot
                    aiTimer: Math.random() * 2,
                    lastFireTime: 0
                });

                // Removed: onHeatChange(5); // Spawning an enemy shouldn't increase heat anymore
                targetsChanged = true;
            }
        }

        let enemiesLockingPlayer = 0;

        // --- ENEMY AI LOOP ---
        targetsRef.current.forEach((t) => {
            // Update AI Timer
            t.aiTimer -= delta;

            const pos = new Vector3(t.position[0], t.position[1], t.position[2]);
            const vecToPlayer = playerPos.clone().sub(pos);
            const distToPlayer = vecToPlayer.length();
            const dirToPlayer = vecToPlayer.normalize();

            // STATE TRANSITIONS (Behavior Tree)
            if (t.aiTimer <= 0) {
                if (t.aiState === 'SURROUND') {
                    // Try to attack periodically
                    if (Math.random() < 0.4) {
                        t.aiState = 'ALIGN'; // Turn to face first
                        t.aiTimer = 1.0;
                    } else {
                        t.aiTimer = 3.0 + Math.random(); // Keep circling
                    }
                } else if (t.aiState === 'ALIGN') {
                    t.aiState = 'ATTACK_RUN';
                    t.aiTimer = 3.0;
                } else if (t.aiState === 'ATTACK_RUN') {
                    t.aiState = 'BREAK_OFF'; // Break off after run
                    t.aiTimer = 2.0;
                } else if (t.aiState === 'BREAK_OFF') {
                    t.aiState = 'SURROUND'; // Go back to orbit
                    t.aiTimer = 4.0;
                }
            }

            // Force Break Off if too close (Anti-Kamikaze)
            if (distToPlayer < 150 && t.aiState !== 'BREAK_OFF') {
                t.aiState = 'BREAK_OFF';
                t.aiTimer = 2.0;
            }

            // BEHAVIOR MOVEMENT
            let desiredVel = new Vector3();
            let moveSpeed = t.enemyType === 'FIGHTER' ? 220 : 160;
            if (t.enemyType === 'POLICE') moveSpeed = 250; // Police are fast

            const turnSpeed = t.enemyType === 'FIGHTER' ? 2.5 : 4.0;

            switch (t.aiState) {
                case 'SURROUND':
                    // Orbit Logic: Target a point on a ring around player
                    const orbitRadius = 800;
                    // Slowly rotate the slot
                    t.assignedSlot += delta * 0.2;
                    const targetSpot = new Vector3(
                        playerPos.x + Math.cos(t.assignedSlot) * orbitRadius,
                        playerPos.y + 100 + Math.sin(t.assignedSlot * 0.5) * 100, // Undulate height
                        playerPos.z + Math.sin(t.assignedSlot) * orbitRadius
                    );
                    desiredVel = targetSpot.sub(pos).normalize().multiplyScalar(moveSpeed * 0.8);
                    break;

                case 'ALIGN':
                    // Slow down and turn towards player prediction
                    // Predict player pos in 1 second
                    const futurePlayerPos = playerPos.clone().add(playerVel.current.clone().multiplyScalar(1.0));
                    desiredVel = futurePlayerPos.sub(pos).normalize().multiplyScalar(moveSpeed * 0.4);
                    break;

                case 'ATTACK_RUN':
                    // Fly towards where player is GOING to be
                    const leadTime = distToPlayer / 400; // Approx projectile speed relative
                    const aimPos = playerPos.clone().add(playerVel.current.clone().multiplyScalar(leadTime));
                    desiredVel = aimPos.sub(pos).normalize().multiplyScalar(moveSpeed * 1.5);
                    break;

                case 'BREAK_OFF':
                    // Fly UP and AWAY relative to the fight
                    // Cross product to find perpendicular escape route
                    const up = new Vector3(0, 1, 0);
                    const escapeDir = new Vector3().crossVectors(dirToPlayer, up).normalize();
                    // Add verticality
                    escapeDir.y = 1;
                    // Add repulsion from player
                    escapeDir.add(dirToPlayer.clone().negate()).normalize();

                    desiredVel = escapeDir.multiplyScalar(moveSpeed * 1.2);
                    break;
            }

            // ATMOSPHERIC CONSTRAINTS
            if (inAtmosphere) {
                // Ground Repulsion
                if (pos.y < 100) {
                    const pushUp = 1.0 - (pos.y / 100);
                    desiredVel.y += pushUp * 300;
                }
            }

            // APPLY VELOCITY
            const currentVel = new Vector3(t.velocity[0], t.velocity[1], t.velocity[2]);
            currentVel.lerp(desiredVel, delta * turnSpeed);
            pos.add(currentVel.clone().multiplyScalar(delta));

            // SAVE STATE
            t.velocity = currentVel.toArray();
            t.position = pos.toArray();

            // FIRING LOGIC
            const fireRange = t.enemyType === 'FIGHTER' ? 1500 : 900;
            const fireRate = t.enemyType === 'FIGHTER' ? 0.8 : (t.enemyType === 'POLICE' ? 0.3 : 0.5);

            // Only fire in ATTACK or ALIGN states (disciplined shooting)
            if ((t.aiState === 'ATTACK_RUN' || t.aiState === 'ALIGN' || distToPlayer < 400) && distToPlayer < fireRange) {
                const angleToPlayer = currentVel.normalize().dot(dirToPlayer);

                // Only fire if facing player roughly
                if (angleToPlayer > 0.85) {
                    enemiesLockingPlayer++;
                    if (!t.lastFireTime || (time - t.lastFireTime) > fireRate) {
                        t.lastFireTime = time;

                        // Predictive Aiming Logic
                        const shotSpeed = 400 + moveSpeed; // Approx relative
                        const travelTime = distToPlayer / shotSpeed;
                        const predictedPos = playerPos.clone().add(playerVel.current.clone().multiplyScalar(travelTime));

                        // Direction to predicted spot
                        const fireDir = predictedPos.sub(pos).normalize();

                        // Add some inaccuracy spread
                        const spread = (Math.random() - 0.5) * 0.05;
                        fireDir.x += spread;
                        fireDir.y += spread;
                        fireDir.normalize();

                        const projVel = currentVel.clone().add(fireDir.multiplyScalar(400));
                        const quat = new Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), fireDir);

                        const proj = new ProjectileObject(
                            `enemy-shot-${Math.random()}`,
                            'laser',
                            pos.clone().add(fireDir.multiplyScalar(15)),
                            quat,
                            0,
                            projVel,
                            'ENEMY',
                            null
                        );
                        projectilesRef.current.push(proj);
                        playLaserSound(true);
                    }
                }
            }
        });

        // --- PROJECTILE UPDATES ---
        for (let i = activeProjectiles.length - 1; i >= 0; i--) {
            const p = activeProjectiles[i];
            p.timeAlive += delta;
            p.life -= delta;

            // MISSILE LOGIC
            if (p.type === 'missile') {
                if (p.phase === 'EJECT') {
                    // Tumble logic
                    const rotAmt = delta * 4;
                    p.quaternion.multiply(new Quaternion().setFromEuler(new THREE.Euler(
                        p.angularVelocity.x * rotAmt,
                        p.angularVelocity.y * rotAmt,
                        p.angularVelocity.z * rotAmt
                    )));
                    p.velocity.multiplyScalar(0.99);

                    if (p.timeAlive > 0.4) {
                        p.phase = 'IGNITED';
                        playThrusterIgnitionSound();

                        let targetDir = p.launchDirection;
                        if (p.targetId) {
                            const tgt = targetsRef.current.find(t => t.id === p.targetId);
                            if (tgt) {
                                targetDir = new Vector3(tgt.position[0], tgt.position[1], tgt.position[2]).sub(p.position).normalize();
                            }
                        }
                        const targetQuat = new Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), targetDir);
                        p.quaternion.slerp(targetQuat, 0.5);
                        p.velocity.add(targetDir.multiplyScalar(500));
                    }
                } else if (p.phase === 'IGNITED') {
                    let targetPos: Vector3 | null = null;
                    if (p.targetId) {
                        const tgt = targetsRef.current.find(t => t.id === p.targetId);
                        if (tgt) targetPos = new Vector3(tgt.position[0], tgt.position[1], tgt.position[2]);
                    }

                    let desiredDir = p.launchDirection;
                    if (targetPos) {
                        desiredDir = targetPos.clone().sub(p.position).normalize();
                    }

                    const targetQuat = new Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), desiredDir);
                    p.quaternion.slerp(targetQuat, delta * 6.0);

                    const forward = new Vector3(0, 0, -1).applyQuaternion(p.quaternion);
                    const speed = p.velocity.length();
                    const newSpeed = Math.min(speed + (1200 * delta), p.maxSpeed);
                    p.velocity = forward.multiplyScalar(newSpeed);
                }
            }

            p.position.add(p.velocity.clone().multiplyScalar(delta));

            if (inAtmosphere && p.position.y < 0) {
                p.life = 0;
            }

            let hit = false;

            // Check Collision against Enemies
            if (p.owner === 'PLAYER') {
                for (let tIdx = 0; tIdx < targetsRef.current.length; tIdx++) {
                    const t = targetsRef.current[tIdx];
                    if (p.position.distanceTo(new Vector3(t.position[0], t.position[1], t.position[2])) < 30) {
                        hit = true;
                        t.health -= 50;
                        playImpactSound();
                        if (t.health <= 0) {
                            onEnemyDestroyed(t);
                            targetsRef.current.splice(tIdx, 1);
                            pickupsRef.current.push({ id: `cr-${Math.random()}`, type: 'CREDITS', position: t.position, active: true, value: 50 });
                            enemiesKilled.current++;
                            // Police increase heat more
                            onHeatChange(t.enemyType === 'POLICE' ? 20 : 10);
                        }
                    }
                }

                // Check Collision against Civilian Traffic
                if (trafficRef && trafficRef.current && !hit) {
                    const civilians = trafficRef.current;
                    for (let cIdx = 0; cIdx < civilians.length; cIdx++) {
                        const civ = civilians[cIdx];
                        if (civ.active && p.position.distanceTo(civ.position) < 20) {
                            hit = true;
                            civ.active = false; // Destroy
                            playImpactSound();
                            if (onCivilianKilled) onCivilianKilled();
                        }
                    }
                }

            } else {
                if (p.position.distanceTo(playerPos) < 15) {
                    hit = true;
                    onPlayerHit(10);
                    playImpactSound();
                }
            }

            if (hit || p.life <= 0) {
                activeProjectiles.splice(i, 1);
            }
        }

        onTargetingStatusChange(enemiesLockingPlayer > 0, false);

        if (targetsChanged) {
            setTargets([...targetsRef.current]);
            if (onTargetsUpdate) onTargetsUpdate([...targetsRef.current]);
        }
        setProjVersion(v => v + 1);
    });

    return (
        <group>
            <ProjectileSystem items={projectilesRef.current} />
            {targets.map((t) => <TargetView key={t.id} item={t} texture={targetTexture} playerPos={playerPos} camera={camera} />)}
            {pickups.map(p => (
                <group key={p.id} position={new Vector3(p.position[0], p.position[1], p.position[2])}>
                    <mesh rotation={[0, Date.now() * 0.001, 0]}><boxGeometry args={[4, 4, 4]} /><meshStandardMaterial color="#fbbf24" /></mesh>
                </group>
            ))}
        </group>
    );
};