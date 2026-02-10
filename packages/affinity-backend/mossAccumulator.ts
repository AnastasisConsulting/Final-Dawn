import { TensionState } from "./types";

export class MossAccumulator {

    static update(
        state: TensionState,
        delta: number
    ): TensionState {
        let recent = state.recent + delta * 0.25;
        let longTerm = state.longTerm + delta * 0.05;

        // decay
        recent *= 0.85;
        longTerm *= 0.99;

        // clamp
        recent = Math.max(-100, Math.min(100, recent));
        longTerm = Math.max(-100, Math.min(100, longTerm));

        return { recent, longTerm };
    }

    static total(state: TensionState): number {
        return state.recent * 0.7 + state.longTerm * 0.3;
    }

    static band(total: number): string {
        const val = Math.abs(total);
        if (val < 20) return "STABLE";
        if (val < 40) return "UNEASY";
        if (val < 60) return "VOCAL";
        if (val < 80) return "DEFIANT";
        return "AUTONOMOUS";
    }

}
