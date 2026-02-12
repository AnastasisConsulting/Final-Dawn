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
    },

    /**
     * Export the current save data to a local file
     */
    exportToDisk() {
        try {
            const data = localStorage.getItem(SAVE_KEY);
            if (!data) {
                console.error('[Persistence] No save data found to export.');
                return;
            }

            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

            link.href = url;
            link.download = `eideus_save_${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log('[Persistence] Save exported to disk.');
        } catch (err) {
            console.error('[Persistence] Export failed:', err);
        }
    },

    /**
     * Import save data from a local file
     */
    async importFromDisk(): Promise<SaveData | null> {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';

            input.onchange = async (e: Event) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) {
                    resolve(null);
                    return;
                }

                try {
                    const text = await file.text();
                    const parsed = JSON.parse(text) as SaveData;

                    // Basic validation
                    if (!parsed.gameState || !parsed.kernel) {
                        throw new Error('Invalid save file format');
                    }

                    // Save to localStorage immediately
                    localStorage.setItem(SAVE_KEY, text);
                    console.log('[Persistence] Save imported from disk.');
                    resolve(parsed);
                } catch (err) {
                    console.error('[Persistence] Import failed:', err);
                    alert('Failed to import save file: Invalid format.');
                    resolve(null);
                }
            };

            input.click();
        });
    }
};
