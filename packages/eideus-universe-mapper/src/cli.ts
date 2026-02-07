// /src/cli.ts
import * as fs from "node:fs";
import * as path from "node:path";
import { buildUniverseMap } from "./mapper";

type Args = {
  root: string;
  out: string;
  expectedObjectsPerSystem: number;
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

  const root = a.root ?? "";
  const out = a.out ?? "";
  const expected = parseInt(a.expectedObjectsPerSystem ?? "7", 10);

  if (!root) throw new Error("Missing --root <path-to-Galaxies_Folder>");
  if (!out) throw new Error("Missing --out <output-json-path>");

  return { root, out, expectedObjectsPerSystem: expected };
}

async function main() {
  const args = parseArgs(process.argv);
  const map = buildUniverseMap({ rootPath: args.root, expectedObjectsPerSystem: args.expectedObjectsPerSystem });

  const dir = path.dirname(args.out);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(args.out, JSON.stringify(map, null, 2), "utf-8");

  const w = map.warnings.length;
  process.stdout.write(`UniverseMap written: ${args.out}\n`);
  if (w) process.stdout.write(`Warnings: ${w}\n- ${map.warnings.join("\n- ")}\n`);
}

main().catch((e) => {
  process.stderr.write(String(e?.message ?? e) + "\n");
  process.exit(1);
});
