import React from 'react';
import { Attribute } from '../types';

interface FractalGizmoProps {
  affinity: Attribute;
  className?: string;
}

export const FractalGizmo: React.FC<FractalGizmoProps> = ({ affinity, className = '' }) => {
  // Map standard attributes to the Affinity System colors/axes
  // Strength -> Geopolitical (Transform A - Green)
  // Dexterity -> Economic (Transform B - Yellow)
  // Intelligence -> Social (Transform C - Red)
  
  const getAxisColor = (attr: Attribute) => {
    switch(attr) {
      case Attribute.STRENGTH: return 'bg-green-500'; // Green/Input
      case Attribute.DEXTERITY: return 'bg-yellow-500'; // Yellow/Identity
      case Attribute.INTELLIGENCE: return 'bg-red-500'; // Red/Inception
      default: return 'bg-gray-500';
    }
  };

  const activeColor = getAxisColor(affinity);
  const glowColor = activeColor.replace('bg-', 'shadow-');

  return (
    <div className={`relative w-48 h-48 flex items-center justify-center perspective-800 ${className}`}>
      {/* 3D Container - Rotating slowly */}
      <div className="w-full h-full relative preserve-3d animate-slow-spin">
        
        {/* The 7x7x7 Lattice Grid Representation (Simplified) */}
        <div className="absolute inset-0 grid grid-cols-7 gap-1 opacity-20 transform translate-z-[-50px]">
          {Array.from({ length: 49 }).map((_, i) => (
             <div key={i} className="w-1 h-1 bg-green-900 rounded-full"></div>
          ))}
        </div>
        
        {/* Central Axis Lines (The Gizmo) */}
        {/* Z Axis (Vertical in this view) - Strength/Green */}
        <div className={`absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 ${affinity === Attribute.STRENGTH ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-green-900/50'}`}></div>
        
        {/* X Axis - Dexterity/Yellow */}
        <div className={`absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 ${affinity === Attribute.DEXTERITY ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]' : 'bg-yellow-900/50'}`}></div>
        
        {/* Y Axis (Cross) - Intelligence/Red */}
        <div className={`absolute top-1/2 left-1/2 w-48 h-0.5 -translate-x-1/2 -translate-y-1/2 rotate-45 ${affinity === Attribute.INTELLIGENCE ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-red-900/50'}`}></div>

        {/* Active Node Highlighter - A pulsing sphere representing the current state vector */}
        <div className={`absolute top-1/2 left-1/2 w-4 h-4 -mt-2 -ml-2 rounded-full ${activeColor} animate-ping opacity-75`}></div>
        <div className={`absolute top-1/2 left-1/2 w-3 h-3 -mt-1.5 -ml-1.5 rounded-full bg-white z-10`}></div>
        
        {/* Data Labels in 3D Space */}
        <div className="absolute top-0 left-1/2 text-[10px] text-green-500 -translate-x-1/2 -translate-y-4">STR</div>
        <div className="absolute right-0 top-1/2 text-[10px] text-yellow-500 translate-x-4 -translate-y-1/2">DEX</div>
        <div className="absolute bottom-4 left-4 text-[10px] text-red-500">INT</div>

      </div>

      <style>{`
        .perspective-800 { perspective: 800px; }
        .preserve-3d { transform-style: preserve-3d; }
        .animate-slow-spin { animation: spin 20s linear infinite; }
        @keyframes spin {
          0% { transform: rotateY(0deg) rotateX(20deg); }
          100% { transform: rotateY(360deg) rotateX(20deg); }
        }
      `}</style>
    </div>
  );
};