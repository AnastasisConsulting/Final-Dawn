/// <reference path="../../three-elements.d.ts" />
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Vector3, MathUtils, Color, MeshBasicMaterial, MeshStandardMaterial, Euler, Mesh, Quaternion } from 'three';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameStore } from '../../store';
import { ReEntryEffects } from './Effects';
import { GamePhase } from '../../types';
import { getMissionUpdate } from '../../services/geminiService';
import { ShipModel } from './ShipModel';
import { RibbonGuide } from './RibbonGuide';
import { requestPointerLock } from './Controls';

const Shield: React.FC<{ hull: number; active: boolean }> = ({ hull, active }) => {
  const meshRef = useRef<Mesh>(null);
  const prevHull = useRef(hull);
  const hitFlash = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Detect damage
    if (hull < prevHull.current) {
      hitFlash.current = 1.0;
    }
    prevHull.current = hull;

    // Decay flash
    hitFlash.current = MathUtils.lerp(hitFlash.current, 0, delta * 4);

    const baseOpacity = active ? 0.05 : 0.0;
    const flashOpacity = hitFlash.current * 0.6;
    const finalOpacity = baseOpacity + flashOpacity;

    const mat = meshRef.current.material as MeshBasicMaterial;
    mat.opacity = finalOpacity;
    mat.color.setHSL(0.55, 0.9, 0.5 + hitFlash.current * 0.5); // Cyan to White on hit

    // Pulse scale slightly on hit
    const scale = 1 + hitFlash.current * 0.1;
    meshRef.current.scale.set(scale, scale, scale);
    meshRef.current.rotation.y += delta * 0.5;
  });

  return (
    <mesh ref={meshRef} visible={active || hitFlash.current > 0.01}>
      <sphereGeometry args={[4.5, 32, 32]} />
      <meshBasicMaterial
        color="#06b6d4"
        transparent
        opacity={0.0}
        blending={2} // Additive
        depthWrite={false}
        wireframe={false}
      />
    </mesh>
  );
};

