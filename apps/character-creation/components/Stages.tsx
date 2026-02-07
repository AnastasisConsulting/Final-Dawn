// apps/character-creation/components/Stages.tsx

import React from 'react';
import { BotFace } from './BotFace';
import { ClassCard } from './ClassCard';
import { FractalGizmo } from './FractalGizmo';
import { QuestionData, CoreClass, Attribute, LevelData, Character, Affinity } from '../types';
import { CLASS_PROGRESSION, CLASS_DESCRIPTIONS } from '../constants';

// --- Loading / Intro Stage ---
export const IntroStage: React.FC<{ onStart: () => void, loading: boolean }> = ({ onStart, loading }) => (
  <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-1000">
    <BotFace mood="talking" />
    <h1 className="text-3xl md:text-5xl font-bold mb-6 text-green-500 tracking-tight">
      AFFINITY MATRIX INITIALIZING...
    </h1>
    <p className="max-w-md text-green-300/80 mb-10 text-lg leading-relaxed">
      "Detecting consciousness. Loading fractal templates. Calibrate STR/DEX/INT so I can assign a CORE identity template."
    </p>
    <button
      onClick={onStart}
      disabled={loading}
      className="px-8 py-3 bg-green-700 hover:bg-green-600 text-black font-bold text-xl uppercase tracking-widest transition-colors disabled:opacity-50"
    >
      {loading ? "Calibrating Transforms..." : "Begin Calibration"}
    </button>
  </div>
);

// --- Question Stage ---
export const QuestionStage: React.FC<{ data: QuestionData, onAnswer: (attr: Attribute) => void }> = ({ data, onAnswer }) => (
  <div className="flex flex-col h-full max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
    <div className="flex-shrink-0 mb-8 text-center">
      <BotFace mood="neutral" />
      <div className="bg-green-900/20 p-6 border border-green-800 rounded-lg">
        <p className="text-xl md:text-2xl text-green-300 leading-relaxed">"{data.scenario}"</p>
      </div>
    </div>

    <div className="grid gap-4 flex-grow content-center">
      {data.options.map((opt, idx) => (
        <button
          key={idx}
          onClick={() => onAnswer(opt.affinity)}
          className="p-5 border border-green-700/50 hover:bg-green-900/20 hover:border-green-400 text-left text-green-100 transition-all duration-200 group flex items-start gap-4"
        >
          <span className="text-green-600 font-bold group-hover:text-green-400">0{idx + 1}.</span>
          <span>{opt.text}</span>
        </button>
      ))}
    </div>
  </div>
);

// --- Class Selection Stage ---
export const ClassSelectionStage: React.FC<{
  affinity: Attribute,
  onSelect: (c: CoreClass) => void
}> = ({ affinity, onSelect }) => {
  const [selected, setSelected] = React.useState<CoreClass | null>(null);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl text-green-500 mb-2">CORE CONFIGURATION</h2>
        <div className="flex items-center justify-center gap-2 text-green-400/60">
          <span>Dominant Attribute:</span>
          <span className={`font-bold ${affinity === Attribute.STR ? 'text-green-500' :
            affinity === Attribute.DEX ? 'text-yellow-500' : 'text-red-500'
            }`}>{affinity}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[CoreClass.REBEL, CoreClass.HACKER, CoreClass.ACOLYTE].map((c) => (
          <ClassCard
            key={c}
            type={c as CoreClass}
            selected={selected === c}
            onSelect={setSelected}
            affinity={affinity}
          />
        ))}
      </div>

      <div className="mt-auto text-center">
        <button
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          className="px-10 py-3 border-2 border-green-500 text-green-500 font-bold hover:bg-green-500 hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-green-500 transition-colors uppercase tracking-widest"
        >
          Confirm Hull
        </button>
      </div>
    </div>
  );
};

