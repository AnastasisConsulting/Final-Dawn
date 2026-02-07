import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { useGameStore } from '../../store';

const SHIP_COUNT = 100; // Increased traffic significantly

const SingleShip = ({ offset, speed, altitude, center }: { offset: number; speed: number; altitude: number, center: Vector3 }) => {
  const ref = useRef<Group>(null);
  
  // Spawn relative to the center (City location)
  const startPos = useMemo(() => {
      const offsetX = (Math.random() - 0.5) * 5000;
      const offsetZ = (Math.random() - 0.5) * 5000;
      return new Vector3(center.x + offsetX, altitude, center.z + offsetZ);
  }, [center, altitude]);

  const direction = useMemo(() => new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(), []);
  
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    
    // Move along direction
    const moveDist = (t * speed * 150) + offset;
    const currentPos = startPos.clone().add(direction.clone().multiplyScalar(moveDist));
    
    // Wrap around logic relative to city center
    // If too far from center, wrap to other side
    const distToCenter = currentPos.distanceTo(center);
    if (distToCenter > 3000) {
        if (currentPos.x > center.x + 3000) currentPos.x -= 6000;
        if (currentPos.x < center.x - 3000) currentPos.x += 6000;
        if (currentPos.z > center.z + 3000) currentPos.z -= 6000;
        if (currentPos.z < center.z - 3000) currentPos.z += 6000;
    }
    
    ref.current.position.copy(currentPos);
    ref.current.lookAt(currentPos.clone().add(direction));
  });

  return (
    <group ref={ref}>
       <mesh rotation={[0, Math.PI, 0]}>
         <coneGeometry args={[1, 4, 4]} />
         <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} />
       </mesh>
       <mesh position={[0, 0, 2.5]} rotation={[Math.PI/2, 0, 0]}>
         <cylinderGeometry args={[0.2, 0.05, 3, 8]} />
         <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
       </mesh>
       <pointLight distance={10} intensity={0.5} color="#fbbf24" decay={2} />
    </group>
  );
};

export const Traffic: React.FC = () => {
  const { landingPadPosition } = useGameStore();
  
  const center = useMemo(() => new Vector3(...landingPadPosition), []);

  const ships = useMemo(() => {
    return new Array(SHIP_COUNT).fill(0).map((_, i) => ({
      key: i,
      offset: Math.random() * 2000,
      speed: 0.5 + Math.random() * 2.0,
      altitude: 400 + Math.random() * 1200
    }));
  }, []);

  return (
    <group>
      {ships.map((ship) => (
        <SingleShip key={ship.key} {...ship} center={center} />
      ))}
    </group>
  );
};