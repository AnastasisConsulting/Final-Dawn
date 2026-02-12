import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SceneContent } from './components/CityScene';
import { Interface } from './components/Interface';
import { useCityCore } from './hooks/useCityCore';

const App: React.FC = () => {
  const { mode, stats, logs, activeIncident, toggleMode, toggleModule, resolveIncident } = useCityCore();

  return (
    <div className="w-full h-screen bg-slate-950 relative overflow-hidden">
      <Interface 
        stats={stats} 
        logs={logs} 
        activeIncident={activeIncident} 
        onResolve={resolveIncident}
        mode={mode}
        toggleMode={toggleMode}
        toggleModule={toggleModule}
      />
      <Canvas shadows dpr={[1, 2]}>
        <SceneContent activeIncident={activeIncident} mode={mode} />
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={!activeIncident || activeIncident.severity < 3}
          autoRotateSpeed={mode === 'SIEGE' ? 1.0 : 0.5}
        />
      </Canvas>
    </div>
  );
};

export default App;