import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useCursor, Billboard } from '@react-three/drei';
import { Group, Mesh, Vector3, CanvasTexture, DoubleSide, Euler } from 'three';
import { StarSystem, Planet } from '../../types';

interface SystemProps {
  system: StarSystem;
  onSelectPlanet: (id: string) => void;
  selectedPlanetId: string | null;
}

// --- Procedural Texture Generator ---
// Generates textures matching the visual descriptions:
// 0: Industrial Moon, 1: City World, 2: Tech, 3: Green Swirls, 4: Vortex, 5: Purple Ring, 6: Lightning
const generatePlanetTexture = (index: number) => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const w = 512;
  const h = 512;
  const cx = w / 2;
  const cy = h / 2;
  const rand = () => Math.random();

  // Background
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);

  const styleIdx = index % 7;

  switch (styleIdx) {
    case 0: // Industrial Moon (Grey + Craters + Orange Lights)
      ctx.fillStyle = '#555555';
      ctx.fillRect(0, 0, w, h);
      // Noise
      for (let i = 0; i < 1000; i++) {
        ctx.fillStyle = `rgba(0,0,0,${rand() * 0.2})`;
        ctx.fillRect(rand() * w, rand() * h, 2, 2);
      }
      // Craters
      for (let i = 0; i < 40; i++) {
        const r = rand() * 30 + 5;
        const x = rand() * w; const y = rand() * h;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#444'; ctx.fill();
        ctx.strokeStyle = '#666'; ctx.stroke();
      }
      // Industrial Lights
      ctx.fillStyle = '#ffaa00';
      for (let i = 0; i < 150; i++) ctx.fillRect(rand() * w, rand() * h, 3, 3);
      break;

    case 1: // City World (Deep Blue + Cyan Grid + White Clusters)
      ctx.fillStyle = '#081122';
      ctx.fillRect(0, 0, w, h);
      // Grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 20; i++) {
        ctx.beginPath(); ctx.moveTo(0, i * 25); ctx.lineTo(w, i * 25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i * 25, 0); ctx.lineTo(i * 25, h); ctx.stroke();
      }
      // City Clusters
      for (let i = 0; i < 60; i++) {
        const x = rand() * w; const y = rand() * h;
        const size = rand() * 40;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
        grad.addColorStop(0, 'rgba(255,255,255,0.8)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
      }
      break;

    case 2: // Tech Surface (Dark Metal + Red Circuits)
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 40; i++) {
        const x = rand() * w; const y = rand() * h;
        const len = rand() * 100 + 20;
        const dir = rand() > 0.5 ? 0 : 1; // Horiz or Vert
        ctx.beginPath(); ctx.moveTo(x, y);
        if (dir === 0) ctx.lineTo(x + len, y); else ctx.lineTo(x, y + len);
        ctx.stroke();
        // Node
        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      }
      break;

    case 3: // Organic (Green Swirls)
      ctx.fillStyle = '#052e16'; // Dark Green
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 300; i++) {
        ctx.fillStyle = `rgba(34, 197, 94, ${rand() * 0.4})`;
        const r = rand() * 50;
        ctx.beginPath(); ctx.arc(rand() * w, rand() * h, r, 0, Math.PI * 2); ctx.fill();
      }
      // Veins
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, rand() * h);
      for (let x = 0; x < w; x += 10) ctx.lineTo(x, rand() * h);
      ctx.stroke();
      break;

    case 4: // Vortex (Purple/Pink Storms)
      ctx.fillStyle = '#2e0b36'; // Deep Purple
      ctx.fillRect(0, 0, w, h);
      ctx.translate(cx, cy);
      for (let i = 0; i < 100; i++) {
        ctx.rotate(rand() * Math.PI * 2);
        const r = rand() * 200 + 50;
        const grad = ctx.createRadialGradient(0, r, 0, 0, r, 40);
        grad.addColorStop(0, 'rgba(217, 70, 239, 0.6)'); // Fuchsia
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, r, 40, 0, Math.PI * 2); ctx.fill();
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      break;

    case 5: // Anomaly (Black + Purple Glowing Rings/Cracks)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      // Glowing cracks
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#a855f7';
      ctx.strokeStyle = '#d8b4fe';
      ctx.lineWidth = 4;
      for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        const x = rand() * w; const y = rand() * h;
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + 50, y - 50, x + 50, y + 50, x + 100, y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      break;

    case 6: // Blue Lightning River
      ctx.fillStyle = '#0f172a'; // Slate 900
      ctx.fillRect(0, 0, w, h);
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#38bdf8';
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 3;

      let lx = 0; let ly = h / 2;
      ctx.beginPath(); ctx.moveTo(lx, ly);
      while (lx < w) {
        lx += rand() * 20 + 5;
        ly += (rand() - 0.5) * 50;
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
  }

  return new CanvasTexture(canvas);
};

// Deterministic random
const getSeededRandom = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
};

