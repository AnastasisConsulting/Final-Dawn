// src/features/game/core/gameLogic.ts

import { CUBE_SIZE, GameState, Piece, PieceType, PlayerColor, Position, TurnPhase, Axis, Difficulty } from '../types';

// --- AI IMPORTS ---
import { KnowledgeGraph } from '../ai/KnowledgeGraph';
import { ProfileManager } from '../ai/ProfileManager';
import { TI } from '../ai/tensorTypes';

// --- Helpers ---
export const posEquals = (a: Position, b: Position) => a.x === b.x && a.y === b.y && a.z === b.z;
const isValidPos = (p: Position) => p.x >= 0 && p.x < CUBE_SIZE && p.y >= 0 && p.y < CUBE_SIZE && p.z >= 0 && p.z < CUBE_SIZE;

// --- GLOBAL AI INSTANCE ---
// We keep this outside the React cycle to persist memory/learning across renders
export const AI_BRAIN = new KnowledgeGraph();
export const AI_PROFILER = new ProfileManager(AI_BRAIN);

let lastLoadedDifficulty: Difficulty | null = null;

// Helper to sync difficulty to profile
const syncDifficultyProfile = (diff: Difficulty) => {
    if (diff === lastLoadedDifficulty) return;
    
    console.log(`⚡ Switching AI Profile to match difficulty: ${diff}`);
    
    // Load specific personalities based on difficulty settings
    if (diff === 'Easy') {
        AI_PROFILER.loadProfile('opportunist'); // Reactive, makes mistakes
    } else if (diff === 'Medium') {
        AI_PROFILER.loadProfile('balanced'); // Standard play
    } else if (diff === 'Hard') {
        AI_PROFILER.loadProfile('strategist'); // Deep positional play
    }
    
    lastLoadedDifficulty = diff;
};

