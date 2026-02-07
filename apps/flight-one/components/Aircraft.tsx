
import React, { useRef, useState, useEffect, MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Group, Euler, Color, MathUtils, Matrix4 } from 'three';
import { Sparkles } from '@react-three/drei';
import { useFlightControls } from './Controls';
import { FlightStatus, WeaponType, SystemNode, CinematicState, TargetDynamics, Target } from '../types';
import { EngineSound, playChaffSound, playLockWarningSound, playMissileAlertSound } from '../utils/audio';
import { PerspectiveCamera } from 'three';
import * as THREE from 'three';


interface AircraftProps {
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
}

type ManeuverState = 'NONE' | 'ROLL_LEFT' | 'ROLL_RIGHT' | 'LOOP' | 'FLIP_180';

export const Aircraft: React.FC<AircraftProps> = ({
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
  targetingStatus
}) => {
  const shipRef = useRef<Group>(null);
  const controlsRef = useFlightControls();
  const { camera } = useThree();

  const prevSystemRef = useRef<string | null>(null);
  const [boosting, setBoosting] = useState(false);

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
  const hullMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
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

  useEffect(() => {
    const snd = new EngineSound();
    snd.start();
    engineSoundRef.current = snd;
    return () => snd.stop();
  }, []);

  const velocity = useRef(new Vector3(0, 0, 0));
  const lastFireTime = useRef(0);
  const lastMissileTime = useRef(0);

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
  const BANK_ANGLE = 0.6; // Increased bank for more "flight" feel
  
  const MANEUVER_SPEED = 0.8; 
  const FLIP_SPEED = 0.5; // Slower, approx 2.0s duration

  useEffect(() => {
    const currentId = activeSystem ? activeSystem.id : null;
    const prevId = prevSystemRef.current;

    if (shipRef.current) {
      if (currentId && !prevId) {
        shipRef.current.position.set(0, 2000, -12000);
        velocity.current.set(0, 0, 100);
        shipRef.current.lookAt(0, 0, 0);
        shipRef.current.rotateY(Math.PI);
      } else if (!currentId && prevId) {
        shipRef.current.position.set(0, 100, 2000);
        velocity.current.set(0, 0, 0);
      }
    }
    prevSystemRef.current = currentId;
  }, [activeSystem]);

  useEffect(() => {
      if (playerHealth > prevHealthRef.current) {
          healFlashTime.current = 1.0; 
      }
      prevHealthRef.current = playerHealth;
  }, [playerHealth]);

  useFrame((state, delta) => {
    if (!shipRef.current) return;

    const input = controlsRef.current;
    const time = state.clock.getElapsedTime();
    const flightAssist = input.flightAssist;

    // --- AUDIO ALERTS ---
    if (targetingStatus.missileTracking) {
        missileAlertTimer.current -= delta;
        if (missileAlertTimer.current <= 0) {
            playMissileAlertSound();
            missileAlertTimer.current = 0.15; 
        }
    } else if (targetingStatus.locked) {
        lockWarningTimer.current -= delta;
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

    let autoMoveZ = 0;
    let autoBoost = false;
    let autoSteer = false;
    let isApproaching = false;

    if (dockingTarget && targetDynamicsRef && !cinematicMode.active) {
        isApproaching = true;
        autoSteer = true;
        
        const targetPos = targetDynamicsRef.current.position;
        const targetVel = targetDynamicsRef.current.velocity;
        const currentPos = shipRef.current.position;
        
        const toTarget = targetPos.clone().sub(currentPos);
        const dist = toTarget.length();
        const targetRadius = (dockingTarget.radius || 100) + 50; 
        
        const targetRotation = new Quaternion();
        const m = new Matrix4().lookAt(currentPos, targetPos, new Vector3(0, 1, 0));
        targetRotation.setFromRotationMatrix(m);
        const flip = new Quaternion().setFromAxisAngle(new Vector3(0,1,0), Math.PI);
        targetRotation.multiply(flip);
        
        shipRef.current.quaternion.slerp(targetRotation, 3.0 * delta);

        let approachSpeed = Math.max(0, (dist - targetRadius) * 0.5); 
        approachSpeed = Math.min(approachSpeed, 100); 

        const desiredVelocity = targetVel.clone().add(toTarget.normalize().multiplyScalar(approachSpeed));
        velocity.current.lerp(desiredVelocity, 2.0 * delta);
    }
    else if (autopilot && navTarget && !cinematicMode.active) {
      autoSteer = true;
      const currentPos = shipRef.current.position;
      const toTarget = navTarget.clone().sub(currentPos);
      const distanceToTarget = toTarget.length();

      if (distanceToTarget < 500) {
        onAutopilotDisengage();
      } else {
        const targetRotation = new Quaternion();
        const m = new Matrix4().lookAt(currentPos, navTarget, new Vector3(0, 1, 0));
        targetRotation.setFromRotationMatrix(m);
        const flip = new Quaternion().setFromAxisAngle(new Vector3(0,1,0), Math.PI);
        targetRotation.multiply(flip);
        
        shipRef.current.quaternion.slerp(targetRotation, 2.0 * delta);
        autoMoveZ = 1.0;
        if (distanceToTarget > 1000) autoBoost = true;
      }
    }

    const isManeuvering = maneuverState.current !== 'NONE';
    const inputActive = !isApproaching && !autopilot && !cinematicMode.active && !isManeuvering;
    
    const isBoosting = autoBoost || (inputActive && input.boost) || (maneuverState.current === 'FLIP_180');
    const isMediumSpeed = inputActive && input.mediumSpeed;
    
    if (isBoosting !== boosting) setBoosting(isBoosting);

    if (camera instanceof PerspectiveCamera) {
        const targetFOV = isBoosting ? 95 : isMediumSpeed ? 55 : 60;
        camera.fov = MathUtils.lerp(camera.fov, targetFOV, delta * 3);
        camera.updateProjectionMatrix();
    }

    const targetColor = isBoosting ? '#a5f3fc' : (isMediumSpeed ? '#f59e0b' : '#60a5fa');
    engineColor.current.lerp(new Color(targetColor), delta * 6);

    // --- MANEUVER UPDATE (Seized Controls) ---
    if (isManeuvering) {
        const speed = maneuverState.current === 'FLIP_180' ? FLIP_SPEED : MANEUVER_SPEED;
        maneuverProgress.current += delta * speed;
        const p = maneuverProgress.current;

        if (p >= 1) {
            // Maneuver Complete
            if (maneuverState.current === 'FLIP_180') {
                 // Force alignment to new forward vector to correct any drift
                 const newForward = new Vector3(0,0,-1).applyQuaternion(shipRef.current.quaternion);
                 const speedVal = velocity.current.length();
                 velocity.current.copy(newForward.multiplyScalar(speedVal));
            }
            maneuverState.current = 'NONE';
        } else {
            if (maneuverState.current === 'FLIP_180') {
                // Pitch up 180 AND Roll 180 (Immelmann Turn)
                const pitchAmt = delta * speed * Math.PI; 
                const rollAmt = delta * speed * Math.PI; 
                
                shipRef.current.rotateX(pitchAmt);
                shipRef.current.rotateZ(rollAmt);

                // Redirect velocity vector along with the pitch to simulate "flying the turn"
                const pitchAxis = new Vector3(1,0,0).applyQuaternion(shipRef.current.quaternion);
                velocity.current.applyAxisAngle(pitchAxis, pitchAmt);
                
            } else if (maneuverState.current === 'ROLL_LEFT' || maneuverState.current === 'ROLL_RIGHT') {
                const dir = maneuverState.current === 'ROLL_RIGHT' ? -1 : 1;
                const rotAmt = delta * speed * Math.PI * 2 * dir; 
                shipRef.current.rotateZ(rotAmt);
            } else if (maneuverState.current === 'LOOP') {
                const rotAmt = delta * speed * Math.PI * 2;
                shipRef.current.rotateX(rotAmt);
            }
        }
    } else if (inputActive && input.active) {
        // --- NORMAL MOUSE STEERING ---
        let jitterX = 0;
        let jitterY = 0;
        
        if (activeTargets.length > 0) {
            const forward = new Vector3(0, 0, -1).applyQuaternion(shipRef.current.quaternion);
            for (const tgt of activeTargets) {
                const dirToTgt = new Vector3(...tgt.position).sub(shipRef.current.position).normalize();
                const dot = forward.dot(dirToTgt);
                if (dot > 0.995) {
                    const strength = 8.0; 
                    jitterX = (Math.random() - 0.5) * strength;
                    jitterY = (Math.random() - 0.5) * strength;
                    break; 
                }
            }
        }

        const yawChange = -(input.mouse.x + jitterX) * MOUSE_SENSITIVITY;
        const pitchChange = -(input.mouse.y + jitterY) * MOUSE_SENSITIVITY;

        const qYaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yawChange);
        const qPitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitchChange);
        
        shipRef.current.quaternion.multiply(qPitch);
        shipRef.current.quaternion.premultiply(qYaw);

        const targetRoll = -(input.mouse.x + jitterX) * 20.0;
        const currentEuler = new Euler().setFromQuaternion(shipRef.current.quaternion, 'YXZ');
        currentEuler.z = MathUtils.lerp(currentEuler.z, MathUtils.clamp(targetRoll, -BANK_ANGLE, BANK_ANGLE), delta * 5);
        shipRef.current.quaternion.setFromEuler(currentEuler);

        input.mouse.x = 0;
        input.mouse.y = 0;
    }

    if (!isApproaching) {
        let thrust = 0;
        let strafeX = 0;
        let strafeY = 0;

        if (autopilot) {
            thrust = -autoMoveZ;
        } else if (inputActive) {
            thrust = -input.move.z;
            strafeX = input.move.x;
            strafeY = input.move.y;
        } else if (isManeuvering && maneuverState.current === 'FLIP_180') {
             // Force forward thrust during the loop/turn
             thrust = -1.0; 
        }

        if (cinematicMode.active) thrust = 0; 

        if (isMediumSpeed && !isBoosting) {
            thrust *= 0.6;
        }

        const accelInput = new Vector3(strafeX * 0.6, strafeY * 0.6, thrust);
        
        let speedMult = ACCEL;
        if (isBoosting) speedMult *= BOOST_MULT;
        
        const accelWorld = accelInput.clone().multiplyScalar(speedMult * delta).applyQuaternion(shipRef.current.quaternion);
        velocity.current.add(accelWorld);

        const invQuat = shipRef.current.quaternion.clone().invert();
        const localVel = velocity.current.clone().applyQuaternion(invQuat);

        if (flightAssist) {
            const DRAG_LATERAL = 3.0;
            const DRAG_FORWARD = 1.0; 
            localVel.x = MathUtils.lerp(localVel.x, 0, delta * DRAG_LATERAL);
            localVel.y = MathUtils.lerp(localVel.y, 0, delta * DRAG_LATERAL);
            localVel.z = MathUtils.lerp(localVel.z, 0, delta * DRAG_FORWARD);
        } else {
            const DRAG_SPACE = 0.05;
            localVel.multiplyScalar(1 - DRAG_SPACE * delta);
        }
        
        if (flightAssist && isMediumSpeed && !isBoosting) {
             const MAX_MED_SPEED = ACCEL * MEDIUM_SPEED_MULT;
             if (Math.abs(localVel.z) > MAX_MED_SPEED) {
                 localVel.z = MathUtils.lerp(localVel.z, Math.sign(localVel.z) * MAX_MED_SPEED, delta * 5);
             }
        }

        velocity.current = localVel.applyQuaternion(shipRef.current.quaternion);
    } 
    
    shipRef.current.position.add(velocity.current.clone().multiplyScalar(delta));

    if (chaffTimer.current > 0) {
        chaffTimer.current -= delta;
        if (chaffParticlesRef.current) {
            chaffParticlesRef.current.visible = true;
            chaffParticlesRef.current.rotation.z += delta * 5;
            chaffParticlesRef.current.scale.addScalar(delta * 10);
        }
    } else {
        if (chaffParticlesRef.current) {
             chaffParticlesRef.current.visible = false;
             chaffParticlesRef.current.scale.set(1,1,1);
        }
    }

    const forwardVec = new Vector3(0,0,-1).applyQuaternion(shipRef.current.quaternion);
    const forwardSpeed = velocity.current.dot(forwardVec);
    const forwardSpeedRatio = Math.max(0, forwardSpeed) / (ACCEL * 2);
    const plumeLen = 0.9 + (isBoosting ? 3.5 : forwardSpeedRatio * 2.0);
    plumeScale.current.set(1, 1, plumeLen);

    if (engineLeftMatRef.current) engineLeftMatRef.current.color.copy(engineColor.current);
    if (engineRightMatRef.current) engineRightMatRef.current.color.copy(engineColor.current);
    if (leftPlumeRef.current) leftPlumeRef.current.scale.lerp(plumeScale.current, delta * 10);
    if (rightPlumeRef.current) rightPlumeRef.current.scale.lerp(plumeScale.current, delta * 10);
    if (engineSoundRef.current) engineSoundRef.current.update(Math.min(forwardSpeedRatio, 1), isBoosting);
    if (shieldMeshRef.current) {
        shieldMeshRef.current.visible = status.shieldActive;
        if (status.shieldActive) {
            shieldMeshRef.current.rotation.y += delta * 0.5;
            shieldMeshRef.current.rotation.z += delta * 0.2;
            const s = 1.2 + Math.sin(time * 5) * 0.02;
            shieldMeshRef.current.scale.set(s, s, s);
        }
    }

    if (hullMaterialRef.current) {
        if (healFlashTime.current > 0) {
            healFlashTime.current -= delta * 2;
            hullMaterialRef.current.emissive.set('#4ade80'); 
            hullMaterialRef.current.emissiveIntensity = healFlashTime.current + 0.5;
        } else {
            hullMaterialRef.current.emissive.set('#3b82f6'); 
            hullMaterialRef.current.emissiveIntensity = 0.5; 
        }
    }

    if (onFire && !cinematicMode.active) {
      if (input.firePrimary && time - lastFireTime.current > getFireRate()) {
        lastFireTime.current = time;
        // Adjusted for new ship model width
        const offsetLeft = new Vector3(-2.8, -0.2, -4).applyQuaternion(shipRef.current.quaternion);
        const offsetRight = new Vector3(2.8, -0.2, -4).applyQuaternion(shipRef.current.quaternion);
        onFire(shipRef.current.position.clone().add(offsetLeft), shipRef.current.quaternion.clone(), 'laser', velocity.current);
        onFire(shipRef.current.position.clone().add(offsetRight), shipRef.current.quaternion.clone(), 'laser', velocity.current);
      }
      
      if (input.fireSecondary && !isBoosting && time - lastMissileTime.current > FIRE_RATE_MISSILE) {
        lastMissileTime.current = time;
        const offset = new Vector3(0, -1.0, -2).applyQuaternion(shipRef.current.quaternion);
        onFire(shipRef.current.position.clone().add(offset), shipRef.current.quaternion.clone(), 'missile', velocity.current);
      }
    }

    // --- CINEMATIC & BOSS INTRO CAMERA ---
    if (cinematicMode.active && cinematicMode.targetPosition) {
        let camPos, targetVec;
        
        if (cinematicMode.type === 'BOSS_INTRO') {
            // Boss Intro: Camera detached, shaking, looking at boss
            const bossPos = new Vector3(...cinematicMode.targetPosition);
            // Orbit position relative to boss
            const angle = time * 0.5;
            const dist = 150;
            const camOffset = new Vector3(Math.cos(angle)*dist, 40, Math.sin(angle)*dist);
            camPos = bossPos.clone().add(camOffset);
            
            // Shake
            camPos.add(new Vector3((Math.random()-0.5)*5, (Math.random()-0.5)*5, (Math.random()-0.5)*5));
            targetVec = bossPos;
        } else {
            // Normal Cinematic
            camPos = shipRef.current.position.clone().add(new Vector3(0, 10, 30).applyQuaternion(shipRef.current.quaternion));
            targetVec = new Vector3(...cinematicMode.targetPosition);
        }
        
        camera.position.lerp(camPos, delta * 3);
        const dummy = new THREE.Object3D();
        dummy.position.copy(camera.position);
        dummy.lookAt(targetVec);
        camera.quaternion.slerp(dummy.quaternion, delta * 4);
        
    } else {
        const shake = isBoosting ? (Math.random() - 0.5) * 0.12 : 0;
        const invQuat = shipRef.current.quaternion.clone().invert();
        const localVel = velocity.current.clone().applyQuaternion(invQuat);
        
        const camDist = 28 + (isBoosting ? 5 : 0) + (Math.abs(localVel.z) * 0.05);
        const camHeight = 8 + (Math.abs(localVel.y) * 0.02);
        
        // During 180 flip, lock camera tighter to orientation so player feels the rotation
        const smoothFactor = maneuverState.current === 'FLIP_180' ? 10 : 4;
        
        const idealOffset = new Vector3(0, camHeight, camDist);
        idealOffset.applyQuaternion(shipRef.current.quaternion);
        const idealPos = shipRef.current.position.clone().add(idealOffset);
        camera.position.lerp(idealPos, delta * smoothFactor);
        
        const lookOffset = new Vector3(0, 0, -50).applyQuaternion(shipRef.current.quaternion);
        const lookTarget = shipRef.current.position.clone().add(lookOffset);
        
        camera.position.add(new Vector3(shake, shake, 0));
        camera.lookAt(lookTarget);
        
        if (maneuverState.current === 'LOOP' || maneuverState.current === 'FLIP_180') {
             // Tightly couple up-vector during loops/flips to prevent gimble lock visual issues
             const upVec = new Vector3(0,1,0).applyQuaternion(shipRef.current.quaternion);
             camera.up.lerp(upVec, delta * 10);
        } else {
             camera.up.set(0,1,0);
        }
    }

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
      
      {/* --- NEW SHIP DESIGN: "STAR-VIPER" --- */}
      <group rotation={[0, Math.PI, 0]}>
         
         {/* Main Fuselage (Long Nose) */}
         <mesh position={[0, 0, -2]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.5, 1.2, 8, 8]} />
             <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.6} />
         </mesh>

         {/* Cockpit Canopy */}
         <mesh position={[0, 0.8, -1]} scale={[0.8, 0.6, 1.5]}>
             <capsuleGeometry args={[1, 1, 4, 8]} />
             <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.9} />
         </mesh>

         {/* Rear Engine Block */}
         <mesh position={[0, 0.2, 3]}>
             <boxGeometry args={[3, 1.5, 3]} />
             <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.5} />
         </mesh>

         {/* Left Wing & Engine */}
         <group position={[-2.5, 0, 2]}>
             {/* Wing Strut */}
             <mesh position={[0.5, 0, 0]} rotation={[0, 0, -0.2]}>
                 <boxGeometry args={[3, 0.2, 4]} />
                 <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.5} />
             </mesh>
             {/* Engine Nacelle */}
             <mesh position={[-1, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
                 <cylinderGeometry args={[0.8, 0.6, 6, 16]} />
                 <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.7} />
             </mesh>
             {/* Engine Glow */}
             <mesh position={[-1, 0, 3.1]}>
                 <circleGeometry args={[0.5, 16]} />
                 <meshBasicMaterial ref={engineLeftMatRef} color="#60a5fa" toneMapped={false} />
             </mesh>
             {/* Plume */}
             <group ref={leftPlumeRef} position={[-1, 0, 3.2]}>
                 <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 1.6]}>
                     <cylinderGeometry args={[0.4, 0.1, 3.4, 16, 1, true]} />
                     <meshBasicMaterial transparent opacity={0.4} color="#a5f3fc" depthWrite={false} blending={2} />
                 </mesh>
             </group>
         </group>

         {/* Right Wing & Engine */}
         <group position={[2.5, 0, 2]}>
             {/* Wing Strut */}
             <mesh position={[-0.5, 0, 0]} rotation={[0, 0, 0.2]}>
                 <boxGeometry args={[3, 0.2, 4]} />
                 <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.5} />
             </mesh>
             {/* Engine Nacelle */}
             <mesh position={[1, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
                 <cylinderGeometry args={[0.8, 0.6, 6, 16]} />
                 <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.7} />
             </mesh>
             {/* Engine Glow */}
             <mesh position={[1, 0, 3.1]}>
                 <circleGeometry args={[0.5, 16]} />
                 <meshBasicMaterial ref={engineRightMatRef} color="#60a5fa" toneMapped={false} />
             </mesh>
             {/* Plume */}
             <group ref={rightPlumeRef} position={[1, 0, 3.2]}>
                 <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 1.6]}>
                     <cylinderGeometry args={[0.4, 0.1, 3.4, 16, 1, true]} />
                     <meshBasicMaterial transparent opacity={0.4} color="#a5f3fc" depthWrite={false} blending={2} />
                 </mesh>
             </group>
         </group>

         {/* Weapon Mounts */}
         <group position={[3.5, -0.2, 0]} scale={[gunScale, gunScale, gunScale]}>
             <mesh><boxGeometry args={[0.2, 0.2, 3]} /><meshStandardMaterial color="#333" /></mesh>
             <mesh position={[0,0,-1.5]}><boxGeometry args={[0.1, 0.1, 1]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" /></mesh>
         </group>
         <group position={[-3.5, -0.2, 0]} scale={[gunScale, gunScale, gunScale]}>
             <mesh><boxGeometry args={[0.2, 0.2, 3]} /><meshStandardMaterial color="#333" /></mesh>
             <mesh position={[0,0,-1.5]}><boxGeometry args={[0.1, 0.1, 1]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" /></mesh>
         </group>

         {/* Decals / Stripes */}
         <mesh position={[0, 0.51, -2]} rotation={[Math.PI/2, 0, 0]}>
             <planeGeometry args={[0.8, 4]} />
             <meshStandardMaterial color="#ef4444" roughness={0.8} />
         </mesh>

      </group>

      {/* Thruster Particles */}
      <group position={[0, 0.2, 6]}><Sparkles count={boosting ? 60 : 20} scale={[4, 1, 8]} size={4} speed={2} opacity={0.3} color="#a5f3fc" /></group>
    </group>
  );
};
