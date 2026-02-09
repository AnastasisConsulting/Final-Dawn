// landing-game/components/GameCanvas.tsx

/**
 * Game Canvas - Atmospheric Entry Scene
 * Redesigned with 5-phase atmospheric entry physics and corrected landing logic.
 */

import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sky, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Spaceship } from './Scene/Spaceship';
import { Planet } from './Scene/Planet';
import { SoundManager } from './SoundManager';
import { useGameStore } from '../store';
import { GamePhase } from '../types';
import { AtmosphericPhysics, AtmosphericPhase } from '../physics/atmosphericPhysics';
import { ReentryEffects } from '../effects/reentryEffects';
import { WeatherSystem, WeatherType } from '../weather/weatherSystem';
import { generateMegaCity, findNearestLandingPad, isInLandingClearance, MegaCity, LandingPad } from '../generation/cityGenerator';
import { LandingPadIndicator, NavigationArrow } from './Navigation/WaypointSystem';
import { AutoLandingController } from '../systems/autoLanding';
import { LandingGear, TouchdownEffects, AutopilotHUD } from '../effects/landingEffects';
import { GuidanceRibbon } from './Navigation/GuidanceRibbon';

interface SceneProps {
  landingContext?: any; // Ship state from flight-one
}

const AtmosphericEntryScene: React.FC<SceneProps> = ({ landingContext }) => {
  const { phase, setPhase } = useGameStore();
  const shipRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  // Initialize atmospheric physics
  const physicsRef = useRef<AtmosphericPhysics>(
    new AtmosphericPhysics(landingContext?.ship?.position?.y || 100000)
  );

  // Calibrated initial velocity: Lower vertical drop to prevent instant landing
  const velocityRef = useRef(
    new THREE.Vector3(
      landingContext?.ship?.velocity?.x || 0,
      landingContext?.ship?.velocity?.y || -5, // Slower initial drop
      landingContext?.ship?.velocity?.z || -50 // Forward momentum
    )
  );

  // Generate procedural city (memoized)
  const city = useMemo<MegaCity>(() => {
    const cityName = landingContext?.destination?.name || 'Unnamed City';
    const seed = landingContext?.destination?.address?.charCodeAt(0) || Math.random();
    return generateMegaCity(cityName, seed);
  }, [landingContext]);

  // Track target landing pad
  const [targetPad, setTargetPad] = useState<LandingPad | null>(null);
  const [autoLandingState, setAutoLandingState] = useState<any>(null);
  const [touchdownActive, setTouchdownActive] = useState(false);
  const autoLandingRef = useRef<AutoLandingController | null>(null);

  const [atmosphericState, setAtmosphericState] = useState(physicsRef.current.getState());
  const [integrity, setIntegrity] = useState(landingContext?.ship?.health || 100);

  useEffect(() => {
    // Initialize ship position
    if (shipRef.current && landingContext?.ship) {
      const pos = landingContext.ship.position;
      shipRef.current.position.set(pos.x, pos.y, pos.z);
    }
  }, [landingContext]);

  useFrame((state, delta) => {
    if (!shipRef.current || !cameraRef.current) return;

    // Apply gravity
    const gravity = new THREE.Vector3(0, -9.81 * delta, 0);
    velocityRef.current.add(gravity);

    // Update physics simulation
    const atmState = physicsRef.current.update(delta, velocityRef.current);
    setAtmosphericState(atmState);

    // Update ship position
    shipRef.current.position.add(velocityRef.current.clone().multiplyScalar(delta));
    physicsRef.current.setAltitude(shipRef.current.position.y);

    // Find nearest landing pad when approaching
    if (atmState.altitude < 5000 && !targetPad) {
      setTargetPad(findNearestLandingPad(shipRef.current.position, city));
    }

    // Check landing clearance for Autopilot takeover
    if (targetPad) {
      const clearance = isInLandingClearance(
        shipRef.current.position,
        velocityRef.current,
        targetPad
      );

      // Activate auto-landing when in clearance
      if (clearance && !autoLandingRef.current) {
        autoLandingRef.current = new AutoLandingController(targetPad.position);
        autoLandingRef.current.activate(shipRef.current.position);
      }
    }

    // Update auto-landing if active
    if (autoLandingRef.current && autoLandingRef.current.isActive()) {
      const result = autoLandingRef.current.update(
        delta,
        shipRef.current.position,
        velocityRef.current
      );
      setAutoLandingState(result.state);

      // Override velocity with autopilot
      velocityRef.current.copy(result.velocity);

      // Trigger touchdown effects
      if (result.state.phase === 'touchdown' && !touchdownActive) {
        setTouchdownActive(true);
      }

      // Complete landing
      if (autoLandingRef.current.isComplete()) {
        setPhase(GamePhase.LANDED);
      }
    }

    // Update game phase based on atmospheric phase
    const atmPhase = atmState.phase;
    if (atmPhase === AtmosphericPhase.LOW_ORBIT && phase !== GamePhase.ORBIT) {
      setPhase(GamePhase.ORBIT);
    } else if (atmPhase === AtmosphericPhase.ENTRY_INTERFACE && phase !== GamePhase.ENTRY) {
      setPhase(GamePhase.ENTRY);
    } else if (
      (atmPhase === AtmosphericPhase.VIOLENT_ENTRY || atmPhase === AtmosphericPhase.ATMOSPHERE) &&
      phase !== GamePhase.FLIGHT
    ) {
      setPhase(GamePhase.FLIGHT);
    }
    // Hard-coded LANDED trigger based purely on altitude removed

    // Heat damage
    if (physicsRef.current.isOverheating()) {
      const damage = physicsRef.current.getHeatDamage() * delta;
      setIntegrity((prev) => Math.max(0, prev - damage));
    }

    // Crash condition
    if (integrity <= 0) {
      setPhase(GamePhase.CRASHED);
    }
  });

  // Determine weather based on phase
  const getWeatherType = (): WeatherType => {
    if (atmosphericState.phase === AtmosphericPhase.VIOLENT_ENTRY) {
      return WeatherType.STORM;
    } else if (atmosphericState.phase === AtmosphericPhase.ATMOSPHERE) {
      return Math.random() > 0.5 ? WeatherType.RAIN : WeatherType.CLOUDY;
    }
    return WeatherType.CLEAR;
  };

  // Scene background color
  const getBackgroundColor = (): string => {
    switch (atmosphericState.phase) {
      case AtmosphericPhase.LOW_ORBIT:
        return '#000000';
      case AtmosphericPhase.ENTRY_INTERFACE:
        return '#1a0a00';
      case AtmosphericPhase.VIOLENT_ENTRY:
        return '#3a1000';
      default:
        return '#87CEEB';
    }
  };

  return (
    <>
      <color attach="background" args={[getBackgroundColor()]} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 100, 20]} intensity={2.0} castShadow />

      {atmosphericState.altitude > 50000 && (
        <Stars radius={20000} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
      )}

      {atmosphericState.altitude < 30000 && (
        <Sky sunPosition={[10, 10, 10]} turbidity={8} rayleigh={3} />
      )}

      <WeatherSystem
        type={getWeatherType()}
        intensity={atmosphericState.turbulence}
        altitude={atmosphericState.altitude}
      />

      <group ref={shipRef}>
        <PerspectiveCamera ref={cameraRef} makeDefault fov={85} near={0.01} far={50000} />

        <ReentryEffects
          heat={atmosphericState.heat}
          speed={atmosphericState.speed}
          phase={atmosphericState.phase}
        />

        <Spaceship />

        <LandingGear deployed={autoLandingState?.gearDeployed || false} />
      </group>

      <Planet />

      {touchdownActive && targetPad && (
        <TouchdownEffects
          active={touchdownActive}
          position={targetPad.position}
        />
      )}

      {targetPad && atmosphericState.altitude < 10000 && (
        <LandingPadIndicator
          position={targetPad.position}
          designation={targetPad.designation}
          available={targetPad.status === 'available'}
          distance={shipRef.current?.position.distanceTo(targetPad.position) || 0}
        />
      )}

      {targetPad && shipRef.current && atmosphericState.altitude < 5000 && !autoLandingState?.active && (
        <GuidanceRibbon
          startPosition={shipRef.current.position}
          targetPosition={targetPad.position}
          color="#00ffff"
          visible={true}
        />
      )}

      {targetPad && shipRef.current && atmosphericState.altitude > 1000 && !autoLandingState?.active && (
        <NavigationArrow
          targetDirection={targetPad.position.clone().sub(shipRef.current.position)}
          distance={shipRef.current.position.distanceTo(targetPad.position)}
        />
      )}

      {autoLandingState?.active && (
        <AutopilotHUD
          phase={autoLandingState.phase}
          progress={autoLandingState.progress}
          gearDeployed={autoLandingState.gearDeployed}
        />
      )}

      <SoundManager />
    </>
  );
};

const SceneContent: React.FC<SceneProps> = (props) => {
  return <AtmosphericEntryScene {...props} />;
};

export const GameCanvas: React.FC<{ landingContext?: any }> = ({ landingContext }) => {
  return (
    <Canvas shadows camera={{ fov: 60, position: [0, 5, 10], far: 50000 }}>
      <Suspense fallback={null}>
        <SceneContent landingContext={landingContext} />
      </Suspense>
    </Canvas>
  );
};