// --- Initial Setup ---
export const getInitialGameState = (): GameState => {
  const pieces: Piece[] = [];
  let idCounter = 0;

  const addPiece = (type: PieceType, color: PlayerColor, x: number, y: number, z: number, faction?: 'gold' | 'silver') => {
    pieces.push({
      id: `${color}-${type}-${idCounter++}`,
      type,
      color,
      position: { x, y, z },
      hasMoved: false,
      faction
    });
  };

  // -------------------------------------------------------------------------
  // BLACK SETUP (Bottom Floor: Y=0)
  // -------------------------------------------------------------------------
  
  // Majors at Y=0
  addPiece(PieceType.ROOK, 'black', 0, 0, 0, 'silver');
  addPiece(PieceType.KNIGHT, 'black', 1, 0, 0, 'silver');
  addPiece(PieceType.BISHOP, 'black', 2, 0, 0, 'silver');
  addPiece(PieceType.QUEEN, 'black', 3, 0, 0, 'silver');
  addPiece(PieceType.KING, 'black', 4, 0, 0, 'gold');
  addPiece(PieceType.BISHOP, 'black', 5, 0, 0, 'gold');
  addPiece(PieceType.KNIGHT, 'black', 6, 0, 0, 'gold');
  addPiece(PieceType.ROOK, 'black', 7, 0, 0, 'gold');

  // Pawns at Y=1
  for(let x=0; x<8; x++) {
      addPiece(PieceType.PAWN, 'black', x, 1, 0, x < 4 ? 'silver' : 'gold');
  }
  
  // Special Unit
  addPiece(PieceType.FRACTAL_KNIGHT, 'black', 4, 1, 1, 'gold');


  // -------------------------------------------------------------------------
  // WHITE SETUP (Top Ceiling: Y=7)
  // -------------------------------------------------------------------------
  
  // Majors at Y=7
  addPiece(PieceType.ROOK, 'white', 0, 7, 7, 'silver');
  addPiece(PieceType.KNIGHT, 'white', 1, 7, 7, 'silver');
  addPiece(PieceType.BISHOP, 'white', 2, 7, 7, 'silver');
  addPiece(PieceType.QUEEN, 'white', 3, 7, 7, 'silver');
  addPiece(PieceType.KING, 'white', 4, 7, 7, 'gold');
  addPiece(PieceType.BISHOP, 'white', 5, 7, 7, 'gold');
  addPiece(PieceType.KNIGHT, 'white', 6, 7, 7, 'gold');
  addPiece(PieceType.ROOK, 'white', 7, 7, 7, 'gold');

  // Pawns at Y=6
  for(let x=0; x<8; x++) {
      addPiece(PieceType.PAWN, 'white', x, 6, 7, x < 4 ? 'silver' : 'gold');
  }

  // Special Unit
  addPiece(PieceType.FRACTAL_KNIGHT, 'white', 4, 6, 6, 'gold');

  return {
    pieces,
    capturedPieces: [],
    selectedId: null,
    validMoves: [],
    turn: 'white', // White starts (at top)
    moveHistory: [],
    turnPhase: null,
    pendingPromotion: null,
    gameMode: 'HvH',
    difficulty: 'Medium',
    isAiThinking: false,
    
    // Default Metrics for UI Dashboard
    matchStats: { 
        turnCount: 0, 
        winner: null, 
        totalMoves: 0, 
        totalCaptures: 0, 
        riskDelta: 0, 
        rewardDelta: 0, 
        relationDelta: 0 
    },
    detailedMetrics: {
        risk: { whiteMaterial: 0, blackMaterial: 0, breakdown: [], delta: 0, status: 0 },
        reward: { whiteControl: 0, blackControl: 0, components: [], delta: 0, status: 0 },
        relation: { whiteMorale: 0, blackMorale: 0, breakdown: [], subteams: { white: {gold:0, silver:0}, black: {gold:0, silver:0} }, delta: 0, status: 0 }
    },
    whiteStats: { name: "White Alliance", color: 'white', morale: 50, totalKills: 0, totalLosses: 0, checksMade: 0, timesInCheck: 0, boardControlScore: 0, kingSurvived: true },
    blackStats: { name: "Black Syndicate", color: 'black', morale: 50, totalKills: 0, totalLosses: 0, checksMade: 0, timesInCheck: 0, boardControlScore: 0, kingSurvived: true },
    boardLayers: []
  };
};

// --- Movement Logic ---

// Vectors
const ORTHOGONAL = [
  {x:1,y:0,z:0}, {x:-1,y:0,z:0},
  {x:0,y:1,z:0}, {x:0,y:-1,z:0},
  {x:0,y:0,z:1}, {x:0,y:0,z:-1}
];
const DIAGONAL = [ // 2D diagonals on all 3 planes
  {x:1,y:1,z:0}, {x:1,y:-1,z:0}, {x:-1,y:1,z:0}, {x:-1,y:-1,z:0},
  {x:1,y:0,z:1}, {x:1,y:0,z:-1}, {x:-1,y:0,z:1}, {x:-1,y:0,z:-1},
  {x:0,y:1,z:1}, {x:0,y:1,z:-1}, {x:0,y:-1,z:1}, {x:0,y:-1,z:-1}
];
const TRIAGONAL = [ // 3D corners
  {x:1,y:1,z:1}, {x:1,y:1,z:-1}, {x:1,y:-1,z:1}, {x:1,y:-1,z:-1},
  {x:-1,y:1,z:1}, {x:-1,y:1,z:-1}, {x:-1,y:-1,z:1}, {x:-1,y:-1,z:-1}
];

