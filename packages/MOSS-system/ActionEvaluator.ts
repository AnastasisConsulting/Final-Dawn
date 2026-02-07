import { Affinity, ActionContext } from "./MOSSTypes";

const AFFINITY_TABLE: Record<Affinity, Record<Affinity, number>> = {
    STR: { STR: 1, INT: 0, DEX: -1 },
    INT: { STR: -1, INT: 1, DEX: 0 },
    DEX: { STR: 0, INT: -1, DEX: 1 }
};

export function evaluateAction(ctx: ActionContext): number {
    const weight = AFFINITY_TABLE[ctx.actorAffinity][ctx.targetAffinity];

    // First derivative of relationship
    const delta = weight * ctx.relationalDelta * ctx.impact;

    // Small perception noise (misinterpretation)
    const noise = (Math.random() - 0.5) * 0.1;

    return delta * (1 + noise);
}
