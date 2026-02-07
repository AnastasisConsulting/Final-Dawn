// PATH: src/demo.ts
import { compileSkillDescription, deriveCrossClass } from "./compiler.js";

const level = 21;
const coreClass = "Rebel";
const subClass = "Merc";
const crossClass = deriveCrossClass(coreClass, subClass);

const desc = compileSkillDescription({
  level,
  coreClass,
  subClass,
  crossClass,
  slot: "E6",
  mode: "narrative",
  sceneContext: "A border checkpoint dispute escalates in the rain-lit docking bay.",
  cooldownRemainingTurns: 3
});

console.log(desc);
