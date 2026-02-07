import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { NodeData, Affinity } from '../types';

interface NodeProps {
  position: [number, number, number];
  data: NodeData;
  color: string;
  onSelect: (data: NodeData | null) => void;
  selectedId?: string;
}

const getColor = (affinity: Affinity) => {
  switch (affinity) {
    case Affinity.STR: return '#ef4444'; // Red-500
    case Affinity.INT: return '#3b82f6'; // Blue-500
    case Affinity.DEX: return '#22c55e'; // Green-500
    default: return '#fbbf24'; // Amber-400
  }
};

const SkillNode = ({ position, color, isActive, label }: { position: [number, number, number], color: string, isActive: boolean, label: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
      const scale = hovered ? 1.5 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh 
        ref={meshRef} 
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={hovered ? 1 : 0.2}
          transparent
          opacity={0.8}
        />
      </mesh>
       {hovered && (
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <Html position={[0, 1, 0]} center pointerEvents="none">
             <div className="bg-black/80 text-white text-xs px-2 py-1 rounded border border-white/20 whitespace-nowrap backdrop-blur-sm">
              {label}
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
};

export const TreeNode: React.FC<NodeProps> = ({ position, data, onSelect, selectedId }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  const color = getColor(data.affinity);
  const isSelected = selectedId === data.id;

  useFrame(() => {
    if (meshRef.current) {
      // Gentle pulsing or rotation
      meshRef.current.rotation.y += 0.005;
      const targetScale = isSelected ? 1.3 : hovered ? 1.15 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect(data);
  };

  return (
    <group position={position}>
      {/* The Class Node (Sphere) */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.6}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={isSelected ? 0.8 : hovered ? 0.5 : 0.1}
        />
      </mesh>

      {/* Label */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <Html position={[0, -1.8, 0]} center pointerEvents="none" transform>
          <div className={`px-3 py-1 rounded-full text-sm font-bold border transition-all duration-300
            ${isSelected ? 'bg-white text-black border-white scale-110' : 'bg-black/60 text-white border-white/20'}`}
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
          >
            {data.name}
          </div>
        </Html>
      </Billboard>
      
      {/* Skill Nodes (Squares) floating near the class node - Level 0 core skills */}
      {data.type === 'CLASS_CORE' && (
        <group>
           <SkillNode position={[-1, 1.5, 0]} color={color} isActive={true} label={data.skills[0]?.name} />
           <SkillNode position={[1, 1.5, 0]} color={color} isActive={true} label={data.skills[1]?.name} />
        </group>
      )}

      {/* Render Children Recursively */}
      {data.children?.map((child, idx) => {
        // Calculate child position based on index and depth
        // We fan out children. 
        // 3 children per core, then 1 child per sub.
        let childOffset: [number, number, number] = [0, 8, 0];
        
        if (data.type === 'CLASS_CORE') {
           // Fan out the 3 sub-classes
           const angleSpread = 0.8; // Radians
           const angle = (idx - 1) * angleSpread;
           // Rotate vector (0, 8, 0) by Z axis? No, strictly 3D relative
           // Let's use simple x/z offset
           childOffset = [(idx - 1) * 6, 10, (idx - 1) * 2];
        } else {
           // Linear progression upwards for sub -> cross -> master
           childOffset = [0, 8, 0];
        }

        const childPos: [number, number, number] = [
          position[0] + childOffset[0],
          position[1] + childOffset[1],
          position[2] + childOffset[2]
        ];

        // Midpoint for connection line skills
        const midPos: [number, number, number] = [
            (position[0] + childPos[0]) / 2,
            (position[1] + childPos[1]) / 2,
            (position[2] + childPos[2]) / 2
        ];
        
        // Offset skills slightly from the line
        const skill1Pos: [number, number, number] = [midPos[0] - 0.5, midPos[1], midPos[2] + 0.5];
        const skill2Pos: [number, number, number] = [midPos[0] + 0.5, midPos[1], midPos[2] - 0.5];

        const childColor = getColor(child.affinity);

        return (
          <React.Fragment key={child.id}>
            {/* Connection Line */}
            <Line
              points={[position, childPos]}
              color={childColor}
              lineWidth={2}
              transparent
              opacity={0.3}
            />
            
            {/* Skills along the path (The "squares" mentioned in prompt) */}
            {child.skills.length > 0 && (
                <group>
                   {/* E3/E4, E5/E6, E7 */}
                   <SkillNode position={skill1Pos} color={childColor} isActive={true} label={child.skills[0].name} />
                   {child.skills[1] && (
                       <SkillNode position={skill2Pos} color={childColor} isActive={true} label={child.skills[1].name} />
                   )}
                </group>
            )}

            <TreeNode 
              position={childPos} 
              data={child} 
              color={getColor(child.affinity)}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          </React.Fragment>
        );
      })}
    </group>
  );
};