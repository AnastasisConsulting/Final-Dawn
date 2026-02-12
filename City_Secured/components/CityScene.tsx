import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances, PerspectiveCamera, Float, Stars, Trail, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { CITY_SIZE, BUILDING_COUNT, INCIDENT_COLORS } from '../constants';
import { Incident, SystemMode } from '../types';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

const useCityLayout = () => {
  return useMemo(() => {
    const buildings = [];
    for (let i = 0; i < BUILDING_COUNT; i++) {
      const x = (Math.random() - 0.5) * CITY_SIZE;
      const z = (Math.random() - 0.5) * CITY_SIZE;
      if (Math.abs(x) < 2 && Math.abs(z) < 2) continue; 
      const height = Math.random() * 4 + 1;
      buildings.push({ position: [x, height / 2, z], scale: [1, height, 1] });
    }
    return buildings;
  }, []);
};

export const Buildings: React.FC<{ mode: SystemMode }> = ({ mode }) => {
  const layout = useCityLayout();
  const isSiege = mode === 'SIEGE';
  return (
    <Instances range={layout.length}>
      <boxGeometry />
      <meshStandardMaterial 
        color={isSiege ? "#2a0a0a" : "#1e293b"} 
        emissive={isSiege ? "#450a0a" : "#0f172a"} 
        roughness={0.2} metalness={0.8} wireframe={isSiege} 
      />
      {layout.map((data: any, i) => (
        <BuildingInstance key={i} {...data} isSiege={isSiege} />
      ))}
    </Instances>
  );
};

const BuildingInstance = ({ position, scale, isSiege }: any) => {
  const isLit = useMemo(() => Math.random() > 0.7, []);
  return (
    <group position={position}>
      <Instance scale={scale} />
      {!isSiege && <mesh scale={[scale[0]*1.01, scale[1]*1.01, scale[2]*1.01]}><boxGeometry /><meshBasicMaterial color={isLit ? "#0ea5e9" : "#334155"} wireframe transparent opacity={0.3} /></mesh>}
      {isSiege && <mesh scale={[scale[0]*1.02, scale[1]*1.02, scale[2]*1.02]}><boxGeometry /><meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.1} /></mesh>}
    </group>
  );
};

export const Ground: React.FC<{ mode: SystemMode }> = ({ mode }) => {
  const isSiege = mode === 'SIEGE';
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[CITY_SIZE * 2, CITY_SIZE * 2, 32, 32]} />
      <meshStandardMaterial color={isSiege ? "#1a0505" : "#020617"} metalness={0.8} roughness={0.2} emissive={isSiege ? "#2b0a0a" : "#0f172a"} emissiveIntensity={0.2} />
      <gridHelper args={[CITY_SIZE * 2, 40, isSiege ? '#ef4444' : '#1e293b', isSiege ? '#450a0a' : '#0f172a']} rotation={[-Math.PI / 2, 0, 0]} />
    </mesh>
  );
};

export const IncidentMarker: React.FC<{ incident: Incident }> = ({ incident }) => {
  const color = INCIDENT_COLORS[incident.type] || '#ffffff';
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => { if (ref.current) { ref.current.rotation.y += 0.05; const scale = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.3; ref.current.scale.set(scale, scale, scale); } });
  return (
    <group position={incident.position} ref={ref}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}><ringGeometry args={[1, 1.2, 32]} /><meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} /></mesh>
      <Float speed={4} rotationIntensity={0} floatIntensity={1}>
        <mesh position={[0, 2, 0]}><octahedronGeometry args={[0.5]} /><meshBasicMaterial color={color} wireframe /></mesh>
        <pointLight color={color} distance={15} intensity={8} />
      </Float>
      <mesh position={[0, 10, 0]}><cylinderGeometry args={[0.05, 0.05, 20, 8]} /><meshBasicMaterial color={color} transparent opacity={0.3} /></mesh>
    </group>
  );
};

export const ResponseUnit: React.FC<{ target: [number, number, number], mode: SystemMode }> = ({ target, mode }) => {
  const ref = useRef<THREE.Group>(null);
  const color = mode === 'SIEGE' ? '#10b981' : '#06b6d4'; 
  const [startPos] = useState(() => [(Math.random() - 0.5) * 15, 3, (Math.random() - 0.5) * 15] as [number, number, number]);
  useFrame((state) => {
    if (ref.current) {
      const speed = mode === 'SIEGE' ? 0.05 : 0.02; 
      ref.current.position.x += (target[0] - ref.current.position.x) * speed;
      ref.current.position.z += (target[2] - ref.current.position.z) * speed;
      ref.current.position.y = 2 + Math.sin(state.clock.elapsedTime * 2 + startPos[0]) * 0.5;
      ref.current.lookAt(target[0], target[1], target[2]);
    }
  });
  return (
    <group position={startPos} ref={ref}>
      <Trail width={0.5} length={mode === 'SIEGE' ? 12 : 8} color={color} attenuation={(t) => t * t}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={mode === 'SIEGE' ? [0.1, 0.4, 4] : [0.2, 0.5, 8]} /><meshBasicMaterial color={color} /></mesh>
      </Trail>
    </group>
  );
};

const ScanningGrid: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => { if (ref.current) { ref.current.position.y = 1 + Math.sin(state.clock.elapsedTime) * 3; ref.current.scale.set(1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2, 1, 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2); } });
  return <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 2, 0]}><planeGeometry args={[CITY_SIZE, CITY_SIZE, 20, 20]} /><meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.15} /></mesh>;
};

export const SceneContent: React.FC<{ activeIncident: Incident | null, mode: SystemMode }> = ({ activeIncident, mode }) => {
  const isSiege = mode === 'SIEGE';
  return (
    <>
      <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
      <Environment preset={isSiege ? "city" : "night"} />
      <ambientLight intensity={isSiege ? 0.1 : 0.2} />
      <pointLight position={[10, 10, 10]} intensity={isSiege ? 0.2 : 0.5} color={isSiege ? "#ef4444" : "#ffffff"} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={[isSiege ? '#1a0505' : '#020617', 5, 40]} />
      <group>
        <Buildings mode={mode} />
        <Ground mode={mode} />
        {isSiege && <ScanningGrid />}
        {activeIncident && <><IncidentMarker incident={activeIncident} />{(activeIncident.status === 'RESPONDING' || activeIncident.status === 'TRACKING') && Array.from({ length: isSiege ? 6 : 3 }).map((_, i) => <ResponseUnit key={i} target={activeIncident.position} mode={mode} />)}</>}
      </group>
    </>
  );
};