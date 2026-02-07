// apps/dawn-ui/src/services/PersistenceService.ts

import { GameState } from '../context/GameContext';

export interface SaveData {
    version: string;
    timestamp: number;
    gameState: GameState;
    kernel: {
        lastAddress: string;
        visitedNodes: string[];
        visitedLocations: string[]; // Addresses of landed locations (e.g., "G1-S1-O1")
    };
}

const SAVE_KEY = 'eideus_dawn_save_v1';

export const PersistenceService = {
    saveGame(gameState: GameState, kernelState: { lastAddress: string; visitedNodes: string[]; visitedLocations?: string[] }) {
        const saveData: SaveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            gameState,
            kernel: {
                ...kernelState,
                visitedLocations: kernelState.visitedLocations || []
            }
        };
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
            console.log('[Persistence] Game Saved.');
        } catch (err) {
            console.error('[Persistence] Save failed:', err);
        }
    },

    loadGame(): SaveData | null {
        try {
            const data = localStorage.getItem(SAVE_KEY);
            if (!data) return null;
            const parsed = JSON.parse(data) as SaveData;

            // Ensure visitedLocations exists (migration)
            if (!parsed.kernel.visitedLocations) {
                parsed.kernel.visitedLocations = [];
            }

            // Version check / migrations could go here
            console.log('[Persistence] Game Loaded.');
            return parsed;
        } catch (err) {
            console.error('[Persistence] Load failed:', err);
            return null;
        }
    },

    clearSave() {
        localStorage.removeItem(SAVE_KEY);
        console.log('[Persistence] Save cleared.');
    },

    /**
     * Mark a location as visited
     */
    markLocationVisited(address: string) {
        try {
            const data = localStorage.getItem(SAVE_KEY);
            if (!data) return;

            const parsed = JSON.parse(data) as SaveData;
            if (!parsed.kernel.visitedLocations) {
                parsed.kernel.visitedLocations = [];
            }

            if (!parsed.kernel.visitedLocations.includes(address)) {
                parsed.kernel.visitedLocations.push(address);
                localStorage.setItem(SAVE_KEY, JSON.stringify(parsed));
                console.log('[Persistence] Location marked as visited:', address);
            }
        } catch (err) {
            console.error('[Persistence] Failed to mark location visited:', err);
        }
    },

    /**
     * Check if a location has been visited
     */
    hasVisited(address: string): boolean {
        try {
            const data = localStorage.getItem(SAVE_KEY);
            if (!data) return false;

            const parsed = JSON.parse(data) as SaveData;
            return parsed.kernel.visitedLocations?.includes(address) || false;
        } catch (err) {
            console.error('[Persistence] Failed to check visited status:', err);
            return false;
        }
    },

    /**
     * Get all visited locations
     */
    getVisitedLocations(): string[] {
        try {
            const data = localStorage.getItem(SAVE_KEY);
            if (!data) return [];

            const parsed = JSON.parse(data) as SaveData;
            return parsed.kernel.visitedLocations || [];
        } catch (err) {
            console.error('[Persistence] Failed to get visited locations:', err);
            return [];
        }
    }
};
