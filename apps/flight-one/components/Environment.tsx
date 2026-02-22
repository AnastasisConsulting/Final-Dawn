
import React, { useRef, useMemo } from 'react';
import { Sparkles, Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RealisticStarField } from './RealisticStarField';
import '../types';

interface EnvironmentProps {
  isBoosting?: boolean;
  shipPosition?: THREE.Vector3;
}

const BlackHole = () => {
  return (
    <group position={[0, 2000, -8000]} rotation={[Math.PI / 6, 0, Math.PI / 8]}>
      {/* Event Horizon */}
      <mesh>
        <sphereGeometry args={[200, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* Accretion Disk */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[220, 500, 64]} />
        <meshBasicMaterial color="#f97316" side={THREE.DoubleSide} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Inner Hot Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[205, 250, 64]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Gamma Ray Jets */}
      <mesh position={[0, 2000, 0]}>
        <cylinderGeometry args={[10, 50, 4000, 32, 1, true]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, -2000, 0]}>
        <cylinderGeometry args={[50, 10, 4000, 32, 1, true]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

const Wormhole = () => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z += 0.02;
      ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
    }
  });

  return (
    <group position={[-5000, -1000, 4000]} rotation={[0, Math.PI / 4, 0]}>
      <group ref={ref}>
        <mesh>
          <torusGeometry args={[300, 50, 16, 100]} />
          <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, 280, 64]} />
          <meshBasicMaterial color="#2e1065" transparent opacity={0.5} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <Sparkles count={200} scale={800} size={20} speed={2} color="#d8b4fe" />
    </group>
  )
}

const StellarNursery = () => {
  return (
    <group position={[5000, 3000, 2000]}>
      {/* Glowing Gas Cloud simulation using layered spheres */}
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
        <mesh>
          <sphereGeometry args={[600, 32, 32]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[200, -100, 100]}>
          <sphereGeometry args={[400, 32, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </Float>
      {/* New Stars */}
      <Sparkles count={300} scale={1200} size={40} speed={0.4} opacity={1} color="#fff" />
      <pointLight color="#f472b6" intensity={2} distance={2000} />
      <pointLight color="#60a5fa" intensity={2} distance={2000} position={[200, -100, 100]} />
    </group>
  )
}

const CelestialGrid = () => {
  return (
    <group>
      {/* Equatorial Ring (White) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[19950, 20000, 128]} />
        <meshBasicMaterial color="#ffffff" opacity={0.1} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Polar Ring 1 (Cyan) */}
      <mesh rotation={[0, 0, 0]}>
        <ringGeometry args={[19950, 20000, 128]} />
        <meshBasicMaterial color="#06b6d4" opacity={0.05} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

const WarpField: React.FC<{ active: boolean }> = ({ active }) => {
  const groupRef = useRef<THREE.Group>(null);
  const count = 300;

  const lines = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 800,
          (Math.random() - 0.5) * 800,
          Math.random() * -2000
        ),
        speed: 1500 + Math.random() * 2000
      });
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Intensity Lerping
    const targetOpacity = active ? 0.6 : 0;
    groupRef.current.children.forEach((child: any) => {
      if (child.material) {
        child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, delta * 4);
        if (active) {
          child.position.z += delta * lines[child.userData.index].speed;
          if (child.position.z > 200) child.position.z = -1800;
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {lines.map((line, i) => (
        <mesh key={i} position={line.pos} userData={{ index: i }}>
          <boxGeometry args={[0.15, 0.15, 40]} />
          <meshBasicMaterial color="#a5f3fc" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

const MovingStarField = () => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      // Keep centered on camera
      groupRef.current.position.copy(state.camera.position);
    }
  });

  return (
    <group ref={groupRef}>
      <RealisticStarField count={12000} radius={8000} clusters={80} />
    </group>
  );
};

export const Environment: React.FC<EnvironmentProps> = ({ isBoosting = false }) => {
  return (
    <group>
      {/* 1. Distance Fog */}
      <fogExp2 attach="fog" args={['#000105', 0.0001]} />

      {/* 2. Dynamic Starfield (Follows Camera) */}
      <MovingStarField />

      {/* 3. Warp Field Effect */}
      <WarpField active={isBoosting} />

      {/* 4. Ambient Sparkles (Centered on player) */}
      <Sparkles count={400} scale={5000} size={10} speed={0.1} opacity={0.2} color="#4c1d95" />

      {/* 5. Global Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[0, 10, 0]} intensity={0.8} color="#1e3a8a" />

      {/* 6. Contextual Scenery */}
      <CelestialGrid />
      <BlackHole />
      <Wormhole />
      <StellarNursery />
    </group>
  );
};
