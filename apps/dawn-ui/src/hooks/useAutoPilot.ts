import { useState, useEffect, useRef } from 'react';
import { Message } from '../../components/Features/Chat/ChatLog';
import { QuestManager } from '../services/QuestManager';
import { devLog } from '../services/devLog';

export interface AutoPilotState {
    enabled: boolean;
    class: string;
    affinity: string;
    questsCompleted: number;
    turnCount: number;
    maxTurns: number;
    boldness: number;
}

export function useAutoPilot(
    isProcessing: boolean,
    messages: Message[],
    objectKey: string,
    gameState: any,
    gameActions: any,
    executeInput: (text: string, isAutoPilotGenerated: boolean, activeTarget?: any, objectKey?: string, autoPilot?: any, overrideRecipients?: string[], silent?: boolean) => Promise<any>,
    generateMessageId: (prefix?: string) => string
) {
    const [autoPilot, setAutoPilot] = useState<AutoPilotState>(() => {
        const saved = localStorage.getItem('eideus-autopilot');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return {
                    enabled: false,
                    class: parsed.class || '',
                    affinity: parsed.affinity || '',
                    questsCompleted: parsed.questsCompleted || 0,
                    turnCount: 0,
                    maxTurns: 0,
                    boldness: parsed.boldness ?? 50
                };
            } catch (e) {
                console.error("Failed to parse saved autopilot state", e);
            }
        }
        return { enabled: false, class: '', affinity: '', questsCompleted: 0, turnCount: 0, maxTurns: 0, boldness: 50 };
    });

    const [lastAutoAction, setLastAutoAction] = useState(0);

    useEffect(() => {
        localStorage.setItem('eideus-autopilot', JSON.stringify(autoPilot));
    }, [autoPilot]);

    useEffect(() => {
        if (!autoPilot.enabled || isProcessing) return;

        if (autoPilot.maxTurns > 0 && autoPilot.turnCount >= autoPilot.maxTurns) {
            setAutoPilot(prev => ({ ...prev, enabled: false }));
            const sysMsg = {
                id: generateMessageId('sys'),
                sender: 'navbot' as const,
                content: `>> BETA TEST COMPLETE. LIMIT REACHED (${autoPilot.maxTurns} TURNS).`,
                type: 'text' as const,
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
            };
            // We can't directly setMessages here, but we could return it or use an event
            window.dispatchEvent(new CustomEvent('sys-message', { detail: sysMsg }));
            return;
        }

        const timeSinceLastAct = Date.now() - lastAutoAction;
        if (timeSinceLastAct < 7000) return;

        const lastMsg = messages[messages.length - 1];
        if (!lastMsg) return;

        const npcSenders = ['navbot', 'vizzy', 'lyra', 'gm', 'npc'];
        if (!npcSenders.includes(lastMsg.sender.toLowerCase())) return;
        if (lastMsg.content.includes('QUANTUM JUMP') || lastMsg.content.includes('BETA PROTOCOL')) return;

        const runBot = async () => {
            setLastAutoAction(Date.now());
            setAutoPilot(prev => ({ ...prev, turnCount: prev.turnCount + 1 }));
            gameActions.incrementTurn();

            const questId = `${objectKey}-${autoPilot.affinity}`;
            const activeQuest = gameState.quests?.[questId];
            let objective = "Explore the area. Look for opportunities.";
            const qData = QuestManager.getQuest(objectKey, autoPilot.affinity);

            if (activeQuest && activeQuest.status === 'active' && qData) {
                objective = QuestManager.getObjective(qData, activeQuest.stepIndex);
            } else if (qData && (!activeQuest || activeQuest.status !== 'completed')) {
                objective = `NEW MISSION AVAILABLE: ${qData.title}. Seek out ${qData.cast.giver.name}.`;
            }

            // Fallback Heuristic
            const pickActionFallback = () => {
                const cleanObjective = String(objective || "").replace(/<[^>]*>/g, "").trim();
                const tgt = qData && activeQuest && activeQuest.status === 'active'
                    ? QuestManager.getTargetDetails(qData, activeQuest.stepIndex)
                    : qData?.cast?.giver;

                if (tgt?.name && qData?.title) return `I call out to ${tgt.name}, asking about ${qData.title}.`;
                if (cleanObjective.toLowerCase().includes("scan")) return "I rescan the area for any readable signage, terminals, or names.";
                if (autoPilot.boldness > 70) return "I push deeper into the loudest, most restricted-looking corridor and see who stops me.";
                if (autoPilot.boldness < 30) return "I keep my distance and quietly observe the nearest group, listening for useful details.";
                return "I look around for someone in charge and ask what's going on here.";
            };

            if (!isProcessing) {
                try {
                    // 1. Ask Orchestrator for Intent
                    const cleanObj = String(objective || "").replace(/\(.*\)/g, "").trim();
                    const query = `[BETA_BOT]: [PNS_OVERRIDE]: OBJECTIVE: ${cleanObj} | STATUS: HEROIC_MOMENTUM | ACTION_PREDICTION_REQUESTED`;
                    const result = await (executeInput as any)(query, true, undefined, undefined, undefined, ['bot'], true);

                    if (result && result.botIntent) {
                        const raw = String(result.botIntent);

                        // --- Stage 1: Strip memory contamination (| x-: and everything after) ---
                        const decontaminated = raw.split(/\s*\|\s*x-:/)[0].trim();

                        // --- Stage 2: Strip all === SECTION === blocks entirely ---
                        const noSections = decontaminated
                            .replace(/={2,}\s*\[?[A-Z0-9_ :\-]+\]?\s*={2,}[\s\S]*?(?=={2,}|$)/gi, '')
                            .trim();

                        // --- Stage 3: Extract candidate lines ---
                        const lines = noSections
                            .split('\n')
                            .map(l => l.trim())
                            // Remove markdown bold/italic markers, RECIPIENTS, bullets, asterisks
                            .map(l => l.replace(/^\*+\s*/, '').replace(/\*+$/g, '').replace(/^\d+\.\s+/, ''))
                            .filter(l => l.length > 8 && l.length < 220);

                        // --- Stage 4: LLM meta-preamble rejection patterns ---
                        const junkStarters = [
                            /^as the\s+(gm|beta_bot|bot|player|narrator)/i,
                            /^based on (your|the|my)/i,
                            /^here('?s| is) my/i,
                            /^i('?ll|'?m going to) respond/i,
                            /^i will (continue|respond|provide)/i,
                            /^please let me know/i,
                            /^what would you like/i,
                            /^the (gm|narrat|world|eideus)/i,
                            /^you (decide|notice|see|move|navigate|hear)/i,
                            /^recipients:/i,
                            /^\*\*(gm|nav|bot)\*\*/i,
                        ];

                        const isJunk = (line: string) => junkStarters.some(rx => rx.test(line));

                        // Prefer a line starting with "I " that isn't junk
                        const actionLine = lines.find(l => /^I\s+[a-z]/i.test(l) && !isJunk(l));
                        // As last resort, take first non-junk line
                        const fallbackLine = lines.find(l => !isJunk(l));
                        const finalAction = actionLine || fallbackLine || null;

                        if (finalAction && !isJunk(finalAction)) {
                            devLog("info", "beta.action", "orchestrator intent received", { action: finalAction });
                            void executeInput(finalAction, true, undefined, undefined, undefined, undefined, false);
                        } else {
                            // 2. Fallback to Heuristic
                            const action = pickActionFallback();
                            devLog("info", "beta.action", "heuristic fallback (bad intent)", { action });
                            void executeInput(action, true);
                        }
                    } else {
                        // 2. Fallback to Heuristic
                        const action = pickActionFallback();
                        devLog("info", "beta.action", "heuristic fallback", { action });
                        void executeInput(action, true);
                    }
                } catch (err) {
                    const action = pickActionFallback();
                    devLog("error", "beta.action", "orchestrator intent failed, using fallback", { err: String(err) });
                    void executeInput(action, true);
                }
            }
        };

        runBot();
    }, [autoPilot, isProcessing, messages, lastAutoAction, objectKey, gameState.quests, gameActions]);

    return { autoPilot, setAutoPilot };
}
