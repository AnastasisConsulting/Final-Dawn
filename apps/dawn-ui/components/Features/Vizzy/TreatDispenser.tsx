// TreatDispenser - UI element to spawn treats for Vizzy

import React, { useState, useEffect } from 'react';
import { VizzyTreat } from './VizzyTreat';

interface TreatDispenserProps {
    onFeedVizzy: (treatType: string) => void;
}

const COOLDOWN_MS = 30000; // 30 seconds between treats
const TREAT_TYPES = ['energy', 'data', 'scrap'] as const;

export const TreatDispenser: React.FC<TreatDispenserProps> = ({ onFeedVizzy }) => {
    const [activeTreats, setActiveTreats] = useState<Array<{ id: string; type: typeof TREAT_TYPES[number] }>>([]);
    const [cooldown, setCooldown] = useState(0);
    const [lastDispense, setLastDispense] = useState(0);

    // Update cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => {
                const remaining = Math.max(0, COOLDOWN_MS - (Date.now() - lastDispense));
                setCooldown(Math.ceil(remaining / 1000));

                if (remaining <= 0) {
                    clearInterval(timer);
                }
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [cooldown, lastDispense]);

    const dispenseTreat = () => {
        if (cooldown > 0) return;

        const randomType = TREAT_TYPES[Math.floor(Math.random() * TREAT_TYPES.length)];
        const newTreat = {
            id: `treat-${Date.now()}`,
            type: randomType
        };

        setActiveTreats([...activeTreats, newTreat]);
        setLastDispense(Date.now());
        setCooldown(COOLDOWN_MS / 1000);
    };

    const handleFeed = (treatId: string, treatType: string) => {
        // Remove treat from active list
        setActiveTreats(activeTreats.filter(t => t.id !== treatId));

        // Notify parent
        onFeedVizzy(treatType);

        // Store feed event in localStorage
        const feedHistory = JSON.parse(localStorage.getItem('vizzy-feed-history') || '[]');
        feedHistory.push({ type: treatType, timestamp: Date.now() });
        localStorage.setItem('vizzy-feed-history', JSON.stringify(feedHistory));
    };

    const handleRemove = (treatId: string) => {
        setActiveTreats(activeTreats.filter(t => t.id !== treatId));
    };

    return (
        <div className="relative">
            {/* Dispenser Button */}
            <button
                onClick={dispenseTreat}
                disabled={cooldown > 0}
                className={`
          relative w-14 h-14 rounded-full 
          transition-all duration-300
          ${cooldown > 0
                        ? 'bg-neutral-800 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-br from-green-500 to-emerald-600 hover:scale-110 cursor-pointer shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                    }
        `}
                title={cooldown > 0 ? `Cooldown: ${cooldown}s` : 'Dispense treat for Vizzy'}
            >
                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                    {cooldown > 0 ? '⏳' : '🍬'}
                </div>

                {/* Cooldown overlay */}
                {cooldown > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{cooldown}</span>
                    </div>
                )}

                {/* Ready pulse */}
                {cooldown === 0 && (
                    <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20" />
                )}
            </button>

            {/* Active Treats */}
            <div className="absolute top-0 left-16 flex gap-2">
                {activeTreats.map(treat => (
                    <VizzyTreat
                        key={treat.id}
                        id={treat.id}
                        type={treat.type}
                        onFeed={handleFeed}
                        onRemove={handleRemove}
                    />
                ))}
            </div>
        </div>
    );
};
