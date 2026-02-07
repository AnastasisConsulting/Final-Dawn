// /src/cli.ts
import * as fs from "node:fs";
import * as path from "node:path";
import { readJson, writeJson } from "./io";
import { bindWorldBundle } from "./binder";

type Args = {
  lorebook: string;
  sectorMap: string;
  quests: string;
  sourceSeed: string;
  outDir: string;
};

function parseArgs(argv: string[]): Args {
  const a: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (!k.startsWith("--")) continue;
    a[k.slice(2)] = v ?? "true";
    i++;
  }

  const lorebook = a.lorebook ?? "";
  const sectorMap = a.sectorMap ?? "";
  const quests = a.quests ?? "";
  const sourceSeed = a.sourceSeed ?? "";
  const outDir = a.outDir ?? "";

  if (!lorebook) throw new Error("Missing --lorebook <path>");
  if (!sectorMap) throw new Error("Missing --sectorMap <path>");
  if (!quests) throw new Error("Missing --quests <path>");
  if (!sourceSeed) throw new Error("Missing --sourceSeed <path>");
  if (!outDir) throw new Error("Missing --outDir <dir>");

  return { lorebook, sectorMap, quests, sourceSeed, outDir };
}

async function main() {
  const args = parseArgs(process.argv);

  const lorebook = readJson<any>(args.lorebook);
  const sectorMap = readJson<any>(args.sectorMap);
  const quests = readJson<any>(args.quests);
  const sourceSeed = readJson<any>(args.sourceSeed);

  const out = bindWorldBundle({ lorebook, sectorMap, quests, sourceSeed });

  fs.mkdirSync(args.outDir, { recursive: true });

  writeJson(path.join(args.outDir, "nav_bindings.json"), out.nav_bindings);
  writeJson(path.join(args.outDir, "entity_index.json"), out.entity_index);
  writeJson(path.join(args.outDir, "quest_bindings.json"), out.quest_bindings);
  writeJson(path.join(args.outDir, "bootstrap_voxels.json"), out.bootstrap_voxels);
  writeJson(path.join(args.outDir, "binder_meta.json"), {
    worldId: out.worldId,
    generatedAtUnixMs: out.generatedAtUnixMs,
    warnings: out.warnings,
    counts: {
      nav_bindings: out.nav_bindings.length,
      entity_index: out.entity_index.length,
      quest_bindings: out.quest_bindings.length,
      bootstrap_voxels: out.bootstrap_voxels.length,
    },
  });

  process.stdout.write(`World bundle bound: ${out.worldId}\n`);
  if (out.warnings.length) process.stdout.write(`Warnings:\n- ${out.warnings.join("\n- ")}\n`);
}

main().catch((e) => {
  process.stderr.write(String(e?.message ?? e) + "\n");
  process.exit(1);
});
