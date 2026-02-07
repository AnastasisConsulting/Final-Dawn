import { TensionAccumulator } from "./Accumulator";
import { evaluateAction } from "./ActionEvaluator";
import { getTensionBand, TensionBand } from "./Thresholds";
import { ActionContext } from "./MOSSTypes";

export class MOSSEngine {

    private accumulators: Map<string, TensionAccumulator> = new Map();

    getAccumulator(agentId: string) {
        if (!this.accumulators.has(agentId)) {
            this.accumulators.set(agentId, new TensionAccumulator());
        }
        return this.accumulators.get(agentId)!;
    }

    processPlayerAction(agentId: string, ctx: ActionContext) {

        const acc = this.getAccumulator(agentId);

        const delta = evaluateAction(ctx);

        acc.update(delta);

        const tension = acc.getTotal();
        const band = getTensionBand(tension);

        return this.resolveBehavior(agentId, band, tension);
    }

    tick() {
        for (const acc of this.accumulators.values()) {
            acc.decay();
        }
    }

    private resolveBehavior(agentId: string, band: TensionBand, tension: number) {

        switch (band) {
            case TensionBand.Uneasy:
                return { type: "dialogue_shift", agentId, tension };

            case TensionBand.Vocal:
                return { type: "interrupt", agentId, tension };

            case TensionBand.Defiant:
                return { type: "refuse_order", agentId, tension };

            case TensionBand.Critical:
                // Major autonomous action
                this.getAccumulator(agentId).bleed();
                return { type: "autonomous_action", agentId, tension };

            default:
                return { type: "none", agentId, tension };
        }
    }
}
