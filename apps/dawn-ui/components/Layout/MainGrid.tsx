/**
 * UI STABILITY WARNING: 
 * This component defines the master layout (20/60/20 grid). 
 * DO NOT modify the dock widths (50px) or panel proportions. 
 * The professional, high-density layout must remain stable.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { CenterPanel } from '../Panels/CenterPanel';
import { RightPanel } from '../Panels/RightPanel';
import { LeftDock } from '../Panels/LeftDock';
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
    // Props passed through to CenterPanel
    activeChatTarget: 'navbot' | 'vizzy' | 'lyra';
    setActiveChatTarget: (t: 'navbot' | 'vizzy' | 'lyra') => void;
    chatInjection?: any;
    devTerminalOpen: boolean;
    setDevTerminalOpen: (open: boolean) => void;
}

export const MainGrid: React.FC<MainGridProps> = ({
    onFlightMode,
    landingPayload,
    onClearLandingPayload,
    activeChatTarget,
    setActiveChatTarget,
    chatInjection,
    devTerminalOpen,
    setDevTerminalOpen
}) => {
    const { state } = useKernel();
    const isWarping = state.isWarping;

    // Independent interaction states for Left and Right docks
    const [activeLeftPanel, setActiveLeftPanel] = useState<string | null>(null);
    const [activeRightPanel, setActiveRightPanel] = useState<string | null>(null);

    // Hover/Focus states for visual feedback
    const [hoveredPanel, setHoveredPanel] = useState<'left' | 'right' | null>(null);

    // Chat Injection Logic (preserved from previous implementation)
    useEffect(() => {
        if (!landingPayload) return;
        // Close panels on landing
        setActiveLeftPanel(null);
        setActiveRightPanel(null);

        const t = window.setTimeout(() => onClearLandingPayload?.(), 50);
        return () => window.clearTimeout(t);
    }, [landingPayload, onClearLandingPayload]);

    // Handlers
    const handleLeftPanelSelect = (panelId: string) => {
        // Warp Handoff: Trigger Flight Mode directly instead of opening a panel
        if (panelId === 'FLIGHT') {
            onFlightMode();
            return;
        }

        setActiveLeftPanel(prev => prev === panelId ? null : panelId);
        // Mutual Exclusion: Close right panel when opening left
        if (panelId !== activeLeftPanel) {
            setActiveRightPanel(null);
        }
    };

    const handleRightPanelSelect = (panelId: string) => {
        setActiveRightPanel(prev => prev === panelId ? null : panelId);
        // Mutual Exclusion: Close left panel when opening right
        if (panelId !== activeRightPanel) {
            setActiveLeftPanel(null);
        }
    };

    const handleBackgroundClick = () => {
        // Optional: Click background to close panels?
        // setActiveLeftPanel(null);
        // setActiveRightPanel(null);
    };

    // WARP ANIMATION STYLES

    const getLeftDockTransform = () => {
        if (isWarping) return 'translateX(-200%)';
        return 'translateX(0)';
    };

    const getRightDockTransform = () => {
        if (isWarping) return 'translateX(200%)';
        return 'translateX(0)';
    };

    const getCenterStyle = (): React.CSSProperties => {
        if (isWarping) {
            return {
                transform: 'scale(0.8) translateZ(-800px)',
                opacity: 0,
                filter: 'blur(10px)',
                transition: 'all 2000ms cubic-bezier(0.4, 0, 0.2, 1)'
            };
        }
        return {
            transform: 'translateZ(0)',
            opacity: 1,
            filter: 'none',
            transition: 'all 1500ms cubic-bezier(0.4, 0, 0.2, 1)'
        };
    };

    return (
        <div
            className="relative flex flex-row w-full h-full overflow-hidden"
            style={{ perspective: '1600px' }}
            onClick={handleBackgroundClick}
        >
            {/* --- LEFT ZONE (20%) --- */}
            <div className="w-[20%] min-w-[20%] max-w-[20%] h-full relative flex flex-row z-30 shrink-0">
                {/* DOCK (Fixed 50px) */}
                <div
                    className="w-[50px] h-full relative z-30"
                    onMouseEnter={() => !isWarping && setHoveredPanel('left')}
                    onMouseLeave={() => setHoveredPanel(null)}
                >
                    <div
                        className="w-full h-full transition-all duration-[2000ms] cubic-bezier(0.4, 0, 0.2, 1) will-change-transform"
                        style={{
                            transform: getLeftDockTransform(),
                            opacity: isWarping ? 0 : 1
                        }}
                    >
                        <LeftDock activePanel={activeLeftPanel} onPanelSelect={handleLeftPanelSelect} />
                    </div>
                </div>

                {/* PANEL AREA (Remaining 20% Zone) */}
                <div className="flex-1 h-full relative z-20 pointer-events-none">
                    <SlidePanel
                        isOpen={!!activeLeftPanel && !isWarping}
                        title={activeLeftPanel || ''}
                        onClose={() => setActiveLeftPanel(null)}
                        side="left"
                        layout="flex"
                    >
                        <PanelContent panelId={activeLeftPanel} onFlightMode={onFlightMode} onPanelChange={handleLeftPanelSelect} />
                    </SlidePanel>
                </div>
            </div>

            {/* --- CENTER ZONE (60%) --- */}
            <div
                className="w-[60%] min-w-[60%] max-w-[60%] h-full relative z-10 px-1 shrink-0"
                style={getCenterStyle()}
            >
                <CenterPanel
                    activeTarget={activeChatTarget}
                    onTargetSelect={setActiveChatTarget}
                    injection={chatInjection}
                    devTerminalOpen={devTerminalOpen}
                    setDevTerminalOpen={setDevTerminalOpen}
                />
            </div>

            {/* --- RIGHT ZONE (20%) --- */}
            <div className="w-[20%] min-w-[20%] max-w-[20%] h-full relative flex flex-row-reverse z-30 shrink-0">
                {/* DOCK (Fixed 50px) */}
                <div
                    className="w-[50px] h-full relative z-30"
                    onMouseEnter={() => !isWarping && setHoveredPanel('right')}
                    onMouseLeave={() => setHoveredPanel(null)}
                >
                    <div
                        className="w-full h-full transition-all duration-[2000ms] cubic-bezier(0.4, 0, 0.2, 1) will-change-transform"
                        style={{
                            transform: getRightDockTransform(),
                            opacity: isWarping ? 0 : 1
                        }}
                    >
                        <RightPanel
                            activePanel={activeRightPanel}
                            onPanelSelect={handleRightPanelSelect}
                            devTerminalOpen={devTerminalOpen}
                            setDevTerminalOpen={setDevTerminalOpen}
                        />
                    </div>
                </div>

                {/* PANEL AREA (Remaining 20% Zone) */}
                <div className="flex-1 h-full relative z-20 pointer-events-none">
                    <SlidePanel
                        isOpen={!!activeRightPanel && !isWarping}
                        title={activeRightPanel || ''}
                        onClose={() => setActiveRightPanel(null)}
                        side="right"
                        layout="flex"
                    >
                        <PanelContent panelId={activeRightPanel} onFlightMode={onFlightMode} onPanelChange={handleRightPanelSelect} />
                    </SlidePanel>
                </div>
            </div>
        </div>
    );
};
