import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { PersistenceService } from '../services/PersistenceService';
import { useKernel } from '../../hooks/useKernel';

export const useAutoSave = () => {
    const { state: gameState } = useGame();
    const { state: kernelState } = useKernel();
    const { settings } = gameState;
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!settings.autoSaveEnabled) {
            if (saveTimerRef.current) {
                clearInterval(saveTimerRef.current);
                saveTimerRef.current = null;
            }
            return;
        }

        const intervalMs = settings.autoSaveInterval * 60 * 1000;

        saveTimerRef.current = setInterval(() => {
            console.log('[AutoSave] Saving game state...');
            PersistenceService.saveGame(gameState, {
                lastAddress: kernelState.address.full,
                visitedNodes: kernelState.visitedNodes
            });
        }, intervalMs);

        return () => {
            if (saveTimerRef.current) {
                clearInterval(saveTimerRef.current);
            }
        };
    }, [settings.autoSaveEnabled, settings.autoSaveInterval, gameState, kernelState]);
};
