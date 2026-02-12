// src/features/game/ai/AIKernel.ts
import { GameState, Piece, PieceType, PlayerColor, Position, Difficulty, TurnPhase } from '../types';
import { KnowledgeGraph } from './KnowledgeGraph';
import { TI } from '../core/TensorConfig';
import { calculateMoves } from '../core/game_logic/moveCalculator'; 
import { posEquals } from '../core/game_logic/gameConstants'; 
import { AiPromotionService } from './AiPromotionService';

const PIECE_VALUES: Record<PieceType, number> = {
    [PieceType.KING]: 1000,
    [PieceType.QUEEN]: 18,
    [PieceType.FRACTAL_KNIGHT]: 14,
    [PieceType.ROOK]: 10,
    [PieceType.BISHOP]: 9,
    [PieceType.KNIGHT]: 8,
    [PieceType.PAWN]: 1
};

// [HELPER] Robust Move Simulator (Prevents Self-Delete Bug)
const simulateMove = (pieces: Piece[], fromId: string, to: Position): Piece[] => {
    const newPieces = [...pieces];
    const moverIndex = newPieces.findIndex(p => p.id === fromId);
    if (moverIndex === -1) return newPieces;

    const targetIndex = newPieces.findIndex(p => posEquals(p.position, to));
    
    // CRITICAL FIX: Only capture if target is NOT the mover (Self-Move = Stop)
    if (targetIndex !== -1 && targetIndex !== moverIndex) {
        newPieces.splice(targetIndex, 1);
    }

    // Re-find mover index safely
    const finalMoverIndex = newPieces.findIndex(p => p.id === fromId);
    if (finalMoverIndex !== -1) {
        newPieces[finalMoverIndex] = { 
            ...newPieces[finalMoverIndex], 
            position: to 
        };
    }
    return newPieces;
};

const calculateTotalValidMoves = (pieces: Piece[], color: PlayerColor): number => {
    let totalMoves = 0;
    const allies = pieces.filter(p => p.color === color);
    allies.forEach(p => { totalMoves += calculateMoves(p, pieces, null).length; });
    return totalMoves;
};

const evaluateBoard = (pieces: Piece[], turnColor: PlayerColor, aiBrain: KnowledgeGraph): number => {
    let score = 0;
    const whiteControl = calculateTotalValidMoves(pieces, 'white');
    const blackControl = calculateTotalValidMoves(pieces, 'black');
    let whiteMaterial = 0; let blackMaterial = 0;
    
    pieces.forEach(p => {
        const val = PIECE_VALUES[p.type] || 1;
        if(p.color === 'white') whiteMaterial += val; else blackMaterial += val;
        
        if (p.color === 'black') {
            const { x, y, z } = p.position;
            const threat = aiBrain.getTensorValue(x, y, z, TI.DIRECT_THREAT as any);
            const synergy = aiBrain.getTensorValue(x, y, z, TI.SYNERGY_SCORE as any);
            score += (synergy * 0.25) - (threat * 0.3);
        }
    });

    score += (blackMaterial - whiteMaterial) * 10;
    score += (blackControl - whiteControl) * 0.5;

    return turnColor === 'black' ? score : -score;
};

const getAllMoves = (pieces: Piece[], color: PlayerColor, turnPhase: TurnPhase | null, aiBrain: KnowledgeGraph): { fromId: string, to: Position, score?: number }[] => {
    const allMoves: { fromId: string, to: Position, score?: number }[] = [];
    
    if (turnPhase && turnPhase.active) {
        const activePiece = pieces.find(p => p.id === turnPhase.pieceId);
        if (activePiece && activePiece.color === color) {
            const moves = calculateMoves(activePiece, pieces, turnPhase);
            moves.forEach(m => allMoves.push({ fromId: activePiece.id, to: m }));
        }
        return allMoves;
    }

    pieces.filter(p => p.color === color).forEach(p => {
        const moves = calculateMoves(p, pieces, null);
        moves.forEach(m => allMoves.push({ fromId: p.id, to: m }));
    });
    return allMoves;
};

