
import { SimulationEngine } from "./simEngine.js";

export const engine = new SimulationEngine();

export function registerEntity(entity) {
  engine.addEntity(entity);
}

export function applyDelta(delta) {
  engine.applyRelationalDelta(delta);
}

export function step() {
  return engine.tick();
}
