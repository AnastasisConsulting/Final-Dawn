// cubexgui/src/features/game/ai/EvaluationEngine.ts
import { PieceType, PieceColor, MpwEvaluation, RrrScore, StanceLabel } from '../types';
import { GamePiece } from '../core/Pieces';

// New material and morale values based on specification
const PIECE_MATERIAL_VALUES: Record<PieceType, number> = {
    [PieceType.KING]: 100000, 
    [PieceType.QUEEN]: 18,
    [PieceType.FRACTAL_KNIGHT]: 14,
    [PieceType.ROOK]: 10,
    [PieceType.BISHOP]: 9,
    [PieceType.KNIGHT]: 8,
    [PieceType.PAWN]: 3 // UPDATED: Increased from 1 to 3 due to 5-way movement
};

const PIECE_MORALE_VALUES: Record<PieceType, number> = {
    [PieceType.KING]: 21,
    [PieceType.QUEEN]: 10,
    [PieceType.FRACTAL_KNIGHT]: 10,
    [PieceType.ROOK]: 3,
    [PieceType.BISHOP]: 3,
    [PieceType.KNIGHT]: 3,
    [PieceType.PAWN]: 1 // Morale contribution remains low (they are expendable)
};

export class EvaluationEngine {

  /**
   * Calculates the Master Piecewise Evaluation (M-Pw).
   */
  public static calculateMpw(pieces: Map<string, GamePiece>, color: PieceColor, totalValidMoves: number): MpwEvaluation {
    const myPieces = Array.from(pieces.values()).filter(p => p.color === color);
    
    // --- 1. RISK (Material) ---
    let risk = myPieces.reduce((sum, p) => sum + (PIECE_MATERIAL_VALUES[p.type] || 1), 0);

    // --- 2. REWARD (Board Control) ---
    const reward = totalValidMoves;

    // --- 3. RELATION (Morale) ---
    let relation = 0;
    
    myPieces.forEach(p => {
       let currentMp = PIECE_MORALE_VALUES[p.type] || 0;
       
       // A. COMMANDER LOGIC
       if (this._isCommander(p.type)) {
           const myPawns = myPieces.filter(sub => sub.type === PieceType.PAWN && sub.commanderId === p.id);
           const expectedPawns = 2; 
           const missingPawns = expectedPawns - myPawns.length; 
           if (missingPawns > 0) {
               currentMp -= missingPawns;
           }
       }
       
       // B. GENERAL LOGIC
       if (this._isGeneral(p.type)) {
           const myCommanders = myPieces.filter(sub => this._isCommander(sub.type) && sub.generalId === p.id);
           const expectedCommanders = 3;
           const missingCommanders = expectedCommanders - myCommanders.length;
           if (missingCommanders > 0) {
               currentMp -= (missingCommanders * 3);
           }
       }

       // C. MERCENARY MASK
       if (p.type === PieceType.PAWN) {
           const generalAlive = myPieces.some(g => g.id === p.generalId);
           if (!generalAlive && p.generalId) {
               currentMp = 1; 
           }
       }

       relation += Math.max(0, currentMp);
    });

    return { risk, reward, relation };
  }

  public static getRrrScore(myMpw: MpwEvaluation, oppMpw: MpwEvaluation): RrrScore {
      const riskDelta = myMpw.risk - oppMpw.risk;
      const rewardDelta = myMpw.reward - oppMpw.reward;
      const relationDelta = myMpw.relation - oppMpw.relation;

      const riskThreshold = 4;
      const rewardThreshold = 5;
      const relationThreshold = 8;

      return {
          offense: this._resolveThreshold(riskDelta, riskThreshold),
          defense: this._resolveThreshold(rewardDelta, rewardThreshold),
          strategy: this._resolveThreshold(relationDelta, relationThreshold)
      };
  }

  public static analyzePosture(history: RrrScore[]): StanceLabel {
      if (history.length < 3) return 'Balanced';
      
      const last3 = history.slice(-3);
      const offSeq = last3.map(h => h.offense);
      const strSeq = last3.map(h => h.strategy);
      const defSeq = last3.map(h => h.defense);
      
      if (offSeq.every(v => v === 1)) return 'Hyper Aggressive';
      if (offSeq.every(v => v === -1)) return 'Hyper Retaliatory';

      const sumOff = offSeq.reduce((a: number, b) => a + b, 0);
      const sumStr = strSeq.reduce((a: number, b) => a + b, 0);

      if (Math.abs(sumOff) <= 1 && offSeq.includes(1) && offSeq.includes(-1) && sumStr === 0) {
          return 'Reactive';
      }
      
      if (sumStr >= 2) return 'Tactical'; 
      if (defSeq.every(v => v === 1)) return 'Fortified';

      return 'Balanced';
  }

  private static _resolveThreshold(delta: number, threshold: number): -1 | 0 | 1 {
      if (delta <= -threshold) return -1;
      if (delta >= threshold) return 1;
      return 0;
  }

  private static _isCommander(t: PieceType): boolean {
      return t === PieceType.ROOK || t === PieceType.BISHOP || t === PieceType.KNIGHT;
  }

  private static _isGeneral(t: PieceType): boolean {
      return t === PieceType.QUEEN || t === PieceType.FRACTAL_KNIGHT;
  }
}