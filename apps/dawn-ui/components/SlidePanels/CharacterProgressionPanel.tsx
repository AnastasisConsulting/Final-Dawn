import React, { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, ContactShadows } from '@react-three/drei';
import { TreeNode } from '../CharacterProgression/TreeVisualizer';
import { UIOverlay } from '../CharacterProgression/UIOverlay';
import { loadProgressionTree } from '../CharacterProgression/Adapter';
import { NodeData } from '../CharacterProgression/types';
import { useGame } from '../../src/context/GameContext';

interface Props { }

export const CharacterProgressionPanel: React.FC<Props> = () => {
    const { state, actions } = useGame();
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

    const treeData = useMemo(() => loadProgressionTree(), []);

    // Position the 3 core trees
    const positions: [number, number, number][] = [
        [-12, 0, 5],
        [0, 0, -8],
        [12, 0, 5]
    ];

    return (
        <div className="w-full h-full relative bg-black">
            {/* 3D Canvas */}
            <Canvas camera={{ position: [0, 15, 45], fov: 50 }}>
                <fog attach="fog" args={['#050505', 20, 90]} />
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
                <pointLight position={[-10, 20, -10]} intensity={0.5} color="#4c1d95" />

                <Suspense fallback={null}>
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <Environment preset="city" />

                    {/* Render the 3 distinct trees (Rebel, Acolyte, Hacker) */}
                    <group position={[0, -10, 0]}>
                        {treeData.map((node, idx) => (
                            <TreeNode
                                key={node.id}
                                position={positions[idx] || [0, 0, 0]}
                                data={node}
                                color="#fff"
                                onSelect={setSelectedNode}
                                selectedId={selectedNode?.id}
                                unlockedIds={state.skills.unlocked}
                            />
                        ))}
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
                    target={[0, 5, 0]}
                />
            </Canvas>

            {/* UI Overlay */}
            <UIOverlay
                selectedNode={selectedNode}
                onClose={() => setSelectedNode(null)}
                unlockedIds={state.skills.unlocked}
                xpPoints={state.xp} // Passing raw XP as points for now (simplified)
                onUnlock={(id) => actions.unlockSkill(id)}
            />
        </div>
    );
};
