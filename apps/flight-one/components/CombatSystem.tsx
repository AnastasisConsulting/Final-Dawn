
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, TextureLoader, Texture, Color, Matrix4 } from 'three';
import { Html, Float, Sparkles, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { Projectile, Target, WeaponType, Pickup, PickupType, TargetTier, CinematicState } from '../types';
import { playLaserSound, playMissileSound, playImpactSound } from '../utils/audio';

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
}

// --- HUD COMPONENT ---
const TacticalHUD: React.FC<{ target: Target; playerPos: Vector3; camera: THREE.Camera }> = ({ target, playerPos, camera }) => {
    const screenPos = new Vector3(...target.position);
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
    const dist = playerPos.distanceTo(new Vector3(...target.position));

    let leadX = 0, leadY = 0;
    let showLead = !isBehind && dist < 1500;
    if (showLead && target.velocity) {
        const flightTime = dist / 1500;
        const leadPos = new Vector3(...target.position).add(new Vector3(...target.velocity).multiplyScalar(flightTime));
        const leadScreen = leadPos.project(camera);
        if (leadScreen.z < 1) {
            leadX = (leadScreen.x * 50) + 50;
            leadY = (-leadScreen.y * 50) + 50;
        } else {
            showLead = false;
        }
    }

    const color = target.tier === 'BOSS' ? 'border-purple-500' : (target.tier === 'ELITE' ? 'border-yellow-500' : 'border-red-500');
    const textColor = target.tier === 'BOSS' ? 'text-purple-400' : (target.tier === 'ELITE' ? 'text-yellow-400' : 'text-red-400');

    return (
        <Html fullscreen style={{ pointerEvents: 'none', zIndex: 10 }}>
            <div
                className={`absolute w-12 h-12 border-2 ${color} rounded-sm opacity-80 flex items-center justify-center transition-all duration-75`}
                style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
            >
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white"></div>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white"></div>

                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                    <div className={`text-[10px] font-bold ${textColor} bg-black/50 px-1`}>
                        {target.tier} [{dist.toFixed(0)}m]
                    </div>
                    {target.tier === 'BOSS' && (
                        <div className="w-20 h-1 bg-gray-800 mt-1">
                            <div className="h-full bg-purple-500" style={{ width: `${(target.health / target.maxHealth) * 100}%` }}></div>
                        </div>
                    )}
                </div>
            </div>

            {showLead && (
                <div
                    className="absolute w-4 h-4 text-cyan-400 flex items-center justify-center opacity-60"
                    style={{ left: `${leadX}%`, top: `${leadY}%`, transform: 'translate(-50%, -50%)' }}
                >
                    +
                </div>
            )}
        </Html>
    );
};

// --- SHIP GEOMETRY ---

const FriendlyShipGeometry = () => (
    <group rotation={[0, Math.PI, 0]}>
        <mesh><boxGeometry args={[12, 12, 40]} /><meshStandardMaterial color="#475569" roughness={0.7} metalness={0.5} /></mesh>
        <pointLight position={[0, 5, -15]} color="#22d3ee" distance={50} intensity={2} />
    </group>
);

const BOSS_DATA = [
    { name: "THE GILDED TYRANT", transmission: "End of the line, pilot. Hand over the cargo.", color: "#a855f7", secondary: "#facc15" },
    { name: "VOID-STALKER KHAIL", transmission: "You cannot hide in the nebula forever...", color: "#000", secondary: "#22d3ee" },
    { name: "IRON JUDGE - OMEGA", transmission: "Violation of Core Space detected. Lethal force authorized.", color: "#475569", secondary: "#ef4444" },
    { name: "SIREN OF THE DRIFT", transmission: "Such a pretty ship. It will look better as scrap.", color: "#db2777", secondary: "#ec4899" },
    { name: "ARCHON SUPREME", transmission: "Kneel before the Syndicate’s absolute authority!", color: "#1e3a8a", secondary: "#fbbf24" }
];

