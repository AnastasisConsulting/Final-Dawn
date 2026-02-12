import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Planet from './components/Planet';
import StarField from './components/StarField';
import UI from './components/UI';
import { PlanetState } from './types';

// Default initial state
const INITIAL_STATE: PlanetState = {
  textureUrl: null, // Start with wireframe until generated
  name: 'Designation: P-901',
  description: 'Unexplored region.',
  atmosphereColor: '#4488ff',
  rotationSpeed: 0.2, // Base planetary rotation
  isCinematic: true, // Default to true for spaceship orbit effect
};

const App: React.FC = () => {
  const [planetState, setPlanetState] = useState<PlanetState>(INITIAL_STATE);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 3.5], fov: 40 }}>
          <color attach="background" args={['#020205']} />
          
          <Suspense fallback={null}>
            {/* Lighting */}
            <ambientLight intensity={0.1} />
            <directionalLight position={[5, 3, 5]} intensity={2.5} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#444499" />

            {/* Scene Objects */}
            <StarField />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            
            <Planet 
                textureUrl={planetState.textureUrl} 
                rotationSpeed={planetState.rotationSpeed}
                atmosphereColor={planetState.atmosphereColor}
            />
            
            <OrbitControls 
                enablePan={false} 
                minDistance={1.8} 
                maxDistance={12} 
                autoRotate={planetState.isCinematic ?? true}
                autoRotateSpeed={0.8} // Slow, cinematic orbit
                enableDamping={true}
                dampingFactor={0.05} 
                rotateSpeed={0.5} 
            />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay Layer */}
      <UI planetState={planetState} setPlanetState={setPlanetState} />
      
      {/* Vignette Overlay for cinematic effect */}
      <div className="absolute inset-0 z-5 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
    </div>
  );
};

export default App;