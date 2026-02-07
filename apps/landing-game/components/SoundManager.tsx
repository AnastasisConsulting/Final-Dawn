import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store';
import { GamePhase } from '../types';

export const SoundManager: React.FC = () => {
  const { speed, phase, landingGearDeployed, hull, altitude } = useGameStore();
  
  // Audio Context & Nodes
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  
  // Engine
  const engineNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const engineFilterRef = useRef<BiquadFilterNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);

  // Wind
  const windNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const windFilterRef = useRef<BiquadFilterNode | null>(null);
  const windGainRef = useRef<GainNode | null>(null);

  // Alert
  const alertOscRef = useRef<OscillatorNode | null>(null);
  const alertGainRef = useRef<GainNode | null>(null);
  const nextAlertTime = useRef(0);

  // Initialize Audio
  useEffect(() => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    ctxRef.current = ctx;
    
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // --- Noise Buffer ---
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // --- Engine Setup (Low Rumble) ---
    const engineSrc = ctx.createBufferSource();
    engineSrc.buffer = buffer;
    engineSrc.loop = true;
    
    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 100;

    const engineGain = ctx.createGain();
    engineGain.gain.value = 0;

    engineSrc.connect(engineFilter).connect(engineGain).connect(masterGain);
    engineSrc.start();

    engineNodeRef.current = engineSrc;
    engineFilterRef.current = engineFilter;
    engineGainRef.current = engineGain;

    // --- Wind Setup (High Hiss) ---
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = buffer;
    windSrc.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 800;
    windFilter.Q.value = 1;

    const windGain = ctx.createGain();
    windGain.gain.value = 0;

    windSrc.connect(windFilter).connect(windGain).connect(masterGain);
    windSrc.start();

    windNodeRef.current = windSrc;
    windFilterRef.current = windFilter;
    windGainRef.current = windGain;

    // --- Alert Setup (Oscillator) ---
    // We create oscillators on demand for beeps, but keep gain ready
    const alertGain = ctx.createGain();
    alertGain.gain.value = 0.15;
    alertGain.connect(masterGain);
    alertGainRef.current = alertGain;

    // Resume context on user interaction if needed
    const resumeAudio = () => {
      if (ctx.state === 'suspended') ctx.resume();
    };
    window.addEventListener('click', resumeAudio);
    window.addEventListener('keydown', resumeAudio);

    return () => {
      ctx.close();
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
    };
  }, []);

  // Update Audio Params based on Game State
  useFrame((state) => {
    if (!ctxRef.current || !engineFilterRef.current || !engineGainRef.current || !windGainRef.current || !windFilterRef.current) return;

    const time = state.clock.elapsedTime;
    const isCrashed = phase === GamePhase.CRASHED;
    const isLanded = phase === GamePhase.LANDED;

    if (isCrashed) {
        engineGainRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.5);
        windGainRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.5);
        return;
    }

    if (isLanded) {
        engineGainRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 2.0); // Spool down
        windGainRef.current.gain.setTargetAtTime(0.05, ctxRef.current.currentTime, 1.0); // Light breeze
        return;
    }

    // Engine: Pitch and Volume increases with speed
    // Speed range roughly 0 to 5.0
    const engineFreq = 150 + speed * 200; 
    const engineVol = 0.1 + Math.min(speed, 2.0) * 0.2;
    
    engineFilterRef.current.frequency.setTargetAtTime(engineFreq, ctxRef.current.currentTime, 0.1);
    engineGainRef.current.gain.setTargetAtTime(engineVol, ctxRef.current.currentTime, 0.1);

    // Wind: Volume based on speed AND altitude (density)
    // Density is roughly 1 near 300-1500m, 0 above 2500m
    let density = 0;
    if (altitude < 2500) {
        density = 1 - (Math.max(0, altitude - 200) / 2300);
    }
    
    const windVol = (speed * 0.3 + 0.1) * density;
    windGainRef.current.gain.setTargetAtTime(windVol, ctxRef.current.currentTime, 0.1);
    
    // Wind Pitch changes with entry phase turbulence
    const windFreq = phase === GamePhase.ENTRY ? 400 + Math.random() * 200 : 800;
    windFilterRef.current.frequency.setTargetAtTime(windFreq, ctxRef.current.currentTime, 0.2);

    // Alerts (Low Hull or Terrain Warning)
    const terrainWarning = altitude < 400 && speed > 0.5;
    const hullWarning = hull < 30;

    if ((terrainWarning || hullWarning) && time > nextAlertTime.current) {
        playBeep(ctxRef.current, alertGainRef.current!, terrainWarning ? 600 : 800);
        nextAlertTime.current = time + (terrainWarning ? 0.3 : 1.0); // Fast beep for terrain, slow for hull
    }
  });

  const playBeep = (ctx: AudioContext, dest: GainNode, freq: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      osc.connect(dest);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
  };

  return null;
};