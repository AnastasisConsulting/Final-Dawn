// apps/character-creation/components/ClassCard.tsx

import React from 'react';
import { CoreClass, Attribute } from '../types';
import { CLASS_DESCRIPTIONS } from '../constants';

interface ClassCardProps {
  type: CoreClass;
  selected: boolean;
  onSelect: (c: CoreClass) => void;
  affinity: Attribute;
}

export const ClassCard: React.FC<ClassCardProps> = ({ type, selected, onSelect, affinity }) => {
  const info = CLASS_DESCRIPTIONS[type];

  // Recommend class based on canonical mapping
  let recommended = false;
  if (affinity === Attribute.STR && type === CoreClass.REBEL) recommended = true;
  if (affinity === Attribute.DEX && type === CoreClass.HACKER) recommended = true;
  if (affinity === Attribute.INT && type === CoreClass.ACOLYTE) recommended = true;

  return (
    <button
      onClick={() => onSelect(type)}
      className={`
        relative group p-6 border-2 text-left transition-all duration-300 w-full
        ${selected
          ? 'border-green-400 bg-green-900/30 shadow-[0_0_15px_rgba(74,222,128,0.2)]'
          : 'border-green-800/50 hover:border-green-600 bg-black/40 hover:bg-green-900/10'
        }
      `}
    >
      {recommended && (
        <div className="absolute -top-3 -right-3 bg-yellow-600 text-black text-xs font-bold px-2 py-1 rotate-12 shadow-md">
          VECTOR MATCH
        </div>
      )}
      <h3 className={`text-xl font-bold mb-2 ${selected ? 'text-green-300' : 'text-green-600'}`}>
        {type.toUpperCase()}
      </h3>
      <p className="text-gray-400 text-sm mb-4 min-h-[3rem] font-sans">
        {info.description}
      </p>
      <div className="text-xs text-green-500/80 font-mono border-t border-green-900 pt-2">
        BONUS: {info.bonus}
      </div>
    </button>
  );
};