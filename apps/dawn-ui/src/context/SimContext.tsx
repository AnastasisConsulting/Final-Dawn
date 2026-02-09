import React, { createContext, useContext, useState, useEffect } from 'react';
import { UNIVERSE_DATA } from '../../../affinity-viz/constants'; // Relative import to other app
import { UniverseState, ViewLevel } from '../../../affinity-viz/types';

// Define context shape
interface SimContextValue {
    simState: UniverseState;
    economicScore: number;
    currentRegionName: string;
    updateSimState: (newState: UniverseState) => void;
}

const SimContext = createContext<SimContextValue | null>(null);

export const useSim = () => {
    const context = useContext(SimContext);
    if (!context) throw new Error('useSim must be used within SimProvider');
    return context;
};

export const SimProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initial state
    const [simState, setSimState] = useState<UniverseState>({
        currentLevel: ViewLevel.UNIVERSE,
        selectedGalaxyId: null,
        selectedSystemId: null,
        selectedPlanetId: null,
        selectedCityId: null,
        selectedDistrictId: null,
    });

    // Derived state
    const [economicScore, setEconomicScore] = useState<number>(1.0);
    const [currentRegionName, setCurrentRegionName] = useState<string>('Unknown Space');

    // Effect to calculate derived state when simState changes
    useEffect(() => {
        // Simple logic placeholder:
        // If in a city/civ, calculate economy based on type (STR/INT/DEX)
        // For now, random fluctuation based on ID hashing or similar deterministic logic
        // This is where we would hook into the actual Affinity Engine logic

        let score = 1.0;
        let name = 'Deep Space';

        if (simState.selectedPlanetId) {
            name = simState.selectedPlanetId;
            score = 1.0; // Baseline for planet
        }

        if (simState.selectedCityId) {
            name = simState.selectedCityId;
            // Example: "G1-S1-O1_c0-ct1" -> Parse civ index for modifier
            if (simState.selectedCityId.includes('_c0')) score = 1.2; // STR Civ (Corporate?)
            else if (simState.selectedCityId.includes('_c1')) score = 0.8; // INT Civ (Research?)
            else if (simState.selectedCityId.includes('_c2')) score = 0.9; // DEX Civ (Scrappers?)
        }

        setEconomicScore(score);
        setCurrentRegionName(name);

    }, [simState]);

    const updateSimState = (newState: UniverseState) => {
        setSimState(newState);
    };

    return (
        <SimContext.Provider value={{ simState, economicScore, currentRegionName, updateSimState }}>
            {children}
        </SimContext.Provider>
    );
};

