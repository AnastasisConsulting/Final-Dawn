/// <reference path="../../three-elements.d.ts" />
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleConfig, Transform } from '../../types';

const ParticleShader = {
    uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color() },
        uSize: { value: 10.0 },
        uOpacity: { value: 1.0 },
        uSpeed: { value: 1.0 },
        uNoise: { value: 1.0 },
        uTwist: { value: 0.0 },
        uCloudScale: { value: 1.0 },
        uBloom: { value: 0.0 },
    },
    vertexShader: `
    uniform float uTime;
    uniform float uSize;
    uniform float uSpeed;
    uniform float uNoise;
    uniform float uTwist;
    uniform float uCloudScale;
    uniform float uBloom;
    
    varying float vAlpha;
    
    void main() {
      vec3 pos = position;
      
      // 1. Twist Logic (Spiral around Y)
      float twistAngle = pos.y * uTwist;
      float ct = cos(twistAngle);
      float st = sin(twistAngle);
      mat2 twistMat = mat2(ct, -st, st, ct);
      pos.xz = twistMat * pos.xz;

      // 2. Bloom Logic (Radial Pulse/Displacement)
      float r = length(pos);
      if (r > 0.001) {
          vec3 dir = pos / r;
          float bloomPulse = sin(uTime * 2.0 + r * 2.0) * 0.5 + 0.5;
          pos += dir * uBloom * bloomPulse;
      }

      // 3. Overall Cloud Scale
      pos *= uCloudScale;

      // 4. Orbiting movement
      float angle = uTime * uSpeed * 0.1 + pos.x * 0.1;
      float c = cos(angle);
      float s = sin(angle);
      
      vec3 rotated = vec3(
          pos.x * c - pos.z * s,
          pos.y,
          pos.x * s + pos.z * c
      );

      // 5. Noise/Bobbing movement
      rotated.y += sin(uTime * 2.0 + pos.y) * uNoise;

      vec4 mvPosition = modelViewMatrix * vec4(rotated, 1.0);
      
      // Size attenuation
      gl_PointSize = uSize * (30.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      
      // Twinkling
      vAlpha = 0.5 + 0.5 * sin(uTime * 3.0 + pos.x * 100.0);
    }
  `,
    fragmentShader: `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vAlpha;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      
      float strength = 1.0 - (dist * 2.0);
      strength = pow(strength, 2.0);

      gl_FragColor = vec4(uColor, uOpacity * vAlpha * strength);
    }
  `
};

export const ParticleField: React.FC<{ config: ParticleConfig; transform?: Transform }> = ({ config, transform }) => {
    const shaderRef = useRef<THREE.ShaderMaterial>(null);

    const positions = useMemo(() => {
        const pos = new Float32Array(config.count * 3);
        for (let i = 0; i < config.count; i++) {
            const r = config.radius * Math.cbrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);
        }
        return pos;
    }, [config.count, config.radius]);

    useFrame((state) => {
        if (shaderRef.current) {
            shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
            shaderRef.current.uniforms.uColor.value.set(config.color);
            shaderRef.current.uniforms.uSize.value = config.size * 100;
            shaderRef.current.uniforms.uOpacity.value = config.opacity;
            shaderRef.current.uniforms.uSpeed.value = config.speed;
            shaderRef.current.uniforms.uNoise.value = config.noiseStrength;
            shaderRef.current.uniforms.uTwist.value = config.twist;
            shaderRef.current.uniforms.uCloudScale.value = config.overallScale;
            shaderRef.current.uniforms.uBloom.value = config.bloom;
        }
    });

    const shaderArgs = useMemo(() => ({
        uniforms: { ...ParticleShader.uniforms },
        vertexShader: ParticleShader.vertexShader,
        fragmentShader: ParticleShader.fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    }), []);

    const t = transform || { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } };

    return (
        <group
            name="particles"
            position={[t.position.x, t.position.y, t.position.z]}
            rotation={[t.rotation.x, t.rotation.y, t.rotation.z]}
            scale={[t.scale.x, t.scale.y, t.scale.z]}
        >
            <points name="particles_points">
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                </bufferGeometry>
                <shaderMaterial ref={shaderRef} args={[shaderArgs]} />
            </points>
        </group>
    );
};