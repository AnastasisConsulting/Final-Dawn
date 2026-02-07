// VizzyTreat - Draggable treat for feeding Vizzy

import React, { useState } from 'react';

export interface VizzyTreatProps {
    id: string;
    type: 'energy' | 'data' | 'scrap';
    onFeed: (treatId: string, type: string) => void;
    onRemove: (treatId: string) => void;
}

const TREAT_VISUALS = {
    energy: {
        color: 'from-yellow-400 to-orange-500',
        glow: 'shadow-[0_0_20px_rgba(251,191,36,0.6)]',
        emoji: '⚡'
    },
    data: {
        color: 'from-cyan-400 to-blue-500',
        glow: 'shadow-[0_0_20px_rgba(6,182,212,0.6)]',
        emoji: '💾'
    },
    scrap: {
        color: 'from-neutral-500 to-neutral-700',
        glow: 'shadow-[0_0_20px_rgba(115,115,115,0.6)]',
        emoji: '🔧'
    }
};

export const VizzyTreat: React.FC<VizzyTreatProps> = ({ id, type, onFeed, onRemove }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const visual = TREAT_VISUALS[type];

    const handleDragStart = (e: React.DragEvent) => {
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('treatId', id);
        e.dataTransfer.setData('treatType', type);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setIsDragging(false);

        // Check if dropped on Vizzy (you'll need to implement collision detection)
        // For now, we'll use a simple check based on drop position
        const dropX = e.clientX;
        const dropY = e.clientY;

        // TODO: Get Vizzy's actual position from VizzyOrchestrator
        // For prototype, assume Vizzy is in certain area
        const vizzyArea = {
            left: window.innerWidth * 0.75,
            right: window.innerWidth,
            top: 0,
            bottom: window.innerHeight
        };

        if (
            dropX >= vizzyArea.left &&
            dropX <= vizzyArea.right &&
            dropY >= vizzyArea.top &&
            dropY <= vizzyArea.bottom
        ) {
            // Successfully fed to Vizzy!
            onFeed(id, type);
        }
    };

    if (isDragging) {
        return null; // Hide original while dragging
    }

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`
        relative w-12 h-12 cursor-grab active:cursor-grabbing
        bg-gradient-to-br ${visual.color}
        rounded-lg ${visual.glow}
        transition-all duration-300
        hover:scale-110 hover:rotate-12
        animate-pulse
      `}
            title={`Drag to feed ${type} to Vizzy`}
        >
            {/* Inner glow */}
            <div className="absolute inset-0.5 bg-white/20 rounded-lg" />

            {/* Treat icon */}
            <div className="absolute inset-0 flex items-center justify-center text-2xl">
                {visual.emoji}
            </div>

            {/* Particle effect */}
            <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className={`absolute w-1 h-1 bg-white rounded-full`}
                        style={{
                            left: `${20 + i * 30}%`,
                            animation: `float-particle ${2 + i * 0.5}s ease-in-out infinite`,
                            animationDelay: `${i * 0.3}s`
                        }}
                    />
                ))}
            </div>

            <style jsx>{`
        @keyframes float-particle {
          0%, 100% { 
            transform: translateY(0px) scale(1);
            opacity: 0;
          }
          50% { 
            transform: translateY(-20px) scale(1.2);
            opacity: 0.8;
          }
        }
      `}</style>
        </div>
    );
};
