import { AnimationIntent } from "../intent/IntentSchema";
import { AliveObjectState, SubObjectState } from "./ProceduralState";

export class AliveEngine {
  private t = 0;

  private sub(base: number): SubObjectState {
    return {
      rotationSpeed: base,
      rotationDir: Math.random() > 0.5 ? 1 : -1,
      scale: 1,
      luminosity: 1,
      colorShift: 0,
      fold: 0,
      offset: { x: 0, y: 0, z: 0 }
    };
  }

  state: AliveObjectState = {
    sphere: this.sub(0.1),
    rings: [this.sub(0.2), this.sub(0.15), this.sub(0.25)],
    innerParticles: this.sub(0.4),
    outerParticles: this.sub(0.3),
    globalOffset: { x: 0, y: 0 }
  };

  update(intent: AnimationIntent, dt: number): AliveObjectState {
    this.t += dt * (0.5 + intent.energy);

    const pulse = Math.sin(this.t);
    const chaos = Math.sin(this.t * 3.17);

    this.state.sphere.fold = pulse * intent.energy;
    this.state.sphere.luminosity = 1 + intent.mood * 0.5;
    this.state.sphere.colorShift = chaos * 0.2;

    this.state.rings.forEach((r, i) => {
      r.rotationSpeed = (0.2 + i * 0.1) * (0.5 + intent.energy);
      r.rotationDir = Math.sign(Math.sin(this.t + i));
      r.luminosity = 0.8 + intent.mood * 0.4;
      r.colorShift = Math.sin(this.t + i) * 0.3;
    });

    [this.state.innerParticles, this.state.outerParticles].forEach((p, i) => {
      p.rotationSpeed = (0.6 - i * 0.2) * (0.5 + intent.energy);
      p.scale = 1 + pulse * 0.3;
      p.offset.x = Math.sin(this.t * 2 + i) * 0.2;
      p.offset.y = Math.cos(this.t * 2 + i) * 0.2;
      p.colorShift = chaos * 0.4;
    });

    this.state.globalOffset.x = Math.sin(this.t * 0.1) * intent.curiosity * 2;
    this.state.globalOffset.y = Math.cos(this.t * 0.13) * intent.curiosity * 2;

    return this.state;
  }
}
