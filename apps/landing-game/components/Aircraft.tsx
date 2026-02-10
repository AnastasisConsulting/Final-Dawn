import React, { useRef, useState, useEffect, MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Group, Euler, Color, MathUtils, Matrix4, PerspectiveCamera } from 'three';
import { Sparkles } from '@react-three/drei';
import { useFlightControls } from './Controls';
import { FlightStatus, WeaponType, SystemNode, CinematicState, TargetDynamics, Target } from '../types';
import { EngineSound, playChaffSound, playLockWarningSound, playMissileAlertSound } from '../utils/audio';
import { ShipModel } from './ShipModel';
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
  status, onUpdateStatus, onFire, navTarget, autopilot, onAutopilotDisengage,
  activeSystem, playerHealth, cinematicMode, dockingTarget, targetDynamicsRef,
  activeTargets = [], onChaff, targetingStatus
}) => {
  const shipRef = useRef<Group>(null);
  const controlsRef = useFlightControls();
  const { camera } = useThree();
  const [boosting, setBoosting] = useState(false);
  const [landingGear, setLandingGear] = useState(0); // 0 (retracted) to 1 (extended)

  const leftPlumeRef = useRef<Group>(null);
  const rightPlumeRef = useRef<Group>(null);
  const engineLeftMatRef = useRef<any>(null);
  const engineRightMatRef = useRef<any>(null);
  const engineColor = useRef(new Color('#60a5fa'));
  const plumeScale = useRef(new Vector3(1, 1, 1));
  const engineSoundRef = useRef<EngineSound | null>(null);

  const shieldMeshRef = useRef<THREE.Mesh>(null);
  const maneuverState = useRef<ManeuverState>('NONE');
  const maneuverProgress = useRef(0);
  const chaffParticlesRef = useRef<THREE.Group>(null);
  const chaffTimer = useRef(0);
  const lockWarningTimer = useRef(0);
  const missileAlertTimer = useRef(0);
  const velocity = useRef(new Vector3(0, 0, 0));
  const lastFireTime = useRef(0);
  const lastMissileTime = useRef(0);

  useEffect(() => {
    const snd = new EngineSound();
    snd.start();
    engineSoundRef.current = snd;
    return () => snd.stop();
  }, []);

  const getFireRate = () => status.weaponLevel >= 2 ? 0.08 : (status.weaponLevel === 1 ? 0.12 : 0.2);
  const ACCEL = 100.0;
  const BOOST_MULT = 3.0;
  const MOUSE_SENSITIVITY = 0.0025;

  useFrame((state, delta) => {
    if (!shipRef.current) return;
    const input = controlsRef.current;
    const time = state.clock.getElapsedTime();

    // Audio Alerts
    if (targetingStatus.missileTracking) {
      missileAlertTimer.current -= delta;
      if (missileAlertTimer.current <= 0) { playMissileAlertSound(); missileAlertTimer.current = 0.15; }
    } else if (targetingStatus.locked) {
      lockWarningTimer.current -= delta;
      if (lockWarningTimer.current <= 0) { playLockWarningSound(); lockWarningTimer.current = 0.5; }
    }

    // Maneuver Triggers
    if (maneuverState.current === 'NONE' && input.active) {
      if (input.verticalFlip && input.boost) { maneuverState.current = 'FLIP_180'; maneuverProgress.current = 0; }
      else if (input.barrelRoll !== 0) { maneuverState.current = input.barrelRoll > 0 ? 'ROLL_RIGHT' : 'ROLL_LEFT'; maneuverProgress.current = 0; }
      else if (input.verticalFlip) { maneuverState.current = 'LOOP'; maneuverProgress.current = 0; }
      else if (input.dropChaff && chaffTimer.current <= 0) { chaffTimer.current = 0.5; playChaffSound(); onChaff(); }
    }

    // Movement
    const isManeuvering = maneuverState.current !== 'NONE';
    const inputActive = !autopilot && !cinematicMode.active && !isManeuvering;
    const isBoosting = (inputActive && input.boost) || (maneuverState.current === 'FLIP_180');
    if (isBoosting !== boosting) setBoosting(isBoosting);

    // Camera FOV
    if (camera instanceof PerspectiveCamera) {
      camera.fov = MathUtils.lerp(camera.fov, isBoosting ? 95 : 60, delta * 3);
      camera.updateProjectionMatrix();
    }
    engineColor.current.lerp(new Color(isBoosting ? '#a5f3fc' : '#60a5fa'), delta * 6);

    if (isManeuvering) {
      maneuverProgress.current += delta * 0.8;
      if (maneuverProgress.current >= 1) maneuverState.current = 'NONE';
      else {
        if (maneuverState.current === 'FLIP_180') {
          const amt = delta * 0.5 * Math.PI;
          shipRef.current.rotateX(amt); shipRef.current.rotateZ(amt);
        } else if (maneuverState.current.includes('ROLL')) {
          const dir = maneuverState.current === 'ROLL_RIGHT' ? -1 : 1;
          shipRef.current.rotateZ(delta * 0.8 * Math.PI * 2 * dir);
        } else if (maneuverState.current === 'LOOP') {
          shipRef.current.rotateX(delta * 0.8 * Math.PI * 2);
        }
      }
    } else if (inputActive && input.active) {
      const yaw = -(input.mouse.x) * MOUSE_SENSITIVITY;
      const pitch = -(input.mouse.y) * MOUSE_SENSITIVITY;
      shipRef.current.quaternion.multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitch));
      shipRef.current.quaternion.premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw));

      const currentEuler = new Euler().setFromQuaternion(shipRef.current.quaternion, 'YXZ');
      currentEuler.z = MathUtils.lerp(currentEuler.z, MathUtils.clamp(-input.mouse.x * 20.0, -0.6, 0.6), delta * 5);
      shipRef.current.quaternion.setFromEuler(currentEuler);
      input.mouse.x = 0; input.mouse.y = 0;
    }

    if (!cinematicMode.active) {
      if (autopilot && navTarget) {
        // Autopilot landing logic
        const targetPos = navTarget.clone().add(new Vector3(0, 0, 0)); // Flat on pad
        shipRef.current.position.lerp(targetPos, delta * 2);

        // Align ship to pad normal (0,1,0) and current heading
        const targetQuat = new Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), new Vector3(0, 0, -1)); // Keep it flat
        // Actually, we want to look at the center of the planet roughly, or just stay flat relative to the pad.
        // For now, let's just lerp to a flat orientation.
        const up = navTarget.clone().sub(new Vector3(0, -8500, 0)).normalize();
        const forward = new Vector3(0, 0, -1).applyQuaternion(shipRef.current.quaternion);
        const mat = new Matrix4().lookAt(new Vector3(0, 0, 0), forward, up);
        const flatQuat = new Quaternion().setFromRotationMatrix(mat);
        shipRef.current.quaternion.slerp(flatQuat, delta * 3);

        velocity.current.lerp(new Vector3(0, 0, 0), delta * 5);
      } else {
        let thrust = inputActive ? -input.move.z : 0;
        if (maneuverState.current === 'FLIP_180') thrust = -1.0;
        const accelInput = new Vector3(inputActive ? input.move.x * 0.6 : 0, inputActive ? input.move.y * 0.6 : 0, thrust);
        const speedMult = ACCEL * (isBoosting ? BOOST_MULT : 1);
        velocity.current.add(accelInput.clone().multiplyScalar(speedMult * delta).applyQuaternion(shipRef.current.quaternion));

        // Drag
        const invQuat = shipRef.current.quaternion.clone().invert();
        const localVel = velocity.current.clone().applyQuaternion(invQuat);
        localVel.x = MathUtils.lerp(localVel.x, 0, delta * 3.0);
        localVel.y = MathUtils.lerp(localVel.y, 0, delta * 3.0);
        localVel.z = MathUtils.lerp(localVel.z, 0, delta * 1.0);
        velocity.current = localVel.applyQuaternion(shipRef.current.quaternion);
        shipRef.current.position.add(velocity.current.clone().multiplyScalar(delta));
      }
    }

    // Landing Gear Logic
    const shouldExtendGear = (autopilot) || (status.speed < 200 && status.altitude < 500);
    setLandingGear(prev => MathUtils.lerp(prev, shouldExtendGear ? 1 : 0, delta * 2));

    // Shooting
    if (onFire && !cinematicMode.active && input.active) {
      if (input.firePrimary && time - lastFireTime.current > getFireRate()) {
        lastFireTime.current = time;
        const offsets = [new Vector3(-2.8, -0.2, -4), new Vector3(2.8, -0.2, -4)];
        offsets.forEach(o => onFire(shipRef.current!.position.clone().add(o.applyQuaternion(shipRef.current!.quaternion)), shipRef.current!.quaternion.clone(), 'laser', velocity.current));
      }
    }

    // Camera Chase
    const invQuat = shipRef.current.quaternion.clone().invert();
    const localVel = velocity.current.clone().applyQuaternion(invQuat);
    const camDist = 28 + (isBoosting ? 5 : 0) + (Math.abs(localVel.z) * 0.05);
    const camHeight = 8 + (Math.abs(localVel.y) * 0.02);
    const idealOffset = new Vector3(0, camHeight, camDist).applyQuaternion(shipRef.current.quaternion);
    const idealPos = shipRef.current.position.clone().add(idealOffset);
    camera.position.lerp(idealPos, delta * 4);
    camera.lookAt(shipRef.current.position.clone().add(new Vector3(0, 0, -50).applyQuaternion(shipRef.current.quaternion)));

    // Effects
    const forwardSpeedRatio = Math.max(0, -localVel.z) / (ACCEL * 2);
    plumeScale.current.set(1, 1, 0.9 + (isBoosting ? 3.5 : forwardSpeedRatio * 2.0));
    if (leftPlumeRef.current) leftPlumeRef.current.scale.lerp(plumeScale.current, delta * 10);
    if (rightPlumeRef.current) rightPlumeRef.current.scale.lerp(plumeScale.current, delta * 10);
    engineSoundRef.current?.update(Math.min(forwardSpeedRatio, 1), isBoosting);

    // Chaff
    if (chaffTimer.current > 0) {
      chaffTimer.current -= delta;
      if (chaffParticlesRef.current) {
        chaffParticlesRef.current.visible = true;
        chaffParticlesRef.current.scale.addScalar(delta * 10);
      }
    } else if (chaffParticlesRef.current) chaffParticlesRef.current.visible = false;

    // Status Update
    const euler = new Euler().setFromQuaternion(shipRef.current.quaternion, 'YXZ');
    onUpdateStatus({
      speed: Math.round(velocity.current.length() * 10),
      altitude: Math.round(shipRef.current.position.y),
      heading: ((-euler.y * 180) / Math.PI + 360) % 360,
      position: [shipRef.current.position.x, shipRef.current.position.y, shipRef.current.position.z],
      flightAssist: input.flightAssist,
      weaponLevel: status.weaponLevel,
      shieldActive: status.shieldActive,
      landingGear: landingGear
    });
  });

  return (
    <group ref={shipRef}>
      <group ref={chaffParticlesRef} position={[0, 0, 5]} visible={false}>
        <Sparkles count={50} scale={[10, 10, 10]} color="#fbbf24" size={5} speed={0.5} opacity={0.8} />
      </group>
      <mesh ref={shieldMeshRef} visible={status.shieldActive}>
        <icosahedronGeometry args={[5, 2]} />
        <meshPhysicalMaterial color="#3b82f6" transparent opacity={0.15} transmission={0.9} wireframe />
      </mesh>
      <ShipModel
        engineColor={engineColor.current} leftPlumeRef={leftPlumeRef} rightPlumeRef={rightPlumeRef}
        engineLeftMatRef={engineLeftMatRef} engineRightMatRef={engineRightMatRef} boosting={boosting} weaponLevel={status.weaponLevel}
        landingGear={landingGear}
      />
      <group position={[0, 0.2, 6]}><Sparkles count={boosting ? 60 : 20} scale={[4, 1, 8]} size={4} speed={2} opacity={0.3} color="#a5f3fc" /></group>
    </group>
  );
};