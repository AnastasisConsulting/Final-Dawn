import React, { useState } from 'react';
import { useRelationship } from '../../src/hooks/useRelationship';

export const RelationshipDebugger: React.FC = () => {
    const { relationships, setRelationship } = useRelationship();
    const [simulateSentiment, setSimulateSentiment] = useState<string | null>(null);

    const handleSentiment = (sentiment: string) => {
        setSimulateSentiment(sentiment);
        // Dispatch event for Vizzy to catch with full parameters
        window.dispatchEvent(new CustomEvent('vizzy-sentiment', {
            detail: {
                sentiment,
                intensity: 0.8 // High intensity for demo buttons
            }
        }));

        // Reset after a bit
        setTimeout(() => setSimulateSentiment(null), 2000);
    };

    return (
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 text-xs font-mono">
            <h3 className="text-cyan-400 font-bold mb-2 uppercase tracking-widest">Relational Actuator Debug</h3>

            <div className="space-y-3 mb-4">
                {(Object.keys(relationships) as Array<keyof typeof relationships>).map(target => (
                    <div key={target} className="flex items-center gap-2">
                        <span className="w-16 uppercase text-neutral-500">{target}</span>
                        <input
                            type="range"
                            min="0" max="100"
                            value={relationships[target]}
                            onChange={(e) => setRelationship(target, parseInt(e.target.value))}
                            className="flex-1 accent-cyan-500 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="w-8 text-right text-cyan-200">{relationships[target]}</span>
                    </div>
                ))}
            </div>

            <div className="border-t border-neutral-800 pt-2">
                <div className="text-neutral-500 mb-2 uppercase tracking-wide">Force Sentiment (Anim)</div>
                <div className="grid grid-cols-2 gap-2">
                    {['happy', 'thinking', 'alert', 'sad', 'idle'].map(s => (
                        <button
                            key={s}
                            onClick={() => handleSentiment(s)}
                            className={`px-2 py-1 border rounded transition-colors uppercase text-[10px] ${simulateSentiment === s
                                ? 'bg-cyan-900 border-cyan-500 text-cyan-100'
                                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
