// components/Planet.tsx
import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import Atmosphere from './Atmosphere';
import Clouds from './Clouds';
import { proceduralVertexShader, proceduralFragmentShader } from './shaders/planetShaders';

interface PlanetProps {
  textureUrl: string | null;
  rotationSpeed: number;
  atmosphereColor: string;
}

const Planet: React.FC<PlanetProps> = ({ textureUrl, rotationSpeed, atmosphereColor }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const texture = useMemo(() => {
    if (!textureUrl) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(textureUrl);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 16; 
    return tex;
  }, [textureUrl]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Planet surface rotation
      meshRef.current.rotation.y += rotationSpeed * delta * 0.1;
    }
  });

  const proceduralUniforms = useMemo(() => ({
    uColorWater: { value: new THREE.Color("#001133") },
    uColorSand: { value: new THREE.Color("#d4b483") },
    uColorGrass: { value: new THREE.Color("#1a4a1a") },
    uColorMountain: { value: new THREE.Color("#5a5a5a") },
    uColorSnow: { value: new THREE.Color("#ffffff") },
    uColorCity: { value: new THREE.Color("#8899aa") },
    uLightDirection: { value: new THREE.Vector3(5, 3, 5).normalize() }
  }), []);

  // Calculate cloud rotation speeds relative to planet
  // Cloud layers move slightly faster than planet to simulate wind/orbit difference
  const baseCloudSpeed = rotationSpeed * 0.1;

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        {texture ? (
           <meshStandardMaterial 
             map={texture}
             bumpMap={texture}
             bumpScale={0.05} 
             metalness={0.2} 
             roughness={0.6} 
           />
        ) : (
          <shaderMaterial 
            ref={materialRef}
            vertexShader={proceduralVertexShader}
            fragmentShader={proceduralFragmentShader}
            uniforms={proceduralUniforms}
          />
        )}
      </mesh>
      
      {/* Volumetric Cloud Layers with Parallax */}
      {/* Layer 1: Low, dense */}
      <Clouds 
        radius={1.01} 
        rotationSpeed={baseCloudSpeed * 1.1} // 10% faster than surface
        opacity={0.5}
        seed={0}
        textureSpeed={0.02}
      />

      {/* Layer 2: High, wispy, faster */}
      <Clouds 
        radius={1.025} 
        rotationSpeed={baseCloudSpeed * 1.2} // 20% faster than surface
        opacity={0.4}
        seed={42} // Different noise pattern
        textureSpeed={0.03}
      />

      <Atmosphere color={atmosphereColor} size={1} />
    </group>
  );
};

export default Planet;