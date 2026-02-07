// PATH: src/types.ts
export type Affinity = "str" | "dex" | "int";
export type SkillSlot = "E1" | "E2" | "E3" | "E4" | "E5" | "E6" | "E7";
export type SkillTier = "core" | "sub" | "cross" | "mastery";
export type SceneMode = "narrative" | "combat";

export interface SkillDef {
  name: string;
  tier: SkillTier;
  affinity: Affinity | null;
  kind: string;
  desc: string;
}

export interface Template {
  domain: string;
  version: string;
  tier_descriptions: Record<string, string>;
  skill_tier_rules: Record<string, unknown>;
  affinity_matrix: Record<Affinity, Record<Affinity, number>>;
  cores: Record<string, { affinity: Affinity; description: string }>;
  subs: Record<string, Record<string, { affinity: Affinity; description: string }>>;
  crosses: Record<string, Record<string, { core_sub_key: string; description: string }>>;
  elements_E1_to_E7: Record<SkillSlot, string>;
  skill_access_by_level: Array<{ level_min: number; level_max: number | null; slots: SkillSlot[] }>;
  builds: Record<string, Record<string, Record<SkillSlot, SkillDef>>>;
}

export interface SkillKeyParts {
  core: string;
  modifier: string; // "Sub -> Cross" label
  slot?: SkillSlot;
}

export interface CompileInput {
  // identity
  level: number;
  coreClass: string;
  subClass?: string | null;
  crossClass?: string | null;

  // what is being invoked
  slot: SkillSlot;

  // narration controls
  mode?: SceneMode;
  sceneContext?: string;

  // cooldown state (optional)
  cooldownRemainingTurns?: number;
}
