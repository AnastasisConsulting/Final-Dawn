// PATH: src/access.ts
import type { SkillSlot } from "./types.js";
import { TEMPLATE } from "./fractalTemplate.js";

export type IdentityTier = "core" | "core_sub" | "cross" | "mastery";

export function getActiveIdentityTier(level: number): IdentityTier {
  if (level < 7) return "core";
  if (level < 14) return "core_sub";
  if (level < 21) return "cross";
  return "mastery";
}

export function getAllowedSkillSlots(level: number): SkillSlot[] {
  const rules = TEMPLATE.skill_access_by_level;
  for (const r of rules) {
    const max = r.level_max ?? Number.POSITIVE_INFINITY;
    if (level >= r.level_min && level <= max) return r.slots;
  }
  // Should never happen if rules cover all levels.
  return ["E1", "E2"];
}
