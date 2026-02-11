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
  onUpdateMessage: (id: string, newContent: string) => void;
}

const SENDER_LABELS: Record<ChatSender, string> = {
  user: 'YOU',
  navbot: 'NAVBOT',
  vizzy: 'VIZZY',
  lyra: 'LYRA',
  gm: 'GM'
};

export const ChatLog: React.FC<ChatLogProps> = ({ messages, onUpdateMessage }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = React.useState(true);

  // Monitor scroll to unlock auto-scroll if user moves up
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    // Tolerance of 50px
    const near = scrollHeight - scrollTop - clientHeight < 50;
    setIsNearBottom(near);
  };

  // Auto-scroll only if we were already at the bottom
  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (el && isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isNearBottom]);

  const handleEdit = (message: Message) => {
    const updated = window.prompt('Edit response', message.content);
    if (updated !== null && updated !== message.content) {
      onUpdateMessage(message.id, updated);
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto pr-2 space-y-3 pb-3 scroll-smooth"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className="relative rounded-md border border-neutral-800 bg-neutral-950/80 p-3 shadow-[0_3px_15px_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-slate-500 mb-2">
            <div className="flex items-center gap-2">
              {message.avatarUrl && (
                <img src={message.avatarUrl} className="w-6 h-6 rounded-full border border-cyan-500/30 object-cover" alt="avatar" />
              )}
              <span className="font-bold text-cyan-600">{SENDER_LABELS[message.sender]}</span>
            </div>
            <span>{message.timestamp}</span>
          </div>

          <div
            className="text-[14px] leading-relaxed text-slate-100"
            onDoubleClick={() => handleEdit(message)}
          >
            {/* 
              We assume the message content is Markdown. 
              dangerouslySetInnerHTML is replaced by ReactMarkdown.
            */}
            <ReactMarkdown
              components={{
                // Styles for paragraphs (spacing)
                p: ({ node, ...props }) => <p className="mb-3 last:mb-0 block" {...props} />,
                // Styles for italics (*actions* -> em)
                em: ({ node, ...props }) => <em className="italic text-cyan-400" {...props} />,
                // Styles for bold (**names** -> strong)
                strong: ({ node, ...props }) => <strong className="font-bold text-yellow-400" {...props} />,
                // Link styling just in case
                a: ({ node, ...props }) => <a className="text-blue-400 underline" {...props} />
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          <div className="absolute top-2 right-2 text-[8px] uppercase tracking-[0.5em] text-transparent group hover:text-white/50 cursor-pointer" onClick={() => handleEdit(message)}>
            <span className="transition-opacity duration-200">edit</span>
          </div>
        </div>
      ))}
    </div>
  );
};
