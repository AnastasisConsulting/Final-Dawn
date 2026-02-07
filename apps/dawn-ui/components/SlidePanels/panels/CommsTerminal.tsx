
import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import ReactMarkdown from 'react-markdown';

export const CommsTerminal: React.FC = () => {
    const { contacts, sendCommsMessage } = useGame();
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const activeContact = contacts.find(c => c.id === selectedContactId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeContact?.history]);

    useEffect(() => {
        if (!selectedContactId && contacts.length > 0) {
            setSelectedContactId(contacts[0].id);
        }
    }, [contacts, selectedContactId]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && selectedContactId) {
            sendCommsMessage(selectedContactId, inputValue);
            setInputValue('');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ONLINE': return 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
            case 'BUSY': return 'bg-red-500 shadow-[0_0_8px_#ef4444]';
            case 'AWAY': return 'bg-yellow-500 shadow-[0_0_8px_#eab308]';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="flex h-full bg-slate-900/90 font-mono text-slate-300">
            <div className="w-1/3 border-r border-slate-700 flex flex-col bg-black/40">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                    <h3 className="text-sm font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                        Neural Net
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">SECURE ENCRYPTED CHANNELS</p>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {contacts.map(contact => (
                        <div
                            key={contact.id}
                            onClick={() => setSelectedContactId(contact.id)}
                            className={`p-3 border-b border-slate-800 cursor-pointer transition-colors hover:bg-slate-800/50 flex gap-3 items-center
                                ${selectedContactId === contact.id ? 'bg-slate-800 border-l-2 border-l-cyan-500' : 'border-l-2 border-l-transparent'}
                            `}
                        >
                            <div className="w-10 h-10 bg-slate-700 rounded-sm overflow-hidden shrink-0 relative border border-slate-600">
                                <img
                                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${contact.avatarSeed}`}
                                    alt={contact.name}
                                    className="w-full h-full object-cover opacity-80"
                                />
                                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black ${getStatusColor(contact.status)}`}></div>
                            </div>

                            <div className="min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <h4 className={`text-sm font-bold truncate ${selectedContactId === contact.id ? 'text-cyan-400' : 'text-slate-300'}`}>{contact.name}</h4>
                                </div>
                                <p className="text-[10px] text-slate-500 truncate">{contact.role}</p>
                                <p className="text-[9px] text-slate-600 truncate uppercase mt-0.5">{contact.location}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-slate-950/30 relative">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_2px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_2px)] bg-[size:40px_40px] pointer-events-none opacity-20"></div>

                {activeContact ? (
                    <>
                        <div className="h-16 border-b border-slate-700 flex items-center px-6 justify-between bg-slate-900/80 backdrop-blur-md z-10">
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-wide">{activeContact.name}</h2>
                                <p className="text-xs text-cyan-600 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full animate-ping"></span>
                                    CONNECTION SECURE // {activeContact.location}
                                </p>
                            </div>
                            <div className="text-right text-[10px] text-slate-500 max-w-[200px] leading-tight hidden md:block">
                                {activeContact.description}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar z-0">
                            {activeContact.history.length === 0 ? (
                                <div className="text-center text-slate-600 text-xs mt-10">
                                    <p>-- ENCRYPTED CHANNEL ESTABLISHED --</p>
                                    <p className="mt-2">History logs cleared. Begin transmission.</p>
                                </div>
                            ) : (
                                activeContact.history.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'player' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-sm p-3 border text-sm
                                            ${msg.sender === 'player'
                                                ? 'bg-cyan-900/30 border-cyan-800 text-cyan-100 rounded-tr-none'
                                                : 'bg-slate-800/50 border-slate-600 text-slate-200 rounded-tl-none'}
                                        `}>
                                            <div className="markdown-content">
                                                {/* @ts-expect-error React 18/19 type mismatch with react-markdown */}
                                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                                            </div>
                                            <div className={`text-[9px] mt-1 opacity-50 ${msg.sender === 'player' ? 'text-right' : 'text-left'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-slate-900 border-t border-slate-700 z-10">
                            <form onSubmit={handleSend} className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={`Message ${activeContact.name}...`}
                                    className="flex-1 bg-black border border-slate-600 p-2 text-sm focus:outline-none focus:border-cyan-500 text-slate-200"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim()}
                                    className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    SEND
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                        SELECT A CONTACT TO BEGIN TRANSMISSION
                    </div>
                )}
            </div>
        </div>
    );
};
