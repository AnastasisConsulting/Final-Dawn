/**
 * UI STABILITY WARNING: 
 * This component is part of the established "High-Density / Professional Sleek" UI standard.
 * DO NOT modify the message padding (p-2.5), font sizes (text-[11.5px]), or vertical spacing (space-y-2).
 */
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

export type ChatRole = 'system' | 'user' | 'navbot' | 'vizzy' | 'lyra' | 'gm';
export type ChatTarget = 'navbot' | 'vizzy' | 'lyra';

export type ChatSender = ChatTarget | 'user' | 'gm';

export interface Message {
  id: string;
  sender: ChatSender;
  content: string;
  avatarUrl?: string;
  type: 'text';
  timestamp: string;
}

interface ChatLogProps {
  messages: Message[];
  isProcessing?: boolean;
  activeTargets?: ChatTarget[];
  onToggleTarget?: (target: ChatTarget) => void;
  onUpdateMessage?: (id: string, newContent: string) => void;
}

const SENDER_LABELS: Record<ChatSender, string> = {
  user: 'YOU',
  navbot: 'NAVBOT',
  vizzy: 'VIZZY',
  lyra: 'LYRA',
  gm: 'GM'
};

const SENDER_COLORS: Record<ChatSender, string> = {
  user: 'text-cyan-400',
  navbot: 'text-emerald-400',
  vizzy: 'text-purple-400',
  lyra: 'text-amber-400',
  gm: 'text-rose-400'
};

export const ChatLog: React.FC<ChatLogProps> = ({
  messages,
  isProcessing,
  activeTargets = [],
  onToggleTarget,
  onUpdateMessage
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = React.useState(true);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const near = scrollHeight - scrollTop - clientHeight < 50;
    setIsNearBottom(near);
  };

  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (el && isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isNearBottom, isProcessing]);

  const handleEdit = (message: Message) => {
    if (!onUpdateMessage) return;
    const updated = window.prompt('Edit response', message.content);
    if (updated !== null && updated !== message.content) {
      onUpdateMessage(message.id, updated);
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto pr-2 space-y-2 pb-6 scroll-smooth custom-scrollbar"
    >
      {/* Target Status Indicators */}
      <div className="flex gap-2 p-1.5 mb-2 sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-white/5">
        {(['navbot', 'vizzy', 'lyra'] as ChatTarget[]).map(t => (
          <button
            key={t}
            onClick={() => onToggleTarget?.(t)}
            className={`px-2 py-0.5 text-[8px] tracking-[0.2em] uppercase border transition-all ${activeTargets.includes(t)
              ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
              : 'bg-black/40 border-white/5 text-white/20 hover:border-white/20'
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {messages.map((message) => (
        <div
          key={message.id}
          className="group relative rounded border border-white/5 bg-neutral-950/40 p-2.5 transition-all hover:bg-neutral-900/40"
        >
          <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-white/10 mb-2">
            <div className="flex items-center gap-2">
              <span className={`font-bold ${SENDER_COLORS[message.sender]}`}>{SENDER_LABELS[message.sender]}</span>
              <div className="h-[1px] w-6 bg-white/5" />
            </div>
            <span className="font-mono opacity-30">{message.timestamp}</span>
          </div>

          <div
            className="text-[11.5px] leading-relaxed text-slate-400 selection:bg-cyan-500/30"
            onDoubleClick={() => handleEdit(message)}
          >
            <ReactMarkdown
              components={{
                p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                em: ({ ...props }) => <em className="italic text-cyan-500/80 font-medium" {...props} />,
                strong: ({ ...props }) => <strong className="font-bold text-yellow-500/80" {...props} />,
                code: ({ ...props }) => <code className="bg-black/50 px-1 py-0.5 rounded text-pink-500/80 font-mono text-[10px]" {...props} />,
                a: ({ ...props }) => <a className="text-cyan-500 underline hover:text-cyan-400 transition-colors" {...props} />
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {onUpdateMessage && (
            <div
              className="absolute top-2 right-2 text-[7px] uppercase tracking-[0.1em] opacity-0 group-hover:opacity-40 cursor-pointer hover:opacity-100 transition-opacity"
              onClick={() => handleEdit(message)}
            >
              [EDIT]
            </div>
          )}
        </div>
      ))}

      {isProcessing && (
        <div className="flex items-center gap-2 p-2.5 bg-cyan-950/10 border border-cyan-500/10 rounded-sm animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
          <span className="text-[9px] uppercase tracking-[0.3em] text-cyan-500/40">Neural processing...</span>
        </div>
      )}
    </div>
  );
};