const EnemyShipGeometry = ({ tier, id }: { tier: TargetTier, id: string }) => {
    // Determine ship variant based on ID or hash
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variant = hash % 2;

    if (tier === 'BOSS') {
        const bossIndex = hash % BOSS_DATA.length;
        const boss = BOSS_DATA[bossIndex];

        return (
            <group rotation={[0, Math.PI, 0]}>
                {/* Main Hull */}
                {variant === 0 ? (
                    // Type A: The Wedge
                    <mesh scale={[1, 0.3, 2]}>
                        <coneGeometry args={[40, 100, 4]} />
                        <meshStandardMaterial color={boss.color} roughness={0.2} metalness={0.9} emissive={boss.secondary} emissiveIntensity={0.5} />
                    </mesh>
                ) : (
                    // Type B: The Hammer
                    <group>
                        <mesh scale={[1.5, 0.5, 3]}>
                            <boxGeometry args={[20, 10, 30]} />
                            <meshStandardMaterial color={boss.color} metalness={0.8} emissive={boss.secondary} emissiveIntensity={0.3} />
                        </mesh>
                        <mesh position={[0, 0, -30]} rotation={[0, 0, Math.PI / 4]}>
                            <boxGeometry args={[60, 20, 20]} />
                            <meshStandardMaterial color={boss.color} metalness={0.9} />
                        </mesh>
                    </group>
                )}

                {/* Visual Details */}
                <mesh position={[0, 12, -20]}>
                    <boxGeometry args={[12, 10, 18]} />
                    <meshStandardMaterial color="#111" emissive={boss.secondary} emissiveIntensity={2} />
                </mesh>

                {/* Engines */}
                <mesh position={[15, 0, 45]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[6, 8, 8, 16]} />
                    <meshStandardMaterial emissive={boss.secondary} emissiveIntensity={3} color="#000" />
                </mesh>
                <mesh position={[-15, 0, 45]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[6, 8, 8, 16]} />
                    <meshStandardMaterial emissive={boss.secondary} emissiveIntensity={3} color="#000" />
                </mesh>

                <Sparkles count={100} scale={150} color={boss.secondary} size={25} speed={0.8} opacity={0.6} />
            </group>
        );
    }

    if (tier === 'ELITE') {
        // Elite Variants
        return (
            <group rotation={[0, Math.PI, 0]}>
                {variant === 0 ? (
                    // Needle Interceptor
                    <group>
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <coneGeometry args={[1.5, 14, 8]} />
                            <meshStandardMaterial color="#7f1d1d" roughness={0.4} metalness={0.6} emissive="#ef4444" emissiveIntensity={0.8} />
                        </mesh>
                        <mesh position={[3, 0, 2]} rotation={[Math.PI / 2, 0.2, 0]}>
                            <boxGeometry args={[6, 0.2, 3]} />
                            <meshStandardMaterial color="#991b1b" />
                        </mesh>
                        <mesh position={[-3, 0, 2]} rotation={[Math.PI / 2, -0.2, 0]}>
                            <boxGeometry args={[6, 0.2, 3]} />
                            <meshStandardMaterial color="#991b1b" />
                        </mesh>
                    </group>
                ) : (
                    // Twin-Fin Heavy
                    <group>
                        <mesh>
                            <sphereGeometry args={[2, 16, 16]} />
                            <meshStandardMaterial color="#334155" metalness={0.8} />
                        </mesh>
                        <mesh position={[2, 2, 0]} rotation={[0, 0, 0.5]}>
                            <boxGeometry args={[0.5, 8, 4]} />
                            <meshStandardMaterial color="#1e3a8a" emissive="#3b82f6" />
                        </mesh>
                        <mesh position={[-2, 2, 0]} rotation={[0, 0, -0.5]}>
                            <boxGeometry args={[0.5, 8, 4]} />
                            <meshStandardMaterial color="#1e3a8a" emissive="#3b82f6" />
                        </mesh>
                    </group>
                )}
                <Trail width={3} length={20} color="#f97316">
                    <mesh position={[0, 0, 6]}><sphereGeometry args={[0.4]} /><meshBasicMaterial color="#f97316" /></mesh>
                </Trail>
            </group>
        );
    }

    // Standard Drones
    return (
        <group rotation={[0, Math.PI, 0]}>
            {variant === 0 ? (
                // Classic Ball Drone
                <group>
                    <mesh>
                        <sphereGeometry args={[1.6, 16, 16]} />
                        <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.5} emissive="#111" />
                    </mesh>
                    <mesh position={[2.8, 0, 0]}>
                        <boxGeometry args={[0.2, 5, 4]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                    <mesh position={[-2.8, 0, 0]}>
                        <boxGeometry args={[0.2, 5, 4]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                </group>
            ) : (
                // Triangle Guard
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[2, 2.5, 1, 3]} />
                    <meshStandardMaterial color="#334155" emissive="#475569" />
                </mesh>
            )}
            <mesh position={[0, 0, -1]}>
                <sphereGeometry args={[0.7, 8, 8]} />
                <meshBasicMaterial color="#ef4444" />
            </mesh>
            <Trail width={1.5} length={8} color="#f87171">
                <mesh position={[0, 0, 2]}><sphereGeometry args={[0.3]} /><meshBasicMaterial color="#ef4444" /></mesh>
            </Trail>
        </group>
    );
};

