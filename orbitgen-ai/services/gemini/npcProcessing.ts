// services/gemini/npcProcessing.ts
import { Civilization, City, Lieutenant, Governor, Quest, Leader } from "../../types";

export const processNpcData = (
    civ: Civilization,
    data: any
): Civilization => {
    // 1. SLOT: LEADER
    const leaderId = `${civ.civId}-LDR`;
    const leader: Leader = { id: leaderId, ...data.leader };

    // We store the objects themselves for easy retrieval by name
    const npcNameMap = new Map<string, Lieutenant>();
    const allSubordinates: Lieutenant[] = [];

    // 2. SLOTS: CITIES & REGIONS
    // We strictly iterate the existing cities (which are already keyed CT1..CT3)
    // and assign the AI data to them sequentially.
    const updatedCities: City[] = civ.cities.map((city, cIdx) => {
        
        // Governor Slot: CT{x}-GOV
        const govId = `${city.cityId}-GOV`;
        const govData = data.governors[cIdx] || { 
            name: `Governor of ${city.name}`, title: "Overseer", systemPrompt: "Maintain order.", subordinates: [] 
        };

        const lieutenants: Lieutenant[] = [];
        
        // Subordinate Slots: R{y}-NPC (linked to R{y} region)
        // We expect the AI to return a list of subordinates. We assign them to R1...R7
        for (let rIdx = 0; rIdx < 7; rIdx++) {
            const region = city.regionalLocales[rIdx]; // The region slot exists from Phase 2
            const npcId = `${region.regionId}-NPC`; // TEMPLATE KEY: C1-CT1-R1-NPC
            
            const subData = govData.subordinates && govData.subordinates[rIdx] 
                ? govData.subordinates[rIdx]
                : { name: `Citizen ${rIdx+1}`, role: "Resident", systemPrompt: "Live quietly." };

            const newSub: Lieutenant = {
                id: npcId,
                name: subData.name,
                role: subData.role,
                systemPrompt: subData.systemPrompt,
                governorId: govId,
                cityId: city.cityId,
                regionId: region.regionId,   // Implicit Link
                regionName: region.name,
                quests: []
            };

            // Map for Quest linking
            npcNameMap.set(subData.name.toLowerCase().trim(), newSub);
            
            lieutenants.push(newSub);
            allSubordinates.push(newSub);
        }

        const governor: Governor = {
            id: govId,
            name: govData.name,
            title: govData.title,
            systemPrompt: govData.systemPrompt,
            cityId: city.cityId,
            lieutenants: lieutenants
        };

        return { ...city, governor };
    });

    // 3. SLOTS: QUESTS
    // We assume 7 quests returned by AI.
    const quests: Quest[] = (data.quests || []).slice(0, 7).map((q: any, qIdx: number) => {
        const questId = `${civ.civId}-Q-${qIdx + 1}`;
        
        // Helper to pick a random subordinate distinct from a forbidden list
        const pickDistinctSub = (excludeIds: string[]): Lieutenant => {
            const pool = allSubordinates.filter(s => !excludeIds.includes(s.id));
            if (pool.length === 0) return allSubordinates[0]; // Should never happen given 21 subs
            return pool[Math.floor(Math.random() * pool.length)];
        };

        // Attempt to resolve IDs from names, or fallback to random distinct
        let giver = npcNameMap.get(q.giverSubordinateName?.toLowerCase().trim());
        if (!giver) giver = pickDistinctSub([]);
        
        let middle = npcNameMap.get(q.middleSubordinateName?.toLowerCase().trim());
        if (!middle || middle.id === giver.id) middle = pickDistinctSub([giver.id]);
        
        let completion = npcNameMap.get(q.completionSubordinateName?.toLowerCase().trim());
        if (!completion || completion.id === giver.id || completion.id === middle.id) {
            completion = pickDistinctSub([giver.id, middle.id]);
        }

        return {
            id: questId, name: q.name, description: q.description, steps: q.steps,
            status: 'QUEUED', currentCheckpoint: 0, primaryAttribute: civ.primaryAttribute,
            giverNpcId: giver.id, middleNpcId: middle.id, completionNpcId: completion.id,
            giverName: giver.name, middleName: middle.name, completionName: completion.name
        };
    });

    // Link Quests back to Givers
    updatedCities.forEach(city => {
        city.governor?.lieutenants.forEach(sub => {
            sub.quests = quests.filter(q => q.giverNpcId === sub.id);
        });
    });

    return { ...civ, leader, cities: updatedCities, quests };
};