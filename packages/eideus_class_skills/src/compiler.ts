// PATH: src/compiler.ts
import { TEMPLATE } from "./fractalTemplate.js";
import { getActiveIdentityTier, getAllowedSkillSlots } from "./access.js";
import type { CompileInput, SkillDef, SkillSlot } from "./types.js";

function normalizeBuildLabel(subClass: string, crossClass: string): string {
  return `${subClass} -> ${crossClass}`;
}

export function deriveCrossClass(coreClass: string, subClass: string): string {
  const core = TEMPLATE.cores[coreClass];
  if (!core) throw new Error(`Unknown core class: ${coreClass}`);

  const sub = TEMPLATE.subs?.[coreClass]?.[subClass];
  if (!sub) throw new Error(`Unknown sub class for core ${coreClass}: ${subClass}`);

  const coreAff = core.affinity;
  const subAff = sub.affinity;
  const key = `${coreAff}/${subAff}`;

  const crossGroup = TEMPLATE.crosses?.[coreClass];
  if (!crossGroup) throw new Error(`No cross classes configured for core: ${coreClass}`);

  for (const [crossName, def] of Object.entries(crossGroup)) {
    if (def.core_sub_key === key) return crossName;
  }
  throw new Error(`No cross class matches key ${key} for core ${coreClass}`);
}

export function getSkillDefFor(input: CompileInput): SkillDef {
  const { coreClass, subClass, crossClass, slot } = input;

  if (!TEMPLATE.builds[coreClass]) throw new Error(`No builds found for core: ${coreClass}`);

  // Determine cross if needed
  let cross = crossClass ?? null;
  let sub = subClass ?? null;

  if (!sub && slot !== "E1" && slot !== "E2") {
    throw new Error(`Sub class is required to access slot ${slot}`);
  }

  if (!cross && sub) cross = deriveCrossClass(coreClass, sub);

  // Find the build label (Sub -> Cross)
  if (!sub || !cross) {
    // Core-only access: use any build under the core, core skills are identical across builds.
    const firstBuild = Object.values(TEMPLATE.builds[coreClass])[0];
    if (!firstBuild) throw new Error(`Missing builds for core: ${coreClass}`);
    return firstBuild[slot];
  }

  const buildLabel = normalizeBuildLabel(sub, cross);

  const build = TEMPLATE.builds[coreClass][buildLabel];
  if (!build) {
    const available = Object.keys(TEMPLATE.builds[coreClass]).join(", ");
    throw new Error(`Unknown build '${buildLabel}' for core '${coreClass}'. Available: ${available}`);
  }
  return build[slot];
}

function describeIdentity(level: number, coreClass: string, subClass?: string | null, crossClass?: string | null): string {
  const tier = getActiveIdentityTier(level);

  const coreDef = TEMPLATE.cores[coreClass];
  if (!coreDef) throw new Error(`Unknown core class: ${coreClass}`);

  const coreLine = `${coreClass} (${coreDef.affinity}) — ${coreDef.description}`;

  if (tier === "core") {
    return `Core: ${coreLine}`;
  }

  const sub = subClass ?? null;
  if (!sub) throw new Error(`Sub class required at level ${level}`);

  const subDef = TEMPLATE.subs?.[coreClass]?.[sub];
  if (!subDef) throw new Error(`Unknown sub class for core ${coreClass}: ${sub}`);

  const subLine = `${sub} (${subDef.affinity}) — ${subDef.description}`;

  let cross = crossClass ?? deriveCrossClass(coreClass, sub);
  const crossDef = TEMPLATE.crosses?.[coreClass]?.[cross];
  if (!crossDef) throw new Error(`Unknown cross class for core ${coreClass}: ${cross}`);

  const crossLine = `${cross} — ${crossDef.description}`;

  if (tier === "core_sub") {
    return `Core/Sub: ${coreLine}. Sub: ${subLine}.`;
  }
  if (tier === "cross") {
    return `Cross: ${crossLine} (evolved from ${coreClass}/${sub}).`;
  }
  // mastery
  return `Mastery: ${cross} (Mastery). ${crossDef.description} (evolved from ${coreClass}/${sub}).`;
}

export function compileSkillDescription(input: CompileInput): string {
  const {
    level,
    coreClass,
    subClass = null,
    crossClass = null,
    slot,
    mode = "narrative",
    sceneContext = "",
    cooldownRemainingTurns
  } = input;

  const allowed = getAllowedSkillSlots(level);
  if (!allowed.includes(slot)) {
    throw new Error(`Skill slot ${slot} is not allowed at level ${level}. Allowed: ${allowed.join(", ")}`);
  }

  const identity = describeIdentity(level, coreClass, subClass, crossClass);
  const skill = getSkillDefFor({ ...input, subClass, crossClass });

  const cdLine =
    typeof cooldownRemainingTurns === "number"
      ? `Cooldown: ${cooldownRemainingTurns} turns remaining after use.`
      : `Cooldown: (not provided).`;

  const contextLine = sceneContext.trim() ? `Scene: ${sceneContext.trim()}` : `Scene: (none).`;

  const affinityStr = skill.affinity === null ? "none" : skill.affinity;

  // Deterministic, short, LLM-facing.
  return [
    identity,
    `Skill Used (${slot}, ${skill.tier}): ${skill.name} (affinity: ${affinityStr}). ${skill.desc}`,
    cdLine,
    `Mode: ${mode}.`,
    contextLine,
    `Narration constraint: narrate only what is implied above; do not invent new abilities.`
  ].join("\n");
}
