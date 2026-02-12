// cubexgui/src/features/game/core/BoardFactory.ts
import {
  PieceColor,
  PieceType
} from '../types';

import { GamePiece } from './Pieces';

/**
 * @deprecated This class is deprecated. Piece initialization logic has been consolidated into 
 * src/features/game/core/game_logic/gameStateInitializer.ts to simplify the codebase.
 */
export class BoardFactory {

    /**
     * Now returns an empty map, as pieces are initialized via GameState/HyperBoard constructor.
     */
    public static initializeBoard(boardSize: number = 8): Map<string, GamePiece> {
        // NOTE: The HyperBoard constructor now uses getInitialGameState directly.
        // This function exists only to prevent breaking previous module coupling.
        return new Map<string, GamePiece>();
    }
}