import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, Mesh, AdditiveBlending, CanvasTexture, RepeatWrapping } from 'three';
import { Sparkles } from '@react-three/drei';
import { useGameStore } from '../../store';
import { GamePhase } from '../../types';
import { City } from './City';

const generatePlanetTexture = () => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark base
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, size, size);

    // Generate random craters/surface noise
    for (let i = 0; i < 4000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 3 + 1;
        ctx.fillStyle = Math.random() > 0.6 ? '#334155' : '#0f172a';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Larger features
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 60 + 20;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Grid overlay for arcade feel
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 2;
    const gridSize = 64;
    for (let i=0; i<=size; i+=gridSize) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }

    return new CanvasTexture(canvas);
};

const CelebrationEffects: React.FC = () => {
  const ringRef = useRef<Mesh>(null);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
        const scale = 1 + Math.sin(t * 4) * 0.1;
        ringRef.current.scale.set(scale, scale, 1);
        ringRef.current.rotation.z = t * 0.5;
    }
  });

  return (
    <group>
        <mesh position={[0, 250, 0]}>
            <cylinderGeometry args={[10, 150, 500, 32, 1, true]} />
            <meshBasicMaterial color="#4ade80" transparent opacity={0.15} blending={AdditiveBlending} side={DoubleSide} depthWrite={false} />
        </mesh>
        <mesh ref={ringRef} rotation={[-Math.PI/2, 0, 0]} position={[0, 10, 0]}>
            <ringGeometry args={[190, 210, 64]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={DoubleSide} blending={AdditiveBlending} />
        </mesh>
        <Sparkles count={150} scale={[300, 150, 300]} size={40} speed={3} opacity={1} color="#fbbf24" position={[0, 20, 0]} noise={1}/>
        <Sparkles count={200} scale={[200, 600, 200]} size={25} speed={2} opacity={0.8} color="#4ade80" position={[0, 200, 0]} />
    </group>
  );
};

export const Planet: React.FC = () => {
  const { phase, landingPadPosition } = useGameStore();
  const isLanded = phase === GamePhase.LANDED;
  const [padX, padY, padZ] = landingPadPosition;
  const radius = 10000; 

  const texture = useMemo(() => {
    const tex = generatePlanetTexture();
    if (tex) {
        tex.wrapS = RepeatWrapping;
        tex.wrapT = RepeatWrapping;
        tex.repeat.set(8, 8);
    }
    return tex;
  }, []);

  const atmosphereColor = useMemo(() => new Color("#38bdf8"), []);

  return (
    <group position={[0, -radius, 0]}>
      {/* Main Planet Sphere with Texture */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial 
          map={texture}
          color="#ffffff"
          roughness={0.9}
          metalness={0.2}
        />
      </mesh>
      
      {/* Landing Zone & City */}
      <group position={[padX, radius + padY, padZ]}>
        
        {/* City Foundation (Plateau) to fill gap between flat plane and sphere curve */}
        <mesh position={[0, -400, 0]} receiveShadow>
           <cylinderGeometry args={[4500, 4200, 810, 64]} />
           <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.4} />
        </mesh>

        {/* The City surrounds the landing pad */}
        <City />

        {/* Landing Pad Geometry */}
        <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
            <circleGeometry args={[500, 64]} />
            <meshStandardMaterial color="#0f172a" roughness={1} />
        </mesh>
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 1, 0]}>
            <ringGeometry args={[180, 200, 64]} />
            <meshBasicMaterial color={isLanded ? "#4ade80" : "#0ea5e9"} opacity={isLanded ? 0.8 : 0.3} transparent side={DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 1, 0]}>
             <planeGeometry args={[100, 10]} />
             <meshBasicMaterial color={isLanded ? "#4ade80" : "#0ea5e9"} opacity={isLanded ? 0.8 : 0.5} transparent />
        </mesh>
        <mesh rotation={[-Math.PI/2, 0, Math.PI/2]} position={[0, 1, 0]}>
             <planeGeometry args={[100, 10]} />
             <meshBasicMaterial color={isLanded ? "#4ade80" : "#0ea5e9"} opacity={isLanded ? 0.8 : 0.5} transparent />
        </mesh>

        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const angle = (i / 8) * Math.PI * 2;
            return (
                <group key={i} position={[Math.cos(angle) * 190, 0.5, Math.sin(angle) * 190]}>
                    <mesh rotation={[-Math.PI/2, 0, 0]}>
                        <circleGeometry args={[5, 16]} />
                        <meshBasicMaterial color={isLanded ? "#22c55e" : "#ef4444"} />
                    </mesh>
                    {isLanded && <pointLight distance={50} intensity={2} color="#22c55e" decay={2} />}
                </group>
            );
        })}

        {isLanded && <CelebrationEffects />}
        {isLanded && <pointLight position={[0, 10, 0]} distance={300} intensity={1} color="#4ade80" decay={2} />}
        {isLanded && <group position={[0, 5, 0]}><Sparkles count={300} scale={[400, 20, 400]} size={20} speed={0.2} opacity={0.4} color="#e2e8f0" /></group>}
      </group>
      
      {/* Atmosphere Glow */}
      <mesh scale={[1.02, 1.02, 1.02]}>
         <sphereGeometry args={[radius, 64, 64]} />
         <meshStandardMaterial color={atmosphereColor} transparent opacity={0.1} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
};