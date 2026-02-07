
// A procedural audio synthesizer using Web Audio API
// No external assets required.

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3; // Master volume
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return { ctx: audioCtx, master: masterGain! };
};

// --- ENGINE SYNTHESIZER ---
export class EngineSound {
  private ctx: AudioContext | null = null;
  
  // Layers
  private rumbleOsc: OscillatorNode | null = null;
  private windNode: AudioBufferSourceNode | null = null;
  private boostNode: AudioBufferSourceNode | null = null;
  
  // Filters & Gains
  private rumbleFilter: BiquadFilterNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private boostFilter: BiquadFilterNode | null = null;

  private rumbleGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private boostGain: GainNode | null = null;
  
  private isPlaying = false;

  constructor() {}

  start() {
    const { ctx, master } = getContext();
    this.ctx = ctx;

    // 1. DEEP RUMBLE (The Ship Frame)
    // Triangle wave for a buzzier, mechanical feel
    this.rumbleOsc = ctx.createOscillator();
    this.rumbleOsc.type = 'triangle'; 
    this.rumbleOsc.frequency.value = 50; 
    
    this.rumbleFilter = ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = 120;
    
    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.value = 0.0;
    
    this.rumbleOsc.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.rumbleGain);
    this.rumbleGain.connect(master);

    // 2. WIND NOISE (Atmospheric Drag)
    // White noise
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.windNode = ctx.createBufferSource();
    this.windNode.buffer = buffer;
    this.windNode.loop = true;

    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'highpass'; // Only hear the "hiss"
    this.windFilter.frequency.value = 800;

    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.0;

    this.windNode.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(master);

    // 3. BOOST ROAR (Thrust)
    // Pinkish noise (using same buffer for now)
    this.boostNode = ctx.createBufferSource();
    this.boostNode.buffer = buffer;
    this.boostNode.loop = true;
    // Pitch it down for a roar
    this.boostNode.playbackRate.value = 0.5;

    this.boostFilter = ctx.createBiquadFilter();
    this.boostFilter.type = 'lowpass';
    this.boostFilter.frequency.value = 200;

    this.boostGain = ctx.createGain();
    this.boostGain.gain.value = 0.0;

    this.boostNode.connect(this.boostFilter);
    this.boostFilter.connect(this.boostGain);
    this.boostGain.connect(master);

    // Start
    this.rumbleOsc.start();
    this.windNode.start();
    this.boostNode.start();
    this.isPlaying = true;
  }

  update(throttle: number, boosting: boolean) {
    if (!this.isPlaying || !this.ctx || !this.rumbleOsc) return;

    const t = this.ctx.currentTime;
    
    // Sanitize inputs to ensure they are finite numbers (prevents AudioParam error)
    let safeThrottle = throttle;
    if (!Number.isFinite(safeThrottle)) safeThrottle = 0;
    
    const boostAmt = boosting ? 1.0 : 0.0;
    const totalSpeed = Math.min(1, Math.max(0, safeThrottle + boostAmt * 0.5));

    // RUMBLE
    // Pitch goes up slightly, volume goes up
    const rumbleFreq = Math.max(20, 40 + (totalSpeed * 40));
    const rumbleGainVal = Math.max(0, 0.2 + (totalSpeed * 0.2));
    this.rumbleOsc.frequency.setTargetAtTime(rumbleFreq, t, 0.1);
    this.rumbleGain!.gain.setTargetAtTime(rumbleGainVal, t, 0.1);

    // WIND (Always present based on speed)
    // Filter opens up as you go faster
    const windFreq = Math.max(100, 1000 - (totalSpeed * 400));
    const windGainVal = Math.max(0, totalSpeed * 0.4);
    this.windFilter!.frequency.setTargetAtTime(windFreq, t, 0.1); 
    this.windGain!.gain.setTargetAtTime(windGainVal, t, 0.1);

    // BOOST (The heavy thruster sound)
    const boostGainVal = boosting ? 0.5 : 0.0;
    const boostFreqVal = boosting ? 400 : 100;
    
    this.boostGain!.gain.setTargetAtTime(boostGainVal, t, 0.2);
    this.boostFilter!.frequency.setTargetAtTime(boostFreqVal, t, 0.2);
  }

  stop() {
    if (this.rumbleOsc) this.rumbleOsc.stop();
    if (this.windNode) this.windNode.stop();
    if (this.boostNode) this.boostNode.stop();
    this.isPlaying = false;
  }
}

// --- ONE-SHOT FX ---

export const playLaserSound = (isEnemy = false) => {
    const { ctx, master } = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isEnemy ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isEnemy ? 400 : 800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(isEnemy ? 0.1 : 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(master);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
};

export const playMissileSound = () => {
    const { ctx, master } = getContext();
    
    // Create White Noise Buffer for Rocket Whoosh
    const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to simulate distance/power
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    // Sweep filter up to simulate ignition flare
    filter.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.2); 
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.0);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.1); // Attack
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2); // Decay

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    noise.start();
};

export const playImpactSound = () => {
    const { ctx, master } = getContext();
    
    // Noise burst
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    noise.start();
};

export const playChaffSound = () => {
    const { ctx, master } = getContext();
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0; i<bufferSize; i++) data[i] = (Math.random()*2-1);
    
    const node = ctx.createBufferSource();
    node.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    node.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    node.start();
}

export const playLockWarningSound = () => {
    const { ctx, master } = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
}

export const playMissileAlertSound = () => {
    const { ctx, master } = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
}

export const playCreditSound = () => {
    const { ctx, master } = getContext();
    // High pitched "ding" sequence
    const t = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, t);
    osc1.frequency.exponentialRampToValueAtTime(2000, t + 0.1);
    
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.3, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc1.connect(gain1);
    gain1.connect(master);
    osc1.start();
    osc1.stop(t + 0.3);
    
    // Coin jingle
    setTimeout(() => {
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2400, ctx.currentTime);
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0.2, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc2.connect(gain2);
        gain2.connect(master);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.2);
    }, 100);
}

export const playLootSound = () => {
    const { ctx, master } = getContext();
    // Power up swell
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.2);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
}

export const playAchievementSound = () => {
    const { ctx, master } = getContext();
    const t = ctx.currentTime;
    
    // Major Chord Arpeggio
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major
    
    freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = f;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, t + (i*0.1));
        gain.gain.exponentialRampToValueAtTime(0.01, t + (i*0.1) + 0.4);
        
        osc.connect(gain);
        gain.connect(master);
        osc.start(t + (i*0.1));
        osc.stop(t + (i*0.1) + 0.4);
    });
}
