export interface SubObjectState {
  rotationSpeed: number;
  rotationDir: number;
  scale: number;
  luminosity: number;
  colorShift: number;
  fold: number;
  offset: { x: number; y: number; z: number };
}

export interface AliveObjectState {
  sphere: SubObjectState;
  rings: SubObjectState[];
  innerParticles: SubObjectState;
  outerParticles: SubObjectState;
  globalOffset: { x: number; y: number };
}