export const calculateMoves = (piece: Piece, pieces: Piece[], turnPhase: TurnPhase | null): Position[] => {
  const moves: Position[] = [];
  
  // If in phase 2, start from intermediate position
  const p = turnPhase && turnPhase.active && turnPhase.intermediatePos ? turnPhase.intermediatePos : piece.position;
  const isPhase2 = turnPhase && turnPhase.active;

  const isOccupied = (pos: Position) => pieces.some(other => posEquals(other.position, pos));
  const isEnemy = (pos: Position) => pieces.some(other => posEquals(other.position, pos) && other.color !== piece.color);
  const isEmpty = (pos: Position) => !isOccupied(pos);

  // Helper: Get standard moves along vectors
  const scanDirection = (dir: Position, limit: number = 8) => {
    for (let i = 1; i <= limit; i++) {
      const next = { x: p.x + dir.x * i, y: p.y + dir.y * i, z: p.z + dir.z * i };
      if (!isValidPos(next)) break;
      if (isOccupied(next)) {
        if (isEnemy(next)) moves.push(next);
        break; // Blocked
      }
      moves.push(next);
    }
  };

  if (piece.type === PieceType.PAWN && !isPhase2) {
    // Forward direction: 
    // White (Top Y=7) moves DOWN (Y-1)
    // Black (Bottom Y=0) moves UP (Y+1)
    const dy = piece.color === 'white' ? -1 : 1;
    
    // 1. Standard Move (Forward Only)
    const forward = { x: p.x, y: p.y + dy, z: p.z };
    if (isValidPos(forward) && isEmpty(forward)) {
        moves.push(forward);
        
        // 2. Double Move (First move only)
        if (!piece.hasMoved) {
            const doubleForward = { x: p.x, y: p.y + (dy * 2), z: p.z };
            if (isValidPos(doubleForward) && isEmpty(doubleForward)) {
                moves.push(doubleForward);
            }
        }
    }

    // 3. Capture Logic: Diagonal planes shared orthogonally
    // Can capture on X-axis diagonals (Left/Right + Forward)
    const xCaptures = [
        { x: p.x + 1, y: p.y + dy, z: p.z },
        { x: p.x - 1, y: p.y + dy, z: p.z }
    ];
    xCaptures.forEach(c => {
        if (isValidPos(c) && isEnemy(c)) moves.push(c);
    });

    // Can capture on Z-axis diagonals (In/Out + Forward)
    const zCaptures = [
        { x: p.x, y: p.y + dy, z: p.z + 1 },
        { x: p.x, y: p.y + dy, z: p.z - 1 }
    ];
    zCaptures.forEach(c => {
        if (isValidPos(c) && isEnemy(c)) moves.push(c);
    });
  }

  if (piece.type === PieceType.ROOK) {
    // Unlimited Orthogonal normally (limited by board size 8)
    // If Phase 2: Limited by remaining distance (total 8) AND must pick "any other" direction
    const remainingDist = isPhase2 ? (8 - (turnPhase?.distanceMoved || 0)) : 8;
    
    ORTHOGONAL.forEach(d1 => {
        // Phase 2 Filter: Cannot move in same direction axis (must change axis/dir)
        // "any other orthogonal dir" implies direction change.
        if (isPhase2 && turnPhase?.firstMoveVector) {
             const fv = turnPhase.firstMoveVector;
             // If vector matches exactly or is opposite on same axis, skip.
             // This forces a turn (dogleg).
             const isSameAxis = (d1.x !== 0 && fv.x !== 0) || (d1.y !== 0 && fv.y !== 0) || (d1.z !== 0 && fv.z !== 0);
             if (isSameAxis) return; 
        }

        for(let i=1; i<=remainingDist; i++) {
            const leg1 = { x: p.x + d1.x*i, y: p.y + d1.y*i, z: p.z + d1.z*i };
            if(!isValidPos(leg1)) break;
            
            let blocked = false;
            if (isOccupied(leg1)) {
                if(isEnemy(leg1)) moves.push(leg1);
                blocked = true;
            } else {
                moves.push(leg1);
            }
            if (blocked) break;
        }
    });
  }

  if (piece.type === PieceType.BISHOP) {
    // Unlimited Diagonal
    // If Phase 2: Limited total 8. "any other same colored diagonal"
    const remainingDist = isPhase2 ? (8 - (turnPhase?.distanceMoved || 0)) : 8;

    DIAGONAL.forEach(d1 => {
        // Phase 2 Filter: Must change direction
        if (isPhase2 && turnPhase?.firstMoveVector) {
            const fv = turnPhase.firstMoveVector;
            // Filter out same direction and exact opposite direction (staying on same line)
            if (d1.x === fv.x && d1.y === fv.y && d1.z === fv.z) return; 
            if (d1.x === -fv.x && d1.y === -fv.y && d1.z === -fv.z) return;
            // We allow other diagonals (e.g. 90 degree turns on different planes)
        }

        for(let i=1; i<=remainingDist; i++) {
            const leg1 = { x: p.x + d1.x*i, y: p.y + d1.y*i, z: p.z + d1.z*i };
            if(!isValidPos(leg1)) break;
            
            let blocked = false;
            if (isOccupied(leg1)) {
                if(isEnemy(leg1)) moves.push(leg1);
                blocked = true;
            } else {
                moves.push(leg1);
            }
            if (blocked) break;
        }
    });
  }

  if (piece.type === PieceType.QUEEN && !isPhase2) {
    [...ORTHOGONAL, ...DIAGONAL, ...TRIAGONAL].forEach(d => scanDirection(d));
  }

  if (piece.type === PieceType.KING && !isPhase2) {
    [...ORTHOGONAL, ...DIAGONAL, ...TRIAGONAL].forEach(d => scanDirection(d, 1));
  }

  if (piece.type === PieceType.KNIGHT) {
    // 3-Phase Movement: Any 2, 3, 3 shape along any axes (distinct axes for each leg)
    // FIX: Explicitly cast empty array to Axis[] to avoid 'never[]' inference error
    const state = turnPhase?.knightState || { legsRemaining: [2, 3, 3], axesUsed: [] as Axis[] };
    const { legsRemaining, axesUsed } = state;
    
    // Get unique available distances
    const availableDistances = Array.from(new Set(legsRemaining));
    const allAxes: Axis[] = ['X', 'Y', 'Z'];
    const availableAxes = allAxes.filter(a => !axesUsed.includes(a));
    const isFinalLeg = legsRemaining.length === 1;

    availableAxes.forEach(axis => {
        availableDistances.forEach(dist => {
            // Check both + and - directions
            [1, -1].forEach(sign => {
                const shift = dist * sign;
                const next: Position = { ...p };
                if (axis === 'X') next.x += shift;
                if (axis === 'Y') next.y += shift;
                if (axis === 'Z') next.z += shift;

                if (isValidPos(next)) {
                    // For Waypoints (not final leg), must be empty
                    // For Final Leg, can be empty or enemy (capture)
                    if (isFinalLeg) {
                        if (isEmpty(next) || isEnemy(next)) moves.push(next);
                    } else {
                        if (isEmpty(next)) moves.push(next);
                    }
                }
            });
        });
    });
  }

  if (piece.type === PieceType.FRACTAL_KNIGHT) {
    // 2-Phase Standard Knight L-Shape
    const getKnightTargets = (start: Position) => {
        const targets: Position[] = [];
        const shifts = [1, -1, 2, -2];
        shifts.forEach(dx => {
            shifts.forEach(dy => {
                if (Math.abs(dx) === Math.abs(dy)) return;
                // Knight moves in all 3 planes
                const planes = [
                    {x: start.x+dx, y: start.y+dy, z: start.z},
                    {x: start.x+dx, y: start.y, z: start.z+dy},
                    {x: start.x, y: start.y+dx, z: start.z+dy}
                ];
                planes.forEach(t => { if(isValidPos(t)) targets.push(t); });
            });
        });
        return targets;
    };

    const targets = getKnightTargets(p);
    targets.forEach(m => {
        if (isEmpty(m) || isEnemy(m)) moves.push(m);
    });
  }

  // Deduplicate
  const uniqueMoves: Position[] = [];
  const seen = new Set<string>();
  moves.forEach(m => {
      const s = `${m.x},${m.y},${m.z}`;
      if (!seen.has(s)) {
          seen.add(s);
          uniqueMoves.push(m);
      }
  });

  return uniqueMoves;
};

