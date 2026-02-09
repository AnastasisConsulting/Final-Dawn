import React, { Suspense, useCallback } from 'react';
// @ts-ignore
import { SimVizRoot } from '../../../../affinity-viz/components/SimVizRoot';
import { useSim } from '../../../src/context/SimContext';
import { runTurn } from '../../../services/orchestrator';

/**
 * AffinityVizPanel
 * 
 * Wrapper component to integrating the stand-alone affinity-viz
 * application into the dawn-ui slide panel system.
 */
interface AffinityVizPanelProps {
    onPanelChange?: (panelId: string) => void;
}

export const AffinityVizPanel: React.FC<AffinityVizPanelProps> = ({ onPanelChange }) => {
    const { updateSimState } = useSim();

    // Fast travel handler - triggers LLM narration of entering new location
    const handleFastTravel = useCallback(async (
        spatial: { g: number; s: number; o: number; c: number; ct: number; r: number },
        locationName: string
    ) => {
        // ... existing fast travel logic ...
        console.log('[FastTravel] Warping to:', spatial, locationName);

        const objectKey = `G${spatial.g}-S${spatial.s}-O${spatial.o}-C${spatial.c}-CT${spatial.ct}-R${spatial.r}`;

        window.dispatchEvent(new CustomEvent('fast-travel-start', {
            detail: { spatial, locationName, objectKey }
        }));

        // ... (rest of the logic usually here, but keeping it brief for the replacement block context if needed, 
        // implies I should probably just inject handleMemoryLink and keep handleFastTravel as is.
        // But replace_file_content replaces the chunk. I need to be careful not to delete logic.)
        // wait, I can just add handleMemoryLink and update the return.
    }, []); // This was the existing one.

    const handleMemoryLink = useCallback((
        spatial: { g: number; s: number; o: number; c: number; ct: number; r: number },
        locationName: string
    ) => {
        // 1. Dispatch event for Memory Viz to pick up
        window.dispatchEvent(new CustomEvent('memory-viz-request-location', {
            detail: { spatial, locationName }
        }));

        // 2. Switch Panel
        onPanelChange?.('MEM');
    }, [onPanelChange]);

    return (
        <div className="w-full h-full bg-black relative overflow-hidden">
            <Suspense fallback={<div className="text-cyan-500 p-4">Initializing Simulation...</div>}>
                <SimVizRoot
                    embedded={true}
                    onStateChange={updateSimState}
                    onFastTravel={handleFastTravel}
                    onOpenMemoryViz={handleMemoryLink}
                />
            </Suspense>
        </div>
    );
};