// --- LOGIC ---

class ProjectileObject {
    id: string; type: WeaponType; position: Vector3; velocity: Vector3; quaternion: Quaternion; launchDirection: Vector3; life: number; level: number; targetId: string | null = null; owner: 'PLAYER' | 'ENEMY'; phase: 'DROP' | 'IGNITED' = 'DROP'; timeAlive: number = 0; maxSpeed: number;
    constructor(id: string, type: WeaponType, pos: Vector3, quat: Quaternion, level: number, initialShipVel: Vector3, owner: 'PLAYER' | 'ENEMY') {
        this.id = id; this.type = type; this.position = pos.clone(); this.quaternion = quat.clone();
        this.launchDirection = new Vector3(0, 0, -1).applyQuaternion(quat);
        this.life = 5.0; this.level = level; this.owner = owner; this.maxSpeed = 1500;
        if (type === 'missile') {
            const ejectionForce = new Vector3(15, -15, 0).applyQuaternion(quat);
            this.velocity = initialShipVel.clone().add(ejectionForce);
            this.life = 8.0; this.maxSpeed = 1200;
        } else {
            const forward = new Vector3(0, 0, -1).applyQuaternion(quat);
            let speed = 1500; if (owner === 'ENEMY') speed = 800; if (level > 0) speed += (level * 100);
            this.velocity = forward.multiplyScalar(speed); this.phase = 'IGNITED';
        }
    }
}

