import React, { useRef, useMemo, useState } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { Text, useCursor, Billboard, Html } from '@react-three/drei';
import { Group, Color, AdditiveBlending, Vector3, BufferGeometry, Float32BufferAttribute, ShaderMaterial, Vector2 } from 'three';
import { Galaxy } from '../../types';

interface GalacticProps {
  galaxies: Galaxy[];
  onSelectGalaxy: (id: string) => void;
  selectedGalaxyId: string | null;
}

// --- Custom Star Shader for Twinkle & Variation ---
const StarShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 2.0 },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uPixelRatio;
    attribute float aScale;
    attribute float aRandom;
    attribute vec3 color;
    varying vec3 vColor;
    
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Twinkle Calculation: varies scale based on time and random offset
      float twinkle = 1.0 + sin(uTime * 3.0 + aRandom * 15.0) * 0.5; 
      
      // Size attenuation
      gl_PointSize = aScale * twinkle * uPixelRatio * (60.0 / -mvPosition.z);
      
      vColor = color;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
      // Soft circular glow calculation
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      
      if (dist > 0.5) discard;
      
      // Glow falloff
      float glow = 1.0 - (dist * 2.0);
      glow = pow(glow, 1.5);
      
      gl_FragColor = vec4(vColor, glow); // Alpha comes from glow strength
    }
  `
};

// --- Stats Generator ---
const getGalaxyStats = (id: string) => {
    // Deterministic stats based on ID string
    const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
    const s = (val: number) => Math.floor(((seed * val) % 100));
    return {
        geo: 40 + s(1.5) * 0.6,
        econ: 20 + s(2.5) * 0.8,
        diplo: 10 + s(3.5) * 0.9,
    };
};

// --- Unique Galaxy Style Definitions ---
const GALAXY_STYLES = [
  // Core Syndicate: Industrial Spiral
  { 
    type: 'spiral',
    colorInside: new Color('#ffaa00'), 
    colorOutside: new Color('#ff4400'), 
    radius: 35, 
    branches: 2, 
    spin: 4, 
    randomness: 0.2,
    baseSize: 5.0
  },
  // Fading Echo: Ghostly Hourglass
  { 
    type: 'hourglass',
    colorInside: new Color('#00f0ff'), 
    colorOutside: new Color('#ffffff'), 
    radius: 30, 
    baseSize: 4.0
  },
  // Void Sea: Chaotic Nebula
  { 
    type: 'nebula',
    colorInside: new Color('#d946ef'), // Fuchsia
    colorOutside: new Color('#4f46e5'), // Indigo
    radius: 38, 
    baseSize: 6.0
  }
];

// --- Geometry Generators (Updated with Attributes) ---

const generateGeometry = (style: any, count: number = 8000) => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        let x, y, z;

        // Position Logic
        if (style.type === 'spiral') {
             const r = Math.pow(Math.random(), 1.5) * style.radius; // More dense at center
             const spinAngle = r * style.spin;
             const branchAngle = ((i % style.branches) / style.branches) * Math.PI * 2;
             const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * style.randomness * r;
             const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (style.randomness / 2) * r;
             const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * style.randomness * r;
             x = Math.cos(branchAngle + spinAngle) * r + randomX;
             y = randomY; 
             z = Math.sin(branchAngle + spinAngle) * r + randomZ;
        } else if (style.type === 'hourglass') {
             const h = (Math.random() - 0.5) * style.radius * 2;
             const rAtH = Math.abs(h) * 0.8 + 2; 
             const r = Math.random() * rAtH;
             const angle = Math.random() * Math.PI * 2;
             x = Math.cos(angle) * r;
             y = h;
             z = Math.sin(angle) * r;
        } else { // Nebula
             const r = Math.random() * style.radius;
             const theta = Math.random() * Math.PI * 2;
             const phi = Math.acos((Math.random() * 2) - 1);
             x = r * Math.sin(phi) * Math.cos(theta);
             y = (r * 0.6) * Math.sin(phi) * Math.sin(theta);
             z = r * Math.cos(phi);
        }

        positions[i3] = x; positions[i3+1] = y; positions[i3+2] = z;

        // Color Logic - Mix with randomness
        const mixedColor = style.colorInside.clone();
        const distNorm = Math.sqrt(x*x + y*y + z*z) / style.radius;
        mixedColor.lerp(style.colorOutside, distNorm + (Math.random() * 0.2 - 0.1));
        
        colors[i3] = mixedColor.r;
        colors[i3+1] = mixedColor.g;
        colors[i3+2] = mixedColor.b;

        // Scale Logic - Random distribution with some large outliers
        const sizeRand = Math.random();
        scales[i] = sizeRand > 0.9 ? style.baseSize * 2.5 : (sizeRand > 0.6 ? style.baseSize * 1.5 : style.baseSize * 0.8);
        
        // Random Offset for Twinkle
        randoms[i] = Math.random();
    }
    
    return { positions, colors, scales, randoms };
};

export const GalacticView: React.FC<GalacticProps> = ({ galaxies, onSelectGalaxy, selectedGalaxyId }) => {
  const groupRef = useRef<Group>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current && !selectedGalaxyId) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {galaxies.map((galaxy, idx) => {
        const angle = (idx / galaxies.length) * Math.PI * 2;
        const radius = 80; // Spread galaxies out more
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
            <GalaxyCluster 
              key={galaxy.id} 
              position={[x, 0, z]} 
              data={galaxy} 
              style={GALAXY_STYLES[idx % GALAXY_STYLES.length]}
              onClick={() => onSelectGalaxy(galaxy.id)}
              isSelected={selectedGalaxyId === galaxy.id}
            />
        );
      })}
    </group>
  );
};

const GalaxyCluster: React.FC<{ 
  position: [number, number, number], 
  data: Galaxy, 
  style: any, 
  onClick: () => void, 
  isSelected: boolean
}> = ({ position, data, style, onClick, isSelected }) => {
  const pointsRef = useRef<any>(null);
  const materialRef = useRef<any>(null);
  const [hovered, setHover] = useState(false);
  useCursor(hovered);

  const stats = useMemo(() => getGalaxyStats(data.id), [data.id]);

  // Generate Geometry
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const { positions, colors, scales, randoms } = generateGeometry(style, 12000); // 12k stars
    
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geo.setAttribute('aScale', new Float32BufferAttribute(scales, 1));
    geo.setAttribute('aRandom', new Float32BufferAttribute(randoms, 1));
    
    return geo;
  }, [style]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      // Rotate cluster
      pointsRef.current.rotation.y += delta * 0.05;
      
      // Update Shader Time
      if (materialRef.current) {
         materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      }

      // Scale up on hover
      const targetScale = isSelected ? 0.05 : (hovered ? 1.1 : 1);
      pointsRef.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), delta * 3);
    }
  });

  return (
    <group position={position}>
      {/* Interaction Hitbox */}
      <mesh 
        visible={false} 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <sphereGeometry args={[40, 16, 16]} />
        <meshBasicMaterial />
      </mesh>

      {/* Core Light */}
      <pointLight color={style.colorInside} distance={60} decay={2} intensity={2} />

      {/* Animated Star Points */}
      <points ref={pointsRef} geometry={geometry}>
        <shaderMaterial 
            ref={materialRef}
            attach="material"
            args={[StarShaderMaterial]}
            transparent={true}
            depthWrite={false}
            blending={AdditiveBlending}
        />
      </points>

      {/* High-Fidelity HUD Overlay */}
      {!isSelected && (
        <Html 
            position={[40, 0, 0]} // Positioned to the right of the galaxy
            transform={false} // Screen Space for maximum legibility
            distanceFactor={undefined} // Not used with transform=false
            zIndexRange={[100, 0]} 
            style={{ 
                pointerEvents: 'none',
                opacity: hovered ? 1 : 0.4,
                transition: 'opacity 0.3s ease-out' 
            }}
        >
            <div className={`
                flex items-center gap-4
                transition-all duration-300
                ${hovered ? 'scale-100' : 'scale-90 blur-[1px]'}
            `}>
                {/* Connecting Line Graphic */}
                <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-holo-cyan to-holo-cyan" />
                
                {/* HUD Card */}
                <div className="
                    w-[500px] bg-slate-900/90 backdrop-blur-xl 
                    border border-holo-cyan/40 shadow-[0_0_40px_rgba(0,240,255,0.15)]
                    rounded-lg overflow-hidden
                    text-white font-mono
                ">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-holo-cyan/20 to-transparent p-4 border-b border-holo-cyan/30 flex justify-between items-center">
                        <h2 className="text-2xl font-black tracking-widest text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                            {data.name}
                        </h2>
                        <span className="text-xs text-holo-cyan border border-holo-cyan px-2 py-1 rounded">
                            SECURE: G-LEVEL
                        </span>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5">
                        <StatRow label="Geopolitical Stability" value={stats.geo} color="bg-blue-500" />
                        <StatRow label="Economic Output" value={stats.econ} color="bg-emerald-500" />
                        <StatRow label="Diplomatic Index" value={stats.diplo} color="bg-rose-500" />
                        
                        <div className="pt-4 flex justify-between text-xs text-slate-400 border-t border-slate-700 mt-4">
                            <span>COORDS: {position[0].toFixed(0)}, {position[2].toFixed(0)}</span>
                            <span className="animate-pulse text-alert-orange">AWAITING INPUT...</span>
                        </div>
                    </div>
                </div>
            </div>
        </Html>
      )}

      {/* Name Label (3D) */}
      {!isSelected && (
          <Billboard follow={true}>
              <Text 
                position={[0, -45, 0]}
                fontSize={4}
                color={hovered ? "white" : "#888"}
                anchorX="center"
                outlineWidth={0.1}
                outlineColor="black"
              >
                  {data.name.toUpperCase()}
              </Text>
          </Billboard>
      )}
    </group>
  );
};

const StatRow: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
    <div>
        <div className="flex justify-between mb-1">
            <span className="text-sm font-bold tracking-wider text-slate-300 uppercase">{label}</span>
            <span className="text-lg font-mono font-bold">{value}%</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
                style={{ width: `${value}%` }} 
                className={`h-full ${color} shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out`} 
            />
        </div>
    </div>
);
