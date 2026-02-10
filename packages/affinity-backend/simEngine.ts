import { Entity, RelationalLink } from "./types";
import { MossAccumulator } from "./mossAccumulator";
import { RelationalActuator } from "./relationalActuator";

export class SimulationEngine {

    entities = new Map<string, Entity>();

    // world-facing actuators
    regionalPublicUnrest = 0;
    intergalacticDiplomacyTension = 0;

    addEntity(entity: Entity) {
        this.entities.set(entity.id, entity);
    }

    applyRelationalActuator(links: RelationalLink[]) {
        const pressure = RelationalActuator.computePressure(links);

        // micro → macro bleed
        // Use the 'macro' component for system-wide tension
        this.regionalPublicUnrest += pressure.macro * 0.1;
        this.intergalacticDiplomacyTension += pressure.macro * 0.05;
    }

    applyMossDelta(entityId: string, delta: number) {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        entity.tension =
            MossAccumulator.update(entity.tension, delta);
    }

    tick() {
        // 1. Snapshot State
        const snapshot = [];
        let totalSystemicTension = 0;

        // 2. Iterate Entities
        for (const entity of this.entities.values()) {
            // A. Apply autonomous decay/bleed
            const total = MossAccumulator.total(entity.tension);

            // bleed logic: if tension is high, it infects neighbors (conceptually)
            // for now, we just act on the entity itself
            if (Math.abs(total) > 50) {
                // High tension entities generate "Unrest"
                this.regionalPublicUnrest += 0.5;
            }

            // B. Capture Snapshot
            snapshot.push({
                id: entity.id,
                tension: total,
                band: MossAccumulator.band(total)
            });

            totalSystemicTension += Math.abs(total);
        }

        // 3. Macro Churn (The Three Gears)
        // Public Unrest (Chaos) -> Diplomatic Tension (Order) -> Economic Strain (Flow)

        // Decay public unrest if diplomacy is high (Police State)
        if (this.intergalacticDiplomacyTension > 50) {
            this.regionalPublicUnrest = Math.max(0, this.regionalPublicUnrest - 1);
        }

        // 4. Return World State
        return {
            entities: snapshot,
            systemic: {
                unrest: parseFloat(this.regionalPublicUnrest.toFixed(2)),
                diplomacy: parseFloat(this.intergalacticDiplomacyTension.toFixed(2)),
                globalTension: parseFloat(totalSystemicTension.toFixed(2))
            }
        };
    }

}
