// services/gemini/gridAllocator.ts
import { GridVoxel, City, RegionalLocale } from "../../types";

export const buildCivilizationGrid = (
  rawRegions: any[], 
  rawCities: any[]
): { grid: GridVoxel[], cities: City[] } => {
    
    // Ensure inputs are arrays
    const regionsList = Array.isArray(rawRegions) ? rawRegions : [];
    const citiesList = Array.isArray(rawCities) ? rawCities : [];

    // 1. Map Regions (ignore input position if present, we randomize below)
    const mappedRegions: RegionalLocale[] = regionsList.map(r => ({
        ...r,
        type: (r.tags && (r.tags.includes('Dungeon') || r.tags.includes('Dangerous'))) ? 'DUNGEON' : 'QUEST_LOCALE',
        description: r.summaryStub || "No description.",
        position: { x: 0, y: 0 } // Placeholder, updated below
    }));

    // 2. Generate all 49 coordinates (0,0 to 6,6)
    const allPositions: {x: number, y: number}[] = [];
    for (let x=0; x<7; x++) {
        for (let y=0; y<7; y++) {
            allPositions.push({x, y});
        }
    }

    // 3. Fisher-Yates Shuffle to randomize slot assignment
    for (let i = allPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
    }

    // 4. Allocate Slots
    // We need 3 slots for Cities
    // We need 21 slots for Regions
    // Total 24 slots. Remaining 25 are Wilderness.
    
    if (citiesList.length !== 3) throw new Error(`Must have exactly 3 cities (Got ${citiesList.length})`);
    if (mappedRegions.length !== 21) throw new Error(`Must have exactly 21 regions (Got ${mappedRegions.length})`);

    const citySlots = allPositions.slice(0, 3);
    const regionSlots = allPositions.slice(3, 24);
    const wildernessSlots = allPositions.slice(24);

    // 5. Construct Cities with assigned positions
    const cities: City[] = citiesList.map((c, idx) => {
        // Assign regions to this city (simple distribution: 7 per city)
        const cityRegions = mappedRegions.slice(idx * 7, (idx + 1) * 7);
        
        // Update regions with their coordinates from our shuffled list
        cityRegions.forEach((r, rIdx) => {
            const globalRIdx = idx * 7 + rIdx;
            r.position = regionSlots[globalRIdx];
            r.cityId = c.cityId; // Ensure link
        });

        return {
            ...c,
            description: c.summary,
            regionalLocales: cityRegions,
            governor: undefined // Filled in Phase 3
        };
    });

    // 6. Build Grid Array
    const grid: GridVoxel[] = [];

    // Add Cities to Grid
    cities.forEach((c, idx) => {
        const pos = citySlots[idx];
        grid.push({
            x: pos.x,
            y: pos.y,
            type: 'A',
            name: c.name,
            description: c.description
        });
    });

    // Add Regions to Grid
    cities.forEach(c => {
        c.regionalLocales.forEach(r => {
            grid.push({
                x: r.position.x,
                y: r.position.y,
                type: r.type === 'DUNGEON' ? 'B' : 'C',
                name: r.name,
                description: r.description,
                parentCity: c.name
            });
        });
    });

    // Add Wilderness to Grid
    wildernessSlots.forEach(pos => {
        grid.push({
            x: pos.x,
            y: pos.y,
            type: 'D',
            name: 'Wilderness',
            description: 'Untamed lands.'
        });
    });

    return { grid, cities };
};
