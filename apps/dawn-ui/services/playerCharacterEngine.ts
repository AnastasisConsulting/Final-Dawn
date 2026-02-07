// /src/engine/playerCharacterEngine.ts
/* eslint-disable @typescript-eslint/no-unused-vars */

export type Affinity = "STR" | "DEX" | "INT";
export type CoreClass = "VANGUARD" | "SHADE" | "CIPHER";
export type SubClassFlavor = "CORE" | "DEX" | "INT"; // within a core row (CORE=core/core)
export type Depth = "ACTIVE" | "PASSIVE" | "MOD";

export type SkillTone = "SOFT" | "HARD" | "ULTIMATE";

export interface PlayerBuild {
  core: CoreClass; // chosen at new game
  subFlavor?: SubClassFlavor; // unlocked at level 7
  crossCore?: CoreClass; // unlocked at level 14 (optional)
}

export interface XPState {
  coreLevel: number; // 1..21
  coreXP: number; // current XP toward next
  subclassXP: number; // mastery pool (unlocked at 7)
  subclassRank: number; // 0..?
}

export interface CombatContext {
  attackerCore: CoreClass;
  attackerSubFlavor?: SubClassFlavor;
  defenderCore: CoreClass;
  defenderSubFlavor?: SubClassFlavor;
  defenderStance?: Affinity; // if omitted, defaults to defender core affinity
}

export interface SkillSlot {
  id: string;
  depth: Depth;
  affinity: Affinity;
  tone: SkillTone;
  unlockLevel: number; // core level gate
}

export interface PlayerCharacter {
  id: string;
  name: string;
  build: PlayerBuild;
  xp: XPState;
}

const MAX_LEVEL = 21;

// ---------- Affinity Mapping ----------
export function coreAffinity(core: CoreClass): Affinity {
  switch (core) {
    case "VANGUARD":
      return "STR";
    case "SHADE":
      return "DEX";
    case "CIPHER":
      return "INT";
  }
}

export function flavorAffinity(flavor: SubClassFlavor, core: CoreClass): Affinity {
  if (flavor === "CORE") return coreAffinity(core);
  return flavor; // "DEX" or "INT"
}

// Your canonical table encoded as advantage/neutral/disadvantage.
// STR beats INT; INT beats DEX; DEX beats STR.
export function affinityMultiplier(att: Affinity, def: Affinity): number {
  if (att === def) return 1.0;
  if (att === "STR" && def === "INT") return 1.25;
  if (att === "INT" && def === "DEX") return 1.25;
  if (att === "DEX" && def === "STR") return 1.25;
  return 0.8; // disadvantage
}

// ---------- Level Curve (Core) ----------
/**
 * XP needed to advance from level L -> L+1 (L in [1..20]).
 * 1-7 fast, 7-14 steeper, 14-21 very steep.
 */
export function coreXPToNext(level: number): number {
  if (level < 1 || level >= MAX_LEVEL) return 0;

  // 1..6
  if (level < 7) {
    // 50,60,70,80,90,100
    return 40 + level * 10;
  }

  // 7..13
  if (level < 14) {
    // 7->8:140 up to 13->14:260 (step 20)
    return 120 + (level - 6) * 20;
  }

  // 14..20
  // 14->15:400 up to 20->21:880 (step 80)
  return 320 + (level - 13) * 80;
}

/**
 * Subclass mastery XP costs:
 * - before 7: locked
 * - core 7..14: 2x core
 * - core 14..21: 3x core
 */
export function subclassXPToNext(coreLevel: number, subclassRank: number): number {
  if (coreLevel < 7) return Number.POSITIVE_INFINITY;
  const base = coreXPToNext(Math.min(coreLevel, 20)); // tie mastery pacing to current band
  if (coreLevel < 14) return base * 2;
  return base * 3;
}

// ---------- Standard Attack Power (1..21) ----------
/**
 * Standard (infinite-use) attack power on 1..255 scale.
 * Steepens at 7, 14, 21 per your request.
 */