const ProjectileView: React.FC<{ item: ProjectileObject }> = ({ item }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame(() => { if (ref.current) { ref.current.position.copy(item.position); ref.current.quaternion.copy(item.quaternion); } });
    const color = item.owner === 'ENEMY' ? '#ef4444' : (item.type === 'laser' ? (item.level > 1 ? '#f87171' : '#93c5fd') : '#fcd34d');
    return (
        <group ref={ref} position={item.position}>
            <mesh rotation={item.type === 'missile' ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
                {item.type === 'laser' ? (<boxGeometry args={[0.4 + (item.level * 0.2), 0.4 + (item.level * 0.2), item.owner === 'ENEMY' ? 12 : 6]} />) : (<capsuleGeometry args={[0.3, 2.5, 4, 8]} />)}
                <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            {item.type === 'missile' && (<Sparkles count={10} scale={[1, 1, 5]} color="#fcd34d" size={8} speed={5} opacity={1} position={[0, 0, 2]} />)}
        </group>
    );
};

const TargetView: React.FC<{ item: Target; texture: Texture | null; playerPos: Vector3; camera: THREE.Camera }> = ({ item, playerPos, camera }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.position.set(...item.position);
            // Smooth rotation towards velocity
            if (item.velocity) {
                const vel = new Vector3(...item.velocity);
                if (vel.lengthSq() > 10) {
                    const targetQuat = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), vel.clone().normalize());
                    ref.current.quaternion.slerp(targetQuat, delta * 3.0);
                }
            }
        }
    });

    return (
        <group ref={ref} position={item.position}>
            <EnemyShipGeometry tier={item.tier} id={item.id} />
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
    onDistressSignal,
    chaffActive,
    onEnemyDestroyed,
    onTargetingStatusChange,
    weaponLevel,
    onHeatChange,
    onPlayerHit,
    setCinematic
}) => {
    const projectilesRef = useRef<ProjectileObject[]>([]);
    const [projVersion, setProjVersion] = useState(0);

    const [targets, setTargets] = useState<Target[]>([]);
    const targetsRef = useRef<Target[]>([]);

    const [pickups, setPickups] = useState<Pickup[]>([]);
    const pickupsRef = useRef<Pickup[]>([]);

    const friendlyShipRef = useRef<{ id: string, position: Vector3, active: boolean, maxHp: number, currentHp: number }>({ id: '', position: new Vector3(), active: false, maxHp: 500, currentHp: 500 });
    const [friendlyShip, setFriendlyShip] = useState<{ id: string, position: Vector3, active: boolean, maxHp: number, currentHp: number } | null>(null);
    const [targetTexture, setTargetTexture] = useState<Texture | null>(null);

    const { camera } = useThree();

    const currentWave = useRef(0);
    const waveTimer = useRef(0);

    // Track player velocity for aiming prediction
    const lastPlayerPos = useRef(playerPos.clone());
    const playerVelocity = useRef(new Vector3());

    useEffect(() => {
        if (targetTextureUrl) {
            new TextureLoader().load(targetTextureUrl, (tex) => { tex.colorSpace = THREE.SRGBColorSpace; setTargetTexture(tex); });
        } else { setTargetTexture(null); }
    }, [targetTextureUrl]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'KeyK') {
                targetsRef.current.forEach(t => onEnemyDestroyed(t));
                targetsRef.current = [];
                setTargets([]);
                if (onTargetsUpdate) onTargetsUpdate([]);
                playImpactSound();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onTargetsUpdate, onEnemyDestroyed]);

    useEffect(() => {
        registerFireFn((pos: Vector3, quat: Quaternion, type: WeaponType, level: number, initialVel: Vector3) => {
            const id = Math.random().toString(36).substr(2, 9);
            const proj = new ProjectileObject(id, type, pos, quat, level, initialVel, 'PLAYER');
            if (type === 'laser') playLaserSound(false);
            if (type === 'missile') playMissileSound();
            projectilesRef.current.push(proj);
            setProjVersion(v => v + 1);
        });
    }, [registerFireFn]);

    // --- SPAWNING LOGIC ---
    const spawnWave = (wave: number) => {
        const newTargets: Target[] = [];
        const time = Date.now();

        if (wave === 1) {
            // SCOUTS
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const r = 3000;
                const spawnPos = playerPos.clone().add(new Vector3(Math.cos(angle) * r, (Math.random() - 0.5) * 500, Math.sin(angle) * r));

                newTargets.push({
                    id: `wave1-${time}-${i}`,
                    position: spawnPos.toArray(),
                    health: 80, maxHealth: 80, velocity: [0, 0, 0],
                    tier: 'STANDARD', behavior: 'ATTACK_PLAYER',
                    aiState: 0, aiTimer: 0, aiVector: [0, 0, 0], lastFireTime: 0
                });
            }
        } else if (wave === 2) {
            // KILL SQUAD (ELITE)
            const squadCenter = playerPos.clone().add(new Vector3(0, 0, 2000));
            for (let i = 0; i < 3; i++) {
                const spawnPos = squadCenter.clone().add(new Vector3((i - 1) * 100, 0, 0));
                newTargets.push({
                    id: `wave2-${time}-${i}`,
                    position: spawnPos.toArray(),
                    health: 400, maxHealth: 400, velocity: [0, 0, 0],
                    tier: 'ELITE', behavior: 'ATTACK_PLAYER',
                    aiState: 0, aiTimer: 0, aiVector: [0, 0, 0], lastFireTime: 0
                });
            }
        } else if (wave === 3) {
            // BOSS
            const bossPos = playerPos.clone().add(new Vector3(0, 200, -1000));

            // Randomly select boss from registry
            const bossIndex = Math.floor(Math.random() * BOSS_DATA.length);
            const boss = BOSS_DATA[bossIndex];

            setCinematic({
                active: true,
                type: 'BOSS_INTRO',
                targetPosition: bossPos.toArray(),
                message: boss.name,
                transmission: boss.transmission
            });
            setTimeout(() => { setCinematic({ active: false, targetPosition: null }); }, 6000);

            newTargets.push({
                id: `BOSS-${time}-${bossIndex}`, // Include index to ensure geometry matches name
                position: bossPos.toArray(),
                health: 5000, maxHealth: 5000, velocity: [0, 0, 0],
                tier: 'BOSS', behavior: 'ATTACK_PLAYER',
                aiState: 0, aiTimer: 0, aiVector: [0, 0, 0], lastFireTime: 0
            });
        }

        targetsRef.current = [...targetsRef.current, ...newTargets];
    };

    useFrame((state, delta) => {
        const time = state.clock.getElapsedTime();
        const activeProjectiles = projectilesRef.current;
        let targetsChanged = false;
        let pickupsChanged = false;
        let friendlyChanged = false;
        let projectilesChanged = false;

        // Calc Player Velocity
        const disp = playerPos.clone().sub(lastPlayerPos.current);
        if (delta > 0) playerVelocity.current.lerp(disp.divideScalar(delta), 0.1);
        lastPlayerPos.current.copy(playerPos);

        if (currentWave.current === 0) { currentWave.current = 1; spawnWave(1); targetsChanged = true; }
        if (targetsRef.current.length === 0) {
            waveTimer.current += delta;
            if (waveTimer.current > 3.0) {
                waveTimer.current = 0;
                const next = currentWave.current < 3 ? currentWave.current + 1 : 2;
                currentWave.current = next;
                spawnWave(next);
                targetsChanged = true;
            }
        }

        let enemiesLockingPlayer = 0;

        targetsRef.current.forEach((t) => {
            const pos = new Vector3(...t.position);
            let targetPos = playerPos;
            const distToTarget = pos.distanceTo(targetPos);
            const vecToTarget = targetPos.clone().sub(pos).normalize();

            // --- AI STATE MACHINE ---
            if (!t.aiTimer) t.aiTimer = 0;
            t.aiTimer -= delta;

            // Init AI state if undefined
            if (t.aiState === undefined) t.aiState = 0; // 0: INTERCEPT, 1: DOGFIGHT, 2: EVADE

            // State Transitions
            if (t.aiTimer <= 0) {
                if (t.aiState === 0) {
                    // Was INTERCEPT -> Switch to DOGFIGHT if close
                    if (distToTarget < 1000) {
                        t.aiState = 1;
                        t.aiTimer = 5 + Math.random() * 5;
                        // Pick a random strafe vector
                        const up = new Vector3(0, 1, 0);
                        const right = vecToTarget.clone().cross(up).normalize();
                        if (Math.random() > 0.5) right.negate();
                        t.aiVector = right.toArray();
                    } else {
                        t.aiTimer = 2; // Keep intercepting
                    }
                } else if (t.aiState === 1) {
                    // Was DOGFIGHT -> Maybe EVADE or Re-pick Strafe
                    if (Math.random() > 0.7) {
                        t.aiState = 2; // Evade
                        t.aiTimer = 3;
                        // Fly away from player + random up/down
                        const fleeDir = vecToTarget.clone().negate().add(new Vector3(0, (Math.random() - 0.5), 0)).normalize();
                        t.aiVector = fleeDir.toArray();
                    } else {
                        // Change strafe direction
                        t.aiTimer = 4;
                        const up = new Vector3(0, 1, 0);
                        const right = vecToTarget.clone().cross(up).normalize();
                        if (Math.random() > 0.5) right.negate();
                        // Add some verticality
                        right.y += (Math.random() - 0.5);
                        t.aiVector = right.normalize().toArray();
                    }
                } else if (t.aiState === 2) {
                    // Was EVADE -> Back to INTERCEPT
                    t.aiState = 0;
                    t.aiTimer = 4;
                }
            }

            let desiredVelocity = new Vector3(0, 0, 0);

            if (t.tier === 'BOSS') {
                desiredVelocity = vecToTarget.multiplyScalar(20);
                enemiesLockingPlayer++;
            } else {
                // MOVEMENT BASED ON STATE
                const maxSpeed = t.tier === 'ELITE' ? 200 : 120;
                const accel = t.tier === 'ELITE' ? 4.0 : 2.0;

                if (t.aiState === 0) { // INTERCEPT
                    desiredVelocity = vecToTarget.multiplyScalar(maxSpeed);
                } else if (t.aiState === 1) { // DOGFIGHT (Orbit)
                    // Move perpendicular (stored in aiVector) + slight forward to spiral in
                    const strafeDir = new Vector3(...(t.aiVector || [1, 0, 0]));
                    desiredVelocity = strafeDir.multiplyScalar(maxSpeed * 0.8).add(vecToTarget.multiplyScalar(maxSpeed * 0.3));
                    enemiesLockingPlayer++;
                } else { // EVADE
                    const fleeDir = new Vector3(...(t.aiVector || [0, 0, -1]));
                    desiredVelocity = fleeDir.multiplyScalar(maxSpeed * 1.5); // Boost away
                }

                // Smoothly interpolate velocity for weight
                const currentVel = new Vector3(...(t.velocity || [0, 0, 0]));
                currentVel.lerp(desiredVelocity, delta * accel);

                // Apply collision avoidance with other enemies
                targetsRef.current.forEach(other => {
                    if (other !== t) {
                        const d = pos.distanceTo(new Vector3(...other.position));
                        if (d < 50) {
                            const push = pos.clone().sub(new Vector3(...other.position)).normalize().multiplyScalar(150);
                            currentVel.add(push.multiplyScalar(delta * 5));
                        }
                    }
                });

                t.velocity = currentVel.toArray();
                pos.add(currentVel.clone().multiplyScalar(delta));
            }

            t.position = [pos.x, pos.y, pos.z];

            // -- FIRING LOGIC --
            // Aim Prediction
            const projectileSpeed = 800;
            const timeToHit = distToTarget / projectileSpeed;
            const predictedTargetPos = targetPos.clone().add(playerVelocity.current.clone().multiplyScalar(timeToHit));
            const aimDir = predictedTargetPos.sub(pos).normalize();

            const angleToTarget = new Vector3(...(t.velocity || [0, 0, 1])).normalize().angleTo(vecToTarget);
            const canFire = (t.tier === 'BOSS') || (t.aiState !== 2 && angleToTarget < 1.0 && distToTarget < 2500);

            if (canFire) {
                const now = time;
                // NERFED: Boss fires slower (0.5 -> 0.8)
                const fireRate = t.tier === 'BOSS' ? 0.8 : (t.tier === 'ELITE' ? 0.2 : 1.5);

                if (!t.lastFireTime || (now - t.lastFireTime) > fireRate) {
                    t.lastFireTime = now;

                    if (t.tier === 'BOSS') {
                        // NERFED: Reduced spread count from 3 to 2, reduced accuracy
                        for (let k = -1; k <= 0; k += 2) { // 2 shots
                            const spreadAim = aimDir.clone().add(new Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, 0)).normalize();
                            const quat = new Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), spreadAim);
                            const spawnPos = pos.clone().add(spreadAim.clone().multiplyScalar(40));
                            const proj = new ProjectileObject(`boss-shot-${Math.random()}`, 'laser', spawnPos, quat, 5, new Vector3(0, 0, 0), 'ENEMY');
                            projectilesRef.current.push(proj);
                        }
                        playMissileSound();
                    } else {
                        const accuracy = t.tier === 'ELITE' ? 0.95 : 0.85;
                        const jitter = new Vector3((Math.random() - 0.5) * (1 - accuracy), (Math.random() - 0.5) * (1 - accuracy), (Math.random() - 0.5) * (1 - accuracy));
                        const finalAim = aimDir.add(jitter).normalize();
                        const quat = new Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), finalAim);
                        const spawnOffset = finalAim.clone().multiplyScalar(15);
                        const spawnPos = pos.clone().add(spawnOffset);
                        const proj = new ProjectileObject(`enemy-proj-${Math.random()}`, 'laser', spawnPos, quat, 0, new Vector3(0, 0, 0), 'ENEMY');
                        projectilesRef.current.push(proj);
                        playLaserSound(true);
                    }
                    setProjVersion(v => v + 1);
                }
            }
        });

        if (friendlyShipRef.current.active) {
            const fPos = friendlyShipRef.current.position;
            fPos.z += delta * 10;
            fPos.x += Math.sin(time * 0.1) * 0.5;
        }

        let missileTrackingPlayer = false;

        for (let i = activeProjectiles.length - 1; i >= 0; i--) {
            const p = activeProjectiles[i];
            p.life -= delta;

            if (p.type === 'missile') {
                p.timeAlive += delta;
                if (p.phase === 'DROP') {
                    if (p.timeAlive > 0.5) {
                        p.phase = 'IGNITED';
                        playMissileSound();
                    }
                } else {
                    let dirToTarget: Vector3 | null = null;
                    if (chaffActive && p.targetId === 'PLAYER') p.targetId = null;

                    if (p.targetId) {
                        let tPos: Vector3 | null = null;
                        if (p.targetId === 'PLAYER') {
                            tPos = playerPos;
                            missileTrackingPlayer = true;
                        } else {
                            const target = targetsRef.current.find(t => t.id === p.targetId);
                            if (target) tPos = new Vector3(...target.position);
                        }
                        if (tPos) dirToTarget = tPos.clone().sub(p.position).normalize();
                    }
                    if (!dirToTarget) dirToTarget = p.launchDirection.clone();

                    const currentDir = p.velocity.clone().normalize();
                    const turnRate = 4.0 + (p.level * 0.5);
                    currentDir.lerp(dirToTarget, turnRate * delta).normalize();
                    p.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), currentDir);
                    const currentSpeed = p.velocity.length();
                    const newSpeed = Math.min(p.maxSpeed, currentSpeed + (1000 * delta));
                    p.velocity = currentDir.multiplyScalar(newSpeed);
                }
            }

            p.position.add(p.velocity.clone().multiplyScalar(delta));

            let hit = false;

            if (p.owner === 'PLAYER') {
                for (let tIdx = 0; tIdx < targetsRef.current.length; tIdx++) {
                    const t = targetsRef.current[tIdx];
                    const tPos = new Vector3(...t.position);
                    let hitRad = 15;
                    if (t.tier === 'ELITE') hitRad = 20;
                    if (t.tier === 'BOSS') hitRad = 60;

                    if (p.position.distanceTo(tPos) < hitRad) {
                        hit = true;
                        // BUFFED: Player does more damage
                        const damage = p.type === 'missile' ? 100 + (p.level * 50) : 20 + (p.level * 15);
                        t.health -= damage;
                        playImpactSound();

                        if (t.health <= 0) {
                            const dropPos = new Vector3(...t.position);
                            let credits = 50;
                            if (t.tier === 'ELITE') credits = 150;
                            if (t.tier === 'BOSS') credits = 5000;

                            pickupsRef.current.push({ id: `cr-${Math.random()}`, type: 'CREDITS', position: dropPos.clone().add(new Vector3(0, 5, 0)).toArray(), active: true, value: credits });

                            onEnemyDestroyed(t);
                            targetsRef.current.splice(tIdx, 1);
                            tIdx--;
                            targetsChanged = true;
                            pickupsChanged = true;
                            if (onTargetsUpdate) onTargetsUpdate([...targetsRef.current]);
                        }
                    }
                }
            } else {
                if (p.position.distanceTo(playerPos) < 12) {
                    hit = true;
                    // NERFED: Enemies do significantly less damage
                    const dmg = p.type === 'missile' ? 30 : 5;
                    onPlayerHit(dmg);
                    playImpactSound();
                }
            }

            if (hit || p.life <= 0) {
                activeProjectiles.splice(i, 1);
                projectilesChanged = true;
            }
        }

        if (enemiesLockingPlayer > 0 || missileTrackingPlayer) {
            onTargetingStatusChange(enemiesLockingPlayer > 0, missileTrackingPlayer);
        } else {
            onTargetingStatusChange(false, false);
        }

        for (let i = pickupsRef.current.length - 1; i >= 0; i--) {
            const p = pickupsRef.current[i];
            const pPos = new Vector3(...p.position);
            if (playerPos.distanceTo(pPos) < 30) {
                onPickup(p.type, p.value);
                pickupsRef.current.splice(i, 1);
                pickupsChanged = true;
            }
        }

        if (targetsChanged || friendlyChanged) {
            setTargets([...targetsRef.current]);
            setFriendlyShip(friendlyShipRef.current.active ? { ...friendlyShipRef.current } : null);
            if (onTargetsUpdate) onTargetsUpdate([...targetsRef.current]);
        }
        if (pickupsChanged) setPickups([...pickupsRef.current]);
        if (projectilesChanged) setProjVersion(v => v + 1);
    });

    return (
        <group>
            {projectilesRef.current.map((p) => (
                <ProjectileView key={p.id} item={p} />
            ))}

            {targets.map((t) => (
                <TargetView key={t.id} item={t} texture={targetTexture} playerPos={playerPos} camera={camera} />
            ))}

            {friendlyShip && friendlyShip.active && (
                <group position={friendlyShip.position}>
                    <Html position={[0, 20, 0]} center distanceFactor={250}>
                        <div className="flex flex-col items-center">
                            <div className="text-cyan-400 font-bold text-xs animate-pulse whitespace-nowrap border border-cyan-500/50 bg-black/70 px-2 py-1 rounded mb-1 tracking-wider">
                                RESCUE TARGET
                            </div>
                            <div className="w-32 h-2 bg-gray-800 border border-gray-600 rounded overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${friendlyShip.currentHp < 500 ? 'bg-red-500' : 'bg-cyan-500'}`}
                                    style={{ width: `${(friendlyShip.currentHp / friendlyShip.maxHp) * 100}%` }}
                                />
                            </div>
                        </div>
                    </Html>
                    <FriendlyShipGeometry />
                </group>
            )}

            {pickups.map((p) => (
                <group key={p.id} position={p.position}>
                    <Float speed={4} rotationIntensity={2} floatIntensity={1}>
                        {p.type === 'CREDITS' ? (
                            <mesh><octahedronGeometry args={[2]} /><meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} /></mesh>
                        ) : (
                            <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}><boxGeometry args={[3, 3, 3]} /><meshStandardMaterial color={p.type === 'HEALTH' ? '#22c55e' : (p.type === 'SHIELD' ? '#3b82f6' : '#f59e0b')} emissiveIntensity={2} /></mesh>
                        )}
                    </Float>
                    <pointLight color={p.type === 'CREDITS' ? '#fbbf24' : '#fff'} distance={40} intensity={2} />
                    <Sparkles count={10} scale={10} color={p.type === 'CREDITS' ? '#fbbf24' : '#fff'} size={4} speed={1} />
                </group>
            ))}
        </group>
    );
};
