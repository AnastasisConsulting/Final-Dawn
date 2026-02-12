import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface AtmosphereProps {
  color: string;
  size?: number;
}

const Atmosphere: React.FC<AtmosphereProps> = ({ color, size = 1.0 }) => {
  const materialRef = React.useRef<THREE.ShaderMaterial>(null);

  const vertexShader = `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec3 vNormal;
    uniform vec3 uColor;
    
    void main() {
      float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
      gl_FragColor = vec4(uColor, 1.0) * intensity * 1.5;
    }
  `;

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) }
  }), [color]);

  return (
    <mesh scale={[size * 1.2, size * 1.2, size * 1.2]}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
};

export default Atmosphere;