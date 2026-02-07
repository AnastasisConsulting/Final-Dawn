import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ViewLevel, EntityBase } from '../../types';

interface UIProps {
  currentLevel: ViewLevel;
  selectedEntity: EntityBase | null;
  onBack: () => void;
  breadcrumbs: string;
  ambientAudio?: boolean;
}

// Ambient Sound Hook
const useAmbientStatic = (active: boolean) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!active) return;

    const initAudio = () => {
        if (audioCtxRef.current) return;
        
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;

            // 1. Create Noise Buffer (Pink/Brownian mix for "crackle")
            const bufferSize = ctx.sampleRate * 5; // 5 seconds loop
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                // Brownian-ish base
                const white = Math.random() * 2 - 1;
                lastOut = (lastOut + (0.02 * white)) / 1.02;
                
                // Add random sharp "crackles"
                const crackle = Math.random() > 0.99 ? (Math.random() * 2 - 1) * 0.5 : 0;
                
                data[i] = lastOut * 3 + crackle; // Boost base, mix crackle
            }

            // 2. Source Node
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            // 3. Filter for "Warp/Fizzle" movement
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 600;
            filter.Q.value = 1;

            // 4. LFO to modulate filter (The "Warp")
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.15; // Slow modulation
            
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 400; // Swing freq by +/- 400Hz

            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);

            // 5. Master Gain
            const masterGain = ctx.createGain();
            masterGain.gain.value = 0.03; // VERY SUBTLE volume
            gainRef.current = masterGain;

            // Connect Graph
            source.connect(filter);
            filter.connect(masterGain);
            masterGain.connect(ctx.destination);

            source.start();
            lfo.start();
        } catch (e) {
            console.warn("Audio init failed", e);
        }
    };

    // Initialize immediately, browser might suspend
    initAudio();

    // Resume on interaction
    const resumeAudio = () => {
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };
    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);

    return () => {
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
            audioCtxRef.current = null;
        }
    };
  }, [active]);
};

export const UIOverlay: React.FC<UIProps> = ({ currentLevel, selectedEntity, onBack, breadcrumbs, ambientAudio = true }) => {
  const isSplitView = currentLevel === ViewLevel.CITY || currentLevel === ViewLevel.DISTRICT;
  const [isGlitching, setGlitching] = useState(false);
  const glitchTimeout = useRef<any>(null);

  // Initialize Ambient Audio
  useAmbientStatic(ambientAudio);

  // Visual Glitch Loop
  useEffect(() => {
    const triggerGlitch = () => {
        const nextDelay = 2000 + Math.random() * 6000;
        glitchTimeout.current = setTimeout(() => {
            setGlitching(true);
            setTimeout(() => {
                setGlitching(false);
                triggerGlitch();
            }, 100 + Math.random() * 300);
        }, nextDelay);
    };
    triggerGlitch();
    return () => { if (glitchTimeout.current) clearTimeout(glitchTimeout.current); };
  }, []);

  // Determine Back Button Label
  const backLabel = useMemo(() => {
    switch (currentLevel) {
        case ViewLevel.GALAXY: return "< RETURN TO UNIVERSE";
        case ViewLevel.SYSTEM: return "< RETURN TO GALAXY";
        case ViewLevel.SURFACE: return "< RETURN TO ORBIT";
        case ViewLevel.CITY: return "< RETURN TO SURFACE";
        case ViewLevel.DISTRICT: return "< RETURN TO CITY";
        default: return "< RETURN";
    }
  }, [currentLevel]);

  return (
    <div className={`absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-50 font-mono text-sm uppercase ${isSplitView ? 'w-2/3' : 'w-full'}`}>
      
      {/* Top Bar */}
      <div className="flex justify-end items-start pointer-events-auto">
        <div className="bg-glass-panel p-2 border border-slate-700">
           <div className="text-xs text-slate-500">COORDS</div>
           <div className="text-lg text-holo-blue">{breadcrumbs}</div>
        </div>
      </div>

      {/* Center Reticle & Title Area - UNIVERSE ONLY */}
      {currentLevel === ViewLevel.UNIVERSE && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border border-holo-cyan/30 rounded-full border-dashed animate-[spin_20s_linear_infinite] absolute" />
          <div className="w-44 h-44 border border-alert-orange/20 rounded-full absolute" />
          
          <div className="relative z-10 text-center">
             <h1 
                className={`text-3xl font-black tracking-[0.2em] glitch-text ${isGlitching ? 'glitch-active' : ''}`} 
                data-text="EIDEUS DAWN"
             >
                EIDEUS DAWN
             </h1>
             <div className="text-[10px] text-alert-orange tracking-widest mt-2 animate-pulse opacity-80">
                SYS.VER.4.92 // CONNECTED
             </div>
          </div>
        </div>
      )}

      {/* Bottom Interface */}
      <div className="flex justify-between items-end pointer-events-auto">
        {/* Back / Navigation Controls */}
        <div className="space-y-2">
          {currentLevel !== ViewLevel.UNIVERSE && (
            <button 
              onClick={onBack}
              className="px-6 py-2 bg-slate-900 border border-holo-cyan text-holo-cyan hover:bg-holo-cyan hover:text-black transition-all duration-200 clip-path-polygon font-bold tracking-wider"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              {backLabel}
            </button>
          )}
        </div>

        {/* Info Panel - Only show if NOT in split view */}
        {!isSplitView && (
          <div className="w-96 bg-glass-panel border-r-2 border-holo-cyan p-6 backdrop-blur-md relative">
            <div className="absolute -top-3 left-0 bg-holo-cyan text-black px-2 text-xs font-bold">DATA FEED</div>
            {selectedEntity ? (
              <>
                <h2 className="text-xl text-white mb-2">{selectedEntity.name}</h2>
                <div className="h-px w-full bg-slate-600 mb-4"></div>
                <p className="text-slate-300 leading-relaxed mb-4 text-xs normal-case">
                  {selectedEntity.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                   <div>TYPE: <span className="text-holo-blue">{selectedEntity.type}</span></div>
                   <div>ID: <span className="text-holo-blue">{selectedEntity.id}</span></div>
                </div>
              </>
            ) : (
              <div className="text-slate-500 italic">Select an object to analyze...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