export const SystemView: React.FC<SystemProps> = ({ system, onSelectPlanet, selectedPlanetId }) => {
  // Calculate orbital mechanics for all planets at once to ensure distribution
  let currentRadius = 18; // Start further out

  const orbitalData = useMemo(() => {
    let r = 25; // Initial radius from star
    return system.planets.map((planet, idx) => {
      const rng = getSeededRandom(planet.id);

      // Cumulative Distance: Add random gap (10 to 25 units)
      const gap = 12 + (rng * 18);
      r += gap;

      // Random Scale: 0.8 to 2.5
      const scale = 0.8 + (getSeededRandom(planet.id + "scale") * 1.7);

      // Speed: Slower as it gets further (Kepler-ish) + random jitter
      const speed = (20 / r) * 0.5 + (rng * 0.05);

      // Inclination: Random tilt (-25 to +25 degrees)
      const tiltX = (getSeededRandom(planet.id + "tx") - 0.5) * 0.8;
      const tiltZ = (getSeededRandom(planet.id + "tz") - 0.5) * 0.8;

      return {
        radius: r,
        scale,
        speed,
        inclination: [tiltX, 0, tiltZ] as [number, number, number],
        rng
      };
    });
  }, [system.planets]);

  return (
    <group>
      {/* Central Star */}
      <mesh>
        <sphereGeometry args={[8, 64, 64]} /> {/* Bigger Star */}
        <meshStandardMaterial
          color="#ffaa00"
          emissive="#ff4400"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={4} distance={400} color="#ffaa00" decay={1} />

      {/* Star Halo/Glow */}
      <mesh scale={[1.4, 1.4, 1.4]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.15} side={DoubleSide} />
      </mesh>

      {/* Planets */}
      {system.planets.map((planet, idx) => {
        const data = orbitalData[idx];
        // Anomaly Logic: Planets 2 and 4 (indices) are affected
        const isAnomaly = (idx === 2 || idx === 4);

        return (
          <OrbitingPlanet
            key={planet.id}
            index={idx}
            data={planet}
            config={data}
            onSelect={() => onSelectPlanet(planet.id)}
            isTargeted={selectedPlanetId === planet.id}
            isAnomaly={isAnomaly}
          />
        );
      })}
    </group>
  );
};

const OrbitingPlanet: React.FC<{
  index: number,
  data: Planet,
  config: { radius: number, scale: number, speed: number, inclination: [number, number, number], rng: number },
  onSelect: () => void,
  isTargeted: boolean,
  isAnomaly: boolean,
}> = ({ index, data, config, onSelect, isTargeted, isAnomaly }) => {
  const orbitGroupRef = useRef<Group>(null);
  const planetRef = useRef<Mesh>(null);
  const [hovered, setHover] = useState(false);
  useCursor(hovered);

  // Generate Texture
  const texture = useMemo(() => generatePlanetTexture(index), [index]);
  const randomOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  // Anomaly Params
  const anomalyFreq = 0.5 + (index * 0.1);
  const anomalyAmp = 3.0;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (orbitGroupRef.current && !isTargeted) {
      // Orbital Rotation
      let angle = (t * config.speed) + randomOffset;

      if (isAnomaly) {
        angle += Math.sin(t * anomalyFreq) * 0.1;
      }

      orbitGroupRef.current.rotation.y = angle;
    }

    if (planetRef.current) {
      planetRef.current.rotation.y += 0.005;

      let currentDist = config.radius;
      let currentY = 0;

      if (isAnomaly && !isTargeted) {
        currentDist = config.radius + Math.sin(t * anomalyFreq) * (anomalyAmp * 0.8);
        currentY = Math.cos(t * anomalyFreq * 1.3) * (anomalyAmp * 0.5);
      }

      planetRef.current.position.set(currentDist, currentY, 0);
    }
  });

  const planetColor = useMemo(() => {
    if (data.biome.includes('Ice')) return '#ffffff';
    if (data.biome.includes('Volcanic')) return '#ffcccc';
    if (data.biome.includes('Terran')) return '#ffffff';
    if (data.biome.includes('Gas')) return '#ddddff';
    return '#ffffff';
  }, [data.biome]);

  return (
    <group rotation={new Euler(...config.inclination)}>

      {/* Orbital Path Line */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[config.radius - 0.1, config.radius + 0.1, 128]} />
        <meshBasicMaterial
          color={isAnomaly ? "#ef4444" : "#ffffff"}
          opacity={isAnomaly ? 0.4 : 0.05}
          transparent
          side={DoubleSide}
        />
      </mesh>

      {/* Orbit Pivot Group */}
      <group ref={orbitGroupRef}>
        <group>
          <mesh
            ref={planetRef}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
            scale={isTargeted ? 2 : config.scale} // Use random scale
            position={[config.radius, 0, 0]}
          >
            <sphereGeometry args={[1.5, 64, 64]} />
            <meshStandardMaterial
              map={texture || undefined}
              color={planetColor}
              emissive={hovered ? "#333" : "#000"}
              roughness={0.6}
              metalness={0.2}
            />

            {/* Atmosphere */}
            {hovered && (
              <mesh scale={[1.1, 1.1, 1.1]}>
                <sphereGeometry args={[1.5, 32, 32]} />
                <meshBasicMaterial color="#00f0ff" transparent opacity={0.1} side={DoubleSide} />
              </mesh>
            )}

            {/* Label */}
            <Billboard>
              <group position={[0, 2.5, 0]}>
                <Text
                  fontSize={0.6 * (1 / config.scale)} // Inverse scale text so it stays readable
                  color={isAnomaly ? "#ef4444" : (hovered ? "#00f0ff" : "#aaaaaa")}
                  anchorX="center"
                  anchorY="bottom"
                  font={undefined}
                  outlineWidth={0.02}
                  outlineColor="#000"
                >
                  {data.name}
                </Text>
                {isAnomaly && (
                  <Text
                    position={[0, -0.8, 0]}
                    fontSize={0.3}
                    color="#ef4444"
                    anchorX="center"
                    anchorY="top"
                    font={undefined}
                  >
                    ⚠ UNSTABLE
                  </Text>
                )}
              </group>
            </Billboard>
          </mesh>
        </group>
      </group>
    </group>
  );
};
