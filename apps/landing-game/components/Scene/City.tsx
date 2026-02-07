import React, { useMemo, useRef } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { Color, MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';

const BUILDING_COUNT = 400;
const LIGHT_COUNT = 200;

export const City: React.FC = () => {
  const lightMatRef = useRef<MeshBasicMaterial>(null);
  const buildingMatRef = useRef<MeshStandardMaterial>(null);

  // Animate materials
  useFrame((state) => {
      const time = state.clock.elapsedTime;
      
      // Update shader uniform for lights
      if (lightMatRef.current && lightMatRef.current.userData.shader) {
          lightMatRef.current.userData.shader.uniforms.time.value = time;
      }

      // Pulse buildings slightly
      if (buildingMatRef.current) {
          buildingMatRef.current.emissiveIntensity = 0.2 + Math.sin(time * 0.5) * 0.1;
      }
  });

  // Custom Shader Logic for Blinking Lights
  const onLightBeforeCompile = (shader: any) => {
    shader.uniforms.time = { value: 0 };
    shader.vertexShader = `
      varying vec3 vInstPos;
      ${shader.vertexShader}
    `.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vInstPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      `
    );
    shader.fragmentShader = `
      uniform float time;
      varying vec3 vInstPos;
      ${shader.fragmentShader}
    `.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>
      // Random offset based on position
      float offset = vInstPos.x * 0.05 + vInstPos.z * 0.05;
      // Blink pattern: fast pulse
      float blink = sin(time * 3.0 + offset);
      // Sharp on/off for some, smooth for others
      float intensity = smoothstep(0.2, 0.8, blink);
      
      gl_FragColor.rgb = mix(gl_FragColor.rgb * 0.5, gl_FragColor.rgb * 2.0, intensity);
      gl_FragColor.a = 0.6 + 0.4 * intensity;
      `
    );
    lightMatRef.current!.userData.shader = shader;
  };

  const buildings = useMemo(() => {
    const items = [];
    for (let i = 0; i < BUILDING_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        // Exclusion zone: 900 radius. City outer radius: 4500
        const dist = 900 + Math.pow(Math.random(), 1.5) * 3500; 

        const width = 30 + Math.random() * 80;
        const depth = 30 + Math.random() * 80;
        let height = 150 + Math.random() * 300;
        if (dist > 1800) height += Math.random() * 800; 
        if (dist > 3000) height += Math.random() * 1000;

        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        
        const color = new Color().setHSL(0.6, 0.2, 0.1 + Math.random() * 0.15);

        items.push({ 
            position: [x, height / 2, z], 
            scale: [width, height, depth], 
            color,
            rotation: [0, Math.random() * Math.PI, 0] 
        });
    }
    return items;
  }, []);

  const lights = useMemo(() => {
      const items = [];
      for(let i = 0; i< LIGHT_COUNT; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 900 + Math.random() * 3500;
          const x = Math.cos(angle) * dist;
          const z = Math.sin(angle) * dist;
          const y = 50 + Math.random() * 800;
          
          const color = new Color().setHSL(Math.random(), 1, 0.5);
          items.push({
              position: [x, y, z],
              scale: [10 + Math.random()*20, 10 + Math.random()*20, 10 + Math.random()*20],
              color
          });
      }
      return items;
  }, []);

  return (
    <group>
        {/* Buildings */}
        <Instances range={BUILDING_COUNT}>
            <boxGeometry />
            <meshStandardMaterial 
                ref={buildingMatRef}
                roughness={0.3}
                metalness={0.8}
                emissive="#1e3a8a"
            />
            {buildings.map((b, i) => (
                <Instance 
                    key={`b-${i}`} 
                    position={b.position as any} 
                    scale={b.scale as any} 
                    rotation={b.rotation as any}
                    color={b.color} 
                />
            ))}
        </Instances>

        {/* City Lights / Traffic Nodes */}
        <Instances range={LIGHT_COUNT}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial 
                ref={lightMatRef}
                toneMapped={false} 
                onBeforeCompile={onLightBeforeCompile}
                transparent
            />
            {lights.map((l, i) => (
                <Instance
                    key={`l-${i}`}
                    position={l.position as any}
                    scale={l.scale as any}
                    color={l.color}
                />
            ))}
        </Instances>
    </group>
  );
};