// cubexgui/src/features/game/core/HyperBoard.ts
import React from 'react';
import { TensorNode } from './TensorNode';
import { TI } from './TensorConfig';
import { GamePiece, Pawn, Rook, Knight, Bishop, Queen, King, FractalKnight } from './Pieces'; 
import { getInitialGameState } from '../core/game_logic/gameStateInitializer';
import { Vector3, PlayerColor, RrrScore, MpwEvaluation, PieceStats, Position, TeamStats, MatchStats, PieceType, Faction, Piece, PieceColor } from '../types';
import { MoraleEngine, TeamMorale } from './MoraleSystem';
import { EvaluationEngine } from '../ai/EvaluationEngine';
import { ThreatMap, CoverageMap, PieceWithMaps } from '../ai/MetricMaps'; 
import { StatTracker } from '../ai/StatTracker'; 
import { posToKey } from '../ai/TelemetryUtils';


// Helper interface to satisfy StatTracker.endOfTurnAllPieces
interface HyperBoardEngineInterface {
    getPiece: (pos: Position) => GamePiece | undefined; 
}


// Helper function to map initial Piece data to GamePiece instance

const _createGamePiece = (pieceData: Piece): GamePiece => {
    const { id, type, color, position, faction } = pieceData;
    // FIX: Map the PlayerColor string union to the PieceColor enum
    const pieceColorEnum = color === 'white' ? PieceColor.WHITE : PieceColor.BLACK;
    const { x, y, z } = position;
    
    let gamePiece: GamePiece;
    
    switch(type) {
        case PieceType.ROOK: gamePiece = new Rook(id, pieceColorEnum, x, y, z); break;
        case PieceType.KNIGHT: gamePiece = new Knight(id, pieceColorEnum, x, y, z); break;
        case PieceType.BISHOP: gamePiece = new Bishop(id, pieceColorEnum, x, y, z); break;
        case PieceType.QUEEN: gamePiece = new Queen(id, pieceColorEnum, x, y, z); break;
        case PieceType.KING: gamePiece = new King(id, pieceColorEnum, x, y, z); break;
        case PieceType.FRACTAL_KNIGHT: gamePiece = new FractalKnight(id, pieceColorEnum, x, y, z); break;
        default: gamePiece = new Pawn(id, pieceColorEnum, x, y, z); break; // Default to Pawn
    }

    // Apply faction and generalId from Piece object
    if (faction === 'gold') gamePiece.faction = Faction.GOLD;
    else if (faction === 'silver') gamePiece.faction = Faction.SILVER;
    gamePiece.generalId = pieceData.generalId || null;
    
    return gamePiece;
};


export class HyperBoard {
  public size: number;
  public nodes: TensorNode[];
  public pieces: Map<string, GamePiece>;
  public capturedPieces: Map<string, GamePiece>;
  
  public turnCount: number = 0;
  public rrrHistory: RrrScore[] = [];

  public whiteMorale: TeamMorale;
  public blackMorale: TeamMorale;

  // Telemetry Maps
  private threatMap: ThreatMap;
  private coverageMap: CoverageMap;
  
  private _getPieceAtPos(pos: Position): GamePiece | undefined {
      for(const p of this.pieces.values()) {
          if (p.position.x === pos.x && p.position.y === pos.y && p.position.z === pos.z) return p;
      }
      return undefined;
  }

