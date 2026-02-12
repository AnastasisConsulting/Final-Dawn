
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return { ctx: audioCtx, master: masterGain! };
};

export class EngineSound {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;

  start() {
    const { ctx, master } = getContext();
    this.ctx = ctx;
    this.osc = ctx.createOscillator();
    this.gain = ctx.createGain();
    this.filter = ctx.createBiquadFilter();

    this.osc.type = 'sawtooth';
    this.osc.frequency.value = 40;
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 200;

    this.gain.gain.value = 0;

    this.osc.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(master);
    this.osc.start();
  }

  update(speedRatio: number, boosting: boolean) {
    if (!this.osc || !this.gain || !this.ctx) return;
    const t = this.ctx.currentTime;
    const targetFreq = 40 + (speedRatio * 80) + (boosting ? 120 : 0);
    this.osc.frequency.setTargetAtTime(targetFreq, t, 0.1);
    this.gain.gain.setTargetAtTime(0.15 + (speedRatio * 0.1), t, 0.1);
    this.filter!.frequency.setTargetAtTime(200 + (speedRatio * 1000), t, 0.1);
  }

  stop() {
    this.osc?.stop();
  }
}

export const playLaserSound = () => {
  const { ctx, master } = getContext();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
  g.gain.setValueAtTime(0.1, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(g);
  g.connect(master);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

export const playImpactSound = () => {
  const { ctx, master } = getContext();
  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 400;
  g.gain.setValueAtTime(0.3, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start();
};

export const playChaffSound = () => {
  const { ctx, master } = getContext();
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.value = 2000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.05, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  osc.connect(g);
  g.connect(master);
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
};

export const playLockWarningSound = () => playLaserSound(); // Placeholder
export const playMissileAlertSound = () => playLaserSound(); // Placeholder