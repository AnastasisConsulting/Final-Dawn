import React, { useState, useEffect, useRef } from 'react';
import { ChatLog, ChatTarget, Message } from '../Features/Chat/ChatLog';
import { InputConsole } from '../Features/Chat/InputConsole';
import { useKernel } from '../../hooks/useKernel';
import { getDefaultLocationId } from 'eideus-routers';
import { useColorStealing } from '../../src/contexts/ColorStealingContext';
import { useGame } from '../../src/context/GameContext';
import { DevTerminal } from '../Features/Dev/DevTerminal';

// Hooks
import { useTurnExecution } from '../../src/hooks/useTurnExecution';
import { useAutoPilot } from '../../src/hooks/useAutoPilot';
import { useCommandRouter } from '../../src/hooks/useCommandRouter';

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
  devTerminalOpen: boolean;
  setDevTerminalOpen: (open: boolean) => void;
}

declare global {
  interface Window {
    __LATEST_CHAT_LOGS?: Message[];
  }
}

export const CenterPanel: React.FC<CenterPanelProps> = ({
  activeTarget,
  onTargetSelect,
  injection,
  devTerminalOpen,
  setDevTerminalOpen
}) => {
  const { state, loadLocationFromAddress, ensureGlobalSession } = useKernel();
  const { state: gameState, actions: gameActions } = useGame();
  const { panelColors } = useColorStealing();

  const objectKeyRef = useRef<string>(getDefaultLocationId());
  const lastInjectionId = useRef<number | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<ChatTarget[]>(['navbot']);
  const [input, setInput] = useState('');

  const messageIdCounter = useRef(0);
  const generateMessageId = (prefix: string = 'msg') => {
    messageIdCounter.current += 1;
    return `${prefix}-${Date.now()}-${messageIdCounter.current}`;
  };

  const {
    messages, setMessages, isProcessing, setIsProcessing, processTransaction
  } = useTurnExecution(state, gameState, gameActions, loadLocationFromAddress, ensureGlobalSession, generateMessageId);

  // We need to pass a stable reference to executeInput to useAutoPilot
  const executeRef = useRef<any>(null);

  const { autoPilot, setAutoPilot } = useAutoPilot(
    isProcessing, messages, objectKeyRef.current, gameState, gameActions,
    async (t, a) => {
      if (executeRef.current) {
        return executeRef.current(t, a, activeTarget, objectKeyRef.current, autoPilot);
      }
    }, generateMessageId
  );

  const { executeInput } = useCommandRouter(
    gameState, gameActions, setMessages, setIsProcessing, setDevTerminalOpen,
    generateMessageId, setAutoPilot,
    (t, r, a, o) => processTransaction(t, r, a, o)
  );

  executeRef.current = executeInput;

  // Sync to global
  useEffect(() => { window.__LATEST_CHAT_LOGS = messages; }, [messages]);

  // Handle Injection
  useEffect(() => {
    if (!injection || lastInjectionId.current === injection.id) return;
    lastInjectionId.current = injection.id;
    const stamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setMessages(prev => [
      ...prev,
      { id: `${injection.id}-land`, sender: 'lyra', type: 'text', timestamp: stamp, content: `Landing at <b>${injection.targetName}</b>:<br/>${injection.landingNarration}` },
      { id: `${injection.id}-scene`, sender: 'lyra', type: 'text', timestamp: stamp, content: `<b>Opening Scene</b><br/>${injection.openingScene}` },
    ]);
    objectKeyRef.current = injection.targetAddress || injection.targetName;
  }, [injection, setMessages]);

  useEffect(() => { if (state.address.full) objectKeyRef.current = state.address.full; }, [state.address.full]);

  useEffect(() => {
    setSelectedTargets(prev => prev.includes(activeTarget) ? prev : [activeTarget, ...prev].slice(0, 3));
  }, [activeTarget]);

  const toggleTarget = (target: ChatTarget) => {
    setSelectedTargets(prev => {
      const active = prev.includes(target);
      if (active) return prev.filter(t => t !== target);
      if (prev.length >= 3) return prev;
      onTargetSelect(target);
      return [...prev, target];
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#050505]/80 border-x border-cyan-500/10 relative overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        <ChatLog
          messages={messages}
          isProcessing={isProcessing}
          activeTargets={selectedTargets}
          onToggleTarget={toggleTarget}
        />
      </div>

      <div className="p-1 bg-black/60 border-t border-cyan-500/10">
        <InputConsole
          value={input}
          onChange={setInput}
          onSend={(val) => {
            executeInput(val, false, activeTarget, objectKeyRef.current, autoPilot);
            setInput('');
          }}
          disabled={isProcessing}
          placeholder={autoPilot.enabled ? "AUTOPILOT ENGAGED..." : "ENTER NEURAL COMMAND..."}
        />
      </div>

      <DevTerminal open={devTerminalOpen} onClose={() => setDevTerminalOpen(false)} />
    </div>
  );
};
