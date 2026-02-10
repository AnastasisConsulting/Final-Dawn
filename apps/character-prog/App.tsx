import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, ContactShadows } from '@react-three/drei';
import { TreeNode } from './components/TreeVisualizer';
import { UIOverlay } from './components/UIOverlay';
import { rpgData } from './data';
import { NodeData } from './types';

export default function App() {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">

      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 15, 45], fov: 50 }}>
        <fog attach="fog" args={['#050505', 20, 90]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, 20, -10]} intensity={0.5} color="#4c1d95" />

        <Suspense fallback={null}>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          {/* Render the 3 distinct trees */}
          <group position={[0, -10, 0]}>
            {/* 
                  Arranging the 3 base trees in a triangle 
                  Rebel (Red) Left
                  Acolyte (Blue) Center/Back
                  Hacker (Green) Right
                */}
            <TreeNode
              position={[-12, 0, 5]}
              data={rpgData[0]} // Rebel
              color="#ef4444"
              onSelect={setSelectedNode}
              selectedId={selectedNode?.id}
            />

            <TreeNode
              position={[0, 0, -8]}
              data={rpgData[1]} // Acolyte
              color="#3b82f6"
              onSelect={setSelectedNode}
              selectedId={selectedNode?.id}
            />

            <TreeNode
              position={[12, 0, 5]}
              data={rpgData[2]} // Hacker
              color="#22c55e"
              onSelect={setSelectedNode}
              selectedId={selectedNode?.id}
            />
          </group>

          <ContactShadows opacity={0.4} scale={50} blur={2.5} far={10} resolution={256} color="#000000" />
        </Suspense>

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.5}
          minDistance={10}
          maxDistance={80}
          target={[0, 5, 0]} // Focus slightly up the tree
        />
      </Canvas>

      {/* UI Layer */}
      <UIOverlay
        selectedNode={selectedNode}
        onClose={() => setSelectedNode(null)}
      />

      {/* Footer Branding */}
      <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none opacity-30">
        <p className="text-[10px] tracking-[0.5em] text-white">SYSTEM ONLINE // NODE VISUALIZER V1.0</p>
      </div>

    </div>
  );
}