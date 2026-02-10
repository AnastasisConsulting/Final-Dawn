import React, { Suspense, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { ViewLevel, Galaxy, UniverseState } from '../../types';
import { GalacticView } from './GalacticView';
import { GalaxyLevelView } from './GalaxyLevelView';
import { SystemView } from './SystemView';
import { SurfaceLattice } from './SurfaceLattice';
import { BufferGeometry, Float32BufferAttribute, Color, AdditiveBlending, ShaderMaterial } from 'three';

interface SceneProps {
  state: UniverseState;
  data: Galaxy[];
  actions: {
    selectGalaxy: (id: string) => void;
    selectSystem: (id: string) => void;
    selectPlanet: (id: string) => void;
    selectCity: (id: string) => void;
    selectDistrict: (id: string) => void;
  };
}

// --- Custom Background Starfield ---
const BackgroundStarfield = () => {
  const geometry = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randoms = new Float32Array(count);

    const colorPalette = [
      new Color('#ffffff'), // White
      new Color('#a5f3fc'), // Light Cyan
      new Color('#fde047'), // Light Yellow
      new Color('#c4b5fd')  // Light Purple
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Distribute on a large sphere surface for background feel
      const r = 800 + Math.random() * 400; // Further back background
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = Math.random() * 4.0 + 1.0; // Slightly larger stars for distance
      randoms[i] = Math.random();
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aRandom', new Float32BufferAttribute(randoms, 1));
    return geo;
  }, []);

  const material = useMemo(() => new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 2.0 }
    },
    vertexShader: `
            uniform float uTime;
            uniform float uPixelRatio;
            attribute float aSize;
            attribute float aRandom;
            attribute vec3 color;
            varying vec3 vColor;
            
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                
                // Subtle breathing size
                float breathe = 1.0 + sin(uTime * 0.5 + aRandom * 10.0) * 0.2;
                
                gl_PointSize = aSize * breathe * uPixelRatio;
                vColor = color;
            }
        `,
    fragmentShader: `
            varying vec3 vColor;
            void main() {
                // Circular soft particle
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                if (dist > 0.5) discard;
                
                // Intense center, soft edge
                float alpha = 1.0 - smoothstep(0.1, 0.5, dist);
                
                gl_FragColor = vec4(vColor, alpha * 0.8);
            }
        `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending
  }), []);

  useFrame((state) => {
    if (material) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points geometry={geometry} material={material} />
  );
};

export const SceneContainer: React.FC<SceneProps> = ({ state, data, actions }) => {
  const activeGalaxy = data.find(g => g.id === state.selectedGalaxyId);
  const activeSystem = activeGalaxy?.systems.find(s => s.id === state.selectedSystemId);
  const activePlanet = activeSystem?.planets.find(p => p.id === state.selectedPlanetId);

  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!controlsRef.current) return;

    let targetX = 0, targetY = 0, targetZ = 0;

    // REVISED TARGETING LOGIC FOR RADIAL LAYOUT
    if (state.currentLevel === ViewLevel.CITY && state.selectedCityId) {
      // ID format example: G1-S1-O1_c0-ct1
      const parts = state.selectedCityId.split('_c');
      if (parts.length > 1) {
        const sub = parts[1].split('-ct');
        const civIdx = parseInt(sub[0]); // Civilization Index (0-2)
        const cityIdx = parseInt(sub[1]); // City Index (0-2)

        // Replicate SurfaceLattice Math:
        const R_CIV = 35;
        const R_CITY = 18;
        const TOTAL_CIVS = 3; // Hardcoded in generator
        const TOTAL_CITIES = 3; // Hardcoded in generator

        // 1. Calculate Civ Position
        const civAngle = (civIdx / TOTAL_CIVS) * Math.PI * 2;
        const civX = Math.cos(civAngle) * R_CIV;
        const civZ = Math.sin(civAngle) * R_CIV;

        // 2. Calculate City Position
        const spread = Math.PI / 2;
        const offset = (cityIdx / (Math.max(TOTAL_CITIES - 1, 1))) * spread - (spread / 2);
        const cityAngle = civAngle + offset;

        targetX = civX + Math.cos(cityAngle) * R_CITY;
        targetZ = civZ + Math.sin(cityAngle) * R_CITY;
        targetY = 0;
      }
    } else if (state.currentLevel === ViewLevel.UNIVERSE) {
      targetX = 0; targetY = 0; targetZ = 0;
    } else if (state.currentLevel === ViewLevel.GALAXY) {
      targetX = 0; targetY = 0; targetZ = 0;
    }

    // Smoothly animate target? For now, snap to it to avoid dizziness
    controlsRef.current.target.set(targetX, targetY, targetZ);
    controlsRef.current.update();

  }, [state.selectedCityId, state.currentLevel]);

  return (
    <div className="w-full h-full bg-black">
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 40, 150]} fov={55} />
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            // Greatly increased max distance for breathing room
            maxDistance={state.currentLevel >= ViewLevel.SURFACE ? 100 : 500}
            minDistance={5}
            // Allow more vertical rotation for better top-down views of orbits
            maxPolarAngle={state.currentLevel >= ViewLevel.SURFACE ? Math.PI / 2 : Math.PI}
          />

          {/* Base Environment */}
          <ambientLight intensity={0.2} />

          {/* Custom Background Stars */}
          <BackgroundStarfield />

          <group>
            {state.currentLevel === ViewLevel.UNIVERSE && (
              <GalacticView
                galaxies={data}
                onSelectGalaxy={actions.selectGalaxy}
                selectedGalaxyId={state.selectedGalaxyId}
              />
            )}

            {state.currentLevel === ViewLevel.GALAXY && activeGalaxy && (
              <GalaxyLevelView
                galaxy={activeGalaxy}
                onSelectSystem={actions.selectSystem}
                selectedSystemId={state.selectedSystemId}
              />
            )}

            {state.currentLevel === ViewLevel.SYSTEM && activeSystem && (
              <SystemView
                system={activeSystem}
                onSelectPlanet={actions.selectPlanet}
                selectedPlanetId={state.selectedPlanetId}
              />
            )}

            {(state.currentLevel === ViewLevel.SURFACE || state.currentLevel === ViewLevel.CITY || state.currentLevel === ViewLevel.DISTRICT) && activePlanet && (
              <SurfaceLattice
                planet={activePlanet}
                onBack={() => { }}
                selectedCityId={state.selectedCityId}
                selectedDistrictId={state.selectedDistrictId}
                onSelectCity={actions.selectCity}
                onSelectDistrict={actions.selectDistrict}
              />
            )}
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
};