// ==========================================
// --- AI LOGIC (ENHANCED) ---
// ==========================================

const PIECE_VALUES: Record<PieceType, number> = {
    [PieceType.KING]: 200,
    [PieceType.QUEEN]: 9,
    [PieceType.FRACTAL_KNIGHT]: 7,
    [PieceType.ROOK]: 5,
    [PieceType.BISHOP]: 3,
    [PieceType.KNIGHT]: 3,
    [PieceType.PAWN]: 1
};

// Evaluate board state using Knowledge Graph Tensor
const evaluateBoard = (pieces: Piece[]): number => {
    let score = 0;
    const center = 3.5;

    for (const piece of pieces) {
        let value = PIECE_VALUES[piece.type];
        
        // 1. Standard Centrality Bonus
        const distFromCenter = Math.abs(piece.position.x - center) + Math.abs(piece.position.y - center) + Math.abs(piece.position.z - center);
        const positionBonus = (12 - distFromCenter) * 0.05;

        // 2. Faction Bonus
        if (piece.faction) value += 0.5;

        let pieceScore = value + positionBonus;

        // 3. TENSOR KNOWLEDGE GRAPH INTEGRATION
        // If AI (black), add "Intuition" bonuses
        if (piece.color === 'black') {
            const { x, y, z } = piece.position;
            
            // Query the Brain for "Intuition"
            // Cast to ANY to bypass strict enum mismatch if KnowledgeGraph uses a different Enum instance
            const threat = AI_BRAIN.getTensorValue(x, y, z, TI.DIRECT_THREAT as any);
            const synergy = AI_BRAIN.getTensorValue(x, y, z, TI.SYNERGY_SCORE as any);
            const winCorr = AI_BRAIN.getTensorValue(x, y, z, TI.WIN_CORRELATION as any);
            const influence = AI_BRAIN.getTensorValue(x, y, z, TI.INFLUENCE_GRAD as any);

            // Apply weighting (The 'Personality' affects how these values were learned,
            // but we can also weight them here for the evaluation function)
            pieceScore += (synergy * 0.25);
            pieceScore += (influence * 0.2);
            pieceScore += (winCorr * 0.5);
            pieceScore -= (threat * 0.3); // Avoid spots the AI knows are dangerous
        }

        if (piece.color === 'black') {
            score += pieceScore;
        } else {
            score -= pieceScore;
        }
    }
    return score;
};

