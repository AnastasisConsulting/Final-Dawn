import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, Html, useCursor } from '@react-three/drei';
import { Galaxy, StarSystem } from '../../types';
import { Color, AdditiveBlending, Vector3, CanvasTexture } from 'three';

interface GalaxyLevelProps {
  galaxy: Galaxy;
  onSelectSystem: (id: string) => void;
  selectedSystemId: string | null;
}

// Generate deterministic stats
const generateStats = (id: string) => {
  const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rand = (offset: number) => ((seed + offset) * 9301 + 49297) % 100;
  return {
    pop: Math.floor(rand(1)),
    res: Math.floor(rand(2)),
    haz: Math.floor(rand(3)),
  };
};

// Glow texture
const getGlowTexture = () => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 128; // Increased resolution
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  return new CanvasTexture(canvas);
};

// Map star types to colors
const getStarColor = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('neutron')) return new Color('#00ffff');
  if (t.includes('red')) return new Color('#ff3300');
  if (t.includes('yellow')) return new Color('#ffaa00');
  if (t.includes('white')) return new Color('#ffffff');
  if (t.includes('blue')) return new Color('#0088ff');
  if (t.includes('black')) return new Color('#8b5cf6');
  if (t.includes('nebula')) return new Color('#d946ef');
  if (t.includes('pulsar')) return new Color('#10b981');
  return new Color('#ffaa00');
};

export const GalaxyLevelView: React.FC<GalaxyLevelProps> = ({ galaxy, onSelectSystem, selectedSystemId }) => {
  const glowTexture = useMemo(() => getGlowTexture(), []);

  return (
    <group>
      <ambientLight intensity={0.2} />
      {galaxy.systems.map((sys, i) => (
        <SystemStar 
          key={sys.id}
          system={sys}
          index={i}
          total={galaxy.systems.length}
          galaxyId={galaxy.id}
          onSelect={() => onSelectSystem(sys.id)}
          isSelected={selectedSystemId === sys.id}
          texture={glowTexture}
        />
      ))}
    </group>
  );
};

const SystemStar: React.FC<{
  system: StarSystem;
  index: number;
  total: number;
  galaxyId: string;
  onSelect: () => void;
  isSelected: boolean;
  texture: any;
}> = ({ system, index, total, galaxyId, onSelect, isSelected, texture }) => {
  const meshRef = useRef<any>(null);
  const [hovered, setHover] = useState(false);
  useCursor(hovered);

  // Stats
  const stats = useMemo(() => generateStats(system.id), [system.id]);

  // Position
  const position = useMemo(() => {
    const seed = galaxyId.split('').reduce((a,c) => a+c.charCodeAt(0),0) + index * 50;
    const rng = (offset: number) => {
        const x = Math.sin(seed + offset) * 10000;
        return x - Math.floor(x);
    };
    const angle = rng(1) * Math.PI * 2;
    const radius = 15 + rng(2) * 25; 
    const y = (rng(3) - 0.5) * 12; 
    
    if (total <= 3) {
        const safeAngle = (index / total) * Math.PI * 2 + (rng(4) * 0.5);
        return new Vector3(Math.cos(safeAngle) * 20, y, Math.sin(safeAngle) * 20);
    }
    return new Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  }, [galaxyId, index, total]);

  const starColor = useMemo(() => getStarColor(system.starType), [system.starType]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      // Complex pulse
      const pulse = 1 + Math.sin(t * 3) * 0.1 + Math.sin(t * 7 + index) * 0.05;
      const baseScale = hovered ? 4 : 3;
      meshRef.current.scale.setScalar(baseScale * pulse);
      meshRef.current.rotation.z = t * 0.1;
    }
  });

  if (isSelected) return null;

  return (
    <group position={position}>
        {/* Click Hitbox */}
        <mesh
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
            visible={false}
        >
            <sphereGeometry args={[4, 16, 16]} />
            <meshBasicMaterial />
        </mesh>

        {/* Star Glow */}
        <mesh ref={meshRef}>
            <planeGeometry args={[2, 2]} />
            <meshBasicMaterial 
                map={texture} 
                color={starColor} 
                transparent 
                opacity={hovered ? 1 : 0.8} 
                blending={AdditiveBlending} 
                depthWrite={false}
            />
        </mesh>

        {/* High-Fidelity HUD - Screen Space */}
        <Html 
            position={[5, 0, 0]} 
            transform={false}
            zIndexRange={[100, 0]} 
            style={{ 
                pointerEvents: 'none',
                opacity: hovered ? 1 : 0.4,
                transition: 'all 0.2s ease-out'
            }}
        >
            <div className={`
                flex items-center gap-3
                ${hovered ? 'scale-100 translate-x-2' : 'scale-90 opacity-60'}
                transition-all duration-300
            `}>
                 <div className="w-12 h-[1px] bg-white/50" />
                 
                 <div className="bg-black/80 backdrop-blur-md border border-white/20 p-4 rounded min-w-[300px] shadow-2xl text-white font-mono">
                    <div className="flex justify-between items-start border-b border-white/10 pb-2 mb-3">
                        <div>
                            <div className="text-xl font-bold uppercase tracking-wider">{system.name}</div>
                            <div className="text-xs text-slate-400">CLASS: {system.starType.toUpperCase()}</div>
                        </div>
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: starColor.getStyle() }} />
                    </div>

                    <div className="space-y-3">
                        <SystemStat label="Population Density" value={stats.pop} color="bg-cyan-400" />
                        <SystemStat label="Resource Richness" value={stats.res} color="bg-yellow-400" />
                        <SystemStat label="Hazard Level" value={stats.haz} color="bg-red-500" />
                    </div>
                 </div>
            </div>
        </Html>

        {/* 3D Label */}
        <Billboard follow={true}>
            <Text
                position={[0, 4, 0]}
                fontSize={1.5}
                color={hovered ? "white" : "#aaa"}
                anchorY="bottom"
                outlineWidth={0.1}
                outlineColor="black"
            >
                {system.name.toUpperCase()}
            </Text>
        </Billboard>
    </group>
  );
};

const SystemStat: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
    <div className="flex items-center gap-2 text-xs">
        <div className="w-24 text-slate-400 uppercase">{label}</div>
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full">
            <div style={{ width: `${value}%` }} className={`h-full rounded-full ${color} shadow-[0_0_8px_currentColor]`} />
        </div>
        <div className="w-8 text-right font-bold">{value}%</div>
    </div>
);