export function standardAttackPower(level: number): number {
  const table: number[] = [
    0, // dummy index 0
    10, 11, 12, 13, 14, 15, 17, 20, 23, 28, 33, 38, 45, 53, 67, 83, 104, 130, 163, 204, 255,
  ];
  const clamped = Math.max(1, Math.min(MAX_LEVEL, level));
  return table[clamped];
}

// ---------- 3×3×Depth Skill Slot Layout ----------
/**
 * You described:
 * - 3 horizontal tiers (1-7, 7-14, 14-21) as level gating
 * - column affinities STR/DEX/INT
 * - depth dimension active/passive/mod
 *
 * We implement the *under-the-hood slot system* here:
 * - Actives: 2 sets of 3 (soft/hard per affinity) + 1 ultimate
 * - Passives: parallel 2 sets of 3 (soft/hard per affinity) + 1 ultimate passive
 * - Mods: tiered mastery slots (no button, just modifiers)
 */
export function buildDefaultSlots(core: CoreClass): SkillSlot[] {
  const aCore = coreAffinity(core);

  // Active unlock schedule:
  // L1: soft core affinity
  // L2/L3: soft off affinities
  // L7: hard primary identity (subclass decides which affinity becomes "primary hard" — we keep all three hard gates spread)
  // L8: hard secondary #1
  // L10: hard secondary #2
  // L21: ultimate
  const affinities: Affinity[] = ["STR", "DEX", "INT"];
  const softOrder: Affinity[] = [aCore, ...affinities.filter((a) => a !== aCore)];
  const hardOrder: Affinity[] = [aCore, ...affinities.filter((a) => a !== aCore)];

  const slots: SkillSlot[] = [];

  // Soft Actives
  slots.push({ id: `A_SOFT_${softOrder[0]}`, depth: "ACTIVE", affinity: softOrder[0], tone: "SOFT", unlockLevel: 1 });
  slots.push({ id: `A_SOFT_${softOrder[1]}`, depth: "ACTIVE", affinity: softOrder[1], tone: "SOFT", unlockLevel: 2 });
  slots.push({ id: `A_SOFT_${softOrder[2]}`, depth: "ACTIVE", affinity: softOrder[2], tone: "SOFT", unlockLevel: 3 });

  // Hard Actives (unlocked by tier; which one becomes "signature" is decided by subclass flavor at runtime)
  slots.push({ id: `A_HARD_${hardOrder[0]}`, depth: "ACTIVE", affinity: hardOrder[0], tone: "HARD", unlockLevel: 7 });
  slots.push({ id: `A_HARD_${hardOrder[1]}`, depth: "ACTIVE", affinity: hardOrder[1], tone: "HARD", unlockLevel: 8 });
  slots.push({ id: `A_HARD_${hardOrder[2]}`, depth: "ACTIVE", affinity: hardOrder[2], tone: "HARD", unlockLevel: 10 });

  // Ultimate Active (typed by core+sub at runtime; affinity here defaults to core)
  slots.push({ id: `A_ULT_${aCore}`, depth: "ACTIVE", affinity: aCore, tone: "ULTIMATE", unlockLevel: 21 });

  // Passives mirror actives: soft passives early, hard passives in tier 2, ultimate passive at 21
  slots.push({ id: `P_SOFT_${softOrder[0]}`, depth: "PASSIVE", affinity: softOrder[0], tone: "SOFT", unlockLevel: 1 });
  slots.push({ id: `P_SOFT_${softOrder[1]}`, depth: "PASSIVE", affinity: softOrder[1], tone: "SOFT", unlockLevel: 2 });
  slots.push({ id: `P_SOFT_${softOrder[2]}`, depth: "PASSIVE", affinity: softOrder[2], tone: "SOFT", unlockLevel: 3 });

  slots.push({ id: `P_HARD_${hardOrder[0]}`, depth: "PASSIVE", affinity: hardOrder[0], tone: "HARD", unlockLevel: 7 });
  slots.push({ id: `P_HARD_${hardOrder[1]}`, depth: "PASSIVE", affinity: hardOrder[1], tone: "HARD", unlockLevel: 9 });
  slots.push({ id: `P_HARD_${hardOrder[2]}`, depth: "PASSIVE", affinity: hardOrder[2], tone: "HARD", unlockLevel: 11 });

  slots.push({ id: `P_ULT_${aCore}`, depth: "PASSIVE", affinity: aCore, tone: "ULTIMATE", unlockLevel: 21 });

  // Mods (depth 3-ish): tiered “build shaping”, not actives
  // L4/6: tiny (tier1), L12/13: mid (tier2), L15/17/19/20: endgame shaping
  const modLevels = [4, 6, 12, 13, 15, 17, 19, 20];
  for (let i = 0; i < modLevels.length; i++) {
    slots.push({ id: `M_${i + 1}`, depth: "MOD", affinity: aCore, tone: "SOFT", unlockLevel: modLevels[i] });
  }

  return slots;
}

