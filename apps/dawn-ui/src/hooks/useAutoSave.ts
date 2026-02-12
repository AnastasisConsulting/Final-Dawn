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
        if (!settings.autoSaveEnabled) return;

        const handleSave = setTimeout(() => {
            console.log('[AutoSave] Debounced save triggered...');
            PersistenceService.saveGame(gameState, {
                lastAddress: kernelState.address.full,
                visitedNodes: kernelState.visitedNodes
            });
        }, 1000); // 1s debounce

        return () => clearTimeout(handleSave);
    }, [settings.autoSaveEnabled, gameState, kernelState]);
};
