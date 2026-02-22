import React, { useRef, useState, useEffect, MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Group, Euler, Color, MathUtils, Matrix4 } from 'three';
import { Sparkles } from '@react-three/drei';
import { useFlightControls } from './Controls';
import { FlightStatus, WeaponType, SystemNode, CinematicState, TargetDynamics, Target, TrafficUnit, BuildingData } from '../types';
import { EngineSound, playChaffSound, playLockWarningSound, playMissileAlertSound, playImpactSound } from '../utils/audio';
import { PerspectiveCamera } from 'three';
import * as THREE from 'three';
import { getHeight } from '../utils/terrain';


interface SpaceFighterProps {
    status: FlightStatus;
    onUpdateStatus: (status: FlightStatus) => void;
    onFire?: (pos: Vector3, quat: Quaternion, type: WeaponType, velocity: Vector3) => void;
    navTarget: Vector3 | null;
    autopilot: boolean;
    onAutopilotDisengage: () => void;
    activeSystem: SystemNode | null;
    playerHealth: number;
    cinematicMode: CinematicState;
    dockingTarget?: SystemNode | null;
    targetDynamicsRef?: MutableRefObject<TargetDynamics>;
    activeTargets?: Target[];
    onChaff: () => void;
    targetingStatus: { locked: boolean, missileTracking: boolean };
    onBoostChange?: (isBoosting: boolean) => void;
    inAtmosphere: boolean;
    onCrash?: () => void;
    paused: boolean;
    trafficRef?: MutableRefObject<TrafficUnit[]>;
    buildingsRef?: MutableRefObject<BuildingData[]>;
    onHeatIncrease?: (amount: number, message: string) => void;
    onTakeoffComplete?: () => void;
}

type ManeuverState = 'NONE' | 'ROLL_LEFT' | 'ROLL_RIGHT' | 'LOOP' | 'FLIP_180';