export function unlockedSlots(pc: PlayerCharacter): SkillSlot[] {
  const slots = buildDefaultSlots(pc.build.core);
  return slots.filter((s) => s.unlockLevel <= pc.xp.coreLevel);
}

// ---------- Passive Packages (core/sub identity) ----------
export interface PassivePackage {
  name: string;
  // Numbers are deliberately small; real power comes from matchup + cooldown economy.
  // These are "rule-bending" knobs, not raw god multipliers.
  cooldownMult?: number; // e.g. 0.95 means 5% faster cooldowns
  damageMult?: number; // e.g. 1.05 means 5% more damage
  penetration?: number; // 0..1, how much defenses are bypassed
  tempo?: number; // initiative/turn priority bias
  disruption?: number; // debuff effectiveness
}

export function passivePackageFor(build: PlayerBuild): PassivePackage {
  const coreA = coreAffinity(build.core);
  const subA = build.subFlavor ? flavorAffinity(build.subFlavor, build.core) : coreA;

  // Pure: bigger “simple” output. Mixed: smarter knobs.
  const pure = coreA === subA;

  if (coreA === "STR" && subA === "STR") return { name: "Brute Force", damageMult: pure ? 1.06 : 1.03, tempo: 0.02 };
  if (coreA === "DEX" && subA === "DEX") return { name: "Subversive Force", cooldownMult: pure ? 0.94 : 0.97, tempo: 0.04 };
  if (coreA === "INT" && subA === "INT") return { name: "Tech/Magic Power", disruption: pure ? 0.08 : 0.05, penetration: 0.03 };

  // Mixed pairings (smarter counters)
  if (coreA === "STR" && subA === "INT") return { name: "Precision", penetration: 0.08, damageMult: 1.02 };
  if (coreA === "STR" && subA === "DEX") return { name: "Fluency", cooldownMult: 0.96, tempo: 0.03 };

  if (coreA === "DEX" && subA === "INT") return { name: "Disruption", disruption: 0.1, cooldownMult: 0.98 };
  if (coreA === "DEX" && subA === "STR") return { name: "Momentum", damageMult: 1.03, tempo: 0.03 };

  if (coreA === "INT" && subA === "STR") return { name: "Overcharge", damageMult: 1.02, penetration: 0.06 };
  if (coreA === "INT" && subA === "DEX") return { name: "Trickery", cooldownMult: 0.97, disruption: 0.06, tempo: 0.02 };

  return { name: "Neutral" };
}

// ---------- XP / Leveling Engine ----------
export function createPlayerCharacter(id: string, name: string, core: CoreClass): PlayerCharacter {
  return {
    id,
    name,
    build: { core },
    xp: { coreLevel: 1, coreXP: 0, subclassXP: 0, subclassRank: 0 },
  };
}