export const Spaceship: React.FC = () => {
  const shipRef = useRef<Group>(null);
  const modelRef = useRef<Group>(null);
  const controls = useKeyboard();
  const { camera } = useThree();

  // Model Refs
  const engineLeftMatRef = useRef<MeshBasicMaterial>(null);
  const engineRightMatRef = useRef<MeshBasicMaterial>(null);
  const leftPlumeRef = useRef<Group>(null);
  const rightPlumeRef = useRef<Group>(null);
  const hullMaterialRef = useRef<MeshStandardMaterial>(null);
  const landingGearGroupRef = useRef<Group>(null);

  const engineColor = useRef(new Color('#60a5fa'));
  const speedRef = useRef(0);
  const targetSpeedRef = useRef(1.0);
  const gearExtensionRef = useRef(0);

  // Auto-landing state
  const isAutoLanding = useRef(false);

  const [lastBrakeTime, setLastBrakeTime] = useState(0);

  const {
    setAltitude, setSpeed, setTemperature, setHull, setPhase, toggleLandingGear,
    altitude, hull, phase, setMessage, setIsMessageLoading, landingPadPosition, landingGearDeployed
  } = useGameStore();

  const landingPadVec = useMemo(() => new Vector3(...landingPadPosition), [landingPadPosition]);
  const isLanded = phase === GamePhase.LANDED;
  const lastCommTime = useRef(0);

  useFrame((state, delta) => {
    if (!shipRef.current) return;
    if (phase === GamePhase.CRASHED) return;
    const ship = shipRef.current;
    const time = state.clock.getElapsedTime();
    const currentAlt = ship.position.y;
    const isLanded = phase === GamePhase.LANDED;
    let turbulence = 0;

    // --- Input Logic ---
    if (!isLanded && !isAutoLanding.current && controls.brake && time - lastBrakeTime > 0.5) {
      toggleLandingGear();
      setLastBrakeTime(time);
      if (speedRef.current > 1.5) {
        setPhase(GamePhase.CRASHED);
        setMessage("CATASTROPHIC FAILURE: GEAR DEPLOYED AT MACH SPEED");
      } else if (speedRef.current > 0.9) {
        setHull(hull - 30);
        setMessage("WARNING: STRUCTURAL STRESS DETECTED");
      }
    }

    if (isLanded) {
      // Idle animation on ground
      targetSpeedRef.current = 0;
      speedRef.current = MathUtils.lerp(speedRef.current, 0, delta * 3);
      ship.position.y = MathUtils.lerp(ship.position.y, 1.8, delta * 2);

      // Ensure flat on ground
      const currentEuler = new Euler().setFromQuaternion(ship.quaternion, 'YXZ');
      currentEuler.x = MathUtils.lerp(currentEuler.x, 0, delta * 2);
      currentEuler.z = MathUtils.lerp(currentEuler.z, 0, delta * 2);
      ship.quaternion.setFromEuler(currentEuler);

      engineColor.current.lerp(new Color('#1e293b'), delta * 5);
    } else if (isAutoLanding.current) {
      // --- AUTO LANDING SEQUENCE ---
      // Guide ship to center of pad and down to ground
      const targetPos = new Vector3(landingPadPosition[0], 1.8, landingPadPosition[2]);
      ship.position.lerp(targetPos, delta * 1.5); // Move to center

      // Rotate to flat level
      const currentQ = ship.quaternion.clone();
      const targetQ = new Quaternion().setFromEuler(new Euler(0, 0, 0)); // Assuming North facing 0, or just flat
      // Preserve Yaw? Let's just flatten pitch/roll
      const euler = new Euler().setFromQuaternion(ship.quaternion, 'YXZ');
      const flatQ = new Quaternion().setFromEuler(new Euler(0, euler.y, 0));
      ship.quaternion.slerp(flatQ, delta * 2.0);

      // Slow down
      speedRef.current = MathUtils.lerp(speedRef.current, 0, delta * 1.0);
      targetSpeedRef.current = 0;

      engineColor.current.lerp(new Color('#60a5fa'), delta * 2); // Gentle burn color

      // Check completion
      const distToTarget = ship.position.distanceTo(targetPos);
      if (distToTarget < 0.5 && speedRef.current < 0.05) {
        setPhase(GamePhase.LANDED);
        setMessage("TOUCHDOWN CONFIRMED. SYSTEMS SECURE.");
        document.exitPointerLock?.();
      }

    } else {
      // --- MANUAL FLIGHT ---
      // --- MANUAL FLIGHT (Pointer Lock Logic) ---
      if (controls.forward) targetSpeedRef.current += 1.0 * delta;
      if (controls.backward) targetSpeedRef.current -= 1.0 * delta;

      const minSpeed = 0.0;
      const maxSpeed = controls.boost ? 5.0 : 2.5;
      targetSpeedRef.current = MathUtils.clamp(targetSpeedRef.current, minSpeed, maxSpeed);

      const dragFactor = landingGearDeployed ? 1.5 : 2.0;
      speedRef.current = MathUtils.lerp(speedRef.current, targetSpeedRef.current, delta * dragFactor);

      if (landingGearDeployed && speedRef.current > 0.8) {
        speedRef.current = MathUtils.lerp(speedRef.current, 0.4, delta * 0.5);
        targetSpeedRef.current = MathUtils.lerp(targetSpeedRef.current, 0.4, delta * 0.5);
      }

      const SENSITIVITY = 0.002;
      const pitchChange = -(controls.mouse.y) * SENSITIVITY;
      const yawChange = -(controls.mouse.x) * SENSITIVITY;

      const qYaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yawChange);
      const qPitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitchChange);

      ship.quaternion.multiply(qPitch);
      ship.quaternion.premultiply(qYaw);

      // Banking logic
      const targetRoll = (controls.mouse.x * -0.5) + (controls.left ? 0.8 : 0) + (controls.right ? -0.8 : 0) + (controls.rollLeft ? 1 : 0) + (controls.rollRight ? -1 : 0);
      const currentEuler = new Euler().setFromQuaternion(ship.quaternion, 'YXZ');
      currentEuler.z = MathUtils.lerp(currentEuler.z, targetRoll, delta * 3.0);
      ship.quaternion.setFromEuler(currentEuler);

      controls.mouse.x = 0;
      controls.mouse.y = 0;

      const forwardDir = new Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
      // Flight One uses much higher coordinates, Landing Game seems to use smaller scale (speedRef ~ 2.0). 
      // Need to calibrate. App.tsx sets position [0, 2500, 0].
      // Flight-one uses speed ~100. Landing Game seems to use speed ~2.0 * 100 multiplier = 200 units/sec?
      // Line 185: `speedRef.current * delta * 100` -> if speed is 1, acts as 100.
      // Controls max speed 2.5 -> 250 units/sec. Seems OK.
      ship.position.add(forwardDir.clone().multiplyScalar(speedRef.current * delta * 100));

      const isBoosting = controls.boost;
      engineColor.current.lerp(new Color(isBoosting ? '#a5f3fc' : '#60a5fa'), delta * 6);
    }

    // --- Visuals Updates ---
    const forwardSpeedRatio = speedRef.current / 4.0;
    const plumeLen = (isLanded || isAutoLanding.current) ? 0.5 : 0.9 + (controls.boost ? 3.5 : forwardSpeedRatio * 2.0);
    const plumeScale = new Vector3(1, 1, plumeLen);

    if (leftPlumeRef.current) leftPlumeRef.current.scale.lerp(plumeScale, delta * 10);
    if (rightPlumeRef.current) rightPlumeRef.current.scale.lerp(plumeScale, delta * 10);
    if (engineLeftMatRef.current) engineLeftMatRef.current.color.copy(engineColor.current);
    if (engineRightMatRef.current) engineRightMatRef.current.color.copy(engineColor.current);

    if (hullMaterialRef.current) {
      if (hull < 40) {
        hullMaterialRef.current.emissive.set('#ef4444');
        hullMaterialRef.current.emissiveIntensity = 0.5 + Math.sin(time * 10) * 0.5;
      } else {
        hullMaterialRef.current.emissive.set('#3b82f6');
        hullMaterialRef.current.emissiveIntensity = 0.5;
      }
    }

    const targetExtension = landingGearDeployed ? 1 : 0;
    gearExtensionRef.current = MathUtils.lerp(gearExtensionRef.current, targetExtension, delta * 4);
    if (landingGearGroupRef.current) {
      landingGearGroupRef.current.position.y = MathUtils.lerp(0, -0.6, gearExtensionRef.current);
      landingGearGroupRef.current.rotation.x = MathUtils.lerp(-0.5, 0, gearExtensionRef.current);
    }

    // --- Game State Logic ---
    setAltitude(currentAlt);
    setSpeed(speedRef.current);

    let newTemp = 0;
    let newPhase: GamePhase = phase;

    if (!isLanded && !isAutoLanding.current) {
      if (currentAlt > 1500) newPhase = GamePhase.ORBIT;
      else if (currentAlt > 300) {
        newPhase = GamePhase.ENTRY;
        const density = 1 - ((currentAlt - 300) / 1200);
        newTemp = speedRef.current * density * 800;
        if (newTemp > 1000) setHull(hull - delta * 5);
        if (speedRef.current > 1.5) {
          // Turbulence removed
        }
      } else if (currentAlt > 10) {
        newPhase = GamePhase.FLIGHT;
        newTemp = Math.max(0, speedRef.current * 100);
      } else {
        // Crashed into ground without logic trigger
        newPhase = GamePhase.CRASHED; setMessage("CRASH: IMPACT WITH SURFACE");
      }

      // --- VICTORY / CAPTURE CONDITION ---
      const distToPad = ship.position.distanceTo(landingPadVec);
      // Check if inside the "beam" radius (500 units)
      if (distToPad < 500 && currentAlt < 300) {
        // TRIGGER AUTO-LANDER if speed is low (0-20mph approx 0.2 units)
        if (speedRef.current < 0.3) {
          isAutoLanding.current = true;
          if (!landingGearDeployed) toggleLandingGear(); // Auto-deploy gear
          setMessage("TRACTOR BEAM LOCK ACQUIRED. AUTOPILOT ENGAGED.");
        } else if (distToPad < 150 && currentAlt < 50 && !landingGearDeployed) {
          // Too close without gear
          setPhase(GamePhase.CRASHED);
          setMessage("CRASH: LANDING GEAR NOT DEPLOYED");
        }
      }

      setTemperature(newTemp);
      if (newPhase !== phase) setPhase(newPhase);
    }

    // --- Camera ---
    const isLandingMode = (landingGearDeployed || isAutoLanding.current) && currentAlt < 300;
    const landingMix = isLandingMode ? MathUtils.clamp(1 - (currentAlt / 300), 0, 1) : 0;

    // Flight Camera
    const flightOffset = new Vector3(0, 5, 18);
    if (controls.boost && !isLanded) flightOffset.z += 10;
    if (!isLanded) flightOffset.applyQuaternion(ship.quaternion);
    const flightCamPos = ship.position.clone().add(flightOffset);

    // Landing Camera (Fixed relative to world, looking at ship)
    // We want a nice cinematic view of the landing
    // Position camera slightly to the side and up from the landing pad?
    // Or just a tighter follow cam. Let's do tighter follow.
    const landingOffset = new Vector3(20, 10, 20); // Side view
    const landingCamPos = ship.position.clone().add(landingOffset);

    // Blended Position
    let targetCamPos = new Vector3().lerpVectors(flightCamPos, landingCamPos, landingMix * 0.8);
    let lookTarget = new Vector3().lerpVectors(
      ship.position.clone().add(new Vector3(0, 0, -50).applyQuaternion(ship.quaternion)),
      ship.position.clone(),
      landingMix
    );

    if (phase === GamePhase.ORBIT && !isAutoLanding.current) {
      const orbitCamPos = ship.position.clone().add(new Vector3(0, 30, 80));
      targetCamPos = orbitCamPos;
      // Look slightly ahead of the ship to see where we are going, effectively a high chase cam
      lookTarget = ship.position.clone().add(new Vector3(0, -10, -100));
    }

    if (isLanded) {
      // Rotate around landed ship
      targetCamPos = ship.position.clone().add(new Vector3(Math.sin(time * 0.2) * 25, 8, Math.cos(time * 0.2) * 25));
    }

    if (!isLanded && turbulence > 0) {
      targetCamPos.add(new Vector3((Math.random() - 0.5) * turbulence, (Math.random() - 0.5) * turbulence, (Math.random() - 0.5) * turbulence));
    }

    camera.position.lerp(targetCamPos, delta * (isLanded || isAutoLanding.current ? 1.0 : 3.0));

    // Look Target
    camera.lookAt(lookTarget);

    // --- Comm ---
    if (state.clock.elapsedTime - lastCommTime.current > 8 && phase !== GamePhase.LANDED && !isAutoLanding.current) {
      lastCommTime.current = state.clock.elapsedTime;
      if (Math.random() > 0.7) {
        setIsMessageLoading(true);
        getMissionUpdate(newPhase, currentAlt, hull, speedRef.current).then(msg => { setMessage(msg); setIsMessageLoading(false); });
      }
    }
  });

  return (
    <group ref={shipRef} position={[0, 2500, 0]}>
      {/* Ship Geometry */}
      <ShipModel
        ref={modelRef}
        hullMaterialRef={hullMaterialRef}
        engineLeftMatRef={engineLeftMatRef}
        engineRightMatRef={engineRightMatRef}
        leftPlumeRef={leftPlumeRef}
        rightPlumeRef={rightPlumeRef}
        landingGearGroupRef={landingGearGroupRef}
        weaponLevel={1}
        isBoosting={controls.boost}
      />
      {/* Visual Feedback Components */}
      <Shield hull={hull} active={true} />
      <ReEntryEffects />

      {/* Guidance Ribbon */}
      <RibbonGuide
        shipPosition={shipRef.current?.position || new Vector3(0, 2500, 0)}
        targetPosition={landingPadVec}
        active={phase !== GamePhase.ORBIT && !isLanded}
      />
    </group>
  );
};
