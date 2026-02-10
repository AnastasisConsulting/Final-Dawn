
import { Entity, RelationalDelta } from "./types.js";
import { affinityMatrix } from "./affinityMatrix.js";
import { MossAccumulator } from "./mossAccumulator.js";

export class SimulationEngine {
  entities = new Map<string, Entity>();

  addEntity(e: Entity) {
    this.entities.set(e.id, e);
  }

  applyRelationalDelta(r: RelationalDelta, actionImpact = 1) {
    const src = this.entities.get(r.source);
    const tgt = this.entities.get(r.target);
    if (!src || !tgt) return;

    const affinityWeight = affinityMatrix[src.affinity][tgt.affinity];

    tgt.tension = MossAccumulator.update(
      tgt.tension,
      affinityWeight,
      r.delta,
      actionImpact
    );
  }

  tick() {
    const outputs = [];
    for (const e of this.entities.values()) {
      const total = MossAccumulator.total(e.tension);
      outputs.push({ id: e.id, tension: total, band: MossAccumulator.band(total) });

      if (Math.abs(total) >= 80) {
        e.tension.recent *= 0.6;
      }
    }
    return outputs;
  }
}
