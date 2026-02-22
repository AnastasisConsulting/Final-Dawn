// Simple audio synthesis mock
export const playLaserSound = (isEnemy: boolean) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isEnemy ? 200 : 800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
};

export const playMissileSound = () => {
    // Mechanical clunk for ejection
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
};

export const playThrusterIgnitionSound = () => {
    // Whoosh for ignition
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
    osc.start();
    osc.stop(ctx.currentTime + 1.0);
};

export const playImpactSound = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
};

export const playChaffSound = () => {};
export const playLockWarningSound = () => {};
export const playMissileAlertSound = () => {};

export class EngineSound {
    ctx: AudioContext;
    osc: OscillatorNode;
    gain: GainNode;
    
    constructor() {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.osc = this.ctx.createOscillator();
        this.gain = this.ctx.createGain();
        this.osc.connect(this.gain);
        this.gain.connect(this.ctx.destination);
        this.osc.type = 'sawtooth';
        this.osc.frequency.value = 50;
        this.gain.gain.value = 0;
    }
    
    start() { this.osc.start(); }
    stop() { this.osc.stop(); }
    
    update(throttle: number, boost: boolean) {
        const targetFreq = 50 + (throttle * 100) + (boost ? 100 : 0);
        const targetVol = 0.05 + (throttle * 0.1);
        this.osc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
        this.gain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
    }
}