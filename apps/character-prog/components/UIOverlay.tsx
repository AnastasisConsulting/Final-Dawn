import React from 'react';
import { NodeData, Affinity } from '../types';

interface Props {
  selectedNode: NodeData | null;
  onClose: () => void;
}

const getGradient = (affinity: Affinity) => {
  switch (affinity) {
    case Affinity.STR: return 'from-red-900/90 to-red-600/20';
    case Affinity.INT: return 'from-blue-900/90 to-blue-600/20';
    case Affinity.DEX: return 'from-green-900/90 to-green-600/20';
    default: return 'from-amber-900/90 to-amber-600/20';
  }
};

const getTextColor = (affinity: Affinity) => {
    switch (affinity) {
        case Affinity.STR: return 'text-red-400';
        case Affinity.INT: return 'text-blue-400';
        case Affinity.DEX: return 'text-green-400';
        default: return 'text-amber-400';
    }
};

export const UIOverlay: React.FC<Props> = ({ selectedNode, onClose }) => {
  if (!selectedNode) return (
    <div className="absolute top-8 left-8 p-6 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 max-w-sm">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
            Kabbalah RPG
        </h1>
        <p className="text-gray-300 text-sm">
            Interactive Progression Visualizer. <br/>
            Drag to rotate, Scroll to zoom. <br/>
            Click spheres to inspect Classes. <br/>
            Hover cubes to inspect Skills.
        </p>
    </div>
  );

  const bgGradient = getGradient(selectedNode.affinity);
  const accentText = getTextColor(selectedNode.affinity);

  return (
    <div className={`absolute right-0 top-0 h-full w-full md:w-96 bg-gradient-to-b ${bgGradient} backdrop-blur-xl border-l border-white/10 p-8 shadow-2xl transition-all duration-500 overflow-y-auto`}>
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      <div className="mt-8">
        <span className={`text-xs font-bold tracking-widest border border-current px-2 py-1 rounded ${accentText}`}>
            {selectedNode.type.replace('CLASS_', '')} CLASS
        </span>
        <h2 className="text-4xl font-black mt-4 text-white uppercase tracking-tighter">
            {selectedNode.name}
        </h2>
        <div className="flex items-center gap-2 mt-2">
            <div className={`w-3 h-3 rounded-full ${accentText.replace('text', 'bg')}`}></div>
            <span className="text-gray-300 font-mono">Affinity: {selectedNode.affinity}</span>
        </div>

        <div className="mt-10 space-y-8">
            <h3 className="text-xl font-bold border-b border-white/10 pb-2 text-white/80">
                Unlocked Skills
            </h3>
            
            {selectedNode.skills.length === 0 && <p className="text-gray-400 italic">No skills specific to this node.</p>}

            {selectedNode.skills.map((skill, idx) => (
                <div key={idx} className="bg-black/40 p-4 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-bold text-lg ${accentText}`}>{skill.name}</h4>
                        <span className="text-xs font-mono text-gray-500 bg-black/50 px-2 py-1 rounded">
                            LVL {skill.levelReq}
                        </span>
                    </div>
                    <div className="flex gap-2 mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-white/40 bg-white/5 px-2 py-0.5 rounded">
                            {skill.type}
                        </span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        {/* Placeholder descriptions since prompt didn't provide specific flavor text for skills */}
                        A powerful {skill.type.toLowerCase()} ability utilizing {selectedNode.affinity} energy to dominate the battlefield.
                    </p>
                </div>
            ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <button className={`w-full py-3 font-bold text-black uppercase tracking-widest hover:scale-105 transition-transform rounded shadow-lg shadow-current ${accentText.replace('text', 'bg')}`}>
                Activate Path
            </button>
        </div>
      </div>
    </div>
  );
};