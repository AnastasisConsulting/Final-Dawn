import React, { useEffect, useRef, useState } from 'react';
import { Message, Role } from '../types';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  charName: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isLoading, charName }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-850 flex-1 relative overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-700">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Start a conversation with {charName}</p>
          </div>
        )}

        {messages.map((msg) => {
          // Skip showing Function role messages to user to keep chat clean, 
          // unless you want a debug mode.
          if (msg.role === Role.Function) return null;
          
          // If a message is a tool call request but has no text, render an "Action" indicator
          if (msg.role === Role.Model && msg.toolCalls && !msg.content) {
            return (
              <div key={msg.id} className="flex w-full justify-start opacity-70">
                <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50 italic text-xs text-gray-400 flex items-center gap-2">
                  <span>🛠️</span>
                  <span>Executing: {msg.toolCalls.map(tc => tc.name).join(', ')}...</span>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.role === Role.User ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] md:max-w-[75%] rounded-lg p-4 shadow-sm ${
                  msg.role === Role.User 
                    ? 'bg-blue-900/40 text-blue-50 border border-blue-800/50' 
                    : msg.role === Role.System
                    ? 'bg-red-900/20 text-red-300 border border-red-900/50'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}
              >
                <div className="text-xs font-bold mb-1 opacity-50 uppercase tracking-wider flex justify-between">
                  <span>{msg.role === Role.User ? 'You' : msg.role === Role.System ? 'System' : charName}</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start w-full animate-pulse">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
               <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></div>
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Send a message to ${charName}...`}
            className="w-full bg-gray-800 text-gray-100 rounded-xl pl-4 pr-14 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-14 max-h-32 scrollbar-hide border border-gray-700"
            rows={1}
            style={{ minHeight: '56px' }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;