import { Scale, ScaleState } from "./scaleTypes";
import { tickMultiplier } from "./scaleSpeed";
import { applyGears } from "./gearLogic";

export class ScaleNode {
    readonly id: string;
    readonly scale: Scale;
    state: ScaleState;

    parent?: ScaleNode;

    constructor(
        id: string,
        scale: Scale,
        initial: ScaleState
    ) {
        this.id = id;
        this.scale = scale;
        this.state = initial;
    }

    tick(baseDt: number) {
        const dt = baseDt * tickMultiplier(this.scale);
        this.state = applyGears(this.state, dt);
    }

    propagateUp() {
        if (!this.parent) return;

        // unrest always propagates upward
        this.parent.state.unrest += this.state.unrest * 0.1;
    }
}
