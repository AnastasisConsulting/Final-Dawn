import React, { useRef, useState, useEffect, MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Group, Euler, Color, MathUtils, Matrix4, PerspectiveCamera } from 'three';
import { Sparkles } from '@react-three/drei';
import { useFlightControls } from './Controls';
import { FlightStatus, WeaponType, SystemNode, CinematicState, TargetDynamics, Target } from '../types';
import { EngineSound, playChaffSound, playLockWarningSound, playMissileAlertSound } from '../utils/audio';
import { ShipModel } from './ShipModel';
import * as THREE from 'three';

const PLANET_CENTER = new Vector3(0, -8500, 0);
const PLANET_RADIUS = 8000;

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
}

type ManeuverState = 'NONE' | 'ROLL_LEFT' | 'ROLL_RIGHT' | 'LOOP' | 'FLIP_180';

export const SpaceFighter: React.FC<SpaceFighterProps> = ({
  status, onUpdateStatus, onFire, navTarget, autopilot, onAutopilotDisengage,
  activeSystem, playerHealth, cinematicMode, dockingTarget, targetDynamicsRef,
  activeTargets = [], onChaff, targetingStatus
}) => {
  const shipRef = useRef<Group>(null);
  const controlsRef = useFlightControls();
  const { camera } = useThree();
  const [boosting, setBoosting] = useState(false);
  const [landingGear, setLandingGear] = useState(0);

  const leftPlumeRef = useRef<Group>(null);
  const rightPlumeRef = useRef<Group>(null);
  const engineLeftMatRef = useRef<any>(null);
  const engineRightMatRef = useRef<any>(null);
  const engineColor = useRef(new Color('#60a5fa'));
  const plumeScale = useRef(new Vector3(1, 1, 1));
  const engineSoundRef = useRef<EngineSound | null>(null);

  const maneuverState = useRef<ManeuverState>('NONE');
  const maneuverProgress = useRef(0);
  const chaffTimer = useRef(0);
  const lockWarningTimer = useRef(0);
  const missileAlertTimer = useRef(0);
  const velocity = useRef(new Vector3(0, 0, 0));
  const lastFireTime = useRef(0);

  // Rotation states for pure local control
  const rotationQuat = useRef(new Quaternion());
  const visualRoll = useRef(0);

  useEffect(() => {
    const snd = new EngineSound();
    snd.start();
    engineSoundRef.current = snd;
    return () => snd.stop();
  }, []);

  // Initialization
  useEffect(() => {
    if (shipRef.current && status.position) {
      shipRef.current.position.set(status.position[0], status.position[1], status.position[2]);
    }
  }, []);

  const getFireRate = () => status.weaponLevel >= 2 ? 0.08 : (status.weaponLevel === 1 ? 0.12 : 0.2);
  const ACCEL = 2500.0;
  const BOOST_MULT = 3.0;
  const MOUSE_SENSITIVITY = 0.0035;

  useFrame((state, delta) => {
    if (!shipRef.current) return;
    const input = controlsRef.current;
    const time = state.clock.getElapsedTime();
    const clampedDelta = Math.min(delta, 0.1); // Safety clamp

    // 1. INPUT & AUDIO ALERTS
    if (targetingStatus.missileTracking) {
      missileAlertTimer.current -= clampedDelta;
      if (missileAlertTimer.current <= 0) { playMissileAlertSound(); missileAlertTimer.current = 0.15; }
    } else if (targetingStatus.locked) {
      lockWarningTimer.current -= clampedDelta;
      if (lockWarningTimer.current <= 0) { playLockWarningSound(); lockWarningTimer.current = 0.5; }
    }

    if (maneuverState.current === 'NONE' && input.active) {
      if (input.verticalFlip && input.boost) { maneuverState.current = 'FLIP_180'; maneuverProgress.current = 0; }
      else if (input.barrelRoll !== 0) { maneuverState.current = input.barrelRoll > 0 ? 'ROLL_RIGHT' : 'ROLL_LEFT'; maneuverProgress.current = 0; }
      else if (input.verticalFlip) { maneuverState.current = 'LOOP'; maneuverProgress.current = 0; }
      else if (input.dropChaff && chaffTimer.current <= 0) { chaffTimer.current = 0.5; playChaffSound(); onChaff(); }
    }

    const isManeuvering = maneuverState.current !== 'NONE';
    const inputActive = !autopilot && !cinematicMode.active && !isManeuvering;
    const isBoosting = (inputActive && input.boost) || (maneuverState.current === 'FLIP_180');
    if (isBoosting !== boosting) setBoosting(isBoosting);

    if (camera instanceof PerspectiveCamera) {
      camera.fov = MathUtils.lerp(camera.fov, isBoosting ? 95 : 65, clampedDelta * 3);
      camera.updateProjectionMatrix();
    }
    engineColor.current.lerp(new Color(isBoosting ? '#a5f3fc' : '#38bdf8'), clampedDelta * 6);

    // 2. PLANET-RELATIVE ORIENTATION (GIMBAL LOCK PREVENTION)
    const worldPos = shipRef.current.position.clone();
    const upVector = worldPos.clone().sub(PLANET_CENTER).normalize(); // Local "Up" (away from planet)

    if (isManeuvering) {
      maneuverProgress.current += clampedDelta * 1.5;
      if (maneuverProgress.current >= 1) maneuverState.current = 'NONE';
      else {
        if (maneuverState.current === 'FLIP_180') {
          shipRef.current.rotateX(clampedDelta * Math.PI * 1.5);
          shipRef.current.rotateZ(clampedDelta * Math.PI * 0.5);
        } else if (maneuverState.current.includes('ROLL')) {
          const dir = maneuverState.current === 'ROLL_RIGHT' ? -1 : 1;
          shipRef.current.rotateZ(clampedDelta * Math.PI * 3.0 * dir);
        } else if (maneuverState.current === 'LOOP') {
          shipRef.current.rotateX(clampedDelta * Math.PI * 2.2);
        }
      }
    } else if (inputActive && input.active) {
      // Local Pitch and Yaw (relative to current frame)
      const yawDelta = -(input.mouse.x) * MOUSE_SENSITIVITY;
      const pitchDelta = -(input.mouse.y) * MOUSE_SENSITIVITY;

      const qPitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitchDelta);
      const qYaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yawDelta);

      shipRef.current.quaternion.multiply(qPitch);
      shipRef.current.quaternion.multiply(qYaw);

      // Visual Banking
      visualRoll.current = MathUtils.lerp(visualRoll.current, -input.mouse.x * 0.05, clampedDelta * 6);
      input.mouse.x = 0; input.mouse.y = 0;
    }

    // 3. HORIZON STABILIZATION (Always keep "Up" pointing away from planet)
    // This solves the "flying upside down" issue by slerping the ship's Up vector to align with planet normal
    if (!isManeuvering && !cinematicMode.active) {
      // Current ship forward
      const forward = new Vector3(0, 0, -1).applyQuaternion(shipRef.current.quaternion);
      // Corrected Right vector (Cross product of Forward and Planet-Up)
      const right = new Vector3().crossVectors(forward, upVector).normalize();
      // Corrected ship Up vector (Cross product of Right and Forward)
      const correctedUp = new Vector3().crossVectors(right, forward).normalize();

      const targetMat = new Matrix4().makeBasis(right, correctedUp, forward.negate());
      const targetQuat = new Quaternion().setFromRotationMatrix(targetMat);

      // Slerp towards horizon-stable orientation
      shipRef.current.quaternion.slerp(targetQuat, clampedDelta * 1.2);
      visualRoll.current = MathUtils.lerp(visualRoll.current, 0, clampedDelta * 1.5);
    }

    // Apply visual banking to the model container
    if (shipRef.current.children[1]) {
      shipRef.current.children[1].rotation.z = visualRoll.current;
    }

    // 4. PHYSICS & MOVEMENT (JET FIGHTER MODEL)
    if (!cinematicMode.active) {
      if (autopilot && navTarget) {
        const targetPos = navTarget.clone();
        shipRef.current.position.lerp(targetPos, clampedDelta * 2.0);
        // The original code had a quaternion slerp here, but the instruction implies
        // we only need to lerp position and zero out velocity for autopilot.
        // Keeping the original quaternion slerp for autopilot for smooth orientation.
        const up = navTarget.clone().sub(PLANET_CENTER).normalize();
        const forward = new Vector3(0, 0, -1).applyQuaternion(shipRef.current.quaternion);
        const lookMat = new Matrix4().lookAt(new Vector3(0, 0, 0), forward, up);
        const targetQuat = new Quaternion().setFromRotationMatrix(lookMat);
        shipRef.current.quaternion.slerp(targetQuat, clampedDelta * 3);

        velocity.current.lerp(new Vector3(0, 0, 0), clampedDelta * 5);
      } else {
        const thrust = inputActive ? -input.move.z : (maneuverState.current === 'FLIP_180' ? -1.0 : 0);

        // --- ATMOSPHERIC JET PHYSICS ---
        const forwardVel = velocity.current.clone().applyQuaternion(shipRef.current.quaternion.clone().invert()).z;
        // 1. Lift Logic (Higher speed = more lift relative to ship "Up")
        const liftFactor = Math.pow(Math.abs(forwardVel) / 800, 1.2) * 80.0;
        const liftForce = new Vector3(0, liftFactor, 0).applyQuaternion(shipRef.current.quaternion);

        // 2. Induced Drag (Turning costs speed)
        const turnCost = (Math.abs(input.mouse.x) + Math.abs(input.mouse.y)) * 0.005;

        const force = new Vector3(input.move.x * 0.2, input.move.y * 0.2, thrust);
        const enginePower = ACCEL * (isBoosting ? BOOST_MULT : 1);

        velocity.current.add(force.applyQuaternion(shipRef.current.quaternion).multiplyScalar(enginePower * clampedDelta));
        velocity.current.add(liftForce.multiplyScalar(clampedDelta));

        // 3. Spherical Gravity (Stronger pull to planet)
        const gravity = upVector.clone().negate().multiplyScalar(clampedDelta * 80);
        velocity.current.add(gravity);

        // 4. Atmospheric Drag (Exponential)
        const dragBase = isBoosting ? 0.99 : 0.96;
        const dragFactor = Math.max(0.1, dragBase - turnCost); // Clamp to prevent NaN or negative
        velocity.current.multiplyScalar(Math.pow(dragFactor, clampedDelta * 60));

        shipRef.current.position.add(velocity.current.clone().multiplyScalar(clampedDelta));
      }
    }

    // 5. FX & CAMERA
    const shipSpeed = velocity.current.length();
    const shouldExtendGear = (autopilot) || (shipSpeed < 20 && (worldPos.distanceTo(PLANET_CENTER) - PLANET_RADIUS) < 300);
    setLandingGear(prev => MathUtils.lerp(prev, shouldExtendGear ? 1 : 0, clampedDelta * 2));

    if (onFire && !cinematicMode.active && input.active) {
      if (input.firePrimary && time - lastFireTime.current > getFireRate()) {
        lastFireTime.current = time;
        const side = (Math.sin(time * 25) > 0 ? 1 : -1);
        // Adjusted for 3x ship model width
        const offsetLeft = new Vector3(-8.4, -0.6, -12).applyQuaternion(shipRef.current.quaternion);
        const offsetRight = new Vector3(8.4, -0.6, -12).applyQuaternion(shipRef.current.quaternion);
        const offset = side > 0 ? offsetRight : offsetLeft;
        onFire(shipRef.current.position.clone().add(offset), shipRef.current.quaternion.clone(), 'laser', velocity.current);
      }
    }

    // Dynamic Chase Camera (Refined for dogfighting)
    const camDist = 120 + (isBoosting ? 40 : 0) + (shipSpeed * 0.08);
    const camHeight = 45 + (shipSpeed * 0.03);
    const camTargetPos = shipRef.current.position.clone().add(new Vector3(0, camHeight, camDist).applyQuaternion(shipRef.current.quaternion));
    camera.position.lerp(camTargetPos, clampedDelta * 6.0);
    const lookTarget = shipRef.current.position.clone().add(new Vector3(0, 10, -200).applyQuaternion(shipRef.current.quaternion));
    camera.lookAt(lookTarget);

    const forwardSpeedHUD = Math.abs(velocity.current.clone().applyQuaternion(shipRef.current.quaternion.clone().invert()).z);
    const engineIntensity = Math.min(1.0, forwardSpeedHUD / 800) + (isBoosting ? 3.5 : 0);
    plumeScale.current.set(3, 3, 1.5 + engineIntensity * 4.0); // Scaled for 3x model
    if (leftPlumeRef.current) leftPlumeRef.current.scale.lerp(plumeScale.current, clampedDelta * 15);
    if (rightPlumeRef.current) rightPlumeRef.current.scale.lerp(plumeScale.current, clampedDelta * 15);
    engineSoundRef.current?.update(Math.min(1, forwardSpeedHUD / 1200), isBoosting);

    // 6. STATUS UPDATE (Surface altitude)
    const altitudeHUD = worldPos.distanceTo(PLANET_CENTER) - PLANET_RADIUS;
    onUpdateStatus({
      speed: Math.round(shipSpeed),
      altitude: Math.round(altitudeHUD),
      heading: 0,
      position: [shipRef.current.position.x, shipRef.current.position.y, shipRef.current.position.z],
      flightAssist: input.flightAssist,
      weaponLevel: status.weaponLevel,
      shieldActive: status.shieldActive,
      landingGear: landingGear,
      wave: status.wave
    });
  });

  return (
    <group ref={shipRef}>
      <group visible={chaffTimer.current > 0} position={[0, 0, 5]}>
        <Sparkles count={80} scale={[12, 12, 12]} color="#fbbf24" size={6} speed={0.8} opacity={0.8} />
      </group>

      <group scale={[3, 3, 3]}>
        <ShipModel
          engineColor={engineColor.current}
          leftPlumeRef={leftPlumeRef}
          rightPlumeRef={rightPlumeRef}
          engineLeftMatRef={engineLeftMatRef}
          engineRightMatRef={engineRightMatRef}
          boosting={boosting}
          weaponLevel={status.weaponLevel}
          landingGear={landingGear}
        />
        <group position={[0, 0.2, 5]}><Sparkles count={boosting ? 100 : 25} scale={[3, 0.5, 7]} size={5} speed={2.5} opacity={0.4} color="#a5f3fc" /></group>
      </group>
    </group>
  );
};