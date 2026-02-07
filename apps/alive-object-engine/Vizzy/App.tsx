/// <reference path="./three-elements.d.ts" />
import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { DEFAULT_STATE } from './constants';
import { AppState } from './types';
import { CentralConstruct } from './components/Scene/CentralConstruct';
import { MechanicalRings } from './components/Scene/MechanicalRings';
import { ParticleField } from './components/Scene/ParticleField';
import { VizzyAnimationEngine } from './animationEngine';
import { fetchVizzySentiment } from './ollamaIntegration';
import { VizzyAutonomousAI } from './autonomousAI';

// Main Scene Component with lerping
function VizzyScene({ targetConfig, autonomousAI }: { targetConfig: AppState; autonomousAI: VizzyAutonomousAI }) {
  const groupRef = useRef<THREE.Group>(null);
  const [userActive, setUserActive] = useState(false);

  // Use a ref for the persistent configuration to avoid React re-renders.
  // We initialize with a deep copy of targetConfig to ensure we don't mutate props.
  const currentConfigRef = useRef<AppState>(JSON.parse(JSON.stringify(targetConfig)));

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // 1. Update autonomous AI position
    const movement = autonomousAI.update(delta, userActive);

    // Smoothly lerp position
    const lerpFactor = 1.0 - Math.pow(0.0001, delta); // Faster lerp
    groupRef.current.position.x += (movement.x * 20 - groupRef.current.position.x) * lerpFactor;
    groupRef.current.position.y += ((movement.y * 12 + movement.jump * 8) - groupRef.current.position.y) * lerpFactor;
    groupRef.current.rotation.z += (movement.rotation - groupRef.current.rotation.z) * lerpFactor;

    // 2. Manual lerping of config values in the ref
    const cur = currentConfigRef.current;

    // Lerp Sphere values
    cur.sphere.pulseSpeed += (targetConfig.sphere.pulseSpeed - cur.sphere.pulseSpeed) * lerpFactor * 0.8;
    cur.sphere.foldAmount += (targetConfig.sphere.foldAmount - cur.sphere.foldAmount) * lerpFactor * 0.8;
    cur.sphere.luminosity += (targetConfig.sphere.luminosity - cur.sphere.luminosity) * lerpFactor * 0.8;

    // Lerp Ring values
    const lerpVec3 = (curr: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }, f: number) => {
      curr.x += (target.x - curr.x) * f;
      curr.y += (target.y - curr.y) * f;
      curr.z += (target.z - curr.z) * f;
    };

    lerpVec3(cur.rings.ring1Speed, targetConfig.rings.ring1Speed, lerpFactor * 0.5);
    lerpVec3(cur.rings.ring2Speed, targetConfig.rings.ring2Speed, lerpFactor * 0.5);
    lerpVec3(cur.rings.ring3Speed, targetConfig.rings.ring3Speed, lerpFactor * 0.5);

    // Lerp Particle values
    cur.particles.speed += (targetConfig.particles.speed - cur.particles.speed) * lerpFactor * 0.8;
    cur.particles.size += (targetConfig.particles.size - cur.particles.size) * lerpFactor * 0.8;
  });

  // Detect user activity
  useEffect(() => {
    const handleActivity = () => {
      setUserActive(true);
      setTimeout(() => setUserActive(false), 5000);
    };
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('click', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  // Pass the ref-based config to children. 
  // Note: Children must read from this config in their own useFrame or be designed to handle static props that are mutated.
  // Since we are mutating 'cur' (currentConfigRef.current), the children will see the updated values in their next frame.
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <CentralConstruct config={currentConfigRef.current.sphere} transform={targetConfig.transforms.sphere} />
      <MechanicalRings config={currentConfigRef.current.rings} transforms={targetConfig.transforms} />
      <ParticleField config={currentConfigRef.current.particles} />
    </group>
  );
}

export default function App() {
  const [config, setConfig] = useState<AppState>(DEFAULT_STATE);
  const engineRef = useRef<VizzyAnimationEngine>(new VizzyAnimationEngine(DEFAULT_STATE));
  const autonomousAIRef = useRef<VizzyAutonomousAI>(new VizzyAutonomousAI());
  const lastChatContextRef = useRef<string>('');

  // Listen for chat updates from dawn-ui
  useEffect(() => {
    const handleChatUpdate = async (event: CustomEvent<{ messages: string; context?: any }>) => {
      const chatContext = event.detail.messages;

      if (chatContext === lastChatContextRef.current) return;
      lastChatContextRef.current = chatContext;

      const userAction = event.detail.context?.lastAction || '';
      autonomousAIRef.current.notifyUserAction(userAction);

      try {
        const sentimentResponse = await fetchVizzySentiment({
          chatContext,
          npcPresent: event.detail.context?.npcs,
          playerAction: userAction,
        });

        const animationConfig = engineRef.current.generateAnimation({
          sentiment: sentimentResponse.sentiment,
          intensity: sentimentResponse.intensity,
          context: sentimentResponse.context,
          procedural: sentimentResponse.procedural,
        });

        setConfig(prev => ({
          ...prev,
          ...animationConfig,
          sphere: { ...prev.sphere, ...(animationConfig.sphere || {}) },
          rings: { ...prev.rings, ...(animationConfig.rings || {}) },
          particles: { ...prev.particles, ...(animationConfig.particles || {}) },
        }));
      } catch (error) {
        console.error('[Vizzy] Animation update failed:', error);
      }
    };

    const handleSentiment = (event: CustomEvent<{ sentiment: string; intensity?: number }>) => {
      const animationConfig = engineRef.current.generateAnimation({
        sentiment: event.detail.sentiment,
        intensity: event.detail.intensity ?? 0.8,
      });

      setConfig(prev => ({
        ...prev,
        ...animationConfig,
        sphere: { ...prev.sphere, ...(animationConfig.sphere || {}) },
        rings: { ...prev.rings, ...(animationConfig.rings || {}) },
        particles: { ...prev.particles, ...(animationConfig.particles || {}) },
      }));
    };

    window.addEventListener('vizzy-chat-update' as any, handleChatUpdate);
    window.addEventListener('vizzy-sentiment' as any, handleSentiment);

    const handleStateUpdate = (event: CustomEvent<{ state: any; timestamp: number }>) => {
      const { state: vizzyState } = event.detail;
      if (vizzyState.emotionalMode) {
        autonomousAIRef.current.notifyUserAction(vizzyState.emotionalMode);
      }
    };

    window.addEventListener('vizzy-state-update' as any, handleStateUpdate);

    return () => {
      window.removeEventListener('vizzy-chat-update' as any, handleChatUpdate);
      window.removeEventListener('vizzy-sentiment' as any, handleSentiment);
      window.removeEventListener('vizzy-state-update' as any, handleStateUpdate);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-transparent overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          camera={{ position: [40, 25, 40], fov: 30 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[window.devicePixelRatio, 2]}
        >
          <Suspense fallback={null}>
            <VizzyScene targetConfig={config} autonomousAI={autonomousAIRef.current} />
            <Environment preset="city" />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <ambientLight intensity={0.5} color="#4040a0" />
            <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#ff00ff" />
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableRotate={false}
            target={[0, 0, 0]}
          />
        </Canvas>
      </div>
    </div>
  );
}