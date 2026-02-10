export class EngineSound {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  start() {
    if (typeof window === 'undefined') return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.osc = this.ctx.createOscillator();
    this.gain = this.ctx.createGain();
    
    this.osc.type = 'sawtooth';
    this.osc.frequency.value = 60;
    this.gain.gain.value = 0.05;

    this.osc.connect(this.gain);
    this.gain.connect(this.ctx.destination);
    this.osc.start();
  }

  update(speedRatio: number, boosting: boolean) {
    if (!this.osc || !this.gain || !this.ctx) return;
    const targetFreq = 60 + (speedRatio * 100) + (boosting ? 100 : 0);
    this.osc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
  }

  stop() {
    this.osc?.stop();
    this.ctx?.close();
  }
}

const playTone = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.stop(ctx.currentTime + duration);
};

export const playChaffSound = () => playTone(800, 'noise' as any, 0.5, 0.2);
export const playLockWarningSound = () => playTone(1200, 'square', 0.1, 0.1);
export const playMissileAlertSound = () => playTone(1500, 'sawtooth', 0.2, 0.2);
export const playLaserSound = () => {
    // Simple zap
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
};
export const playExplosionSound = () => playTone(50, 'square', 0.4, 0.3);