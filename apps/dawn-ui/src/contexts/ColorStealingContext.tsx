import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { vizzyOrchestrator } from '../services/VizzyOrchestrator';

type PanelId = 'left' | 'center' | 'right';

interface PanelState {
    color: 'cyan' | 'green' | 'fuchsia';
    stolen: boolean;
    bonded: boolean; // Easter Egg: Permanently gifted to Vizzy
}

interface ColorStealingContextType {
    panelColors: Record<PanelId, PanelState>;
    isGuilty: boolean;
    stealColor: (panelId: PanelId) => void;
    returnColor: (panelId: PanelId) => void;
    adoptColor: (panelId: PanelId) => void;
    catchVizzy: () => void;
}

const DEFAULT_COLORS: Record<PanelId, PanelState> = {
    left: { color: 'cyan', stolen: false, bonded: false },
    center: { color: 'green', stolen: false, bonded: false },
    right: { color: 'fuchsia', stolen: false, bonded: false }
};

const ColorStealingContext = createContext<ColorStealingContextType | undefined>(undefined);

export const ColorStealingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [panelColors, setPanelColors] = useState<Record<PanelId, PanelState>>(DEFAULT_COLORS);
    const [isGuilty, setIsGuilty] = useState(false);
    const [lastSessionTime, setLastSessionTime] = useState<number>(Date.now());

    // Load state from localStorage on mount
    useEffect(() => {
        const storedColors = localStorage.getItem('panel-colors');
        const storedGuilty = localStorage.getItem('vizzy-is-guilty');
        const storedTime = localStorage.getItem('last-session-time');

        if (storedColors) setPanelColors(JSON.parse(storedColors));
        if (storedGuilty) setIsGuilty(JSON.parse(storedGuilty));
        if (storedTime) setLastSessionTime(parseInt(storedTime));

        // Start session tracking
        const interval = setInterval(() => {
            const now = Date.now();
            localStorage.setItem('last-session-time', now.toString());
            setLastSessionTime(now);
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Vizzy's Steal Logic
    const attemptSteal = useCallback(() => {
        if (isGuilty) return; // Already guilty

        const panels: PanelId[] = ['left', 'center', 'right'];
        const available = panels.filter(p => !panelColors[p].stolen);

        if (available.length === 0) return;

        // 30% chance to steal if not guilty
        if (Math.random() < 0.3) {
            const target = available[Math.floor(Math.random() * available.length)];
            stealColor(target);
        }
    }, [isGuilty, panelColors]);

    // Offline check on load: if > 6 hours, maybe steal
    useEffect(() => {
        const now = Date.now();
        const hoursOffline = (now - lastSessionTime) / (1000 * 60 * 60);

        if (hoursOffline > 6) {
            attemptSteal();
        }
    }, []); // Run once on mount after state load? Actually logic is tricky here due to async setPanelColors. 
    // Simplified: We rely on the random steal timer for online play mostly.

    // Online Steal Timer: Every 5 minutes, 10% chance
    useEffect(() => {
        const timer = setInterval(() => {
            if (Math.random() < 0.1) attemptSteal();
        }, 300000);
        return () => clearInterval(timer);
    }, [attemptSteal]);

    // Burp Mechanic: 5% chance every minute if guilty to return color
    useEffect(() => {
        if (!isGuilty) return;

        const timer = setInterval(() => {
            if (Math.random() < 0.05) {
                // Find stolen panel
                const stolenPanel = (Object.keys(panelColors) as PanelId[]).find(p => panelColors[p].stolen);
                if (stolenPanel) {
                    // Burp!
                    // TODO: Trigger Burp Animation via Orchestrator?
                    console.log('Vizzy burped the color back!');
                    returnColor(stolenPanel);
                }
            }
        }, 60000);
        return () => clearInterval(timer);
    }, [isGuilty, panelColors]);


    const stealColor = (panelId: PanelId) => {
        setPanelColors(prev => {
            const next = { ...prev, [panelId]: { ...prev[panelId], stolen: true } };
            localStorage.setItem('panel-colors', JSON.stringify(next));
            return next;
        });
        setIsGuilty(true);
        localStorage.setItem('vizzy-is-guilty', 'true');

        // Notify Vizzy
        // vizzyOrchestrator.triggerGuiltyState(panelColors[panelId].color); // Need to implement this in Orchestrator
        window.dispatchEvent(new CustomEvent('vizzy-steal', { detail: { color: panelColors[panelId].color } }));
    };

    const returnColor = (panelId: PanelId) => {
        setPanelColors(prev => {
            const next = { ...prev, [panelId]: { ...prev[panelId], stolen: false } };
            localStorage.setItem('panel-colors', JSON.stringify(next));
            return next;
        });
        setIsGuilty(false);
        localStorage.setItem('vizzy-is-guilty', 'false');

        window.dispatchEvent(new CustomEvent('vizzy-return-color'));
    };

    const adoptColor = (panelId: PanelId) => {
        setPanelColors(prev => {
            const next = { ...prev, [panelId]: { ...prev[panelId], stolen: false, bonded: true } };
            localStorage.setItem('panel-colors', JSON.stringify(next));
            return next;
        });
        setIsGuilty(false);
        localStorage.setItem('vizzy-is-guilty', 'false');
        window.dispatchEvent(new CustomEvent('vizzy-adopt', { detail: { color: panelColors[panelId].color } }));
    };

    const catchVizzy = useCallback(() => {
        if (!isGuilty) return;
        const stolenPanel = (Object.keys(panelColors) as PanelId[]).find(p => panelColors[p].stolen);
        if (stolenPanel) {
            returnColor(stolenPanel);
            // Trigger shame/burp animation
            window.dispatchEvent(new CustomEvent('vizzy-shame'));
            console.log('You caught Vizzy! He burped the color back.');
        }
    }, [isGuilty, panelColors, returnColor]);

    // AI-Triggered Steal/Return
    useEffect(() => {
        const handleAiSteal = (e: any) => {
            const { color, panelId } = e.detail;
            if (panelId) {
                stealColor(panelId as PanelId);
            } else {
                // If no panelId, find first available
                const panels: PanelId[] = ['left', 'center', 'right'];
                const target = panels.find(p => !panelColors[p].stolen);
                if (target) stealColor(target);
            }
        };

        const handleAiReturn = (e: any) => {
            const { panelId } = e.detail;
            if (panelId) {
                returnColor(panelId as PanelId);
            } else {
                // Return first stolen
                const stolenPanel = (Object.keys(panelColors) as PanelId[]).find(p => panelColors[p].stolen);
                if (stolenPanel) returnColor(stolenPanel);
            }
        };

        const handleShame = () => {
            catchVizzy();
        };

        const handleAiAdopt = (e: any) => {
            const { panelId } = e.detail;
            if (panelId) adoptColor(panelId as PanelId);
        };

        window.addEventListener('vizzy-logic-steal', handleAiSteal);
        window.addEventListener('vizzy-logic-return', handleAiReturn);
        window.addEventListener('vizzy-logic-adopt', handleAiAdopt);
        window.addEventListener('vizzy-shame', handleShame);
        return () => {
            window.removeEventListener('vizzy-logic-steal', handleAiSteal);
            window.removeEventListener('vizzy-logic-return', handleAiReturn);
            window.removeEventListener('vizzy-logic-adopt', handleAiAdopt);
            window.removeEventListener('vizzy-shame', handleShame);
        };
    }, [panelColors, stealColor, returnColor, adoptColor, catchVizzy]);


    return (
        <ColorStealingContext.Provider value={{ panelColors, isGuilty, stealColor, returnColor, adoptColor, catchVizzy }}>
            {children}
        </ColorStealingContext.Provider>
    );
};

export const useColorStealing = () => {
    const context = useContext(ColorStealingContext);
    if (!context) throw new Error("useColorStealing must be used within ColorStealingProvider");
    return context;
};
