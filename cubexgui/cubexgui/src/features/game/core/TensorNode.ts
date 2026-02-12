// cubex³/game/core/TensorNode.ts

import { TI, TENSOR_SIZE } from './TensorConfig';
import { GamePiece } from './Pieces';
import { PlayerColor } from '../types';

/**
 * Represents a single spatial unit (Voxel) on the board.
 * Holds the 64-float "Brain" for this specific location.
 * Manages local state, decay, and feature updates.
 */
export class TensorNode {
  public data: Float32Array;
  public x: number;
  public y: number;
  public z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    // The 64-float vector representing the complete state of this voxel
    this.data = new Float32Array(TENSOR_SIZE);
    this._initializeEmbeddings();
  }

  /**
   * Initialize Block D (Pattern Embeddings) with random noise.
   * This breaks symmetry and allows the AI to learn unique spatial features.
   */
  private _initializeEmbeddings() {
    for (let i = TI.EMBEDDING_START; i <= TI.EMBEDDING_END; i++) {
      // Small random variance (-0.05 to 0.05)
      this.data[i] = (Math.random() * 0.1) - 0.05; 
    }
    // Default Meta-Parameters
    this.data[TI.LEARNING_RATE] = 0.01; // Base Alpha
    
    // [REMOVED] Health/Energy. Replaced with Structural Stability for AI evaluation.
    this.data[TI.STRUCTURAL_STABILITY] = 0.5;
  }

  /**
   * Updates Block A (Identity) when a piece moves in or out.
   * This is the "Hard" state update.
   * * @param piece The piece entering the node (or null if leaving)
   * @param turn The current absolute turn number
   */
  public updateOccupancy(piece: GamePiece | null, turn: number) {
    // 1. Update State & Ownership
    if (piece) {
      this.data[TI.STATE_ID] = this._mapTypeToId(piece.type);
      this.data[TI.OWNER_ID] = piece.color === 'white' ? 1 : 2;
    } else {
      this.data[TI.STATE_ID] = 0; // Empty
      this.data[TI.OWNER_ID] = 0; // None
    }

    // 2. Trigger Dynamics (Physics of the move)
    this.data[TI.LAST_CHANGE_TURN] = turn;
    this.data[TI.CHANGE_VELOCITY] = 1.0; // Spike velocity to max (1.0) on any change
    this.data[TI.UPDATE_COUNT]++;
    
    // Reset Decay Accumulator on interaction
    this.data[TI.TIME_DECAY] = 0.0;
  }

  /**
   * Decay function called every turn to handle Block B (Dynamics) and Block E (Meta).
   * Simulates the "cooling down" of a square after activity.
   */
  public tickDecay() {
    // 1. Decay Change Velocity (approaches 0)
    // High velocity attracts AI attention; low velocity means the square is "settled".
    this.data[TI.CHANGE_VELOCITY] *= 0.85; 

    // 2. Decay Local Entropy (approaches 0)
    this.data[TI.LOCAL_ENTROPY] *= 0.95;

    // 3. Accumulate Time Decay (approaches max)
    this.data[TI.TIME_DECAY] += 0.01;

    // 4. Decay Threat/Defense Vectors (Transient memory)
    this.data[TI.ATTACK_VECTOR_SUM] *= 0.9;
    this.data[TI.DEFENSE_VECTOR_SUM] *= 0.9;
    this.data[TI.MOBILITY_FLUX] *= 0.5; // Flux is instantaneous, decays fast
  }

  /**
   * Set calculated metrics from the HyperBoard analyzer.
   * Used for Influence, Threat, and Strategic scores.
   * * @param idx The Tensor Index to update
   * @param value The new value
   */
  public setMetric(idx: TI, value: number) {
    if (idx >= 0 && idx < TENSOR_SIZE) {
      this.data[idx] = value;
    }
  }

  /**
   * Reads a specific metric from the tensor.
   */
  public getMetric(idx: TI): number {
    if (idx >= 0 && idx < TENSOR_SIZE) {
        return this.data[idx];
    }
    return 0;
  }

  /**
   * Helper: Maps string PieceType to numeric ID for the Tensor.
   */
  private _mapTypeToId(typeStr: string): number {
    switch (typeStr) {
      case 'Pawn': return 1;
      case 'Rook': return 2;
      case 'Knight': return 3;
      case 'Bishop': return 4;
      case 'Queen': return 5;
      case 'King': return 6;
      case 'FractalKnight': return 7; // Gold General special ID
      default: return 0;
    }
  }
}