const minimax = (pieces: Piece[], depth: number, isMaximizing: boolean, alpha: number, beta: number, aiBrain: KnowledgeGraph): number => {
    if (depth === 0) return evaluateBoard(pieces, isMaximizing ? 'black' : 'white', aiBrain);

    const whiteKing = pieces.find(p => p.type === PieceType.KING && p.color === 'white');
    const blackKing = pieces.find(p => p.type === PieceType.KING && p.color === 'black');
    if (!whiteKing) return 9999;
    if (!blackKing) return -9999;

    const possibleMoves = getAllMoves(pieces, isMaximizing ? 'black' : 'white', null, aiBrain);

    possibleMoves.sort((a, b) => {
        const destA = pieces.find(p => posEquals(p.position, a.to));
        const destB = pieces.find(p => posEquals(p.position, b.to));
        const valA = destA ? PIECE_VALUES[destA.type] : 0;
        const valB = destB ? PIECE_VALUES[destB.type] : 0;
        // Tensor opportunity lookup
        const oppA = isMaximizing ? aiBrain.getTensorValue(a.to.x, a.to.y, a.to.z, TI.OPPORTUNITY as any) : 0;
        const oppB = isMaximizing ? aiBrain.getTensorValue(b.to.x, b.to.y, b.to.z, TI.OPPORTUNITY as any) : 0;
        return (valB + oppB) - (valA + oppA);
    });

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of possibleMoves) {
            const newPieces = simulateMove(pieces, move.fromId, move.to);
            const evalScore = minimax(newPieces, depth - 1, false, alpha, beta, aiBrain);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of possibleMoves) {
            const newPieces = simulateMove(pieces, move.fromId, move.to);
            const evalScore = minimax(newPieces, depth - 1, true, alpha, beta, aiBrain);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

export const getAIMove = (state: GameState, difficulty: Difficulty, aiBrain: KnowledgeGraph, syncProfile: (d: Difficulty) => void): { fromId: string, to: Position } | null => {
    console.log(`🤖 [AI KERNEL] Started. Difficulty: ${difficulty}`);
    syncProfile(difficulty);
    aiBrain.processTurn(state, [], 1);

    const pieces = state.pieces;
    const aiColor = 'black';
    
    const moves = getAllMoves(pieces, aiColor, state.turnPhase, aiBrain);
    
    console.log(`📊 [AI KERNEL] Generated ${moves.length} legal moves.`);

    if (moves.length === 0) {
        console.warn("⚠️ [AI KERNEL] No moves available.");
        return null;
    }

    if (difficulty === 'Easy') {
        return moves[Math.floor(Math.random() * moves.length)];
    }

    let bestMove = null;
    let bestValue = -Infinity;
    
    const searchDepth = difficulty === 'Medium' ? 1 : 2; 

    // Random shuffle for variety
    moves.sort(() => Math.random() - 0.5);

    for (const move of moves) {
        const newPieces = simulateMove(pieces, move.fromId, move.to);
        const boardVal = minimax(newPieces, searchDepth - 1, false, -Infinity, Infinity, aiBrain);
        
        if (boardVal > bestValue) {
            bestValue = boardVal;
            bestMove = move;
        }
    }
    
    console.log(`🏆 [AI KERNEL] Best move selected with score: ${bestValue}`);
    return bestMove;
};

export const getAIPromotionChoice = (state: GameState): { newType?: PieceType, restoreId?: string } => {
    if (!state.pendingPromotion) return { newType: PieceType.QUEEN };
    const { pawnId, to } = state.pendingPromotion;
    const decision = AiPromotionService.decidePromotion(state, pawnId, to);
    return {
        newType: decision.newType,
        restoreId: decision.restoreId
    };
};