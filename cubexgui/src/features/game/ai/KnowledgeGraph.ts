// src/features/game/ai/KnowledgeGraph.ts
import { TI, TENSOR_SIZE, CUBE_COUNT } from '../core/TensorConfig';
import { GameState, Piece } from '../types';
import { Skill } from './SkillSystem';

export interface TensorNode {
    position: { x: number, y: number, z: number };
    data: Float32Array;
}

export class KnowledgeGraph {
    public cubes: TensorNode[][][]; // 3D Access: [x][y][z]
    public snapshots: TensorNode[][]; // Historical snapshots for time-travel learning
    
    // Skill Modifier Vectors (Pre-calculated for speed)
    private alphaModVector: Float32Array;
    private decayModVector: Float32Array;
    private impModVector: Float32Array;

    constructor() {
        this.cubes = [];
        this.snapshots = [];
        
        // Initialize 3D Array of Nodes
        for (let x = 0; x < 8; x++) {
            this.cubes[x] = [];
            for (let y = 0; y < 8; y++) {
                this.cubes[x][y] = [];
                for (let z = 0; z < 8; z++) {
                    this.cubes[x][y][z] = this.createNode(x, y, z);
                }
            }
        }

        this.alphaModVector = new Float32Array(TENSOR_SIZE).fill(1.0);
        this.decayModVector = new Float32Array(TENSOR_SIZE).fill(1.0);
        this.impModVector = new Float32Array(TENSOR_SIZE).fill(1.0);
    }

    private createNode(x: number, y: number, z: number): TensorNode {
        const data = new Float32Array(TENSOR_SIZE);
        // Randomize embeddings slightly to break symmetry at start
        for (let i = TI.EMBED_START; i <= TI.EMBED_END; i++) {
            data[i] = (Math.random() * 0.02) - 0.01;
        }
        return { position: { x, y, z }, data };
    }

    public getTensorValue(x: number, y: number, z: number, index: TI): number {
        if (x < 0 || x > 7 || y < 0 || y > 7 || z < 0 || z > 7) return 0;
        return this.cubes[x][y][z].data[index];
    }

    public setTensorValue(x: number, y: number, z: number, index: TI, value: number) {
        if (x < 0 || x > 7 || y < 0 || y > 7 || z < 0 || z > 7) return;
        this.cubes[x][y][z].data[index] = value;
    }

    public applySkills(activeSkills: Skill[]) {
        // Reset vectors
        this.alphaModVector.fill(1.0);
        this.decayModVector.fill(1.0);
        this.impModVector.fill(1.0);

        // Apply skill effects to vectors
        activeSkills.forEach(skill => {
            skill.effects.forEach(effect => {
                effect.targetIndices.forEach(idx => {
                    // Logic modifies vectors based on EffectType
                    // Simplified:
                    this.impModVector[idx] *= effect.multiplier;
                });
            });
        });
    }

    /**
     * CORE LEARNING LOOP
     * Updates the Tensor Field based on the current game state.
     * Crucially, it only updates features that are "Unlocked" by active skills.
     */
    public processTurn(
        state: GameState, 
        activeSkills: Skill[], 
        aiLevel: number,
        baseDecay: number = 0.05
    ) {
        // 1. Identify Unlocked Features
        const unlockedIndices = new Set<number>();
        
        // Base features are always unlocked
        [TI.STATE_ID, TI.OWNER_ID, TI.LAST_CHANGE_TURN, TI.IS_VALID_MOVE].forEach(i => unlockedIndices.add(i));

        // Unlock advanced features based on Skills
        activeSkills.forEach(skill => {
            skill.effects.forEach(effect => {
                effect.targetIndices.forEach(idx => unlockedIndices.add(idx));
            });
        });

        // 2. Map Board State
        const pieceMap = new Map<string, Piece>(); 
        state.pieces.forEach(p => pieceMap.set(`${p.position.x},${p.position.y},${p.position.z}`, p));
        const currentTurn = state.moveHistory.length;

        // 3. Update Loop
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                for (let z = 0; z < 8; z++) {
                    const node = this.cubes[x][y][z];
                    const occupant = pieceMap.get(`${x},${y},${z}`);

                    // A. Update Base Reality (Always)
                    let newState = 0;
                    if (occupant) {
                        // Simple ID mapping: 1=White, 2=Black (simplified)
                        newState = occupant.color === 'white' ? 1 : 2; 
                    }
                    
                    const hasChanged = node.data[TI.STATE_ID] !== newState;
                    if (hasChanged) {
                        node.data[TI.STATE_ID] = newState;
                        node.data[TI.LAST_CHANGE_TURN] = currentTurn;
                        node.data[TI.VELOCITY] = 1.0; // Spike velocity on change
                    } else {
                        // Decay velocity if no change
                        node.data[TI.VELOCITY] *= 0.9;
                    }

                    node.data[TI.OWNER_ID] = newState;

                    // B. Update Advanced Features (Gated)
                    // We iterate through all possible tensor indices
                    for (let i = 4; i < TENSOR_SIZE; i++) {
                        if (unlockedIndices.has(i)) {
                            // If unlocked, run heuristic calculator.
                            // In this simulation, we simulate "Perception" updating.
                            
                            if (i === TI.ENTROPY) {
                                // Example: Entropy increases if velocity is high
                                node.data[i] += node.data[TI.VELOCITY] * 0.1;
                            }
                            
                            // Apply decay to normalize
                            node.data[i] *= (1.0 - baseDecay);
                        } else {
                            // If locked, the AI cannot "see" this. It fades to 0.
                            node.data[i] *= 0.5; 
                        }
                    }
                }
            }
        }
        
        // 4. Snapshot Logic (Legacy learning)
        const snapshotChance = aiLevel * 0.05; 
        if (Math.random() < snapshotChance) {
            this.takeSnapshot();
        }
    }

    private takeSnapshot() {
        // Deep copy
        const snap = this.cubes.flatMap(plane => plane.flatMap(row => row.map(node => {
            const copy = this.createNode(node.position.x, node.position.y, node.position.z);
            copy.data.set(node.data);
            return copy;
        })));
        this.snapshots.push(snap);
        if (this.snapshots.length > 10) this.snapshots.shift(); 
    }
}