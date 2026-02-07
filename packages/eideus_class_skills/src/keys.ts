// PATH: src/keys.ts
import type { SkillKeyParts, SkillSlot } from "./types.js";

const SLOT_RE = /^E[1-7]$/;

export function parseTemplateKey(key: string): SkillKeyParts {
  // Expected:
  //   T:<Core>|M:<Sub->Cross>
  // optionally:
  //   |E:<n>
  //
  // Examples:
  //   T:Rebel|M:Merc->Soldier of Fortune|E:6
  //   T:Hacker|M:Cipher->Cryptocrat
  const parts = key.split("|").map(s => s.trim());
  const out: SkillKeyParts = { core: "", modifier: "" };

  for (const p of parts) {
    if (p.startsWith("T:")) out.core = p.slice(2).trim();
    else if (p.startsWith("M:")) out.modifier = p.slice(2).trim();
    else if (p.startsWith("E:")) {
      const raw = ("E" + p.slice(2).trim()) as SkillSlot;
      if (!SLOT_RE.test(raw)) throw new Error(`Invalid slot in key: ${p}`);
      out.slot = raw;
    }
  }

  if (!out.core) throw new Error(`Missing T:<Core> in key: ${key}`);
  if (!out.modifier) throw new Error(`Missing M:<Modifier> in key: ${key}`);
  return out;
}
