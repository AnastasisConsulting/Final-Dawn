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
    executeInput: (text: string, isAutoPilotGenerated: boolean) => Promise<void>,
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
            let targetParams = "";
            const qData = QuestManager.getQuest(objectKey, autoPilot.affinity);

            if (activeQuest && activeQuest.status === 'active' && qData) {
                const target = QuestManager.getTargetDetails(qData, activeQuest.stepIndex);
                objective = QuestManager.getObjective(qData, activeQuest.stepIndex);
                if (target) targetParams = `CURRENT TARGET NPC: ${target.name} (ID: ${target.id})`;
            } else if (qData && (!activeQuest || activeQuest.status !== 'completed')) {
                objective = `NEW MISSION AVAILABLE: ${qData.title}. Seek out ${qData.cast.giver.name}.`;
                targetParams = `TARGET NPC: ${qData.cast.giver.name} (ID: ${qData.cast.giver.id})`;
            }

            const pickAction = () => {
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

            const action = pickAction();
            devLog("info", "beta.action", "action selected", { objective, targetParams, action });
            if (action && !isProcessing) {
                void executeInput(action, true);
            }
        };

        runBot();
    }, [autoPilot, isProcessing, messages, lastAutoAction, objectKey, gameState.quests, gameActions]);

    return { autoPilot, setAutoPilot };
}
