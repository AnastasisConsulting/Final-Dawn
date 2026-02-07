
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SphereConfig, Transform } from '../../../../types/vizzy';

const ConstructShaderMaterial = {
    uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0.0, 1.0, 1.0) },
        uLuminosity: { value: 1.0 },
        uPulseAmp: { value: 0.0 },
        uPulseSpeed: { value: 1.0 },
        uFoldAmount: { value: 0.0 },
        uFoldSpeed: { value: 0.5 },
        uFoldNoiseScale: { value: 0.7 },
        uLumaScale: { value: 5.0 },
        uLumaSpeed: { value: 0.2 },
        uOpacity: { value: 1.0 }
    },
    vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vDisplace;
    uniform float uTime;
    uniform float uPulseAmp;
    uniform float uPulseSpeed;
    uniform float uFoldAmount;
    uniform float uFoldSpeed;
    uniform float uFoldNoiseScale;
    
    // ... [Standard snoise function] ...
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      return 42.0 * dot(m*m*m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      vUv = uv;
      vNormal = normal;
      // Use the uniform noise scale
      float noiseVal = snoise(position * uFoldNoiseScale + uTime * uFoldSpeed);
      float pulse = sin(uTime * uPulseSpeed) * uPulseAmp;
      
      float rawDisplace = (noiseVal * uFoldAmount) + pulse;
      
      // Allow for more dynamic range in displacement
      float displacement = rawDisplace; 
      
      vDisplace = displacement;
      vec3 newPosition = position + normal * displacement;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
    fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vDisplace;
    uniform vec3 uColor;
    uniform float uLuminosity;
    uniform float uTime;
    uniform float uLumaScale;
    uniform float uLumaSpeed;
    uniform float uOpacity;

    void main() {
      float pattern = sin(vDisplace * uLumaScale + uTime * uLumaSpeed) * 0.5 + 0.5;
      pattern += sin(vUv.y * uLumaScale * 2.0 + uTime) * 0.2;
      
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0,0,1))), 3.0);
      vec3 spectrum = vec3(sin(vDisplace * 8.0), sin(vDisplace * 8.0 + 2.0), sin(vDisplace * 8.0 + 4.0));
      
      vec3 base = mix(uColor, spectrum, 0.2);
      vec3 final = base * uLuminosity * (0.5 + pattern);
      final += fresnel * vec3(0.8, 0.9, 1.0) * (1.0 + pattern); 
      
      gl_FragColor = vec4(final, uOpacity);
    }
  `
};

// Helper to create fresh uniforms ensuring Color instance is valid
const createUniforms = () => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0.0, 1.0, 1.0) },
    uLuminosity: { value: 1.0 },
    uPulseAmp: { value: 0.0 },
    uPulseSpeed: { value: 1.0 },
    uFoldAmount: { value: 0.0 },
    uFoldSpeed: { value: 0.5 },
    uFoldNoiseScale: { value: 0.7 },
    uLumaScale: { value: 5.0 },
    uLumaSpeed: { value: 0.2 },
    uOpacity: { value: 1.0 }
});

export const CentralConstruct: React.FC<{ config: SphereConfig, transform: Transform }> = ({ config, transform }) => {
    const solidMatRef = useRef<THREE.ShaderMaterial>(null);
    const wireMatRef = useRef<THREE.ShaderMaterial>(null);

    const shaderArgs = useMemo(() => ({
        uniforms: createUniforms(),
        vertexShader: ConstructShaderMaterial.vertexShader,
        fragmentShader: ConstructShaderMaterial.fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    }), []);

    // Create a separate shader config for the wireframe material so they don't share uniform state instance
    const wireShaderArgs = useMemo(() => ({
        uniforms: createUniforms(),
        vertexShader: ConstructShaderMaterial.vertexShader,
        fragmentShader: ConstructShaderMaterial.fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        wireframe: true
    }), []);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();

        // Cycle between 0 and 1 every 8 seconds (0 -> 1 -> 0)
        // Blend factor: 0 = Solid & Smooth, 1 = Wireframe & Folded
        const cycleSpeed = 0.5;
        const blend = (Math.sin(t * cycleSpeed) + 1.0) * 0.5;

        // Smooth stepping for clearer transition
        const smoothBlend = blend * blend * (3.0 - 2.0 * blend);

        // Calculate Fold Amount based on blend (Smooth when solid, Folded when wire)
        // We keep a tiny bit of fold even when solid for interest, or go full smooth
        const currentFoldAmount = THREE.MathUtils.lerp(0.05, config.foldAmount, smoothBlend);

        // Opacity logic
        // Solid fades out as blend goes to 1
        const solidOpacity = THREE.MathUtils.lerp(1.0, 0.0, smoothBlend);
        // Wireframe fades in as blend goes to 1
        const wireOpacity = THREE.MathUtils.lerp(0.0, 1.0, smoothBlend);

        if (solidMatRef.current) {
            solidMatRef.current.uniforms.uTime.value = t;
            solidMatRef.current.uniforms.uColor.value.set(config.color);
            solidMatRef.current.uniforms.uLuminosity.value = config.luminosity;
            solidMatRef.current.uniforms.uPulseAmp.value = config.pulseAmplitude;
            solidMatRef.current.uniforms.uPulseSpeed.value = config.pulseSpeed;
            solidMatRef.current.uniforms.uFoldAmount.value = currentFoldAmount;
            solidMatRef.current.uniforms.uFoldSpeed.value = config.foldSpeed;
            solidMatRef.current.uniforms.uFoldNoiseScale.value = config.foldNoiseScale;
            solidMatRef.current.uniforms.uLumaScale.value = config.lumaPatternScale;
            solidMatRef.current.uniforms.uLumaSpeed.value = config.lumaPatternSpeed;
            solidMatRef.current.uniforms.uOpacity.value = solidOpacity;
        }

        if (wireMatRef.current) {
            wireMatRef.current.uniforms.uTime.value = t;
            wireMatRef.current.uniforms.uColor.value.set(config.color);
            wireMatRef.current.uniforms.uLuminosity.value = config.luminosity * 1.5; // Brighter wire
            wireMatRef.current.uniforms.uPulseAmp.value = config.pulseAmplitude;
            wireMatRef.current.uniforms.uPulseSpeed.value = config.pulseSpeed;
            wireMatRef.current.uniforms.uFoldAmount.value = currentFoldAmount;
            wireMatRef.current.uniforms.uFoldSpeed.value = config.foldSpeed;
            wireMatRef.current.uniforms.uFoldNoiseScale.value = config.foldNoiseScale;
            wireMatRef.current.uniforms.uLumaScale.value = config.lumaPatternScale;
            wireMatRef.current.uniforms.uLumaSpeed.value = config.lumaPatternSpeed;
            wireMatRef.current.uniforms.uOpacity.value = wireOpacity;
        }
    });

    return (
        <group
            name="sphere"
            position={[transform.position.x, transform.position.y, transform.position.z]}
            rotation={[transform.rotation.x, transform.rotation.y, transform.rotation.z]}
            scale={[transform.scale.x, transform.scale.y, transform.scale.z]}
        >
            {/* Solid Sphere Mesh */}
            <mesh name="sphere_solid">
                <sphereGeometry args={[config.radius, config.widthSegments, config.heightSegments]} />
                <shaderMaterial ref={solidMatRef} args={[shaderArgs]} />
            </mesh>

            {/* Wireframe Fold Mesh - slightly larger to prevent z-fighting if they align perfectly */}
            <mesh name="sphere_wire" scale={[1.001, 1.001, 1.001]}>
                <sphereGeometry args={[config.radius, config.widthSegments, config.heightSegments]} />
                <shaderMaterial ref={wireMatRef} args={[wireShaderArgs]} wireframe={true} />
            </mesh>
        </group>
    );
};
