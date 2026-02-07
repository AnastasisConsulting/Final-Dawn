/// <reference path="../../three-elements.d.ts" />
import React, { forwardRef } from 'react';
import { Group, MeshStandardMaterial, MeshBasicMaterial } from 'three';
import { Sparkles } from '@react-three/drei';

interface ShipModelProps {
  hullMaterialRef: React.RefObject<MeshStandardMaterial>;
  engineLeftMatRef: React.RefObject<MeshBasicMaterial>;
  engineRightMatRef: React.RefObject<MeshBasicMaterial>;
  leftPlumeRef: React.RefObject<Group>;
  rightPlumeRef: React.RefObject<Group>;
  landingGearGroupRef: React.RefObject<Group>;
  weaponLevel: number;
  isBoosting: boolean;
}

export const ShipModel = forwardRef<Group, ShipModelProps>(({
  hullMaterialRef,
  engineLeftMatRef,
  engineRightMatRef,
  leftPlumeRef,
  rightPlumeRef,
  landingGearGroupRef,
  weaponLevel,
  isBoosting
}, ref) => {
  const gunScale = 1 + weaponLevel * 0.5;

  return (
    <group ref={ref}>
      {/* Visual Feedback Component Positioners */}
      <group rotation={[0, Math.PI, 0]}>

        {/* Main Fuselage (Long Nose) */}
        <mesh position={[0, 0, -2]} rotation={[Math.PI / 2, 0, 0]}>
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
          <mesh position={[-1, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
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
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.6]}>
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
          <mesh position={[1, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
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
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.6]}>
              <cylinderGeometry args={[0.4, 0.1, 3.4, 16, 1, true]} />
              <meshBasicMaterial transparent opacity={0.4} color="#a5f3fc" depthWrite={false} blending={2} />
            </mesh>
          </group>
        </group>

        {/* Weapon Mounts */}
        <group position={[3.5, -0.2, 0]} scale={[gunScale, gunScale, gunScale]}>
          <mesh><boxGeometry args={[0.2, 0.2, 3]} /><meshStandardMaterial color="#333" /></mesh>
          <mesh position={[0, 0, -1.5]}><boxGeometry args={[0.1, 0.1, 1]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" /></mesh>
        </group>
        <group position={[-3.5, -0.2, 0]} scale={[gunScale, gunScale, gunScale]}>
          <mesh><boxGeometry args={[0.2, 0.2, 3]} /><meshStandardMaterial color="#333" /></mesh>
          <mesh position={[0, 0, -1.5]}><boxGeometry args={[0.1, 0.1, 1]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" /></mesh>
        </group>

        {/* Decals / Stripes */}
        <mesh position={[0, 0.51, -2]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.8, 4]} />
          <meshStandardMaterial ref={hullMaterialRef} color="#ef4444" roughness={0.8} emissive="#ef4444" emissiveIntensity={0.5} />
        </mesh>

        {/* Landing Gear Group - Revised for Star-Viper */}
        <group ref={landingGearGroupRef}>
          {/* Front Gear */}
          <group position={[0, -0.4, -2]}>
            <mesh>
              <boxGeometry args={[0.2, 1.2, 0.2]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
            <mesh position={[0, -0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.4, 16]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          </group>
          {/* Rear Left Gear */}
          <group position={[-2, -0.4, 3]}>
            <mesh>
              <boxGeometry args={[0.2, 1.2, 0.2]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
            <mesh position={[0, -0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.4, 16]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          </group>
          {/* Rear Right Gear */}
          <group position={[2, -0.4, 3]}>
            <mesh>
              <boxGeometry args={[0.2, 1.2, 0.2]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
            <mesh position={[0, -0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.4, 16]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          </group>
        </group>
      </group>

      {/* Thruster Particles */}
      <group position={[0, 0.2, 6]}>
        <Sparkles
          count={isBoosting ? 60 : 20}
          scale={[4, 1, 8]}
          size={4}
          speed={2}
          opacity={0.3}
          color="#a5f3fc"
        />
      </group>
    </group>
  );
});
