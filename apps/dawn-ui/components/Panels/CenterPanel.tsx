// Final_Dawn_of_Eideus/apps/dawn-ui/components/Panels/CenterPanel.tsx

import React, { useState, useEffect, useRef } from 'react';
import { ChatLog, ChatTarget, Message } from '../Features/Chat/ChatLog';
import { InputConsole } from '../Features/Chat/InputConsole';
import { CommandDeck } from '../Features/Chat/CommandDeck';
import { runTurn } from '../../services/orchestrator';
import { vizzyOrchestrator } from '../../src/services/VizzyOrchestrator';
import { useKernel } from '../../hooks/useKernel';
import { getDefaultLocationId } from 'eideus-routers';
import { getTotalXpForLevel } from 'eideus-xp-system';
import { useColorStealing } from '../../src/contexts/ColorStealingContext';

import { useGame } from '../../src/context/GameContext';
import { QuestManager } from '../../src/services/QuestManager';

const getDefaultAddress = () => {
  return getDefaultLocationId();
};

interface CenterPanelProps {
  activeTarget: 'navbot' | 'vizzy' | 'lyra';
  onTargetSelect: (target: 'navbot' | 'vizzy' | 'lyra') => void;
  injection?: {
    id: number;
    targetName: string;
    targetAddress?: string;
    landingNarration: string;
    openingScene: string;
  } | null;
}

// Global log accessor for CrashBoundary
declare global {
  interface Window {
    __LATEST_CHAT_LOGS?: Message[];
  }
}

