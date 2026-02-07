
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleConfig, Transform } from '../../../../types/vizzy';

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
    
    attribute float aScale;
    attribute float aZone; // 0.0 = Cylinder (CCW), 1.0 = Sphere (CW)
    
    varying float vAlpha;
    
    void main() {
      vec3 pos = position;
      
      // 1. Twist Logic
      float twistAngle = pos.y * uTwist;
      float ct = cos(twistAngle);
      float st = sin(twistAngle);
      mat2 twistMat = mat2(ct, -st, st, ct);
      pos.xz = twistMat * pos.xz;

      // 2. Bloom Logic
      float r = length(pos.xz);
      if (r > 0.001) {
          vec2 dir = pos.xz / r;
          float bloomPulse = sin(uTime * 2.0 + r * 2.0) * 0.5 + 0.5;
          pos.xz += dir * uBloom * bloomPulse;
      }

      // 3. Overall Cloud Scale
      pos *= uCloudScale;

      // 4. Orbiting movement (Dual Zone)
      float rotationDir = (aZone < 0.5) ? 1.0 : -1.0;
      float orbitSpeed = uSpeed * 0.2;
      float zoneSpeed = (aZone < 0.5) ? 0.5 : 1.5; 

      float angle = uTime * orbitSpeed * rotationDir * zoneSpeed + pos.x * 0.05; 
      float c = cos(angle);
      float s = sin(angle);
      
      vec3 rotated = pos;
      rotated.x = pos.x * c - pos.z * s;
      rotated.z = pos.x * s + pos.z * c;

      // 5. Vertical Drift (Cylinder only)
      float driftStrength = (aZone < 0.5) ? 1.0 : 0.1;
      rotated.y += sin(uTime * 1.5 + pos.x) * uNoise * 0.5 * driftStrength;

      // 6. Project to screen
      vec4 mvPosition = modelViewMatrix * vec4(rotated, 1.0);
      
      gl_PointSize = uSize * aScale * (30.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      
      vAlpha = 0.5 + 0.5 * sin(uTime * 3.0 + pos.y * 10.0 + pos.x * 10.0);
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

    const { positions, scales, zones } = useMemo(() => {
        const count = config.count;
        const pos = new Float32Array(count * 3);
        const sc = new Float32Array(count);
        const zn = new Float32Array(count); // Zone ID

        // Distribution:
        // 70% Cylinder (Pillar) -> Rotates CCW
        // 30% Sphere (Shell) -> Rotates CW

        const cylCount = Math.floor(count * 0.7);

        // Cylinder Dims
        const cylRadius = config.radius * 0.25;
        const cylHeight = config.radius * 2.5;

        // Sphere Dims (Just larger than the main sphere radius which is ~2)
        const sphereRadiusMin = 2.1;
        const sphereRadiusMax = 2.4;

        for (let i = 0; i < count; i++) {
            let x, y, z, scale, zone;

            if (i < cylCount) {
                // CYLINDER GENERATION (Zone 0)
                const r = Math.sqrt(Math.random()) * cylRadius;
                const theta = Math.random() * Math.PI * 2;
                const h = (Math.random() - 0.5) * cylHeight;

                x = r * Math.cos(theta);
                y = h;
                z = r * Math.sin(theta);

                scale = 0.4 + Math.random() * 0.4; // Fine dust
                zone = 0.0;
            } else {
                // SPHERE SHELL GENERATION (Zone 1)
                const r = sphereRadiusMin + Math.random() * (sphereRadiusMax - sphereRadiusMin);
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                x = r * Math.sin(phi) * Math.cos(theta);
                y = r * Math.sin(phi) * Math.sin(theta);
                z = r * Math.cos(phi);

                scale = 0.8 + Math.random() * 0.8; // Visible specks
                zone = 1.0;
            }

            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;
            sc[i] = scale;
            zn[i] = zone;
        }
        return { positions: pos, scales: sc, zones: zn };
    }, [config.count, config.radius]);

    useFrame((state) => {
        if (shaderRef.current) {
            shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
            shaderRef.current.uniforms.uColor.value.set(config.color);
            shaderRef.current.uniforms.uSize.value = config.size * 50;
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
                    <bufferAttribute attach="attributes-aScale" count={scales.length} array={scales} itemSize={1} />
                    <bufferAttribute attach="attributes-aZone" count={zones.length} array={zones} itemSize={1} />
                </bufferGeometry>
                <shaderMaterial ref={shaderRef} args={[shaderArgs]} />
            </points>
        </group>
    );
};