// --- Sub Affinity Selection Stage ---
export const SubSelectionStage: React.FC<{
  coreClass: CoreClass;
  onSelect: (sub: Affinity) => void;
}> = ({ coreClass, onSelect }) => {
  const [selected, setSelected] = React.useState<Affinity | null>(null);

  const asCoreLabel = coreClass.toUpperCase();

  const classData = CLASS_PROGRESSION[coreClass];
  const opts: Array<{ key: Affinity; label: string; hint: string }> = [
    { key: Affinity.STR, label: classData.subs[Affinity.STR].label, hint: classData.subs[Affinity.STR].description },
    { key: Affinity.DEX, label: classData.subs[Affinity.DEX].label, hint: classData.subs[Affinity.DEX].description },
    { key: Affinity.INT, label: classData.subs[Affinity.INT].label, hint: classData.subs[Affinity.INT].description },
  ];


  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl text-green-500 mb-2">SUB TEMPLATE</h2>
        <p className="text-green-400/60 text-sm">
          Your CORE is locked as <span className="text-green-300 font-bold">{asCoreLabel}</span>. Pick a SUB affinity to unlock at level 7.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {opts.map((o) => (
          <button
            key={o.key}
            onClick={() => setSelected(o.key)}
            className={
              `relative group p-6 border-2 text-left transition-all duration-300 w-full ` +
              (selected === o.key
                ? 'border-green-400 bg-green-900/30 shadow-[0_0_15px_rgba(74,222,128,0.2)]'
                : 'border-green-800/50 hover:border-green-600 bg-black/40 hover:bg-green-900/10')
            }
          >
            <h3 className={`text-xl font-bold mb-2 ${selected === o.key ? 'text-green-300' : 'text-green-600'}`}>
              {o.label}
            </h3>
            <p className="text-gray-400 text-sm mb-4 min-h-[3rem] font-sans">{o.hint}</p>
            <div className="text-xs text-green-500/80 font-mono border-t border-green-900 pt-2">
              CROSS: {asCoreLabel}_{o.label}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-auto text-center">
        <button
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          className="px-10 py-3 border-2 border-green-500 text-green-500 font-bold hover:bg-green-500 hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-green-500 transition-colors uppercase tracking-widest"
        >
          Confirm Sub
        </button>
      </div>
    </div>
  );
};

// --- Summary / Character Sheet Stage ---
export const SummaryStage: React.FC<{ character: Character, table: LevelData[] }> = ({ character, table }) => {
  const subLabel = character.coreClass && character.subAffinity
    ? CLASS_PROGRESSION[character.coreClass].subs[character.subAffinity].label
    : '—';

  const crossLabel = character.coreClass && character.crossId
    ? CLASS_PROGRESSION[character.coreClass].cross[character.crossId].label
    : '—';

  return (
    <div className="h-full flex flex-col animate-in zoom-in-95 duration-500">
      <div className="text-center border-b border-green-800 pb-4 mb-6">
        <h2 className="text-3xl font-bold text-white mb-1">UNIT: {character.name}</h2>
        <p className="text-green-500 text-sm tracking-[0.2em]">
          {character.coreClass?.toUpperCase()} // {subLabel.toUpperCase()} // {crossLabel.toUpperCase()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow overflow-auto pr-2">
        {/* Stats Panel */}
        <div className="space-y-6">
          <div className="bg-green-900/10 p-4 border border-green-800 flex flex-col items-center">
            <h3 className="text-green-400 text-sm uppercase mb-4 w-full border-b border-green-800/50 pb-2">Fractal Template</h3>
            <FractalGizmo affinity={character.affinity} />
            <div className="w-full mt-4 text-xs font-mono text-green-300 space-y-1">
              <div className="flex justify-between">
                <span>STR (Geopolitical)</span>
                <span className={character.affinity === Attribute.STR ? "text-green-400 font-bold" : "text-gray-600"}>
                  {character.affinity === Attribute.STR ? "1.00" : "0.00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>DEX (Economic)</span>
                <span className={character.affinity === Attribute.DEX ? "text-yellow-400 font-bold" : "text-gray-600"}>
                  {character.affinity === Attribute.DEX ? "1.00" : "0.00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>INT (Social)</span>
                <span className={character.affinity === Attribute.INT ? "text-red-400 font-bold" : "text-gray-600"}>
                  {character.affinity === Attribute.INT ? "1.00" : "0.00"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-green-900/10 p-4 border border-green-800">
            <h3 className="text-green-400 text-sm uppercase mb-2">Analysis</h3>
            <p className="text-xs text-green-300/70 italic">
              "A {character.coreClass} optimized for {character.affinity.toLowerCase()}? Your specs suggest a 98% probability of {character.affinity === Attribute.STR ? 'collateral damage' : character.affinity === Attribute.DEX ? 'unauthorized access' : 'cult formation'}."
            </p>
          </div>
        </div>

        {/* XP Table Preview */}
        <div className="border border-green-800 bg-black/50 p-4">
          <h3 className="text-green-400 text-sm uppercase mb-4 sticky top-0 bg-black/50 backdrop-blur-sm">Progression Projection (to L21 = 63,000 XP)</h3>
          <div className="text-xs font-mono space-y-1 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-green-700">
            <div className="grid grid-cols-4 text-green-600 mb-2 font-bold">
              <span>LVL</span>
              <span>ΔXP</span>
              <span>TOTAL</span>
              <span>UNLOCK</span>
            </div>
            {table.map((row) => (
              <div key={row.level} className={`grid grid-cols-4 py-1 border-b border-green-900/30 ${row.level === character.level ? 'bg-green-500/20 text-white' : 'text-gray-500'}`}>
                <span>{row.level.toString().padStart(2, '0')}</span>
                <span>{row.xpFromPrevious.toLocaleString()}</span>
                <span>{row.totalXpToReach.toLocaleString()}</span>
                <span className={row.unlock === '—' ? 'text-gray-600' : 'text-green-300 font-bold'}>{row.unlock}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-4">
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('character-created', { detail: character }));
          }}
          className="px-8 py-3 bg-green-600 hover:bg-green-500 text-black font-bold uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(74,222,128,0.4)] transition-all transform hover:scale-105"
        >
          DE-QUARANTINE & ENTER WORLD
        </button>
        <button onClick={() => window.location.reload()} className="text-xs text-red-500 hover:text-red-400 underline decoration-dashed">
          FLUSH BUFFER & RESTART
        </button>
      </div>
    </div>
  );
}