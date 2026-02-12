// src/features/game/core/game_logic/gameStateInitializer.ts
import {
  GameState,
  PieceType,
  PlayerColor,
  PieceColor,
  Faction,
  DetailedMetrics,
  MetricBreakdown,
  Piece,
  Position,
} from '../../types';
import { CUBE_SIZE } from './gameConstants';
import { Pawn, Rook, Bishop, Knight, FractalKnight, Queen, King } from '../Pieces';

export const getInitialGameState = (): GameState => {
  const pieces: Piece[] = [];
  let idCounter = 0;

  // Refactored addPiece to create a plain Piece object (UI definition)
  const addPiece = (
    type: PieceType,
    color: PlayerColor,
    x: number,
    y: number,
    z: number,
    faction: 'gold' | 'silver', // FIX: Use string union type for faction parameter
    generalId?: string
  ) => {
    const id = `${color}-${type}-${idCounter++}`;
    
    // Construct a Piece object directly to conform to Piece interface
    const piece: Piece = {
      id: id,
      type: type,
      color: color,
      position: { x, y, z },
      hasMoved: false,
      faction: faction, // FIX: Assign string literal to faction property
      generalId: generalId,
      // For Pawns, set the initial lastMoveVector to enable the correct move calculation on turn 1
      lastMoveVector: type === PieceType.PAWN 
        ? (color === 'white' ? {x:0, y:-1, z:0} : {x:0, y:1, z:0})
        : undefined
    };
    
    pieces.push(piece);
  };

  const MAX = CUBE_SIZE - 1;

  // --- Black setup ---
  const bKingId = `black-${PieceType.KING}-0`;
  // FIX: Swapped Rook and Bishop order for Gold faction. Now Bishop is Z=2, Knight is Z=3, Rook is Z=4.
  const goldOrder = [PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK];
  const silverOrder = [PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK];

  addPiece(PieceType.KING, 'black', 0, 0, 0, 'gold', bKingId);
  addPiece(PieceType.FRACTAL_KNIGHT, 'black', 0, 0, 1, 'gold', bKingId);
  addPiece(PieceType.QUEEN, 'black', 1, 0, 0, 'silver', bKingId);

  let zGold = 2;
  for (const type of goldOrder) addPiece(type, 'black', 0, 0, zGold++, 'gold', bKingId);

  let xSilver = 2;
  for (const type of silverOrder) addPiece(type, 'black', xSilver++, 0, 0, 'silver', bKingId);

  const blackPawnPositions = [
    { x: 1, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 5, y: 1, z: 0 },
    { x: 0, y: 2, z: 1 }, { x: 2, y: 2, z: 1 }, { x: 4, y: 2, z: 1 },
    { x: 1, y: 3, z: 2 }, { x: 3, y: 3, z: 2 }, { x: 5, y: 3, z: 2 },
    { x: 0, y: 4, z: 2 }, { x: 2, y: 4, z: 2 }, { x: 4, y: 4, z: 2 },
  ];
  blackPawnPositions.forEach((pos, i) => {
    // FIX: Use explicit string union type
    const faction: 'gold' | 'silver' = i < 6 ? 'gold' : 'silver';
    addPiece(PieceType.PAWN, 'black', pos.x, pos.y, pos.z, faction, bKingId);
  });

  // --- White setup ---
  const wKingId = `white-${PieceType.KING}-10`;
  // The goldOrder array is reused.
  
  addPiece(PieceType.KING, 'white', MAX, MAX, MAX, 'gold', wKingId);
  addPiece(PieceType.FRACTAL_KNIGHT, 'white', MAX, MAX, MAX - 1, 'gold', wKingId);
  addPiece(PieceType.QUEEN, 'white', MAX - 1, MAX, MAX, 'silver', wKingId);

  let zGoldW = MAX - 2;
  for (const type of goldOrder) addPiece(type, 'white', MAX, MAX, zGoldW--, 'gold', wKingId);

  let xSilverW = MAX - 2;
  for (const type of silverOrder) addPiece(type, 'white', xSilverW--, MAX, MAX, 'silver', wKingId);

  const whitePawnPositions = [
    { x: 6, y: 6, z: 7 }, { x: 4, y: 6, z: 7 }, { x: 2, y: 6, z: 7 },
    { x: 7, y: 5, z: 6 }, { x: 5, y: 5, z: 6 }, { x: 3, y: 5, z: 6 },
    { x: 6, y: 4, z: 5 }, { x: 4, y: 4, z: 5 }, { x: 2, y: 4, z: 5 },
    { x: 7, y: 3, z: 5 }, { x: 5, y: 3, z: 5 }, { x: 3, y: 3, z: 5 },
  ];
  whitePawnPositions.forEach((pos, i) => {
    // FIX: Use explicit string union type
    const faction: 'gold' | 'silver' = i < 6 ? 'gold' : 'silver';
    addPiece(PieceType.PAWN, 'white', pos.x, pos.y, pos.z, faction, wKingId);
  });

  const initialDetailedMetrics: DetailedMetrics = {
    risk: { whiteMaterial: 0, blackMaterial: 0, breakdown: [], delta: 0, status: 0 },
    reward: { whiteControl: 0, blackControl: 0, components: [], delta: 0, status: 0 },
    relation: {
      whiteMorale: 0,
      blackMorale: 0,
      breakdown: [],
      subteams: { white: { gold: 0, silver: 0 }, black: { gold: 0, silver: 0 } },
      delta: 0,
      status: 0,
    },
  };

  return {
    pieces,
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
    pieceTelemetry: [],
    matchStats: {
      turnCount: 0,
      winner: null,
      endReason: null,
      startTime: Date.now(),
      endTime: null,
      firstBloodBy: null,
      mostValuablePiece: null,
      finalSurvivors: [],
      moraleCrashes: [],
      highestComeback: {},
      totalMoves: 0,
      totalCaptures: 0,
      totalSpecials: 0,
      riskDelta: 0,
      rewardDelta: 0,
      relationDelta: 0,
    },
    detailedMetrics: initialDetailedMetrics,
    whiteStats: {
      name: 'White Alliance',
      color: 'white',
      morale: 50,
      totalKills: 0,
      totalLosses: 0,
      specialsUsed: 0,
      checksMade: 0,
      timesInCheck: 0,
      kingSurvived: true,
      bodyDoubleUsed: false,
      boardControlScore: 0,
      medals: new Set(),
      moraleEvents: [],
    },
    blackStats: {
      name: 'Black Syndicate',
      color: 'black',
      morale: 50,
      totalKills: 0,
      totalLosses: 0,
      specialsUsed: 0,
      checksMade: 0,
      timesInCheck: 0,
      kingSurvived: true,
      bodyDoubleUsed: false,
      boardControlScore: 0,
      medals: new Set(),
      moraleEvents: [],
    },
    boardLayers: [],
  };
};