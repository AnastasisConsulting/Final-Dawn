// PATH: src/cli.ts
import fs from "node:fs";
import { defaultConfig } from "./config.js";
import { buildXpTables } from "./xpTables.js";
import { enemyXpRangesForLevel } from "./enemyXp.js";

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const v = argv[i + 1];
      if (!v || v.startsWith("--")) {
        args[k] = true;
      } else {
        args[k] = v;
        i++;
      }
    }
  }
  return args;
}

function writeOut(outPath: string | undefined, payload: unknown) {
  const s = JSON.stringify(payload, null, 2);
  if (outPath && outPath.length > 0) fs.writeFileSync(outPath, s, "utf-8");
  else process.stdout.write(s + "\n");
}

function cmdTable(args: Record<string, string | boolean>) {
  const cfg = defaultConfig();
  const table = buildXpTables(cfg);

  const levels: Record<string, any> = {};
  for (let level = 0; level <= 21; level++) {
    levels[String(level)] = {
      xp_to_next: table.xpToNext[level] ?? null,
      total_xp_to_reach: table.totalToReach[level],
    };
  }

  const payload = {
    levels,
    meta: {
      level_min: 0,
      level_max: 21,
      total_xp_to_level_21: table.totalXp,
      segments: {
        steps_per_segment: cfg.stepsPerSegment,
        weights: cfg.segWeights,
        ratios: [cfg.r1, cfg.r2, cfg.r3],
      },
    },
  };

  writeOut(typeof args["out"] === "string" ? (args["out"] as string) : "", payload);
}

function cmdEnemyXp(args: Record<string, string | boolean>) {
  const cfg = defaultConfig();
  const levelRaw = args["level"];
  if (typeof levelRaw !== "string") throw new Error("--level is required");
  const level = Number(levelRaw);
  if (!Number.isFinite(level)) throw new Error("--level must be a number");

  const table = buildXpTables(cfg);
  const tiers = enemyXpRangesForLevel(level, cfg);

  const payload = {
    level,
    base_xp_to_next: table.xpToNext[level],
    tiers: Object.fromEntries(
      Object.entries(tiers).map(([k, v]) => [
        k,
        {
          nominal: v.nominal,
          range: [v.lo, v.hi],
          weight: (cfg.enemyXpWeights as any)[k],
          variance: (cfg.enemyXpVariance as any)[k],
        },
      ])
    ),
    meta: {
      legendary_rule: "legendary grants 0 XP; reward via items/flags",
      tier_weights: cfg.enemyXpWeights,
      tier_variance: cfg.enemyXpVariance,
    },
  };

  writeOut(typeof args["out"] === "string" ? (args["out"] as string) : "", payload);
}

export function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const args = parseArgs(argv.slice(1));
  if (cmd === "table") return cmdTable(args);
  if (cmd === "enemy-xp") return cmdEnemyXp(args);
  throw new Error("Usage: eideus-xp <table|enemy-xp> [--out file] [--level N]");
}

main();
