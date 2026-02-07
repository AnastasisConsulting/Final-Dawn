import React, { useMemo, useState } from 'react';

type Contact = { id: string; name: string; role: string; location: string };
type ChatMsg = { id: string; sender: 'player' | 'npc'; text: string };

const SAMPLE_CONTACTS: Contact[] = [
  { id: 'lys', name: 'Captain Lys', role: 'Scavenger Captain', location: 'A-31 Reclaimer' },
  { id: 'elara', name: 'Dr. Elara Thorne', role: 'Rogue Scientist', location: 'Echoes Deep' },
  { id: 'virek', name: 'Cmdr. Virek', role: 'Security Chief', location: 'Sentinel Dome' }
];

export const ContactsOverlay: React.FC = () => {
  const [activeId, setActiveId] = useState<string>('lys');
  const [chat, setChat] = useState<ChatMsg[]>([
    { id: 'seed-1', sender: 'npc', text: 'Standing by. What do you need?' }
  ]);
  const [input, setInput] = useState('');

  const activeContact = useMemo(
    () => SAMPLE_CONTACTS.find(c => c.id === activeId) || SAMPLE_CONTACTS[0],
    [activeId]
  );

  const send = () => {
    if (!input.trim()) return;
    const playerMsg: ChatMsg = { id: `${Date.now()}-p`, sender: 'player', text: input.trim() };
    const reply: ChatMsg = {
      id: `${Date.now()}-r`,
      sender: 'npc',
      text: `Ack. Routing through ${activeContact.name}'s channel.`
    };
    setChat(prev => [...prev, playerMsg, reply]);
    setInput('');
  };

  return (
    <div className="flex h-full gap-4 text-sm">
      <div className="w-1/3 bg-black/40 border border-cyan-900/40 rounded-lg p-3 space-y-2">
        <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-400">Contacts</div>
        {SAMPLE_CONTACTS.map(contact => (
          <button
            key={contact.id}
            onClick={() => setActiveId(contact.id)}
            className={`w-full text-left px-3 py-2 rounded border transition-all ${
              contact.id === activeId
                ? 'border-cyan-500/60 bg-cyan-500/10 text-white'
                : 'border-transparent text-neutral-300 hover:border-cyan-700/40 hover:bg-cyan-900/10'
            }`}
          >
            <div className="font-semibold">{contact.name}</div>
            <div className="text-[11px] text-cyan-300">{contact.role}</div>
            <div className="text-[10px] text-neutral-500">Location: {contact.location}</div>
          </button>
        ))}
      </div>

      <div className="flex-1 bg-black/40 border border-cyan-900/40 rounded-lg p-4 flex flex-col">
        <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
          <div>
            <div className="text-xs text-cyan-300 tracking-[0.2em] uppercase">Channel</div>
            <div className="text-lg font-semibold text-white">{activeContact.name}</div>
            <div className="text-[11px] text-neutral-500">{activeContact.role} · {activeContact.location}</div>
          </div>
          <div className="text-[10px] text-neutral-500">Secure Link</div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {chat.map(m => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded px-3 py-2 ${
                m.sender === 'player'
                  ? 'ml-auto bg-cyan-500/20 border border-cyan-500/40 text-cyan-100'
                  : 'mr-auto bg-neutral-900/70 border border-neutral-700 text-neutral-100'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type a short message…"
            className="flex-1 bg-neutral-900 border border-cyan-800/40 rounded px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
          />
          <button
            onClick={send}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded border border-cyan-500/60 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

