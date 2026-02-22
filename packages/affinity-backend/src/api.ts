
import { SimulationEngine } from "./simEngine.js";

export const engine = new SimulationEngine();

export function registerEntity(entity: any) {
  engine.addEntity(entity);
}

export function applyDelta(delta: any) {
  engine.applyRelationalDelta(delta);
}

export function step() {
  return engine.tick();
}
