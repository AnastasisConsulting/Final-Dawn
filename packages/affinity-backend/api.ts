import { SimulationEngine } from "./simEngine";
import { Entity, RelationalLink } from "./types";

export const engine = new SimulationEngine();

export function registerEntity(entity: Entity) {
    engine.addEntity(entity);
}

export function applyRelationalActuator(
    links: RelationalLink[]
) {
    engine.applyRelationalActuator(links);
}

export function applyMossDelta(
    entityId: string,
    delta: number
) {
    engine.applyMossDelta(entityId, delta);
}

export function step() {
    return engine.tick();
}