const getAllMoves = (pieces: Piece[], color: PlayerColor): { fromId: string, to: Position, score?: number }[] => {
    const allMoves: { fromId: string, to: Position, score?: number }[] = [];
    
    pieces.filter(p => p.color === color).forEach(p => {
        const moves = calculateMoves(p, pieces, null);
        moves.forEach(m => {
            allMoves.push({ fromId: p.id, to: m });
        });
    });

    return allMoves;
};

// Minimax with Alpha-Beta
const minimax = (
    pieces: Piece[], 
    depth: number, 
    isMaximizing: boolean, 
    alpha: number, 
    beta: number
): number => {
    if (depth === 0) return evaluateBoard(pieces);

    const whiteKing = pieces.find(p => p.type === PieceType.KING && p.color === 'white');
    const blackKing = pieces.find(p => p.type === PieceType.KING && p.color === 'black');
    if (!whiteKing) return 9999;
    if (!blackKing) return -9999;

    const possibleMoves = getAllMoves(pieces, isMaximizing ? 'black' : 'white');

    // Move Ordering using Material + Tensor "Opportunity"
    possibleMoves.sort((a, b) => {
        const destA = pieces.find(p => posEquals(p.position, a.to));
        const destB = pieces.find(p => posEquals(p.position, b.to));
        
        // Material Diff
        const valA = destA ? PIECE_VALUES[destA.type] : 0;
        const valB = destB ? PIECE_VALUES[destB.type] : 0;
        
        // Tensor "Opportunity" check for sorting (Lightweight lookup)
        const oppA = isMaximizing ? AI_BRAIN.getTensorValue(a.to.x, a.to.y, a.to.z, TI.OPPORTUNITY as any) : 0;
        const oppB = isMaximizing ? AI_BRAIN.getTensorValue(b.to.x, b.to.y, b.to.z, TI.OPPORTUNITY as any) : 0;

        return (valB + oppB) - (valA + oppA);
    });

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of possibleMoves) {
            const targetIndex = pieces.findIndex(p => posEquals(p.position, move.to));
            const moverIndex = pieces.findIndex(p => p.id === move.fromId);
            if(moverIndex === -1) continue;

            const newPieces = [...pieces];
            if (targetIndex !== -1) newPieces.splice(targetIndex, 1);
            newPieces[moverIndex] = { ...newPieces[moverIndex], position: move.to };

            const evalScore = minimax(newPieces, depth - 1, false, alpha, beta);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of possibleMoves) {
            const targetIndex = pieces.findIndex(p => posEquals(p.position, move.to));
            const moverIndex = pieces.findIndex(p => p.id === move.fromId);
            if(moverIndex === -1) continue;

            const newPieces = [...pieces];
            if (targetIndex !== -1) newPieces.splice(targetIndex, 1);
            newPieces[moverIndex] = { ...newPieces[moverIndex], position: move.to };

            const evalScore = minimax(newPieces, depth - 1, true, alpha, beta);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

export const getAIMove = (state: GameState, difficulty: Difficulty): { fromId: string, to: Position } | null => {
    // 1. Sync Profile to Difficulty
    syncDifficultyProfile(difficulty);

    // 2. Process Learning (Snapshot -> PKG Update)
    // The AI observes the board state *before* moving to learn from the opponent's last move
    AI_BRAIN.processTurn(
        state, 
        [], // No active skills passed here for now
        1 
    );

    const pieces = state.pieces;
    const aiColor = 'black';
    const moves = getAllMoves(pieces, aiColor);

    if (moves.length === 0) return null;

    if (difficulty === 'Easy') {
        // Random move (Chaotic Profile handles this usually, but strict override here)
        return moves[Math.floor(Math.random() * moves.length)];
    }

    let bestMove = null;
    let bestValue = -Infinity;
    
    // Depth settings
    const searchDepth = difficulty === 'Medium' ? 1 : 2; 

    moves.sort(() => Math.random() - 0.5);

    // Sort by capture value
    moves.sort((a, b) => {
        const destA = pieces.find(p => posEquals(p.position, a.to));
        const destB = pieces.find(p => posEquals(p.position, b.to));
        const valA = destA ? PIECE_VALUES[destA.type] : 0;
        const valB = destB ? PIECE_VALUES[destB.type] : 0;
        return valB - valA;
    });

    for (const move of moves) {
        const targetIndex = pieces.findIndex(p => posEquals(p.position, move.to));
        const moverIndex = pieces.findIndex(p => p.id === move.fromId);
        
        const newPieces = [...pieces];
        if (targetIndex !== -1) newPieces.splice(targetIndex, 1);
        newPieces[moverIndex] = { ...newPieces[moverIndex], position: move.to };

        const boardVal = minimax(newPieces, searchDepth - 1, false, -Infinity, Infinity);
        
        if (boardVal > bestValue) {
            bestValue = boardVal;
            bestMove = move;
        }
    }

    return bestMove;
};