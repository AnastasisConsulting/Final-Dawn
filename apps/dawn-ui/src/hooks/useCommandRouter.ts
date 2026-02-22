import { useRef } from 'react';
import { Message, ChatTarget } from '../../components/Features/Chat/ChatLog';
import { devLog, devLogClear, devLogEnable } from '../../src/services/devLog';
import { getTotalXpForLevel } from 'eideus-xp-system';
import { QuestManager } from '../../src/services/QuestManager';

export function useCommandRouter(
    gameState: any,
    gameActions: any,
    messages: Message[],
    setMessages: any,
    setIsProcessing: any,
    setDevTerminalOpen: any,
    generateMessageId: (prefix?: string) => string,
    setAutoPilot: any,
    processTransaction: (userText: string, targets: ChatTarget[], activeTarget: 'navbot' | 'vizzy' | 'lyra', objectKey: string, overrideSessionId?: string, overrideRecipients?: string[]) => Promise<any>
) {
    const objectKeyRef = useRef<string>('');

    const executeInput = async (
        text: string,
        isAutoPilotGenerated: boolean = false,
        activeTarget: 'navbot' | 'vizzy' | 'lyra',
        objectKey: string,
        autoPilot: any,
        overrideRecipients?: string[]
    ) => {
        if (!text.trim()) return;
        objectKeyRef.current = objectKey;

        devLog("info", "center.executeInput", "input", { text, isAutoPilotGenerated });

        const blockedPrefixes = ['/beta-test', '/stop-bot', '/warp', '/tp', '/land', '/export'];
        if (isAutoPilotGenerated && blockedPrefixes.some(prefix => text.toLowerCase().startsWith(prefix))) {
            console.warn(`[CenterPanel] AutoPilot blocked from issuing meta-command: ${text}`);
            return;
        }

        if (text.startsWith('/beta-test ')) {
            const parts = text.split(' ');
            if (parts.length >= 3) {
                const cls = parts[1];
                const aff = parts[2];
                const limitArg = parts[3];
                const maxTurns = limitArg ? parseInt(limitArg, 10) : 0;
                devLogEnable(true);
                setDevTerminalOpen(true);
                setAutoPilot({ enabled: true, class: cls, affinity: aff, questsCompleted: 0, turnCount: 0, maxTurns, boldness: 50 });
                setMessages((prev: Message[]) => [...prev, {
                    id: generateMessageId('sys'),
                    sender: 'navbot' as const,
                    content: `>> BETA PROTOCOL INITIATED. CLASS: ${cls} // AFFINITY: ${aff}. LIMIT: ${maxTurns > 0 ? maxTurns : '∞'} TURNS. WARPING TO SECTOR 7...`,
                    type: 'text' as const,
                    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
                }]);
                await executeInput('/warp G1-S1-O7', false, activeTarget, objectKey, autoPilot);
                return;
            }
        }

        if (text.startsWith('/devlog')) {
            const arg = text.replace('/devlog', '').trim().toLowerCase();
            if (!arg || arg === 'toggle') { devLogEnable(true); setDevTerminalOpen((p: boolean) => !p); return; }
            if (arg === 'on') { devLogEnable(true); setDevTerminalOpen(true); return; }
            if (arg === 'off') { setDevTerminalOpen(false); return; }
            if (arg === 'clear') { devLogClear(); return; }
        }

        if (text === '/stop-bot') {
            setAutoPilot((prev: any) => ({ ...prev, enabled: false }));
            setMessages((prev: Message[]) => [...prev, {
                id: generateMessageId('sys'),
                sender: 'navbot' as const,
                content: `>> BETA PROTOCOL TERMINATED. MANUAL CONTROL RESUMED.`,
                type: 'text' as const,
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
            }]);
            return;
        }

        if (text === '/landing-game') {
            window.dispatchEvent(new CustomEvent('trigger-test-landing', {
                detail: {
                    id: 'TEST-LANDING',
                    name: 'Test Site Alpha',
                    address: 'G1-S1-O1-CIV1-CT1',
                    position: [0, 8000, 0],
                    velocity: [0, -50, 0],
                    heading: 0
                }
            }));
            setMessages((prev: Message[]) => [...prev, {
                id: generateMessageId('sys'),
                sender: 'navbot' as const,
                content: `>> INITIATING LANDING GAME SEQUENCE...`,
                type: 'text' as const,
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
            }]);
            return;
        }

        if (text === '/catch' || text === '/drop-it') {
            window.dispatchEvent(new CustomEvent('vizzy-shame'));
            setMessages((prev: Message[]) => [...prev, {
                id: generateMessageId('sys'),
                sender: 'navbot' as const,
                content: `>> VIZZY REPRIMANDED. COLOR PURGE INITIATED.`,
                type: 'text' as const,
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
            }]);
            return;
        }

        if (text === '/gift') {
            window.dispatchEvent(new CustomEvent('vizzy-logic-adopt', { detail: { panelId: 'center' } }));
            setMessages((prev: Message[]) => [...prev, {
                id: generateMessageId('sys'),
                sender: 'navbot' as const,
                content: `>> VIZZY BONDED WITH CENTER PANEL COLOR. PERMANENT ADOPTION REGISTERED.`,
                type: 'text' as const,
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
            }]);
            return;
        }

        if (text.startsWith('/help')) {
            const query = text.replace('/help', '').trim();
            if (!query) {
                const helpText = `Available Dev Commands:
- /help [QUESTION] : Ask the AI Game Manual a question directly.
- /beta-test [CLASS] [AFFINITY] : Start autonomous tester bot.
- /stop-bot : Stop the bot.
- /landing-game : Jump to Landing Game.
- /warp [ADDRESS] : Instant teleport.
- /telemetry : Display current player/bot state.
- /sim-combat [DIFF 1-10] : Simulate combat encounter.
- /force-level [LEVEL] : Set character level.
- /spawn-loot [RARITY] : Generate random loot.
- /export-logs : Download chat history.`;
                setMessages((prev: Message[]) => [...prev, {
                    id: generateMessageId('sys'),
                    sender: 'navbot' as const,
                    type: 'text' as const,
                    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                    content: `<pre class="text-xs font-mono bg-black/50 p-2 rounded border border-cyan-900">${helpText}</pre>`
                }]);
                return;
            }
            setMessages((prev: Message[]) => [...prev, {
                id: generateMessageId('user'),
                sender: 'user',
                content: `> /help ${query}`,
                type: 'text',
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
            }]);
            setIsProcessing(true);
            try {
                const res = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: 'llama3', prompt: `Roleplay as guide. Question: ${query}`, stream: false })
                });
                const data = await res.json();
                setMessages((prev: Message[]) => [...prev, {
                    id: generateMessageId('guide'),
                    sender: 'navbot' as const,
                    content: `[GUIDE]: ${data.response}`,
                    type: 'text' as const,
                    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
                }]);
            } catch (err) {
                setMessages((prev: Message[]) => [...prev, {
                    id: generateMessageId('err'),
                    sender: 'navbot' as const,
                    content: `[GUIDE ERROR]: Unable to contact manual database.`,
                    type: 'text' as const,
                    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
                }]);
            } finally { setIsProcessing(false); }
            return;
        }

        if (text === '/telemetry') {
            const stateDump = JSON.stringify({ location: objectKey, bot: autoPilot }, null, 2);
            setMessages((prev: Message[]) => [...prev, {
                id: generateMessageId('sys'),
                sender: 'navbot' as const,
                type: 'text' as const,
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                content: `>> TELEMETRY DUMP:\n<pre class="text-xs font-mono text-green-400">${stateDump}</pre>`
            }]);
            return;
        }

        if (text.startsWith('/sim-combat ')) {
            const diff = parseInt(text.split(' ')[1]) || 1;
            const xp = diff * 150;
            const killCount = Math.ceil(diff / 2);

            gameActions.gainXp(xp);
            gameActions.recordCombatResult(true);

            // Record some procedural kills for the ledger
            for (let i = 0; i < killCount; i++) {
                gameActions.recordKill('COMBAT', 'STANDARD', `SIM_DRONE_${i}`, objectKey);
            }

            setMessages((prev: Message[]) => [...prev, {
                id: generateMessageId('sys'),
                sender: 'lyra' as const,
                type: 'text' as const,
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                content: `<b>Combat Simulation (Diff ${diff})</b><br/>
                Status: <b>VICTORY</b><br/>
                Hostiles Neutralized: ${killCount}<br/>
                Combat XP: <b>${xp}</b><br/>
                Ledger Updated with SIM data.`
            }]);
            return;
        }

        if (text.startsWith('/spawn-loot')) {
            const parts = text.split(' ');
            const rarity = (parts[1] || 'RARE').toLowerCase() as any;
            const newItem = {
                id: `dev_loot_${Date.now()}`,
                name: `XENON ${rarity.toUpperCase()} CORE`,
                type: 'RESOURCE' as const,
                rarity: rarity,
                count: 1
            };
            gameActions.addItem(newItem);
            setMessages((prev: Message[]) => [...prev, {
                id: generateMessageId('sys'),
                sender: 'navbot' as const,
                content: `>> DEV OVERRIDE: INJECTING ${rarity.toUpperCase()} LOOT INTO MANIFEST.`,
                type: 'text' as const,
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
            }]);
            return;
        }

        if (text === '/export-logs') {
            const historyText = messages.map((m: Message) => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${m.content.replace(/<[^>]*>/g, '')}`).join('\n');
            const blob = new Blob([historyText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dawn-of-eideus-chat-${Date.now()}.txt`;
            a.click();
            URL.revokeObjectURL(url);

            setMessages((prev: Message[]) => [...prev, {
                id: generateMessageId('sys'),
                sender: 'navbot' as const,
                content: `>> EXPORTING CHAT HISTORY... DOWNLOAD TRIGGERED.`,
                type: 'text' as const,
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
            }]);
            return;
        }

        if (text === '/save') {
            localStorage.setItem('eideus-gamestate', JSON.stringify(gameState));
            setMessages((prev: Message[]) => [...prev, {
                id: generateMessageId('sys'),
                sender: 'navbot' as const,
                type: 'text' as const,
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                content: `>> GAME STATE SAVED.`
            }]);
            return;
        }

        if (text === '/reset-save') { localStorage.removeItem('eideus-gamestate'); location.reload(); return; }

        if (text.startsWith('/force-level ')) {
            const level = parseInt(text.split(' ')[1]) || 1;
            const targetXp = getTotalXpForLevel(level);
            const currentXp = gameState.xp || 0;
            if (targetXp > currentXp) {
                gameActions.gainXp(targetXp - currentXp);
                setMessages((prev: Message[]) => [...prev, {
                    id: generateMessageId('sys'),
                    sender: 'navbot' as const,
                    content: `>> OVERRIDE: CORE LEVEL SET TO [${level}].`,
                    type: 'text' as const,
                    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
                }]);
            }
            return;
        }

        // Default to turn transaction
        return await processTransaction(text, [], activeTarget, objectKey, undefined, overrideRecipients);
    };

    return { executeInput };
}
