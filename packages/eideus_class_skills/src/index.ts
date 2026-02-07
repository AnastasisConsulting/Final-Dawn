// PATH: src/index.ts
export { TEMPLATE } from "./fractalTemplate.js";
export { getAllowedSkillSlots, getActiveIdentityTier } from "./access.js";
export { parseTemplateKey } from "./keys.js";
export { deriveCrossClass, getSkillDefFor, compileSkillDescription } from "./compiler.js";
export type { Affinity, SkillSlot, SkillTier, SceneMode, CompileInput, SkillDef, Template } from "./types.js";