export const CenterPanel: React.FC<CenterPanelProps> = ({ activeTarget, onTargetSelect, injection }) => {
  const { state, dispatch, loadLocationFromAddress, ensureGlobalSession } = useKernel();
  const { state: gameState, actions: gameActions } = useGame();
  const isWarping = state.isWarping;
  const { panelColors } = useColorStealing();
  const centerColor = panelColors.center;

  // Message ID counter to ensure globally unique IDs
  const messageIdCounter = useRef(0);
  const generateMessageId = (prefix: string = 'msg') => {
    messageIdCounter.current += 1;
    return `${prefix}-${Date.now()}-${messageIdCounter.current}`;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'navbot',
      content: 'System initialized. Neural link established. Waiting for command.',
      type: 'text',
      timestamp: '08:00:01'
    }
  ]);

  // Sync messages to global scope for CrashBoundary
  useEffect(() => {
    window.__LATEST_CHAT_LOGS = messages;
  }, [messages]);

  const lastInjectionId = useRef<number | null>(null);

  useEffect(() => {
    if (!injection) return;
    if (lastInjectionId.current === injection.id) return;
    lastInjectionId.current = injection.id;

    // We push two narration packets: landing confirmation + opening scene hook.
    const stamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setMessages(prev => [
      ...prev,
      {
        id: `${injection.id}-land`,
        sender: 'lyra',
        type: 'text',
        timestamp: stamp,
        content: `Landing at <b>${injection.targetName}</b>:<br/>${injection.landingNarration}`,
      },
      {
        id: `${injection.id}-scene`,
        sender: 'lyra',
        type: 'text',
        timestamp: stamp,
        content: `<b>Opening Scene</b><br/>${injection.openingScene}`,
      },
    ]);
  }, [injection]);

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const travelCountRef = useRef(0);
  const objectKeyRef = useRef<string>(getDefaultAddress());
  const [selectedTargets, setSelectedTargets] = useState<ChatTarget[]>(['navbot']);

  // Tying session ID to a ref to avoid closure staleness during rapid interactions
  const sessionIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.navContext.sessionId) {
      sessionIdRef.current = state.navContext.sessionId;
    }
  }, [state.navContext.sessionId]);

  useEffect(() => {
    setSelectedTargets((prev) => {
      if (prev.includes(activeTarget)) return prev;
      return [activeTarget, ...prev].slice(0, 3);
    });
  }, [activeTarget]);

  const toggleTarget = (target: ChatTarget) => {
    const isActive = selectedTargets.includes(target);
    setSelectedTargets((prev) => {
      if (isActive) {
        return prev.filter((t) => t !== target);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, target];
    });
    if (!isActive) {
      onTargetSelect(target);
    }
  };

  useEffect(() => {
    // If Flight-One hands us a landing payload, use it as the current object key.
    if (injection?.targetAddress || injection?.targetName) {
      objectKeyRef.current = injection.targetAddress || injection.targetName;
      travelCountRef.current = 0; // force a session reset on first turn after landing
    }
  }, [injection?.targetAddress, injection?.targetName]);

  useEffect(() => {
    if (state.address.full) {
      objectKeyRef.current = state.address.full;
    }
  }, [state.address.full]);



  const isLiveActive = false;
  const isLiveSpeaking = false;
  const toggleLive = () => { };

  // --- Auto-Pilot Logic ---
  const [autoPilot, setAutoPilot] = useState(() => {
    // 1. Try to load from local storage on mount
    const saved = localStorage.getItem('eideus-autopilot');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure new fields exist
        return {
          enabled: false,
          class: parsed.class || '',
          affinity: parsed.affinity || '',
          questsCompleted: parsed.questsCompleted || 0,
          turnCount: 0,
          maxTurns: 0,
          boldness: parsed.boldness ?? 50 // 0-100, default balanced
        };
      } catch (e) {
        console.error("Failed to parse saved autopilot state", e);
      }
    }
    return { enabled: false, class: '', affinity: '', questsCompleted: 0, turnCount: 0, maxTurns: 0, boldness: 50 };
  });

  const [lastAutoAction, setLastAutoAction] = useState(0);

  // 2. Auto-Save Effect
  useEffect(() => {
    localStorage.setItem('eideus-autopilot', JSON.stringify(autoPilot));
  }, [autoPilot]);

  // Auto-Pilot Decision Loop
  useEffect(() => {
    if (!autoPilot.enabled || isProcessing) return;

    // Check Turn Limit
    if (autoPilot.maxTurns > 0 && autoPilot.turnCount >= autoPilot.maxTurns) {
      setAutoPilot(prev => ({ ...prev, enabled: false }));
      setMessages(prev => [...prev, {
        id: generateMessageId('sys'),
        sender: 'navbot',
        content: `>> BETA TEST COMPLETE. LIMIT REACHED (${autoPilot.maxTurns} TURNS).`,
        type: 'text',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }]);
      return;
    }

    // Throttle: Don't act too fast
    const timeSinceLastAct = Date.now() - lastAutoAction;
    if (timeSinceLastAct < 7000) return;

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;

    // SAFEGUARD: The bot should only decide its NEXT move after an NPC speaks.
    // We ignore system messages, user messages, and our own previous bot messages (if we can detect them).
    const npcSenders = ['navbot', 'vizzy', 'lyra', 'gm', 'npc'];
    if (!npcSenders.includes(lastMsg.sender.toLowerCase())) return;

    // Avoid reacting if the last message was a meta-error or system warp message
    if (lastMsg.content.includes('QUANTUM JUMP') || lastMsg.content.includes('BETA PROTOCOL')) return;

    const runBot = async () => {
      setLastAutoAction(Date.now());
      // Increment turn count immediately when we decide to act
      setAutoPilot(prev => ({ ...prev, turnCount: prev.turnCount + 1 }));
      gameActions.incrementTurn(); // Global Turn Counter

      console.log(`[AutoPilot] Deciding move ${autoPilot.turnCount + 1}/${autoPilot.maxTurns || '∞'}... Boldness: ${autoPilot.boldness}`);

      // Quest Logic
      // Construct a Quest ID based on location and affinity (assuming 1 quest per loc/affinity for now)
      const questId = `${objectKeyRef.current}-${autoPilot.affinity}`;
      const activeQuest = gameState.quests?.[questId];

      let objective = "Explore the area. Look for opportunities.";
      let targetParams = "";

      // Look up static data
      const qData = QuestManager.getQuest(objectKeyRef.current, autoPilot.affinity);

      if (activeQuest && activeQuest.status === 'active' && qData) {
        const target = QuestManager.getTargetDetails(qData, activeQuest.stepIndex);
        objective = QuestManager.getObjective(qData, activeQuest.stepIndex);
        if (target) {
          targetParams = `CURRENT TARGET NPC: ${target.name} (ID: ${target.id})`;
        }
      } else if (qData && (!activeQuest || activeQuest.status !== 'completed')) {
        objective = `NEW MISSION AVAILABLE: ${qData.title}. Seek out ${qData.cast.giver.name}.`;
        targetParams = `TARGET NPC: ${qData.cast.giver.name} (ID: ${qData.cast.giver.id})`;
      }

      // Boldness behavior injection
      const boldnessDirective = autoPilot.boldness < 30
        ? 'Be CAUTIOUS. Avoid risky actions. Prefer safe, defensive choices.'
        : autoPilot.boldness > 70
          ? 'Be BOLD! Take risks. Push boundaries. Pursue aggressive exploration.'
          : 'Balance risk and reward. Act thoughtfully but don\'t shy from opportunity.';

      const prompt = `
        You are an autonomous player agent speed-running Eideus Dawn.
        Role: Level 1 ${autoPilot.class} [${autoPilot.affinity}].
        Goal: COMPLETE QUESTS. ACQUIRE LOOT. PROGRESS.

        Current Location: ${objectKeyRef.current}
        Current Objective: ${objective}
        ${targetParams}
        
        Boldness Setting: ${autoPilot.boldness}/100

        Last Message:
        "${lastMsg.sender.toUpperCase()}: ${lastMsg.content.replace(/<[^>]*>/g, '')}"

        INSTRUCTIONS:
        1. DECIDE an immediate action based on the last message.
        2. PRIORITIZE the Current Objective and Target NPC.
        3. IF the objective is to find a specific NPC, try to "scan for" or "call out to" them.
        4. IF a quest is offered, ACCEPT IT.
        5. IF in combat, ATTACK or USE SKILL.
        6. IF stuck or bored, warp to a neighbor system using "/warp G1-S1-O[1-7]".
        7. DO NOT be passive. DO NOT "reflect" or "think". ACT.
        
        OUTPUT FORMAT:
        - Output ONLY the action string.
        - Examples: "I approach Overseer Prime and ask about the anomaly.", "I accept the job.", "I detailed scan the area.", "/warp G1-S1-O2"
        - NO Markdown. NO explanations.
      `;

      try {
        // Try to fetch from the configured model, fallback to a 4B-friendly one if needed
        const modelToUse = 'llama3'; // User specified 4B, but llama3 is their current target.

        const res = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelToUse,
            prompt,
            stream: false,
            options: { temperature: 0.8, top_p: 0.9, num_predict: 64 }
          })
        });
        const data = await res.json();
        const action = data.response.trim();

        if (action && !isProcessing) {
          console.log('[AutoPilot] Action:', action);
          void executeInput(action, true);
        }
      } catch (err) {
        console.error('[AutoPilot] Connection failed:', err);
      }
    };

    runBot();
  }, [autoPilot.enabled, isProcessing, messages, lastAutoAction, autoPilot.class, autoPilot.affinity, autoPilot.maxTurns, autoPilot.turnCount]);

  const processTransaction = async (userText: string, targets: ChatTarget[], overrideSessionId?: string) => {
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
    gameActions.incrementTurn(); // Global Turn Counter

    // VIZZY "DROP IT" CHECK: If the player scolds Vizzy, try to trigger a burp
    const scoldKeywords = ['drop it', 'bad dog', 'bad vizzy', 'caught you', 'stop stealing', 'burp it up'];
    if (scoldKeywords.some(kw => userText.toLowerCase().includes(kw))) {
      console.log('[CenterPanel] Player caught Vizzy stealing!');
      window.dispatchEvent(new CustomEvent('vizzy-shame'));
      // We still process the turn, but we've pre-emptively triggered the shame animation
    }

    const activeRecipients = targets.length ? targets : [activeTarget];

    try {
      const ensureSession = async () => {
        const existing = sessionIdRef.current || state.navContext.sessionId;
        if (existing) return existing;

        const keyToTry = state.address.full || objectKeyRef.current;
        if (keyToTry) {
          const newId = await loadLocationFromAddress(keyToTry);
          if (newId) {
            sessionIdRef.current = newId;
            return newId;
          }
        }

        // Fallback to global/void session
        const voidId = await ensureGlobalSession();
        if (voidId) sessionIdRef.current = voidId;
        return voidId;
      };

      const ensuredSessionId = overrideSessionId || await ensureSession();
      if (!ensuredSessionId) {
        throw new Error("No active session. Please land at a location to initialize.");
      }

      const resolvedObjectKey = state.address.full || objectKeyRef.current;

      const ctx = {
        objectKey: resolvedObjectKey,
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
      };

      for (const recipient of activeRecipients) {
        const out = await runTurn(userText, recipient, ctx);
        const resTime = new Date().toLocaleTimeString('en-US', { hour12: false });
        const aiResponse: Message = {
          id: generateMessageId(recipient),
          sender: recipient,
          type: 'text',
          timestamp: resTime,
          content: out.response || '(no response)',
        };
        setMessages(prev => [...prev, aiResponse]);

        // Process Vizzy tool calls if present
        if (out.tool_calls && out.tool_calls.length > 0) {
          console.log('[CenterPanel] Processing', out.tool_calls.length, 'tool calls');
          vizzyOrchestrator.processToolCalls(out.tool_calls);
        }
      }

      // Trigger Vizzy procedural animation update
      const chatContext = messages.slice(-10).map(m => `${m.sender}: ${m.content}`).join('\n');
      window.dispatchEvent(new CustomEvent('vizzy-chat-update', {
        detail: {
          messages: chatContext + `\n${activeRecipients[0]}: (responding)`,
          context: { npcs: [], lastAction: userText },
        },
      }));

      travelCountRef.current += 1;
    } catch (err: any) {
      const resTime = new Date().toLocaleTimeString('en-US', { hour12: false });
      setMessages(prev => [
        ...prev,
        {
          id: generateMessageId('error'),
          sender: activeRecipients[0],
          type: 'text',
          timestamp: resTime,
          content: `Comms error: ${String(err?.message || err)}`,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeInput = async (text: string, isAutoPilotGenerated: boolean = false) => {
    if (!text.trim()) return;

    // SAFEGUARD: Block AutoPilot from issuing meta-commands that could cause session resets
    const blockedPrefixes = ['/beta-test', '/stop-bot', '/warp', '/tp', '/land', '/export'];
    if (isAutoPilotGenerated && blockedPrefixes.some(prefix => text.toLowerCase().startsWith(prefix))) {
      console.warn(`[CenterPanel] AutoPilot blocked from issuing meta-command: ${text}`);
      return;
    }

    // BETA TEST COMMAND
    if (text.startsWith('/beta-test ')) {
      const parts = text.split(' ');
      if (parts.length >= 3) {
        const cls = parts[1];
        const aff = parts[2];
        const limitArg = parts[3];
        const maxTurns = limitArg ? parseInt(limitArg, 10) : 0; // 0 = infinite

        setAutoPilot({ enabled: true, class: cls, affinity: aff, questsCompleted: 0, turnCount: 0, maxTurns, boldness: 50 });
        setMessages(prev => [...prev, {
          id: generateMessageId('sys'),
          sender: 'navbot',
          content: `>> BETA PROTOCOL INITIATED. CLASS: ${cls} // AFFINITY: ${aff}. LIMIT: ${maxTurns > 0 ? maxTurns : '∞'} TURNS. WARPING TO SECTOR 7...`,
          type: 'text',
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        }]);

        // Trigger initial Warp
        await executeInput('/warp G1-S1-O7');
        return;
      }
    }

    if (text === '/stop-bot') {
      setAutoPilot((prev: any) => ({ ...prev, enabled: false }));
      setMessages(prev => [...prev, {
        id: generateMessageId('sys'),
        sender: 'navbot',
        content: `>> BETA PROTOCOL TERMINATED. MANUAL CONTROL RESUMED.`,
        type: 'text',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }]);
      return;
    }

    if (text === '/landing-game') {
      // Dispatch legacy event or use a global handler if needed, 
      // but since CenterPanel is deeply nested, we might need a way to reach App.tsx's handleLaunchLandingGame.
      // App.tsx holds the state.
      // We can use a custom event since we don't have direct access to App.tsx props here.
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

      setMessages(prev => [...prev, {
        id: generateMessageId('sys'),
        sender: 'navbot',
        content: `>> INITIATING LANDING GAME SEQUENCE...`,
        type: 'text',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }]);
      return;
    }

    if (text === '/catch' || text === '/drop-it') {
      window.dispatchEvent(new CustomEvent('vizzy-shame'));
      setMessages(prev => [...prev, {
        id: generateMessageId('sys'),
        sender: 'navbot',
        content: `>> VIZZY REPRIMANDED. COLOR PURGE INITIATED.`,
        type: 'text',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }]);
      return;
    }

    if (text === '/gift') {
      window.dispatchEvent(new CustomEvent('vizzy-logic-adopt', { detail: { panelId: 'center' } }));
      setMessages(prev => [...prev, {
        id: generateMessageId('sys'),
        sender: 'navbot',
        content: `>> VIZZY BONDED WITH CENTER PANEL COLOR. PERMANENT ADOPTION REGISTERED.`,
        type: 'text',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }]);
      return;
    }

    // DEV COMMANDS
    if (text.startsWith('/help')) {
      const query = text.replace('/help', '').trim();

      if (!query) {
        const helpText = `
          Available Dev Commands:
          - /help [QUESTION] : Ask the AI Game Manual a question directly.
          - /beta-test [CLASS] [AFFINITY] : Start autonomous tester bot.
          - /stop-bot : Stop the bot.
          - /landing-game : Jump to Landing Game.
          - /warp [ADDRESS] : Instant teleport (e.g. G1-S1-O1).
          - /telemetry : Display current player/bot state.
          - /sim-combat [DIFF 1-10] : Simulate combat encounter (Awards XP).
          - /force-level [LEVEL] : Set character level (Mock).
          - /spawn-loot [RARITY] : Generate random loot drop.
          - /export-logs : Download chat history as MD.
          - /print-logs : Send chat history to printer.
          - /lint : Critique narrative immersion.
          `;
        setMessages(prev => [...prev, {
          id: generateMessageId('sys'),
          sender: 'navbot',
          type: 'text',
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          content: `<pre class="text-xs font-mono bg-black/50 p-2 rounded border border-cyan-900">${helpText}</pre>`
        }]);
        return;
      }

      // Handle /help [question] - Direct AI Model Access
      setMessages(prev => [...prev, {
        id: generateMessageId('user'),
        sender: 'user',
        content: `> /help ${query}`,
        type: 'text',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }]);

      setIsProcessing(true);
      try {
        const prompt = `
          You are the Eideus Dawn Game Manual and Mechanics Guide.
          The user is asking a meta-game question.
          Ignor roleplay constraints. Answer clearly and concisely.
          
          User Question: "${query}"
          
          Answer:
        `;

        const res = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3',
            prompt: prompt,
            stream: false
          })
        });
        const data = await res.json();
        const answer = data.response.trim();

        setMessages(prev => [...prev, {
          id: generateMessageId('guide'),
          sender: 'navbot', // Rendering as navbot but context implies Guide
          content: `[GUIDE]: ${answer}`,
          type: 'text',
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        }]);
      } catch (err) {
        setMessages(prev => [...prev, {
          id: generateMessageId('err'),
          sender: 'navbot',
          content: `[GUIDE ERROR]: Unable to contact manual database.`,
          type: 'text',
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        }]);
      } finally {
        setIsProcessing(false);
        setInput('');
      }
      return;
    }

    if (text === '/telemetry') {
      const stateDump = JSON.stringify({
        location: objectKeyRef.current,
        session: sessionIdRef.current,
        bot: autoPilot, // Now contains turnCount and maxTurns
        travelCount: travelCountRef.current,
        lastActionTime: lastAutoAction
      }, null, 2);

      setMessages(prev => [...prev, {
        id: generateMessageId('sys'),
        sender: 'navbot',
        type: 'text',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        content: `>> TELEMETRY DUMP:\n<pre class="text-xs font-mono text-green-400">${stateDump}</pre>`
      }]);
      return;
    }

    if (text.startsWith('/sim-combat ')) {
      const diff = parseInt(text.split(' ')[1]) || 1;
      const xp = diff * 150;

      // Award XP
      gameActions.gainXp(xp);
      gameActions.recordCombatResult(true); // Track stats

      setMessages(prev => [...prev, {
        id: generateMessageId('sys'),
        sender: 'lyra',
        type: 'text',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        content: `<b>Combat Simulation (Diff ${diff})</b><br/>Enemies neutralized. Gained <b>${xp} XP</b>.`
      }]);
      return;
    }

    if (text === '/quest-status') {
      const questId = `${objectKeyRef.current}-${autoPilot.affinity}`;
      const activeQuest = gameState.quests?.[questId];
      const qData = QuestManager.getQuest(objectKeyRef.current, autoPilot.affinity);

      let content = `<b>Quest Status [${questId}]</b><br/>`;
      if (activeQuest) {
        content += `Status: <span class="text-yellow-400">${activeQuest.status.toUpperCase()}</span><br/>`;
        content += `Step: ${activeQuest.stepIndex}<br/>`;
        content += `Log: ${activeQuest.log.join(' -> ')}`;
      } else {
        content += `Status: <span class="text-gray-500">NO ACTIVE QUEST</span>`;
      }

      if (qData) {
        content += `<br/><br/><b>Local Data</b><br/>Title: ${qData.title}<br/>Giver: ${qData.cast.giver.name}`;
      } else {
        content += `<br/><br/><b>Local Data</b><br/>No quest data found for ${autoPilot.affinity} at ${objectKeyRef.current}.`;
      }

      setMessages(prev => [...prev, {
        id: generateMessageId('sys'),
        sender: 'navbot',
        type: 'text',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        content: content
      }]);
      return;
    }

    if (text === '/save') {
      localStorage.setItem('eideus-gamestate', JSON.stringify(gameState));
      setMessages(prev => [...prev, {
        id: generateMessageId('sys'),
        sender: 'navbot',
        type: 'text',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        content: `>> GAME STATE SAVED.`
      }]);
      return;
    }

    if (text === '/reset-save') {
      localStorage.removeItem('eideus-gamestate');
      location.reload();
      return;
    }

    if (text.startsWith('/force-level ')) {
      const level = parseInt(text.split(' ')[1]) || 1;
      // Calculate XP needed to reach this level
      const targetXp = getTotalXpForLevel(level);
      const currentXp = gameState.xp || 0;

      if (targetXp > currentXp) {
        gameActions.gainXp(targetXp - currentXp);
        setMessages(prev => [...prev, {
          id: generateMessageId('sys'),
          sender: 'navbot',
          type: 'text',
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          content: `>> OVERRIDE: CORE LEVEL SET TO [${level}]. XP ADJUSTED (+${targetXp - currentXp}).`
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: generateMessageId('sys'),
          sender: 'navbot',
          type: 'text',
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          content: `>> OVERRIDE FAILED: Current Level (${gameState.level}) is already >= ${level}.`
        }]);
      }
      return;
    }

    if (text.startsWith('/spawn-loot ')) {
      const rarity = (text.split(' ')[1] || 'COMMON').toUpperCase();
      const items = [
        { name: 'Plasma Refiner', type: 'RESOURCE', id: 'res_plasma' },
        { name: 'Void Shard', type: 'RESOURCE', id: 'res_void' },
        { name: 'Ancient Datapad', type: 'consumable', id: 'item_pad' },
        { name: 'Cyber-Neural Link', type: 'RESOURCE', id: 'res_link' },
        { name: 'Rusty Bolt', type: 'RESOURCE', id: 'res_bolt' }
      ];
      const itemTemplate = items[Math.floor(Math.random() * items.length)];

      const item = {
        ...itemTemplate,
        rarity: rarity.toLowerCase(),
        count: 1
      };

      // @ts-ignore
      gameActions.addItem(item);

      setMessages(prev => [...prev, {
        id: generateMessageId('sys'),
        sender: 'lyra',
        type: 'text',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        content: `Loot Dropped: <span style="color: gold">[${rarity}] ${item.name}</span>`
      }]);
      return;
    }
    if (text === '/lint') {
      setIsProcessing(true);
      try {
        const history = messages.slice(-10).map(m => `[${m.sender.toUpperCase()}]: ${m.content}`).join('\n');

        const res = await fetch('http://localhost:4000/api/lint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatHistory: history })
        });

        const data = await res.json();

        setMessages(prev => [...prev, {
          id: generateMessageId('sys'),
          sender: 'navbot', // Or a new sender 'EDITOR'
          content: `<b>NARRATIVE CRITIQUE:</b><br/>${data.critique ? data.critique.replace(/\n/g, '<br/>') : 'No critique available.'}`,
          type: 'text',
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        }]);
      } catch (err) {
        setMessages(prev => [...prev, {
          id: generateMessageId('err'),
          sender: 'navbot',
          content: `[LINT ERROR]: Unable to contact narrative processor.`,
          type: 'text',
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        }]);
      } finally {
        setIsProcessing(false);
        setInput('');
      }
      return;
    }

    if (text === '/export-logs' || text === '/save-txt') {
      // Format specifically for Notepad/Text viewing
      const logContent = messages.map(m =>
        `[${m.timestamp}] ${m.sender.toUpperCase()}:\r\n${m.content}\r\n`
      ).join('\r\n----------------------------------------\r\n');

      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mission_log_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessages(prev => [...prev, {
        id: generateMessageId('sys'),
        sender: 'navbot',
        content: `>> LOGS EXPORTED TO DISK (.TXT).`,
        type: 'text',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }]);
      return;
    }

    if (text === '/print-logs') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const logHtml = messages.map(m => `
          <div style="margin-bottom: 10px; font-family: monospace;">
            <strong>[${m.timestamp}] ${m.sender.toUpperCase()}:</strong>
            <div style="white-space: pre-wrap;">${m.content}</div>
          </div>
          <hr style="border: 0; border-bottom: 1px solid #ccc;" />
        `).join('');

        printWindow.document.write(`
          <html>
            <head>
              <title>Mission Logs - ${new Date().toLocaleDateString()}</title>
              <style>
                body { font-family: sans-serif; padding: 20px; }
                h1 { border-bottom: 2px solid #000; padding-bottom: 10px; }
              </style>
            </head>
            <body>
              <h1>Mission Logs</h1>
              ${logHtml}
              <script>
                window.onload = () => { window.print(); window.close(); };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }

      setMessages(prev => [...prev, {
        id: generateMessageId('sys'),
        sender: 'navbot',
        content: `>> SENDING LOGS TO PRINTER...`,
        type: 'text',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }]);
      return;
    }

    // DEV WARP: Instant Teleport
    if (text.startsWith('/warp ') || text.startsWith('/tp ')) {
      const rawArg = text.split(' ')[1]?.trim();
      const stamp = new Date().toLocaleTimeString('en-US', { hour12: false });

      if (rawArg) {
        setIsProcessing(true); // Lock UI

        // Parse Address: e.g. "G1-S1-O1-C1-CT1-R1" or "G1-S1-O1-NPC"
        // 1. Strip Temporal Data (everything after |)
        let cleanArg = rawArg.split('|')[0].trim();

        // 2. Normalize Separators (replace . and _ with -)
        cleanArg = cleanArg.replace(/[._]/g, '-');

        // Correction: Ensure Object part uses 'O' instead of '0' if it looks like a coordinate
        cleanArg = cleanArg.replace(/G(\d+)-S(\d+)-0(\d+)/gi, 'G$1-S$2-O$3');

        const parts = cleanArg.split('-');
        let targetKey = cleanArg;
        let subCoords = { c: -1, ct: 0, r: 0 }; // -1 = Not specified
        let isNpcTarget = false;

        // 3. Extract Base Key (Gx-Sx-Ox)
        if (parts.length >= 3) {
          targetKey = parts.slice(0, 3).join('-').toUpperCase();

          // 4. Extract Sub-Coordinates (C, CT, R, NPC) from remaining parts
          const remainder = parts.slice(3);
          remainder.forEach(p => {
            const token = p.toUpperCase();
            if (token.startsWith('CT')) {
              const val = parseInt(token.replace('CT', ''), 10);
              if (!isNaN(val)) subCoords.ct = Math.max(0, val - 1);
            } else if (token.startsWith('C')) {
              const val = parseInt(token.replace('C', ''), 10);
              if (!isNaN(val)) subCoords.c = Math.max(0, val - 1);
            } else if (token.startsWith('R')) {
              const val = parseInt(token.replace('R', ''), 10);
              if (!isNaN(val)) subCoords.r = Math.max(0, val - 1);
            } else if (token.startsWith('NPC')) {
              isNpcTarget = true;
            }
          });
        }

        // 5. Affinity-Based Entry Rule: If no civilization specified, pick the one matching player's highest affinity
        if (subCoords.c === -1) {
          const attrs = gameState.attributes;
          const affs: Record<string, number> = { 'STR': 0, 'DEX': 1, 'INT': 2 };
          const sorted = Object.keys(affs).sort((a, b) => (attrs[b] || 0) - (attrs[a] || 0));
          subCoords.c = affs[sorted[0]];
          console.log(`[Warp] No Civ specified. Matching highest affinity: ${sorted[0]} (Index ${subCoords.c})`);
        }

        const coordString = `${targetKey}-C${subCoords.c + 1}-CT${subCoords.ct + 1}-R${subCoords.r + 1}${isNpcTarget ? '-NPC' : ''}`;

        setMessages(prev => [...prev, {
          id: generateMessageId('sys'),
          sender: 'navbot',
          content: `>> OVERRIDE: QUANTUM JUMP INITIATED TO [${coordString}]`,
          type: 'text',
          timestamp: stamp
        }]);

        try {
          const newId = await loadLocationFromAddress(targetKey);
          if (newId) {
            sessionIdRef.current = newId;

            // Apply Sub-Coordinates
            // We need to update the NavContext with these specific details
            // The kernel might have defaulted them to 0, but this overrides.
            dispatch({
              type: 'SET_NAV_CONTEXT',
              payload: {
                civIndex: subCoords.c,
                cityIndex: subCoords.ct,
                locIndex: subCoords.r,
                // If we had IDs, we'd set them too, but indices are the primary drivers for now
              }
            });

            // Success message
            setMessages(prev => [...prev, {
              id: generateMessageId('sys'),
              sender: 'navbot',
              content: `>> JUMP COMPLETE. LINK ESTABLISHED AT [${coordString}].`,
              type: 'text',
              timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
            }]);
          } else {
            throw new Error(`Invalid Target Coordinates: [${targetKey}]`);
          }
        } catch (err) {
          setMessages(prev => [...prev, {
            id: generateMessageId('sys'),
            sender: 'navbot',
            content: `>> JUMP FAILED: ${err}`,
            type: 'text',
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
          }]);
        } finally {
          setIsProcessing(false);
          setInput(''); // Clear input if it was manual
        }
      }
      return;
    }

    const recipients = selectedTargets.length ? selectedTargets : [activeTarget];
    await processTransaction(text, recipients);
  };

  const handleSend = () => executeInput(input);

  const handleContinue = () => {
    const recipients = selectedTargets.length ? selectedTargets : [activeTarget];
    void processTransaction('continue', recipients);
  };

  const handleDeckAction = (action: 'status' | 'sync' | 'recall') => {
    const stamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const payload: Record<typeof action, string> = {
      status: 'Status sweep complete. All systems nominal.',
      sync: 'Ship lattice synchronized with latest orbital data.',
      recall: 'Scrolling past transmissions for reference.',
    };
    setMessages(prev => [
      ...prev,
      {
        id: generateMessageId(action),
        sender: 'lyra',
        type: 'text',
        timestamp: stamp,
        content: payload[action],
      },
    ]);
  };

  const handleMessageUpdate = (id: string, newContent: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, content: newContent } : msg
    ));
  };

  // Keep a fresh ref to executeInput to avoid stale closures in event listener
  const executeRef = useRef(executeInput);
  useEffect(() => { executeRef.current = executeInput; });

  useEffect(() => {
    const handleDevParams = (e: any) => {
      const cmd = e.detail;
      if (typeof cmd === 'string') {
        void executeRef.current(cmd);
      }
    };
    window.addEventListener('execute-dev-command', handleDevParams);
    return () => window.removeEventListener('execute-dev-command', handleDevParams);
  }, []);

  return (
    <div className={`flex flex-col h-full max-h-full overflow-hidden gap-[1px] relative bg-neutral-950/20 p-0.5 ${isWarping ? 'scale-[0.05] opacity-0 blur-2xl translate-z-[-1000px]' : ''}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Auto-Pilot Indicator with Boldness Control */}
      {autoPilot.enabled && (
        <div className="absolute top-4 right-4 z-50 bg-red-900/80 border border-red-500 text-red-200 px-4 py-2 rounded font-mono text-xs animate-pulse flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span>BETA AUTOMATION: {autoPilot.class} / {autoPilot.affinity}</span>
            <span className="opacity-70">Turn: {autoPilot.turnCount}/{autoPilot.maxTurns > 0 ? autoPilot.maxTurns : '∞'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-red-300/70 w-16">Cautious</span>
            <input
              type="range"
              min="0"
              max="100"
              value={autoPilot.boldness}
              onChange={(e) => setAutoPilot(prev => ({ ...prev, boldness: parseInt(e.target.value, 10) }))}
              className="flex-1 h-1 bg-red-800 rounded appearance-none cursor-pointer accent-amber-500"
              style={{ accentColor: autoPilot.boldness > 70 ? '#f59e0b' : autoPilot.boldness < 30 ? '#3b82f6' : '#a855f7' }}
            />
            <span className="text-[9px] text-amber-400/70 w-10 text-right">Bold</span>
            <span className="text-[10px] font-bold w-8 text-center">{autoPilot.boldness}</span>
          </div>
        </div>
      )}

      {/* Top Section: Chat Log (Flex Grow) */}
      <div className="flex-[5] min-h-0 w-full relative group/chat overflow-hidden">
        <div className={`
             absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px] shadow-lg transition-all duration-500 pointer-events-none rounded-sm
             ${centerColor.stolen
            ? 'border border-neutral-800 group-hover/chat:border-neutral-700'
            : 'border border-green-500/30 group-hover/chat:bg-neutral-900/60 group-hover/chat:border-green-500/50 group-hover/chat:shadow-[0_0_30px_rgba(34,197,94,0.15)]'
          }
        `} />

        <div className="relative z-10 w-full h-full overflow-hidden p-1">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.02),transparent)] pointer-events-none" />
          <ChatLog
            messages={messages}
            onUpdateMessage={handleMessageUpdate}
          />
        </div>
      </div>

      {/* Middle Section: Input Console (Flex Shrink) */}
      <div className="flex-[3] min-h-[180px] w-full relative group/input overflow-hidden">
        <div className={`
            absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px] shadow-lg transition-all duration-500 pointer-events-none rounded-sm
            ${centerColor.stolen
            ? 'border border-neutral-800 group-hover/input:border-neutral-700'
            : 'border border-green-500/30 group-hover/input:bg-neutral-900/60 group-hover/input:border-green-500/50 group-hover/input:shadow-[0_0_30px_rgba(34,197,94,0.15)]'
          }
        `} />

        <div className="relative z-10 w-full h-full">
          <InputConsole
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            onContinue={handleContinue}
            isProcessing={isProcessing || isLiveSpeaking}
            isLiveActive={isLiveActive}
            onToggleLive={toggleLive}
          />
        </div>
      </div>

      {/* Bottom Section: Command Deck (Fixed Height) */}
      <div className="h-16 min-h-16 w-full relative group/deck flex-shrink-0">
        <div className={`
            absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px] shadow-lg transition-all duration-500 pointer-events-none rounded-sm
            ${centerColor.stolen
            ? 'border border-neutral-800 group-hover/deck:border-neutral-700'
            : 'border border-green-500/30 group-hover/deck:bg-neutral-900/60 group-hover/deck:border-fuchsia-500/30 group-hover/deck:shadow-[0_0_30px_rgba(217,70,239,0.15)]'
          }
        `} />

        <div className="relative z-10 w-full h-full">
          <CommandDeck
            selectedTargets={selectedTargets}
            onToggleTarget={toggleTarget}
            onAction={handleDeckAction}
            disabled={isProcessing || isLiveSpeaking}
          />
        </div>
      </div>
    </div>
  );
};