export interface GainXPResult {
  leveledUp: boolean;
  newCoreLevel: number;
  unlockedAt7: boolean;
  unlockedAt14: boolean;
  unlockedAt21: boolean;
  subclassRankUp: boolean;
}

export function gainXP(pc: PlayerCharacter, amount: number): GainXPResult {
  let leveledUp = false;
  let subclassRankUp = false;
  const prev = pc.xp.coreLevel;

  pc.xp.coreXP += Math.max(0, Math.floor(amount));

  // Core level ups
  while (pc.xp.coreLevel < MAX_LEVEL) {
    const need = coreXPToNext(pc.xp.coreLevel);
    if (need <= 0) break;
    if (pc.xp.coreXP < need) break;
    pc.xp.coreXP -= need;
    pc.xp.coreLevel++;
    leveledUp = true;
  }

  // Subclass mastery XP accrues only after 7
  if (pc.xp.coreLevel >= 7) {
    pc.xp.subclassXP += Math.max(0, Math.floor(amount));
    while (true) {
      const need = subclassXPToNext(pc.xp.coreLevel, pc.xp.subclassRank);
      if (!Number.isFinite(need)) break;
      if (pc.xp.subclassXP < need) break;
      pc.xp.subclassXP -= need;
      pc.xp.subclassRank++;
      subclassRankUp = true;
    }
  }

  return {
    leveledUp,
    newCoreLevel: pc.xp.coreLevel,
    unlockedAt7: prev < 7 && pc.xp.coreLevel >= 7,
    unlockedAt14: prev < 14 && pc.xp.coreLevel >= 14,
    unlockedAt21: prev < 21 && pc.xp.coreLevel >= 21,
    subclassRankUp,
  };
}

// ---------- Build Choices at Gates ----------
export function chooseSubclass(pc: PlayerCharacter, flavor: SubClassFlavor): void {
  if (pc.xp.coreLevel < 7) throw new Error("Subclass locked until core level 7.");
  pc.build.subFlavor = flavor;
}

export function chooseCrossCore(pc: PlayerCharacter, cross: CoreClass): void {
  if (pc.xp.coreLevel < 14) throw new Error("Cross-core locked until core level 14.");
  if (cross === pc.build.core) throw new Error("Cross-core must differ from core.");
  pc.build.crossCore = cross;
}

// ---------- Combat Resolution (under-the-hood mechanics) ----------
export type AttackKind = "STANDARD" | "SOFT" | "HARD" | "ULTIMATE";

export interface AttackSpec {
  kind: AttackKind;
  affinity: Affinity; // the skill’s affinity column
  basePowerOverride?: number; // optional direct tuning
}

export interface ResolvedHit {
  basePower: number;
  matchupMult: number;
  passiveDamageMult: number;
  finalPower: number; // integer 1..255-ish scale (can exceed if you allow)
}

export function resolveHit(pc: PlayerCharacter, ctx: CombatContext, atk: AttackSpec): ResolvedHit {
  const level = pc.xp.coreLevel;
  const base = atk.basePowerOverride ?? standardAttackPower(level);

  // Skill kind multipliers (kept modest; real swing comes from cooldowns + matchup)
  const kindMult =
    atk.kind === "STANDARD" ? 1.0 : atk.kind === "SOFT" ? 0.75 : atk.kind === "HARD" ? 1.3 : 2.2;

  const defA: Affinity = ctx.defenderStance ?? coreAffinity(ctx.defenderCore);
  const matchupMult = affinityMultiplier(atk.affinity, defA);

  const pass = passivePackageFor(pc.build);
  const passiveDamageMult = pass.damageMult ?? 1.0;

  const final = Math.max(1, Math.round(base * kindMult * matchupMult * passiveDamageMult));
  return { basePower: Math.round(base * kindMult), matchupMult, passiveDamageMult, finalPower: final };
}
