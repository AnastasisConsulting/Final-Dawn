import React, { useState } from 'react';
import { TreatDispenser } from '../Features/Vizzy/TreatDispenser';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export const FeederDock: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className={`
                absolute top-0 left-0 h-1/2 w-[25%] z-40 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${isOpen ? 'translate-x-0' : '-translate-x-[92%]'}
            `}
        >
            <div className="flex h-full w-full">
                {/* Main Panel Content */}
                <div className="flex-1 h-full bg-[#0a0a0a]/90 backdrop-blur-md border border-cyan-500/30 p-2 shadow-2xl relative overflow-hidden flex flex-col group hover:border-cyan-500/50 transition-colors">
                    {/* Industrial Header */}
                    <div className="h-6 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border-b border-neutral-700 flex items-center justify-between px-2 shrink-0 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold">In-Feed</span>
                        </div>
                        {/* Decorative marks */}
                        <div className="flex gap-0.5">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="w-0.5 h-2 bg-neutral-600 rotate-12" />
                            ))}
                        </div>
                    </div>

                    {/* Dispenser Area */}
                    <div className="flex-1 relative rounded-sm overflow-hidden bg-black/40 border border-neutral-800 shadow-inner">
                        <TreatDispenser onFeedVizzy={(type) => {
                            // Dispatch event is handled inside TreatDispenser or we can pass a handler
                            // But TreatDispenser currently calls VizzyOrchestrator directly via prop if provided, 
                            // OR we can rely on the default behavior if we refactor.
                            // Actually, checking LeftPanel usage: <TreatDispenser onFeedVizzy={(type) => vizzyOrchestrator.feed(type)} />
                            // We need to access vizzyOrchestrator here.
                            // For now, we'll dispatch a custom event that the Orchestrator can listen to, or import any singleton if available.
                            // Better: The functionality passed from parent.
                            // But FeederDock is likely at root level.
                            // Let's assume we can pass the handler down or import the service if it's a singleton.
                            // VizzyOrchestrator is a class instance. 
                            // We'll dispatch a CustomEvent 'req-feed-vizzy' as a decoupling mechanism? 
                            // Or just assume `window.vizzyOrchestrator` if it was global (it's not).
                            // We will fix the wiring in App.tsx. For now, just pass the type up.

                            // Dispatching a UI event for the App to handle
                            window.dispatchEvent(new CustomEvent('ui-feed-request', { detail: { type } }));
                        }} />

                        {/* CRT Scanline Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%]" />
                    </div>
                </div>

                {/* Handle / Toggle Tab */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-6 h-16 mt-4 bg-neutral-900 border-y border-r border-cyan-500/50 flex items-center justify-center cursor-pointer hover:bg-neutral-800 hover:text-cyan-400 text-neutral-500 transition-colors rounded-r-md shadow-lg"
                >
                    {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
            </div>
        </div>
    );
};
