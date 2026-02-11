// hooks/useWorldGeneration.ts
import React, { useState } from 'react';
import { PlanetState, GenerationStatus, TransformData, PhaseStatus, LogEntry, PrimaryAttribute, Civilization } from '../types';
import { generatePlanetTexture, generateSingleCivilization, generateCivilizationNPCs, generateHistoryOnly } from '../services/geminiService';

interface UseWorldGenProps {
  planetState: PlanetState;
  setPlanetState: React.Dispatch<React.SetStateAction<PlanetState>>;
  prompt: string;
  seedData: TransformData | null;
  setPhaseStatus: React.Dispatch<React.SetStateAction<PhaseStatus>>;
  setStatus: React.Dispatch<React.SetStateAction<GenerationStatus>>;
  addLog: (msg: string, type: LogEntry['type']) => void;
  ensureWorldId: (forcedId?: string) => string;
}

export const useWorldGeneration = ({
    planetState, setPlanetState, prompt, seedData, setPhaseStatus, setStatus, addLog, ensureWorldId
}: UseWorldGenProps) => {

    const [activePhaseContext, setActivePhaseContext] = useState<{
        phase: 1 | 2 | 3;
        slotIndex?: number;
    } | null>(null);

    const [isAutoGenerating, setIsAutoGenerating] = useState(false);

    const handlePhase1 = async (refinementInstruction: string = ""): Promise<boolean> => {
        if (!process.env.API_KEY) { alert("API_KEY missing"); return false; }
        
        setStatus(GenerationStatus.GENERATING_VISUALS);
        setActivePhaseContext({ phase: 1 });
        const finalPrompt = refinementInstruction ? `${prompt}. Refinement: ${refinementInstruction}` : prompt;
        addLog(`Initiating Visual Scan: "${finalPrompt}"`, 'info');

        try {
            const textureUrl = await generatePlanetTexture(finalPrompt, seedData);
            setPlanetState(prev => ({
                ...prev, textureUrl,
                atmosphereColor: prompt.toLowerCase().includes('mars') ? '#ff4400' : '#0088ff'
            }));
            setPhaseStatus(prev => ({ ...prev, phase1Done: true }));
            setStatus(GenerationStatus.SUCCESS);
            addLog("Visuals Generated. Texture mapped.", 'success');
            return true;
        } catch (e: any) { 
            console.error(e); setStatus(GenerationStatus.ERROR); 
            addLog(`Visual Generation Failed: ${e.message}`, 'error');
            return false;
        }
    };

    const handlePhase2 = async (slot: number, refinementInstruction: string = ""): Promise<boolean> => {
        if (!process.env.API_KEY) return false;
        setStatus(GenerationStatus.GENERATING_LORE);
        setActivePhaseContext({ phase: 2, slotIndex: slot });
        addLog(`Generating Lore for Civ Slot ${slot}...`, 'info');

        try {
            const worldId = ensureWorldId(seedData?.Object_Key);
            const currentCivs = planetState.metadata?.civilizations || [];
            
            let history = planetState.metadata?.history;
            if (!history) {
                addLog("Generating Global History...", 'info');
                history = await generateHistoryOnly(prompt, seedData);
            }

            const attrs: PrimaryAttribute[] = ['STR', 'DEX', 'INT']; 
            const attr = attrs[slot - 1]; 
            const priorSummaries = currentCivs.map(c => c.summary);
            const effectivePrompt = refinementInstruction ? `${prompt}. Modifications: ${refinementInstruction}` : prompt;
            
            const newCiv = await generateSingleCivilization(worldId, slot, attr, priorSummaries, effectivePrompt, seedData);

            setPlanetState(prev => {
                const oldList = prev.metadata?.civilizations || [];
                const slots: Civilization[] = [null as any, null as any, null as any];
                
                oldList.forEach(c => {
                    const match = c.civId.match(/-C(\d+)$/);
                    if (match) {
                        const idx = parseInt(match[1]) - 1;
                        if (idx >= 0 && idx < 3) slots[idx] = c;
                    }
                });
                
                slots[slot - 1] = newCiv;

                return {
                    ...prev,
                    metadata: {
                        history: history || "",
                        civilizations: slots.filter(c => c !== null)
                    }
                };
            });

            setPhaseStatus(prev => {
                const next = [...prev.civ2Done] as [boolean, boolean, boolean];
                next[slot - 1] = true;
                return { ...prev, civ2Done: next };
            });
            
            setStatus(GenerationStatus.SUCCESS);
            addLog(`Civilization ${newCiv.name} established.`, 'success');
            return true;

        } catch (e: any) {
            console.error(e);
            setStatus(GenerationStatus.ERROR);
            addLog(`Lore Generation Failed: ${e.message}`, 'error');
            return false;
        }
    };

    const handlePhase3 = async (slot: number, refinementInstruction: string = ""): Promise<boolean> => {
        if (!process.env.API_KEY) return false;
        
        const worldId = planetState.ids?.node_key;
        if (!worldId) {
             addLog("Error: World ID missing.", 'error');
             return false;
        }
        
        const currentCivs = planetState.metadata?.civilizations || [];
        const targetSuffix = `-C${slot}`;
        const civ = currentCivs.find(c => c.civId.endsWith(targetSuffix));

        if (!civ) {
            addLog(`Error: Civilization ${slot} not found. Generate Lore first.`, 'error');
            return false;
        }

        setStatus(GenerationStatus.GENERATING_NPCS);
        setActivePhaseContext({ phase: 3, slotIndex: slot });
        addLog(`Populating ${civ.name} (NPCs & Quests)...`, 'info');

        try {
            const populatedCiv = await generateCivilizationNPCs(civ, seedData);
            
            setPlanetState(prev => {
                const oldList = prev.metadata?.civilizations || [];
                const newList = oldList.map(c => c.civId === populatedCiv.civId ? populatedCiv : c);
                return {
                    ...prev,
                    metadata: {
                        ...prev.metadata!,
                        civilizations: newList
                    }
                };
            });

            setPhaseStatus(prev => {
                const next = [...prev.civ3Done] as [boolean, boolean, boolean];
                next[slot - 1] = true;
                return { ...prev, civ3Done: next };
            });

            setStatus(GenerationStatus.SUCCESS);
            addLog(`Population & Quests generated for ${populatedCiv.name}.`, 'success');
            return true;

        } catch (e: any) {
            console.error(e);
            setStatus(GenerationStatus.ERROR);
            addLog(`NPC Generation Failed: ${e.message}`, 'error');
            return false;
        }
    };

    const handleAutoGenerate = async (currentPhaseStatus: PhaseStatus) => {
        if (isAutoGenerating) return;
        setIsAutoGenerating(true);
        addLog(">>> AUTO-GENERATION SEQUENCE INITIATED <<<", 'info');

        try {
            // 1. Phase 1 (Visuals)
            if (!currentPhaseStatus.phase1Done) {
                const success = await handlePhase1();
                if (!success) throw new Error("Auto-Gen halted at Phase 1.");
                await new Promise(r => setTimeout(r, 2000));
            }

            // 2. Phase 2 (Lore 1-3)
            for (let i = 1; i <= 3; i++) {
                // Check latest state from the parameter passed in via recursion or just check local var if React didn't update yet?
                // Actually, inside this async function, we need to be careful. 
                // We rely on checking the status passed into the function call? No, that's stale.
                // We must assume if we just ran it successfully, we can proceed.
                // But better to check the 'setPhaseStatus' result? No, we can't await state updates.
                
                // We will rely on our local flow execution, trusting that handlePhaseX returning true means it worked.
                
                // However, we need to check if we SHOULD skip it (if user did it manually before).
                // Since we don't have access to the *live* state inside this closure easily without Refs,
                // we will rely on a "skip if logically done" approach, but since we can't see the live state update immediately:
                // We will blindly execute the sequence if we started it. 
                
                // Better approach: We check the currentPhaseStatus at start. If it was false then, we do it.
                if (!currentPhaseStatus.civ2Done[i-1]) {
                    const success = await handlePhase2(i);
                    if (!success) throw new Error(`Auto-Gen halted at Civ ${i} Lore.`);
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

            // 3. Phase 3 (NPCs 1-3)
            for (let i = 1; i <= 3; i++) {
                if (!currentPhaseStatus.civ3Done[i-1]) {
                    const success = await handlePhase3(i);
                    if (!success) throw new Error(`Auto-Gen halted at Civ ${i} NPCs.`);
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

            addLog(">>> AUTO-GENERATION SEQUENCE COMPLETE <<<", 'success');

        } catch (e: any) {
            addLog(e.message, 'error');
        } finally {
            setIsAutoGenerating(false);
            setStatus(GenerationStatus.IDLE);
        }
    };

    return {
        handlePhase1,
        handlePhase2,
        handlePhase3,
        handleAutoGenerate,
        isAutoGenerating,
        activePhaseContext
    };
};