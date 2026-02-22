import { useState, useRef, useEffect } from 'react';
import { Message, ChatTarget, ChatSender } from '../../components/Features/Chat/ChatLog';
import { runTurn } from '../../services/orchestrator';
import { vizzyOrchestrator } from '../../src/services/VizzyOrchestrator';
import { devLog, devLogTimer } from '../../src/services/devLog';

export function useTurnExecution(
    state: any,
    gameState: any,
    gameActions: any,
    loadLocationFromAddress: any,
    ensureGlobalSession: any,
    generateMessageId: (prefix?: string) => string
) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init-1',
            sender: 'navbot',
            content: 'System initialized. Neural link established. Waiting for command.',
            type: 'text',
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const travelCountRef = useRef(0);
    const sessionIdRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (state.navContext.sessionId) {
            sessionIdRef.current = state.navContext.sessionId;
        }
    }, [state.navContext.sessionId]);

    const processTransaction = async (
        userText: string,
        targets: ChatTarget[],
        activeTarget: 'navbot' | 'vizzy' | 'lyra',
        objectKey: string,
        overrideSessionId?: string,
        overrideRecipients?: string[]
    ) => {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const userMsg: Message = {
            id: generateMessageId('user'),
            sender: 'user',
            content: userText,
            type: 'text',
            timestamp,
        };
        setMessages(prev => [...prev, userMsg]);
        setIsProcessing(true);
        gameActions.incrementTurn();

        // Vizzy scold check
        const scoldKeywords = ['drop it', 'bad dog', 'bad vizzy', 'caught you', 'stop stealing', 'burp it up'];
        if (scoldKeywords.some(kw => userText.toLowerCase().includes(kw))) {
            window.dispatchEvent(new CustomEvent('vizzy-shame'));
        }

        const inferRecipients = (text: string, requested: ChatTarget[]) => {
            const t = text.toLowerCase();
            const out: string[] = ["gm"];
            const wants = new Set((requested.length ? requested : [activeTarget]).map((x) => String(x).toLowerCase()));
            const named = (name: string) => t.includes(name.toLowerCase()) || t.startsWith(`/${name.toLowerCase()}`) || t.includes(`@${name.toLowerCase()}`);

            if (wants.has("lyra") && named("lyra")) out.push("lyra");
            if ((wants.has("navbot") || wants.has("nav")) && (named("navbot") || named("nav"))) out.push("nav");
            if (wants.has("vizzy") && named("vizzy")) out.push("vizzy");
            return out;
        };

        const activeRecipients = inferRecipients(userText, targets);

        try {
            const ensureSession = async () => {
                const existing = sessionIdRef.current || state.navContext.sessionId;
                if (existing) return existing;

                if (objectKey) {
                    const newId = await loadLocationFromAddress(objectKey);
                    if (newId) {
                        sessionIdRef.current = newId;
                        return newId;
                    }
                }
                const voidId = await ensureGlobalSession();
                if (voidId) sessionIdRef.current = voidId;
                return voidId;
            };

            const ensuredSessionId = overrideSessionId || await ensureSession();
            if (!ensuredSessionId) throw new Error("No active session. Please land at a location to initialize.");

            const ctx = {
                objectKey,
                travelCount: travelCountRef.current,
                quests: [],
                questStatuses: {},
                saga: 'default',
                book: 'Act1',
                chapter: 'C1',
                civId: state.navContext.civId,
                civIndex: state.navContext.civIndex ?? 0,
                cityId: state.navContext.cityId,
                locId: state.navContext.locId,
                cityIndex: state.navContext.cityIndex ?? 0,
                locIndex: state.navContext.locIndex ?? 0,
                sessionId: ensuredSessionId,
                llmConfig: gameState.settings.llm,
                flags: gameState.flags
            };

            const turnTimer = devLogTimer("turn", "runTurn", {
                sessionId: ensuredSessionId,
                objectKey,
                recipients: overrideRecipients || activeRecipients,
                llmConfig: gameState.settings.llm,
            });
            const out = await runTurn(userText, overrideRecipients || activeRecipients, ctx);
            turnTimer.end({ hasOutputs: !!out.outputs, toolCalls: out.tool_calls?.length ?? 0 });
            const resTime = new Date().toLocaleTimeString('en-US', { hour12: false });

            const outputs = out.outputs && out.outputs.length
                ? out.outputs
                : [{ id: activeRecipients[0], label: activeRecipients[0], markdown: out.response || '(no response)' }];

            let suggestionsBlock = '';
            let botIntent = '';
            const nextMessages: Message[] = [];

            const mapSender = (idOrLabel: string | undefined): Message['sender'] | null => {
                const key = (idOrLabel || '').toLowerCase();
                if (key === 'nav' || key === 'navbot') return 'navbot';
                if (key === 'lyra') return 'lyra';
                if (key === 'vizzy') return null; // SILENCED: User requested Vizzy never speaks
                if (key === 'gm') return 'gm';
                if (key === 'bot') return null; // Bot intent is captured separately
                return null;
            };

            for (const o of outputs) {
                const key = (o.id || o.label || '').toLowerCase();
                if (key === 'suggestions') {
                    suggestionsBlock = o.markdown || '';
                    continue;
                }
                if (key === 'bot') {
                    botIntent = o.markdown || '';
                    continue;
                }
                const sender = mapSender(o.id || o.label);
                if (!sender) continue;
                nextMessages.push({
                    id: generateMessageId(sender),
                    sender,
                    type: 'text',
                    timestamp: resTime,
                    content: o.markdown || '(no response)'
                });
            }

            if (suggestionsBlock) {
                const gmIdx = nextMessages.findIndex(m => m.sender === 'gm');
                if (gmIdx !== -1) {
                    nextMessages[gmIdx] = {
                        ...nextMessages[gmIdx],
                        content: `${nextMessages[gmIdx].content}\n\n=== SUGGESTIONS ===\n${suggestionsBlock}`
                    };
                }
            }

            if (nextMessages.length) setMessages(prev => [...prev, ...nextMessages]);
            if (out.tool_calls && out.tool_calls.length > 0) vizzyOrchestrator.processToolCalls(out.tool_calls);

            const chatContext = messages.slice(-10).map(m => `${m.sender}: ${m.content}`).join('\n');
            window.dispatchEvent(new CustomEvent('vizzy-chat-update', {
                detail: {
                    messages: chatContext + `\n${activeRecipients[0]}: (responding)`,
                    context: { npcs: [], lastAction: userText },
                },
            }));

            travelCountRef.current += 1;
            return { botIntent };
        } catch (err: any) {
            const resTime = new Date().toLocaleTimeString('en-US', { hour12: false });
            devLog("error", "turn", "runTurn failed", { err: String(err?.message || err) });
            setMessages(prev => [
                ...prev,
                {
                    id: generateMessageId('error'),
                    sender: activeRecipients[0] as ChatSender,
                    type: 'text',
                    timestamp: resTime,
                    content: `Comms error: ${String(err?.message || err)}`,
                },
            ]);
        } finally {
            setIsProcessing(false);
        }
    };

    return { messages, setMessages, isProcessing, setIsProcessing, processTransaction };
}
