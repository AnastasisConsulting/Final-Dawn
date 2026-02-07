// Space Junk Component - Decorative floating tech bits (2-3ft scale)

import React from 'react';

export interface SpaceJunkProps {
    id: string;
    type: 'plating' | 'strut' | 'conduit' | 'sensor' | 'core';
    panelColor: 'cyan' | 'green' | 'fuchsia';
    position: { x: number; y: number };
    rotation: number;
    scale: number;
    collected: boolean;
    onClick: (id: string) => void;
}

const JUNK_SVGS = {
    // Curved hull plating - looks like armor fragments
    plating: (color: string) => (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-lg">
            <path d="M10 20 C 30 10, 70 10, 90 30 L 80 80 C 60 90, 40 90, 20 70 Z"
                stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
            <path d="M25 35 C 40 30, 60 30, 75 40" stroke={color} strokeWidth="0.5" opacity="0.6" />
            <rect x="30" y="50" width="10" height="20" stroke={color} strokeWidth="1" fill="none" />
            <circle cx="70" cy="60" r="3" fill={color} opacity="0.8" />
        </svg>
    ),
    // Long structural reinforcement
    strut: (color: string) => (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-lg">
            <rect x="45" y="5" width="10" height="90" rx="2" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.05" />
            <line x1="45" y1="20" x2="55" y2="20" stroke={color} strokeWidth="1" />
            <line x1="45" y1="50" x2="55" y2="50" stroke={color} strokeWidth="1" />
            <line x1="45" y1="80" x2="55" y2="80" stroke={color} strokeWidth="1" />
            <path d="M45 5 L 35 15 M 55 5 L 65 15" stroke={color} strokeWidth="1" opacity="0.5" />
        </svg>
    ),
    // Heavy power/data bundles
    conduit: (color: string) => (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-lg">
            <path d="M20 20 Q 50 10, 80 20 T 20 80" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
            <path d="M25 25 Q 55 15, 85 25 T 25 85" stroke={color} strokeWidth="1" strokeDasharray="4 2" />
            <rect x="40" y="40" width="20" height="10" transform="rotate(-45 50 45)" fill={color} fillOpacity="0.2" stroke={color} />
        </svg>
    ),
    // Detached sensor array
    sensor: (color: string) => (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-lg">
            <circle cx="50" cy="50" r="30" stroke={color} strokeWidth="1.5" fill="none" strokeDasharray="10 5" />
            <path d="M50 50 L 80 20" stroke={color} strokeWidth="2" />
            <circle cx="80" cy="20" r="5" fill={color} />
            <path d="M50 50 L 20 80" stroke={color} strokeWidth="1" opacity="0.5" />
            <circle cx="50" cy="50" r="10" fill={color} fillOpacity="0.2" />
        </svg>
    ),
    // Energy containment fragment
    core: (color: string) => (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-lg">
            <path d="M50 10 L 90 50 L 50 90 L 10 50 Z" stroke={color} strokeWidth="2" fill="none" />
            <circle cx="50" cy="50" r="15" stroke={color} strokeWidth="1" opacity="0.6">
                <animate attributeName="r" values="15;20;15" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="50" cy="50" r="5" fill={color} />
        </svg>
    )
};

const COLOR_MAP = {
    cyan: 'rgb(6, 182, 212)',
    green: 'rgb(34, 197, 94)',
    fuchsia: 'rgb(217, 70, 239)'
};

export const SpaceJunk: React.FC<SpaceJunkProps> = ({
    id,
    type,
    panelColor,
    position,
    rotation,
    scale,
    collected,
    onClick
}) => {
    if (collected) return null;

    const color = COLOR_MAP[panelColor];

    return (
        <div
            className="absolute cursor-pointer transition-all duration-300 hover:scale-110 hover:brightness-150 z-20"
            style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                width: '100px', // Roughly 2-3ft scale relative to screen
                height: '100px',
                transform: `rotate(${rotation}deg) scale(${scale})`,
                animation: 'float 6s ease-in-out infinite',
            }}
            onClick={() => onClick(id)}
            title={`Collect ${type}`}
        >
            <div className="relative w-full h-full">
                {JUNK_SVGS[type](color)}

                {/* Glow effect on hover */}
                <div
                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 blur-md"
                    style={{ filter: `drop-shadow(0 0 15px ${color})` }}
                >
                    {JUNK_SVGS[type](color)}
                </div>
            </div>

            <style jsx>{`
        @keyframes float {
          0%, 100% { transform: rotate(${rotation}deg) scale(${scale}) translateY(0px); }
          50% { transform: rotate(${rotation}deg) scale(${scale}) translateY(-10px); }
        }
      `}</style>
        </div>
    );
};
