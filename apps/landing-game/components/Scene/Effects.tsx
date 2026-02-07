import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointsMaterial } from 'three';
import { useGameStore } from '../../store';

export const ReEntryEffects: React.FC = () => {
  const ref = useRef<Points>(null);
  const { speed, altitude, temperature } = useGameStore();

  useFrame((state, delta) => {
    if (!ref.current) return;
    
    // Only show if hot and fast
    const visible = temperature > 300 && speed > 0.5;
    ref.current.visible = visible;

    if (visible) {
      // Jitter particles to simulate flames/turbulence
      const positions = ref.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
         // Reset if too far back
         if (positions[i + 2] > 5) {
            positions[i + 2] = -2;
            positions[i] = (Math.random() - 0.5) * 2;
            positions[i+1] = (Math.random() - 0.5) * 2;
         }
         positions[i + 2] += speed * 20 * delta; // Move particles backward relative to ship
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
      
      // Pulse opacity based on heat
      const mat = ref.current.material as PointsMaterial;
      mat.opacity = Math.min((temperature - 300) / 1000, 0.8);
      mat.color.setHSL(0.05 + Math.random() * 0.1, 1, 0.5); // Flicker orange/yellow
    }
  });

  // Generate initial particles
  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);
  for(let i=0; i<particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 3; 
  }

  return (
    <points ref={ref} position={[0, 0, 2]}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          count={particleCount} 
          array={positions} 
          itemSize={3} 
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.2} 
        color="orange" 
        transparent 
        opacity={0} 
        blending={2} // Additive
      />
    </points>
  );
};