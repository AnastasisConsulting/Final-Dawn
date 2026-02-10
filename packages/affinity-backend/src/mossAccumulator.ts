
import { TensionState } from "./types.js";

export class MossAccumulator {
  static update(
    state: TensionState,
    affinityWeight: number,
    relationalDelta: number,
    actionImpact: number
  ): TensionState {
    const delta = affinityWeight * relationalDelta * actionImpact;

    let recent = state.recent + delta * 0.25;
    let longTerm = state.longTerm + delta * 0.05;

    recent *= 0.85;
    longTerm *= 0.99;

    recent = Math.max(-100, Math.min(100, recent));
    longTerm = Math.max(-100, Math.min(100, longTerm));

    return { recent, longTerm };
  }

  static total(state: TensionState): number {
    return state.recent * 0.7 + state.longTerm * 0.3;
  }

  static band(total: number): string {
    const a = Math.abs(total);
    if (a < 20) return "Stable";
    if (a < 40) return "Uneasy";
    if (a < 60) return "Vocal";
    if (a < 80) return "Defiant";
    return "Autonomous";
  }
}
