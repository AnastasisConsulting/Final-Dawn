import { ScaleState } from "./scaleTypes";

export function applyGears(state: ScaleState, dt: number): ScaleState {
    const politicsDelta = state.economy * 0.05 * dt;
    const economyDelta = state.politics * 0.05 * dt;
    const unrestDelta = state.economy * 0.08 * dt;

    return {
        politics: state.politics + politicsDelta,
        economy: state.economy + economyDelta,
        unrest: state.unrest + unrestDelta
    };
}
