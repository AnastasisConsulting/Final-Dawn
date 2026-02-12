// game/hooks/useCubexEngine.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { GamePiece } from '../core/Pieces'; 
import { HyperBoard } from '../core/HyperBoard'; 
import { Vector3, PieceType, PieceColor, Faction } from '../types';
import { GameState, Piece, PlayerColor, PieceType as UIPieceType, Position } from '../types';

/**
 * ADAPTER: Converts Internal Engine Piece -> UI Piece
 */
const adaptPieceToUI = (gp: GamePiece): Piece => {
  // Map internal enum strings to UI types
  // FIX: Use Enum values instead of string literals to satisfy TypeScript
  const typeMap: Record<string, UIPieceType> = {
    [PieceType.PAWN]: PieceType.PAWN,
    [PieceType.ROOK]: PieceType.ROOK,
    [PieceType.KNIGHT]: PieceType.KNIGHT,
    [PieceType.BISHOP]: PieceType.BISHOP,
    [PieceType.QUEEN]: PieceType.QUEEN,
    [PieceType.KING]: PieceType.KING,
    [PieceType.FRACTAL_KNIGHT]: PieceType.FRACTAL_KNIGHT
  };

  // Convert Engine Faction Enum to UI String Literal
  let uiFaction: 'gold' | 'silver' | undefined = undefined;
  if (gp.faction === Faction.GOLD) uiFaction = 'gold';
  else if (gp.faction === Faction.SILVER) uiFaction = 'silver';

  return {
    id: gp.id,
    type: typeMap[gp.type] || PieceType.PAWN,
    color: gp.color === PieceColor.WHITE ? 'white' : 'black',
    position: { x: gp.position.x, y: gp.position.y, z: gp.position.z },
    hasMoved: gp.hasMoved,
    faction: uiFaction
  };
};