  constructor(size: number = 8) {
    this.size = size;
    this.nodes = [];
    this.pieces = new Map();
    this.capturedPieces = new Map();
    
    // Initialize Tensor Field
    for (let z = 0; z < size; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          this.nodes.push(new TensorNode(x, y, z));
        }
      }
    }

    // Initialize Metric Maps
    this.threatMap = new ThreatMap();
    this.coverageMap = new CoverageMap();

    // Initialize Team Morale objects
    this.whiteMorale = MoraleEngine.getInitialMorale(PieceColor.WHITE);
    this.blackMorale = MoraleEngine.getInitialMorale(PieceColor.BLACK);
    
    // --- CONSOLIDATED PIECE INITIALIZATION ---
    const initialState = getInitialGameState();
    initialState.pieces.forEach(p => {
        const gamePiece = _createGamePiece(p);
        this.pieces.set(gamePiece.id, gamePiece);
    });
    // --- END CONSOLIDATED PIECE INITIALIZATION ---
    
    this._syncPiecesToTensor(0);
    this._updateMetrics(); 
  }
  
  // Helper to ensure compatibility with MetricMaps interface
  private _getGameStateInterface(): any {
      const allPieces = Array.from(this.pieces.values()).map(p => ({
          ...p,
          // Explicitly adding missing properties and methods to satisfy PieceWithMaps
          captured: p.stats.captured,
          getValidMoves: (ctx: any) => p.getPotentialMoves(this.size, this._createMoveContext()),
          // FIX: Added required 'getMaterialValue' method (TS2352)
          getMaterialValue: () => p.getMaterialValue(),
      })) as unknown as PieceWithMaps[]; // Use 'unknown' double-cast to resolve TS2352
      
      return {
          pieces: allPieces,
          getPieceAtPos: (key: string) => {
              const [x, y, z] = key.split(',').map(Number);
              return allPieces.find(p => p.position.x === x && p.position.y === y && p.position.z === z);
          }
      };
  }
  
  // Helper to implement the EngineInterface for StatTracker.endOfTurnAllPieces
  private _getEngineInterface(): HyperBoardEngineInterface {
      return {
          getPiece: (pos: Position) => this._getPieceAtPos(pos)
      };
  }

  /**
   * Main Game Loop Trigger
   */
  public executeMove(pieceId: string, target: Position, turn: number) {
    const piece = this.pieces.get(pieceId);
    if (!piece) return;

    const fromPos = { ...piece.position }; 
    const targetVector: Position = target;

    // 1. Capture Handling
    const capturedPiece = this._getPieceAtPos(targetVector);

    // 2. Run StatTracker Hooks (Move and Capture)
    // FIX: Pass PieceWithTracker compatible objects by spreading relevant GamePiece properties
    const pieceWithTracker = { ...piece, morale: piece.currentMorale, captured: piece.stats.captured };
    const capturedWithTracker = capturedPiece ? { ...capturedPiece, morale: capturedPiece.currentMorale, captured: capturedPiece.stats.captured } : undefined;
    StatTracker.onPieceMove(pieceWithTracker as any, fromPos, target, capturedWithTracker as any);

    // 3. Update internal piece position
    piece.setPosition(targetVector); 
    
    if (capturedPiece) {
        this.capturedPieces.set(capturedPiece.id, capturedPiece);
        this.pieces.delete(capturedPiece.id);
        capturedPiece.stats.captured = true; // Mark stat object as captured
    }
    
    // 4. Sync Reality
    this.turnCount = turn;
    this._syncPiecesToTensor(turn);

    // 5. Run Core Analysis
    this._updateMetrics();
  }

  private _updateMetrics() {
    const gameStateInterface = this._getGameStateInterface();
    const allPieces = Array.from(this.pieces.values()).map(p => ({ 
        ...p, 
        morale: p.currentMorale, 
        captured: p.stats.captured,
        getValidMoves: (ctx: any) => p.getPotentialMoves(this.size, this._createMoveContext()) 
    })); // FIX: Ensure Pieces passed to StatTracker conform to PieceWithTracker

    // --- 1. Run Metric Maps (Global Scan) ---
    // Note: Running two scans for cross-team threat/coverage
    this.threatMap.scanBoard(gameStateInterface, PieceColor.BLACK);
    this.coverageMap.scanBoard(gameStateInterface, PieceColor.WHITE);
    
    // --- 2. Update Piece Telemetry (Exposure, Behavior) ---
    StatTracker.evaluateExposure(allPieces as any, this.threatMap, this.coverageMap);
    // FIX: Pass the HyperBoard instance via _getEngineInterface to StatTracker
    StatTracker.endOfTurnAllPieces(this._getEngineInterface() as any); 
    
    // --- 3. RRR Evaluation (Existing Logic) ---
    const whiteMoves = this._calculateTotalValidMoves(PieceColor.WHITE);
    const blackMoves = this._calculateTotalValidMoves(PieceColor.BLACK);
    
    const whiteEval = EvaluationEngine.calculateMpw(this.pieces, PieceColor.WHITE, whiteMoves);
    const blackEval = EvaluationEngine.calculateMpw(this.pieces, PieceColor.BLACK, blackMoves);
    
    const currentRrr = EvaluationEngine.getRrrScore(whiteEval, blackEval);
    this.rrrHistory.push(currentRrr);
    const posture = EvaluationEngine.analyzePosture(this.rrrHistory);

    this.whiteMorale = MoraleEngine.mapToTeamMorale(PieceColor.WHITE, whiteEval, posture);
    this.blackMorale = MoraleEngine.mapToTeamMorale(PieceColor.BLACK, blackEval, posture);

    this._updateFieldDynamics();
  }

  private _calculateTotalValidMoves(color: PieceColor): number { 
      let count = 0;
      const moveCtx = this._createMoveContext();
      
      // Since PieceColor is now string-backed ('white'/'black'), we can compare directly.
      const colorString = color as PlayerColor; 

      this.pieces.forEach(p => {
          // p.color is PlayerColor, and color is PieceColor (string-backed enum), so they match.
          if (p.color === colorString) {
              const moves = p.getPotentialMoves(this.size, moveCtx);
              count += moves.length;
          }
      });
      return count;
  }

  private _syncPiecesToTensor(turn: number) {
    this.nodes.forEach(n => n.updateOccupancy(null, turn));
    this.pieces.forEach(piece => {
      const idx = this._idx(piece.position.x, piece.position.y, piece.position.z);
      if (this.nodes[idx]) {
        // FIX: Pass the GamePiece object
        this.nodes[idx].updateOccupancy(piece, turn);
      }
    });
  }

  private _updateFieldDynamics() {
    this.nodes.forEach(n => n.tickDecay()); // Example of tensor update
    // ... (rest of tensor dynamics logic)
  }

  public getValidMoves(pieceId: string): Position[] {
      const piece = this.pieces.get(pieceId);
      if (!piece) return [];
      return piece.getPotentialMoves(this.size, this._createMoveContext());
  }

  private _createMoveContext() {
      return {
          isEmpty: (pos: Position) => {
              const idx = this._idx(pos.x, pos.y, pos.z);
              return this.nodes[idx] && this.nodes[idx].data[TI.STATE_ID] === 0;
          },
          isEnemy: (pos: Position, myColor: PlayerColor) => {
              const idx = this._idx(pos.x, pos.y, pos.z);
              if (!this.nodes[idx]) return false;
              const owner = this.nodes[idx].data[TI.OWNER_ID]; 
              // Since PieceColor is now string-backed, we can map to the value stored in the TensorNode
              const myOwnerId = myColor === 'white' ? 1 : 2; 
              return owner !== 0 && owner !== myOwnerId;
          },
          isAlly: (pos: Position, myColor: PlayerColor) => {
              const idx = this._idx(pos.x, pos.y, pos.z);
              if (!this.nodes[idx]) return false;
              const owner = this.nodes[idx].data[TI.OWNER_ID];
              // Since PieceColor is now string-backed, we can map to the value stored in the TensorNode
              const myOwnerId = myColor === 'white' ? 1 : 2;
              return owner === myOwnerId;
          }
      };
  }

  private _idx(x: number, y: number, z: number): number {
    return x + (y * this.size) + (z * this.size * this.size);
  }

  /**
   * Generates a payload containing all updated telemetry data for the Reducer.
   */
  public getTelemetryPayload(): { pieceTelemetry: PieceStats[], whiteStats: TeamStats, blackStats: TeamStats, matchStats: MatchStats } {
      const allPieces = Array.from(this.pieces.values());
      const allCaptured = Array.from(this.capturedPieces.values());
      
      const whitePieces = allPieces.filter(p => p.color === PieceColor.WHITE);
      const blackPieces = allPieces.filter(p => p.color === PieceColor.BLACK);
      
      const compileTeamStats = (pieces: GamePiece[], color: PlayerColor): TeamStats => {
          const moraleKey = color === 'white' ? this.whiteMorale : this.blackMorale;
          
          return {
              name: color === 'white' ? 'White Alliance' : 'Black Syndicate', 
              color: color, 
              morale: moraleKey.totalConfidence, 
              totalKills: pieces.reduce((a, p) => a + p.stats.kills, 0), 
              totalLosses: allCaptured.filter(p => p.color === PieceColor.WHITE && color === 'white' || p.color === PieceColor.BLACK && color === 'black').length,
              specialsUsed: pieces.reduce((a, p) => a + p.stats.special_moves_used, 0),
              checksMade: 0, timesInCheck: 0, kingSurvived: true, bodyDoubleUsed: false,
              boardControlScore: moraleKey.boardControl,
              medals: new Set(), moraleEvents: [],
          };
      }

      return {
          pieceTelemetry: [...whitePieces, ...blackPieces].map(p => p.stats), 
          whiteStats: compileTeamStats(whitePieces, 'white'),
          blackStats: compileTeamStats(blackPieces, 'black'),
          matchStats: {
              turnCount: this.turnCount, winner: null, endReason: null, startTime: null, endTime: null,
              firstBloodBy: null, mostValuablePiece: null, finalSurvivors: [], moraleCrashes: [],
              highestComeback: {}, totalMoves: 0, totalCaptures: 0, totalSpecials: 0,
              riskDelta: this.whiteMorale.threatPressure - this.blackMorale.threatPressure, // Raw Material Delta
              rewardDelta: this.whiteMorale.boardControl - this.blackMorale.boardControl, // Raw BC Delta
              relationDelta: this.whiteMorale.totalConfidence - this.blackMorale.totalConfidence, // Raw Morale Delta
          }
      };
  }
}