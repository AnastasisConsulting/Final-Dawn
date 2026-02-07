// Final_Dawn_of_Eideus/apps/dawn-ui/components/Layout/MainGrid.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { LeftPanel } from '../Panels/LeftPanel';
import { CenterPanel } from '../Panels/CenterPanel';
import { RightPanel } from '../Panels/RightPanel';
import { SlidePanel } from '../SlidePanels/SlidePanel';
import { PanelContent } from '../SlidePanels/PanelContent';
import { useKernel } from '../../hooks/useKernel';

interface MainGridProps {
    onFlightMode: () => void;
    landingPayload?: {
        id: number;
        targetName: string;
        targetAddress?: string;
        systemName?: string;
        landingNarration: string;
        openingScene: string;
    } | null;
    onClearLandingPayload?: () => void;
}

export const MainGrid: React.FC<MainGridProps> = ({ onFlightMode, landingPayload, onClearLandingPayload }) => {
    const { state } = useKernel();
    const isWarping = state.isWarping;

    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [activeChatTarget, setActiveChatTarget] = useState<'navbot' | 'vizzy' | 'lyra'>('navbot');
    const [focusedPanel, setFocusedPanel] = useState<'left' | 'right' | null>(null);
    const [hoveredPanel, setHoveredPanel] = useState<'left' | 'right' | null>(null);

    const chatInjection = useMemo(() => {
        if (!landingPayload) return null;
        return {
            id: landingPayload.id,
            targetName: landingPayload.targetName,
            targetAddress: landingPayload.targetAddress,
            landingNarration: landingPayload.landingNarration,
            openingScene: landingPayload.openingScene,
        };
    }, [landingPayload]);

    useEffect(() => {
        if (!landingPayload) return;
        setActivePanel(null);
        setFocusedPanel(null);
        setActiveChatTarget('lyra');

        const t = window.setTimeout(() => onClearLandingPayload?.(), 50);
        return () => window.clearTimeout(t);
    }, [landingPayload, onClearLandingPayload]);

    const handlePanelSelect = (panelId: string) => {
        setActivePanel(prev => prev === panelId ? null : panelId);
        setFocusedPanel('right');
    };

    const handleBackgroundClick = () => {
        setFocusedPanel(null);
    };

    /**
     * BAY DOOR ANIMATION LOGIC:
     * When isWarping is true (triggered by the button press), panels open outward.
     * Left panel pivots on its left edge to swing away from the center.
     * Right panel pivots on its right edge to swing away from the center.
     * Center chat panel fades out and recedes.
     */
    const getLeftTransform = () => {
        if (isWarping) return 'rotateY(-110deg) translateX(-100%)';
        if (focusedPanel === 'left' || hoveredPanel === 'left') return 'rotateY(0deg)';
        return 'rotateY(12deg)';
    };

    const getRightTransform = () => {
        if (isWarping) return 'rotateY(110deg) translateX(100%)';
        const isActive = focusedPanel === 'right' || hoveredPanel === 'right';
        if (isActive) return 'rotateY(-5deg) translateX(0)';
        return 'rotateY(-88deg) translateX(10%)';
    };

    const getCenterStyle = (): React.CSSProperties => {
        if (isWarping) {
            return {
                transform: 'scale(0.8) translateZ(-800px)',
                opacity: 0,
                filter: 'blur(10px)',
                transition: 'all 4000ms cubic-bezier(0.4, 0, 0.2, 1)'
            };
        }
        return {
            transform: 'translateZ(0)',
            opacity: activePanel ? 0.1 : 1,
            filter: activePanel ? 'blur(4px)' : 'none',
            transition: 'all 1500ms cubic-bezier(0.4, 0, 0.2, 1)'
        };
    };

    return (
        <div
            className="relative flex flex-row w-full h-full justify-between items-center px-[1%] gap-[1%]"
            style={{ perspective: '1600px' }}
            onClick={handleBackgroundClick}
        >
            {/* Left Panel: Opens like a bay door */}
            <div
                className="w-[25%] h-full relative z-10 transition-all duration-[4000ms] cubic-bezier(0.4, 0, 0.2, 1)"
                style={{
                    visibility: 'hidden', // HIDDEN PER USER REQUEST (Preserves layout)
                    transform: getLeftTransform(),
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'center left'
                }}
                data-panel-trigger="true"
                onMouseEnter={() => !isWarping && setHoveredPanel('left')}
                onMouseLeave={() => setHoveredPanel(null)}
                onClick={(e) => { e.stopPropagation(); !isWarping && setFocusedPanel('left'); }}
            >
                <LeftPanel onTargetSelect={(t) => { setActiveChatTarget(t); setFocusedPanel('left'); }} />
            </div>

            {/* Center Panel: Fades and recedes */}
            <div
                className="w-[55%] h-full relative z-10"
                data-panel-trigger="true"
                style={getCenterStyle()}
                onClick={(e) => { e.stopPropagation(); setFocusedPanel(null); }}
            >
                <CenterPanel activeTarget={activeChatTarget} onTargetSelect={setActiveChatTarget} injection={chatInjection} />
            </div>

            {/* Slide Panel Overlay */}
            <SlidePanel
                isOpen={!!activePanel && !isWarping}
                title={activePanel || ''}
                onClose={() => setActivePanel(null)}
            >
                <PanelContent panelId={activePanel} onFlightMode={onFlightMode} />
            </SlidePanel>

            {/* Right Panel: Opens like a bay door */}
            <div
                className="w-[5%] h-full relative z-30"
                data-panel-trigger="true"
                onMouseEnter={() => !isWarping && setHoveredPanel('right')}
                onMouseLeave={() => setHoveredPanel(null)}
                onClick={(e) => { e.stopPropagation(); !isWarping && setFocusedPanel('right'); }}
            >
                <div
                    className="w-full h-full transition-all duration-[4000ms] cubic-bezier(0.4, 0, 0.2, 1) will-change-transform"
                    style={{
                        transform: getRightTransform(),
                        transformStyle: 'preserve-3d',
                        transformOrigin: 'center right',
                        opacity: isWarping ? 0 : ((focusedPanel === 'right' || hoveredPanel === 'right') ? 1 : 0.6)
                    }}
                >
                    <RightPanel activePanel={activePanel} onPanelSelect={handlePanelSelect} />
                </div>
            </div>
        </div>
    );
};
