import { AccumulatorState } from "./MOSSTypes";

export class TensionAccumulator {

    private state: AccumulatorState;

    constructor(initial?: Partial<AccumulatorState>) {
        this.state = {
            recent: initial?.recent ?? 0,
            longTerm: initial?.longTerm ?? 0
        };
    }

    update(delta: number) {
        // Charge with damping
        this.state.recent = this.clamp(this.state.recent + delta * 0.25);
        this.state.longTerm = this.clamp(this.state.longTerm + delta * 0.05);
    }

    decay() {
        // Memory fade
        this.state.recent *= 0.85;
        this.state.longTerm *= 0.99;
    }

    bleed() {
        // After emotional outburst
        this.state.recent *= 0.6;
    }

    getTotal(): number {
        return (this.state.recent * 0.7) + (this.state.longTerm * 0.3);
    }

    private clamp(v: number) {
        return Math.max(-100, Math.min(100, v));
    }
}