export const SpaceFighter: React.FC<SpaceFighterProps> = ({
    status,
    onUpdateStatus,
    onFire,
    navTarget,
    autopilot,
    onAutopilotDisengage,
    activeSystem,
    playerHealth,
    cinematicMode,
    dockingTarget,
    targetDynamicsRef,
    activeTargets = [],
    onChaff,
    targetingStatus,
    onBoostChange,
    inAtmosphere,
    onCrash,
    paused,
    trafficRef,
    buildingsRef,
    onHeatIncrease,
    onTakeoffComplete
}) => {
    const shipRef = useRef<Group>(null);
    const controlsRef = useFlightControls();
    const { camera } = useThree();

    const prevSystemRef = useRef<string | null>(null);
    const [boosting, setBoosting] = useState(false);

    // Camera Smoothing Ref - initialized near start pos to prevent swoop
    const smoothCameraPos = useRef(new Vector3(0, 3600, 200));

    // Engine Refs
    const leftPlumeRef = useRef<Group>(null);
    const rightPlumeRef = useRef<Group>(null);
    const engineLeftMatRef = useRef<any>(null);
    const engineRightMatRef = useRef<any>(null);
    const engineColor = useRef(new Color('#60a5fa'));
    const plumeScale = useRef(new Vector3(1, 1, 1));
    const engineSoundRef = useRef<EngineSound | null>(null);

    // RPG Visual Refs
    const shieldMeshRef = useRef<THREE.Mesh>(null);
    const entryHeatRef = useRef<THREE.Mesh>(null);
    const landingGearRef = useRef<Group>(null);
    const landingAnimProgress = useRef(0);
    const prevHealthRef = useRef(playerHealth);
    const healFlashTime = useRef(0);

    // Maneuver State
    const maneuverState = useRef<ManeuverState>('NONE');
    const maneuverProgress = useRef(0);
    const chaffParticlesRef = useRef<THREE.Group>(null);
    const chaffTimer = useRef(0);

    // Audio Timers
    const lockWarningTimer = useRef(0);
    const missileAlertTimer = useRef(0);

    // Physics
    const velocity = useRef(new Vector3(0, 0, 0));
    const lastFireTime = useRef(0);
    const lastMissileTime = useRef(0);
    const lastCollisionTime = useRef(0);

    useEffect(() => {
        const snd = new EngineSound();
        snd.start();
        engineSoundRef.current = snd;
        return () => snd.stop();
    }, []);

    // Weapon Upgrade Logic
    const getFireRate = () => {
        const level = status.weaponLevel || 0;
        if (level === 0) return 0.2;
        if (level === 1) return 0.12;
        if (level >= 2) return 0.08;
        return 0.2;
    };

    const FIRE_RATE_MISSILE = 1.0;
    const ACCEL = 100.0;
    const BOOST_MULT = 3.0;
    const MEDIUM_SPEED_MULT = 0.5;
    const MOUSE_SENSITIVITY = 0.0025;
    const BANK_ANGLE = 0.6;

    const MANEUVER_SPEED = 0.8;
    const FLIP_SPEED = 0.5;
    const PLANET_RADIUS = 25000;
    const PLANET_CENTER = new Vector3(0, -PLANET_RADIUS, 0);

    useEffect(() => {
        const currentId = activeSystem ? activeSystem.id : null;
        const prevId = prevSystemRef.current;

        if (shipRef.current) {
            // Only perform "Jump to System" logic if NOT in atmosphere
            if (!inAtmosphere) {
                if (currentId && !prevId) {
                    shipRef.current.position.set(0, 2000, -12000);
                    velocity.current.set(0, 0, 100);
                    shipRef.current.lookAt(0, 0, 0);
                    shipRef.current.rotateY(Math.PI);
                    // Reset camera smooth pos to avoid lerp streaking
                    smoothCameraPos.current.set(0, 2100, -11900);
                } else if (!currentId && prevId) {
                    shipRef.current.position.set(0, 100, 2000);
                    velocity.current.set(0, 0, 0);
                    smoothCameraPos.current.set(0, 150, 2100);
                }
            } else if (!prevId && inAtmosphere) {
                // Initial Atmospheric placement if needed
                smoothCameraPos.current.set(status.position[0], status.position[1] + 50, status.position[2] + 100);
                shipRef.current.position.set(status.position[0], status.position[1], status.position[2]);
            }
        }
        prevSystemRef.current = currentId;
    }, [activeSystem, inAtmosphere]);

    useEffect(() => {
        if (playerHealth > prevHealthRef.current) {
            healFlashTime.current = 1.0;
        }
        prevHealthRef.current = playerHealth;
    }, [playerHealth]);

    useFrame((state, delta) => {
        if (!shipRef.current) return;
        if (paused) return; // Physics pause

        // Safety check for delta to prevent explosion
        const dt = Math.min(delta, 0.1);

        const input = controlsRef.current;
        const time = state.clock.getElapsedTime();
        const flightAssist = input.flightAssist;

        // --- AUDIO ALERTS ---
        if (targetingStatus.missileTracking) {
            missileAlertTimer.current -= dt;
            if (missileAlertTimer.current <= 0) {
                playMissileAlertSound();
                missileAlertTimer.current = 0.15;
            }
        } else if (targetingStatus.locked) {
            lockWarningTimer.current -= dt;
            if (lockWarningTimer.current <= 0) {
                playLockWarningSound();
                lockWarningTimer.current = 0.5;
            }
        }

        // --- MANEUVER LOGIC (Trigger) ---
        if (maneuverState.current === 'NONE' && input.active) {
            if (input.verticalFlip && input.boost) {
                maneuverState.current = 'FLIP_180';
                maneuverProgress.current = 0;
            } else if (input.barrelRoll !== 0) {
                maneuverState.current = input.barrelRoll > 0 ? 'ROLL_RIGHT' : 'ROLL_LEFT';
                maneuverProgress.current = 0;
            } else if (input.verticalFlip) {
                maneuverState.current = 'LOOP';
                maneuverProgress.current = 0;
            } else if (input.dropChaff && chaffTimer.current <= 0) {
                chaffTimer.current = 0.5;
                playChaffSound();
                onChaff();
            }
        }

        let isApproaching = false;

        const isManeuvering = maneuverState.current !== 'NONE';
        const inputActive = !isApproaching && !autopilot && !cinematicMode.active && !isManeuvering;

        let autoBoost = false;
        const isBoosting = autoBoost || (inputActive && input.boost) || (maneuverState.current === 'FLIP_180');
        const isMediumSpeed = inputActive && input.mediumSpeed;

        if (isBoosting !== boosting) {
            setBoosting(isBoosting);
            if (onBoostChange) onBoostChange(isBoosting);
        }

        if (camera instanceof PerspectiveCamera) {
            const targetFOV = isBoosting ? 95 : isMediumSpeed ? 55 : 60;
            camera.fov = MathUtils.lerp(camera.fov, targetFOV, dt * 3);
            camera.updateProjectionMatrix();
        }

        const targetColor = isBoosting ? '#a5f3fc' : (isMediumSpeed ? '#f59e0b' : '#60a5fa');
        engineColor.current.lerp(new Color(targetColor), dt * 6);

        // --- MANEUVER UPDATE ---
        if (isManeuvering) {
            const speed = maneuverState.current === 'FLIP_180' ? FLIP_SPEED : MANEUVER_SPEED;
            maneuverProgress.current += dt * speed;
            const p = maneuverProgress.current;

            if (p >= 1) {
                if (maneuverState.current === 'FLIP_180') {
                    const newForward = new Vector3(0, 0, -1).applyQuaternion(shipRef.current.quaternion);
                    const speedVal = velocity.current.length();
                    velocity.current.copy(newForward.multiplyScalar(speedVal));
                }
                maneuverState.current = 'NONE';
            } else {
                if (maneuverState.current === 'FLIP_180') {
                    const pitchAmt = dt * speed * Math.PI;
                    const rollAmt = dt * speed * Math.PI;
                    shipRef.current.rotateX(pitchAmt);
                    shipRef.current.rotateZ(rollAmt);
                    const pitchAxis = new Vector3(1, 0, 0).applyQuaternion(shipRef.current.quaternion);
                    velocity.current.applyAxisAngle(pitchAxis, pitchAmt);
                } else if (maneuverState.current === 'ROLL_LEFT' || maneuverState.current === 'ROLL_RIGHT') {
                    const dir = maneuverState.current === 'ROLL_RIGHT' ? -1 : 1;
                    const rotAmt = dt * speed * Math.PI * 2 * dir;
                    shipRef.current.rotateZ(rotAmt);
                } else if (maneuverState.current === 'LOOP') {
                    const rotAmt = dt * speed * Math.PI * 2;
                    shipRef.current.rotateX(rotAmt);
                }
            }
        } else if (inputActive && input.active) {
            // --- NORMAL MOUSE STEERING ---
            let jitterX = 0;
            let jitterY = 0;

            // Turbulence in Atmosphere
            if (inAtmosphere && velocity.current.length() > 50) {
                const turbStrength = 0.2 + (velocity.current.length() / 500);
                jitterX = (Math.random() - 0.5) * turbStrength;
                jitterY = (Math.random() - 0.5) * turbStrength;
            }

            const yawChange = -(input.mouse.x + jitterX) * MOUSE_SENSITIVITY;
            const pitchChange = -(input.mouse.y + jitterY) * MOUSE_SENSITIVITY;

            const qYaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yawChange);
            const qPitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitchChange);

            shipRef.current.quaternion.multiply(qPitch);
            shipRef.current.quaternion.premultiply(qYaw);

            const targetRoll = -(input.mouse.x + jitterX) * 20.0;
            const currentEuler = new Euler().setFromQuaternion(shipRef.current.quaternion, 'YXZ');
            currentEuler.z = MathUtils.lerp(currentEuler.z, MathUtils.clamp(targetRoll, -BANK_ANGLE, BANK_ANGLE), dt * 5);
            shipRef.current.quaternion.setFromEuler(currentEuler);

            input.mouse.x = 0;
            input.mouse.y = 0;
        }

        // --- MOVEMENT PHYSICS ---
        if (!isApproaching) {
            let thrust = 0;
            let strafeX = 0;
            let strafeY = 0;
            if (autopilot) {
                // Auto hover/land logic when won
                velocity.current.multiplyScalar(0.95);
            } else if (inputActive) {
                thrust = -input.move.z;
                strafeX = input.move.x;
                strafeY = input.move.y;
            } else if (isManeuvering && maneuverState.current === 'FLIP_180') {
                thrust = -1.0;
            }
            if (cinematicMode.active) thrust = 0;
            if (isMediumSpeed && !isBoosting) {
                thrust *= 0.6;
            }

            const accelInput = new Vector3(strafeX * 0.6, strafeY * 0.6, thrust);
            let speedMult = ACCEL;
            if (isBoosting) speedMult *= BOOST_MULT;

            const accelWorld = accelInput.clone().multiplyScalar(speedMult * dt).applyQuaternion(shipRef.current.quaternion);
            velocity.current.add(accelWorld);

            const invQuat = shipRef.current.quaternion.clone().invert();
            const localVel = velocity.current.clone().applyQuaternion(invQuat);

            if (flightAssist) {
                const DRAG_LATERAL = 3.0;
                const DRAG_FORWARD = 1.0;
                localVel.x = MathUtils.lerp(localVel.x, 0, dt * DRAG_LATERAL);
                localVel.y = MathUtils.lerp(localVel.y, 0, dt * DRAG_LATERAL);
                localVel.z = MathUtils.lerp(localVel.z, 0, dt * DRAG_FORWARD);
            } else {
                const DRAG_SPACE = 0.05;
                localVel.multiplyScalar(1 - DRAG_SPACE * dt);
            }

            velocity.current = localVel.applyQuaternion(shipRef.current.quaternion);
        }

        shipRef.current.position.add(velocity.current.clone().multiplyScalar(dt));

        // --- COLLISIONS ---
        if (inAtmosphere && (time - lastCollisionTime.current > 0.5)) {
            // 1. Ground Collision (Topographical)
            const shipPos = shipRef.current.position;
            const terrainHeight = getHeight(shipPos.x, shipPos.z);
            const buffer = 4;

            if (shipPos.y < terrainHeight + buffer) {
                const impactSpeed = velocity.current.length();
                const normal = new Vector3(0, 1, 0); // Upward for plane-based terrain

                // Push out
                shipRef.current.position.y = terrainHeight + buffer;

                if (impactSpeed > 20) {
                    if (onCrash) onCrash();
                    playImpactSound();
                    // Bounce
                    const vNorm = velocity.current.clone().projectOnVector(normal);
                    velocity.current.sub(vNorm.multiplyScalar(1.5));
                    velocity.current.multiplyScalar(0.5); // Friction
                } else {
                    velocity.current.multiplyScalar(0.8);
                    if (velocity.current.y < 0) velocity.current.y = 0;
                }
                lastCollisionTime.current = time;
            }

            // 2. Building Collision
            if (buildingsRef && buildingsRef.current && shipRef.current.position.y < 600) {
                for (const b of buildingsRef.current) {
                    // Fast check
                    if (Math.abs(shipPos.x - b.position.x) > b.width + 10) continue;
                    if (Math.abs(shipPos.z - b.position.z) > b.depth + 10) continue;

                    // Detailed Local AABB
                    const dx = shipPos.x - b.position.x;
                    const dy = shipPos.y - b.position.y;
                    const dz = shipPos.z - b.position.z;

                    const cos = Math.cos(-b.rotationY);
                    const sin = Math.sin(-b.rotationY);
                    const localX = dx * cos - dz * sin;
                    const localZ = dx * sin + dz * cos;

                    if (Math.abs(localX) < b.width / 2 + 3 &&
                        Math.abs(localZ) < b.depth / 2 + 3 &&
                        Math.abs(dy) < b.height / 2 + 3) {

                        // Hit Building
                        playImpactSound();
                        velocity.current.multiplyScalar(-0.4); // Bounce back
                        shipRef.current.position.add(velocity.current.clone().multiplyScalar(0.2));
                        if (onHeatIncrease) onHeatIncrease(10, "PROPERTY DAMAGE");
                        lastCollisionTime.current = time;
                        break;
                    }
                }
            }

            // 3. Traffic Collision
            if (trafficRef && trafficRef.current) {
                for (const t of trafficRef.current) {
                    if (!t.active) continue;
                    if (shipPos.distanceTo(t.position) < 10) {
                        t.active = false; // Destroy commuter
                        playImpactSound();
                        velocity.current.multiplyScalar(0.7); // Impact slow
                        if (onHeatIncrease) onHeatIncrease(40, "VEHICULAR MANSLAUGHTER");
                        lastCollisionTime.current = time;
                        break;
                    }
                }
            }
        }


        if (chaffTimer.current > 0) {
            chaffTimer.current -= dt;
            if (chaffParticlesRef.current) {
                chaffParticlesRef.current.visible = true;
                chaffParticlesRef.current.rotation.z += dt * 5;
                chaffParticlesRef.current.scale.addScalar(dt * 10);
            }
        } else {
            if (chaffParticlesRef.current) {
                chaffParticlesRef.current.visible = false;
                chaffParticlesRef.current.scale.set(1, 1, 1);
            }
        }

        // --- ENGINE VISUALS ---
        const forwardVec = new Vector3(0, 0, -1).applyQuaternion(shipRef.current.quaternion);
        const forwardSpeed = velocity.current.dot(forwardVec);
        const forwardSpeedRatio = Math.max(0, forwardSpeed) / (ACCEL * 2);
        const plumeLen = 0.9 + (isBoosting ? 3.5 : forwardSpeedRatio * 2.0);
        plumeScale.current.set(1, 1, plumeLen);

        if (engineLeftMatRef.current) engineLeftMatRef.current.color.copy(engineColor.current);
        if (engineRightMatRef.current) engineRightMatRef.current.color.copy(engineColor.current);
        if (leftPlumeRef.current) leftPlumeRef.current.scale.lerp(plumeScale.current, dt * 10);
        if (rightPlumeRef.current) rightPlumeRef.current.scale.lerp(plumeScale.current, dt * 10);
        if (engineSoundRef.current) engineSoundRef.current.update(Math.min(forwardSpeedRatio, 1), isBoosting);

        if (shieldMeshRef.current) {
            shieldMeshRef.current.visible = status.shieldActive;
            if (status.shieldActive) {
                shieldMeshRef.current.rotation.y += dt * 0.5;
                shieldMeshRef.current.rotation.z += dt * 0.2;
                const s = 1.2 + Math.sin(time * 5) * 0.02;
                shieldMeshRef.current.scale.set(s, s, s);
            }
        }

        // --- ENTRY HEAT & HIGH ALT TURBULENCE ---
        let entryTurb = 0;
        if (inAtmosphere && status.altitude > 4000) {
            const heatIntensity = MathUtils.clamp((status.altitude - 4000) / 4500, 0, 1);
            if (entryHeatRef.current) {
                entryHeatRef.current.visible = true;
                const heatMat = entryHeatRef.current.material as THREE.MeshBasicMaterial;
                heatMat.opacity = heatIntensity * 0.4 * (1 + Math.sin(time * 15) * 0.2);
                const s = 1.0 + heatIntensity * 0.2;
                entryHeatRef.current.scale.set(s, s, s);
            }
            entryTurb = (Math.random() - 0.5) * heatIntensity * (velocity.current.length() / 200);
        } else if (entryHeatRef.current) {
            entryHeatRef.current.visible = false;
        }

        // --- LANDING GEAR ---
        if (cinematicMode.active && cinematicMode.type === 'LANDING') {
            if (landingGearRef.current) {
                landingGearRef.current.visible = true;
                landingAnimProgress.current = Math.min(1, landingAnimProgress.current + dt * 0.5);
                landingGearRef.current.scale.y = landingAnimProgress.current;
                landingGearRef.current.position.y = -landingAnimProgress.current * 0.5;
            }
        } else {
            landingAnimProgress.current = 0;
            if (landingGearRef.current) landingGearRef.current.visible = false;
        }

        // --- WEAPONS FIRE ---
        if (onFire && !cinematicMode.active) {
            if (input.firePrimary && time - lastFireTime.current > getFireRate()) {
                lastFireTime.current = time;
                // Offset for Wing Lasers
                const offsetLeft = new Vector3(-8.4, -0.6, -12).applyQuaternion(shipRef.current.quaternion);
                const offsetRight = new Vector3(8.4, -0.6, -12).applyQuaternion(shipRef.current.quaternion);
                onFire(shipRef.current.position.clone().add(offsetLeft), shipRef.current.quaternion.clone(), 'laser', velocity.current);
                onFire(shipRef.current.position.clone().add(offsetRight), shipRef.current.quaternion.clone(), 'laser', velocity.current);
            }

            if (input.fireSecondary && !isBoosting && time - lastMissileTime.current > FIRE_RATE_MISSILE) {
                lastMissileTime.current = time;
                // MISSILE OFFSET FIX: Move it DOWN and RIGHT for the "eject" feel
                const offset = new Vector3(2.5, -2.0, 1.0).applyQuaternion(shipRef.current.quaternion);
                onFire(shipRef.current.position.clone().add(offset), shipRef.current.quaternion.clone(), 'missile', velocity.current);
            }
        }

        // --- CAMERA UPDATE ---
        if (!cinematicMode.active) {
            const shake = isBoosting ? (Math.random() - 0.5) * 0.12 : 0;
            const turbShake = inAtmosphere ? (Math.random() - 0.5) * (velocity.current.length() / 1000) : 0;

            // Ensure turbulence doesn't break things if velocity is weird
            const safeTurb = isNaN(turbShake) ? 0 : turbShake;

            const invQuat = shipRef.current.quaternion.clone().invert();
            const localVel = velocity.current.clone().applyQuaternion(invQuat);

            const camDist = 80 + (isBoosting ? 15 : 0) + (Math.abs(localVel.z) * 0.1);
            const camHeight = 24 + (Math.abs(localVel.y) * 0.05);

            const smoothFactor = maneuverState.current === 'FLIP_180' ? 10 : 4;

            const idealOffset = new Vector3(0, camHeight, camDist);
            idealOffset.applyQuaternion(shipRef.current.quaternion);
            const idealPos = shipRef.current.position.clone().add(idealOffset);

            // STABLE CAMERA LOGIC:
            // 1. Lerp the smooth container towards target
            smoothCameraPos.current.lerp(idealPos, dt * smoothFactor);

            // 2. Apply position to camera
            camera.position.copy(smoothCameraPos.current);

            // 3. Add shake non-destructively for this frame only
            const shakeVec = new Vector3(shake + safeTurb, shake + safeTurb, 0);
            camera.position.add(shakeVec);

            const lookOffset = new Vector3(0, 0, -50).applyQuaternion(shipRef.current.quaternion);
            const lookTarget = shipRef.current.position.clone().add(lookOffset);

            camera.lookAt(lookTarget);

            if (maneuverState.current === 'LOOP' || maneuverState.current === 'FLIP_180') {
                const upVec = new Vector3(0, 1, 0).applyQuaternion(shipRef.current.quaternion);
                camera.up.lerp(upVec, dt * 10);
            } else {
                camera.up.set(0, 1, 0);
            }
        } else if (cinematicMode.active && cinematicMode.targetPosition) {
            // Cinematic code
            let camPos, targetVec;
            if (cinematicMode.type === 'BOSS_INTRO') {
                const bossPos = new Vector3(...cinematicMode.targetPosition);
                const angle = time * 0.5;
                const dist = 150;
                const camOffset = new Vector3(Math.cos(angle) * dist, 40, Math.sin(angle) * dist);
                camPos = bossPos.clone().add(camOffset);
                camPos.add(new Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5));
                targetVec = bossPos;
            } else {
                camPos = shipRef.current.position.clone().add(new Vector3(0, 10, 30).applyQuaternion(shipRef.current.quaternion));
                targetVec = new Vector3(...cinematicMode.targetPosition);
            }
            camera.position.lerp(camPos, dt * 3);
            const dummy = new THREE.Object3D();
            dummy.position.copy(camera.position);
            dummy.lookAt(targetVec);
            camera.quaternion.slerp(dummy.quaternion, dt * 4);

            // --- SHIP MOVEMENT DURING LANDING ---
            if (cinematicMode.type === 'LANDING') {
                const targetPos = new Vector3(...cinematicMode.targetPosition);
                // Slowly glide ship to the pad
                shipRef.current.position.lerp(targetPos, dt * 0.5);

                // Point nose down slightly then level out
                const distToGround = shipRef.current.position.y - targetPos.y;
                const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(
                    distToGround > 50 ? -0.2 : 0, // Slight pitch down then level
                    shipRef.current.rotation.y,
                    0
                ));
                shipRef.current.quaternion.slerp(targetRot, dt * 1);

                // Kill velocity so it doesn't drift after cinematic
                velocity.current.multiplyScalar(0.9);
            } else if (cinematicMode.type === 'TAKEOFF') {
                const targetPos = new Vector3(...cinematicMode.targetPosition!);

                // Point nose up
                const upRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2.5, shipRef.current.rotation.y, 0));
                shipRef.current.quaternion.slerp(upRot, dt * 1.5);

                // Accelerate upward
                const upwardForce = new Vector3(0, 1, 0).applyQuaternion(shipRef.current.quaternion).multiplyScalar(1500 * dt);
                velocity.current.add(upwardForce);

                // Check for handoff altitude
                const altitude = shipRef.current.position.y;
                if (altitude > 20000 && onTakeoffComplete) {
                    onTakeoffComplete();
                }
            }
        }

        // Status Update
        const speed = velocity.current.length();
        const euler = new Euler().setFromQuaternion(shipRef.current.quaternion, 'YXZ');
        const heading = ((-euler.y * 180) / Math.PI + 360) % 360;

        onUpdateStatus({
            speed: Math.round(speed * 10),
            altitude: Math.round(shipRef.current.position.y),
            heading: Math.round(heading),
            position: [shipRef.current.position.x, shipRef.current.position.y, shipRef.current.position.z],
            flightAssist: flightAssist,
            weaponLevel: status.weaponLevel,
            shieldActive: status.shieldActive
        });
    });

    const gunScale = 1 + (status.weaponLevel * 0.5);

    return (
        <group ref={shipRef}>
            <group ref={chaffParticlesRef} position={[0, 0, 5]} visible={false}>
                <Sparkles count={50} scale={[10, 10, 10]} color="#fbbf24" size={5} speed={0.5} opacity={0.8} />
                <pointLight color="#fbbf24" intensity={2} distance={20} />
            </group>
            <mesh ref={shieldMeshRef} visible={false}>
                <icosahedronGeometry args={[5, 2]} /><meshPhysicalMaterial color="#3b82f6" transparent opacity={0.15} transmission={0.9} roughness={0} metalness={0.9} emissive="#60a5fa" emissiveIntensity={0.5} wireframe={true} />
            </mesh>

            {/* ENTRY HEAT SHROUD */}
            <mesh ref={entryHeatRef} visible={false}>
                <sphereGeometry args={[15, 32, 16]} />
                <meshBasicMaterial color="#ff4400" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>

            <group rotation={[0, Math.PI, 0]} scale={[3, 3, 3]}>
                {/* [Ship Model Geometry Preserved] */}
                <mesh position={[0, 0, -2]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.5, 1.2, 8, 8]} />
                    <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.6} />
                </mesh>
                <mesh position={[0, 0.8, -1]} scale={[0.8, 0.6, 1.5]}>
                    <capsuleGeometry args={[1, 1, 4, 8]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.9} />
                </mesh>
                <mesh position={[0, 0.2, 3]}>
                    <boxGeometry args={[3, 1.5, 3]} />
                    <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.5} />
                </mesh>
                <group position={[-2.5, 0, 2]}>
                    <mesh position={[0.5, 0, 0]} rotation={[0, 0, -0.2]}>
                        <boxGeometry args={[3, 0.2, 4]} />
                        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.5} />
                    </mesh>
                    <mesh position={[-1, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.8, 0.6, 6, 16]} />
                        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.7} />
                    </mesh>
                    <mesh position={[-1, 0, 3.1]}>
                        <circleGeometry args={[0.5, 16]} />
                        <meshBasicMaterial ref={engineLeftMatRef} color="#60a5fa" toneMapped={false} />
                    </mesh>
                    <group ref={leftPlumeRef} position={[-1, 0, 3.2]}>
                        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.6]}>
                            <cylinderGeometry args={[0.4, 0.1, 3.4, 16, 1, true]} />
                            <meshBasicMaterial transparent opacity={0.4} color="#a5f3fc" depthWrite={false} blending={2} />
                        </mesh>
                    </group>
                </group>
                <group position={[2.5, 0, 2]}>
                    <mesh position={[-0.5, 0, 0]} rotation={[0, 0, 0.2]}>
                        <boxGeometry args={[3, 0.2, 4]} />
                        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.5} />
                    </mesh>
                    <mesh position={[1, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.8, 0.6, 6, 16]} />
                        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.7} />
                    </mesh>
                    <mesh position={[1, 0, 3.1]}>
                        <circleGeometry args={[0.5, 16]} />
                        <meshBasicMaterial ref={engineRightMatRef} color="#60a5fa" toneMapped={false} />
                    </mesh>
                    <group ref={rightPlumeRef} position={[1, 0, 3.2]}>
                        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.6]}>
                            <cylinderGeometry args={[0.4, 0.1, 3.4, 16, 1, true]} />
                            <meshBasicMaterial transparent opacity={0.4} color="#a5f3fc" depthWrite={false} blending={2} />
                        </mesh>
                    </group>
                </group>
                <group position={[3.5, -0.2, 0]} scale={[gunScale, gunScale, gunScale]}>
                    <mesh><boxGeometry args={[0.2, 0.2, 3]} /><meshStandardMaterial color="#333" /></mesh>
                    <mesh position={[0, 0, -1.5]}><boxGeometry args={[0.1, 0.1, 1]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" /></mesh>
                </group>
                <group position={[-3.5, -0.2, 0]} scale={[gunScale, gunScale, gunScale]}>
                    <mesh><boxGeometry args={[0.2, 0.2, 3]} /><meshStandardMaterial color="#333" /></mesh>
                    <mesh position={[0, 0, -1.5]}><boxGeometry args={[0.1, 0.1, 1]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" /></mesh>
                </group>
                <mesh position={[0, 0.51, -2]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.8, 4]} />
                    <meshStandardMaterial color="#ef4444" roughness={0.8} />
                </mesh>

                {/* LANDING GEAR */}
                <group ref={landingGearRef} visible={false} position={[0, -1, 0]}>
                    <group position={[0, 0, -5]}> {/* Front */}
                        <mesh position={[0, -1, 0]}><boxGeometry args={[0.2, 2, 0.2]} /><meshStandardMaterial color="#475569" /></mesh>
                        <mesh position={[0, -2, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.5, 0.5, 1, 16]} /><meshStandardMaterial color="#1e293b" /></mesh>
                    </group>
                    <group position={[-3, 0, 2]}> {/* Left Rear */}
                        <mesh position={[0, -1, 0]}><boxGeometry args={[0.2, 2, 0.2]} /><meshStandardMaterial color="#475569" /></mesh>
                        <mesh position={[0, -2, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.5, 0.5, 1, 16]} /><meshStandardMaterial color="#1e293b" /></mesh>
                    </group>
                    <group position={[3, 0, 2]}> {/* Right Rear */}
                        <mesh position={[0, -1, 0]}><boxGeometry args={[0.2, 2, 0.2]} /><meshStandardMaterial color="#475569" /></mesh>
                        <mesh position={[0, -2, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.5, 0.5, 1, 16]} /><meshStandardMaterial color="#1e293b" /></mesh>
                    </group>
                </group>
            </group>

            <group position={[0, 0.2, 6]}><Sparkles count={boosting ? 60 : 20} scale={[4, 1, 8]} size={4} speed={2} opacity={0.3} color="#a5f3fc" /></group>
        </group>
    );
};