export const useCubexEngine = (boardSize: number = 8) => {
  // The Source of Truth
  const boardRef = useRef<HyperBoard | null>(null);
  
  // React State for UI
  // FIX: Initialize all required properties of GameState, including Dashboard metrics
  const [uiState, setUiState] = useState<GameState>({
    pieces: [],
    capturedPieces: [],
    selectedId: null,
    validMoves: [],
    turn: 'white',
    moveHistory: [],
    turnPhase: null,
    pendingPromotion: null,
    gameMode: 'HvH',
    difficulty: 'Medium',
    isAiThinking: false,
    
    // FIX: Fully initialized MatchStats (TS2740)
    matchStats: { 
        turnCount: 0, 
        winner: null, 
        endReason: null, // ADDED
        startTime: Date.now(), // ADDED
        endTime: null, // ADDED
        firstBloodBy: null, // ADDED
        mostValuablePiece: null, // ADDED
        finalSurvivors: [], // ADDED
        moraleCrashes: [], // ADDED
        highestComeback: {}, // ADDED
        totalMoves: 0, 
        totalCaptures: 0, 
        totalSpecials: 0, // ADDED
        riskDelta: 0, 
        rewardDelta: 0, 
        relationDelta: 0 
    },
    detailedMetrics: {
        risk: { whiteMaterial: 0, blackMaterial: 0, breakdown: [], delta: 0, status: 0 },
        reward: { whiteControl: 0, blackControl: 0, components: [], delta: 0, status: 0 },
        relation: { whiteMorale: 0, blackMorale: 0, breakdown: [], subteams: { white: {gold:0, silver:0}, black: {gold:0, silver:0} }, delta: 0, status: 0 }
    },
    // FIX: Fully initialized TeamStats (TS2739)
    whiteStats: { 
        name: "White Alliance", 
        color: 'white', 
        morale: 50, 
        totalKills: 0, 
        totalLosses: 0, 
        checksMade: 0, 
        timesInCheck: 0, 
        boardControlScore: 0, 
        kingSurvived: true,
        specialsUsed: 0, // ADDED
        bodyDoubleUsed: false, // ADDED
        medals: new Set(), // ADDED
        moraleEvents: [], // ADDED
    },
    // FIX: Fully initialized TeamStats (TS2739)
    blackStats: { 
        name: "Black Syndicate", 
        color: 'black', 
        morale: 50, 
        totalKills: 0, 
        totalLosses: 0, 
        checksMade: 0, 
        timesInCheck: 0, 
        boardControlScore: 0, 
        kingSurvived: true,
        specialsUsed: 0, // ADDED
        bodyDoubleUsed: false, // ADDED
        medals: new Set(), // ADDED
        moraleEvents: [], // ADDED
    },
    boardLayers: [],
    
    // FIX: Added missing 'pieceTelemetry' property
    pieceTelemetry: [],
  });

  const [metrics, setMetrics] = useState({
    whiteMorale: 0,
    whiteControl: 0,
    blackMorale: 0,
    blackControl: 0
  });

  // Initialize Engine
  useEffect(() => {
    boardRef.current = new HyperBoard(boardSize);
    syncState();
  }, [boardSize]);

  // Sync Engine Data -> UI State
  const syncState = () => {
    if (!boardRef.current) return;

    const enginePieces = Array.from(boardRef.current.pieces.values());
    const uiPieces = enginePieces.map(adaptPieceToUI);
    
    // FIX: Also grab the full telemetry payload (MatchStats, TeamStats, PieceTelemetry)
    const telemetryPayload = boardRef.current.getTelemetryPayload();

    setUiState(prev => ({
      ...prev,
      pieces: uiPieces,
      // Sync engine stats to UI state
      whiteStats: { ...telemetryPayload.whiteStats, morale: boardRef.current!.whiteMorale.totalConfidence, boardControlScore: boardRef.current!.whiteMorale.boardControl },
      blackStats: { ...telemetryPayload.blackStats, morale: boardRef.current!.blackMorale.totalConfidence, boardControlScore: boardRef.current!.blackMorale.boardControl },
      matchStats: telemetryPayload.matchStats,
      pieceTelemetry: telemetryPayload.pieceTelemetry,
    }));

    setMetrics({
        whiteMorale: boardRef.current.whiteMorale.totalConfidence,
        whiteControl: boardRef.current.whiteMorale.boardControl,
        blackMorale: boardRef.current.blackMorale.totalConfidence,
        blackControl: boardRef.current.blackMorale.boardControl,
    });
  };

  const selectPiece = useCallback((id: string) => {
    if (!boardRef.current) return;
    
    // 1. Get Engine Piece
    const piece = boardRef.current.pieces.get(id);
    if (!piece) return;

    // 2. Calculate Valid Moves (State Aware via HyperBoard)
    const validVectors = boardRef.current.getValidMoves(id);
    
    // 3. Update UI
    setUiState(prev => ({
      ...prev,
      selectedId: id,
      validMoves: validVectors.map(v => ({ x: v.x, y: v.y, z: v.z }))
    }));
  }, [boardSize]);

  const movePiece = useCallback((target: Position) => {
    if (!boardRef.current || !uiState.selectedId) return;

    const pieceId = uiState.selectedId;
    const targetVec: Vector3 = { x: target.x, y: target.y, z: target.z };

    // Execute Move in Core
    boardRef.current.executeMove(pieceId, targetVec, uiState.moveHistory.length + 1);
    
    // Update Turn
    setUiState(prev => ({
      ...prev,
      selectedId: null,
      validMoves: [],
      turn: prev.turn === 'white' ? 'black' : 'white',
      moveHistory: [...prev.moveHistory, `${pieceId} to ${target.x},${target.y},${target.z}`]
    }));

    syncState();
  }, [uiState.selectedId, uiState.moveHistory]);

  return {
    gameState: uiState,
    metrics,
    selectPiece,
    movePiece,
    engine: boardRef.current 
  };
};