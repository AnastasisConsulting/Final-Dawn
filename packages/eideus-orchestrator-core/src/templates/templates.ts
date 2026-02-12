// packages/eideus-orchestrator-core/src/templates/templates.ts
import type {
  VoxelSnapshot,
  TurnRecipient,
  RecipientMode,
  AgentOutputSection,
  TurnContext
} from '../types.js';
import {
  GLOBAL_INVARIANTS,
  ROLE_INSTRUCTIONS,
  MOSS_INJECTION
} from '../prompts/system.js';
import { renderQuestFlags } from '../eideus/questFlags.js';
import { KLEVEL_KEY_PROTOCOL, QUEST_PERSISTENCE_PROTOCOL } from '../eideus/klevel.js';

export const NOIR_SATIRE_TONE = `
## TONE: INDUSTRIAL NOIR SATIRE
- Atmosphere: Gritty, post-collapse, high-tech, low-life.
- Attitude: Cynical, sardonic, and dark.
- No Magic Rule: All supernatural elements are technology, glitch artifacts, or cognitive distortions.
- The Player: A "Scrubber"—lowly, unremarkable, and survival-focused.
`;

export function buildMultiRecipientPrompt(params: {
  playerText: string;
  memories: VoxelSnapshot[];
  deterministicLore?: any;
  activeQuests?: any[];
  questFlags?: Record<string, boolean | string | number>;
  recipients: TurnRecipient[];
  playerClass?: string;
  playerAffinity?: string;
  characterDirectives?: Record<string, string>;
}): { system: string; user: string } {

  const enabledModes = Array.from(new Set(params.recipients.map(r => r.mode)));

  const system = [
    GLOBAL_INVARIANTS,
    NOIR_SATIRE_TONE,
    KLEVEL_KEY_PROTOCOL,
    QUEST_PERSISTENCE_PROTOCOL,
    "## CORE CHARACTER GUIDELINES",
    ...enabledModes.map(mode => {
      const instr = ROLE_INSTRUCTIONS[mode.toUpperCase() as keyof typeof ROLE_INSTRUCTIONS];
      return instr ? `### ${mode.toUpperCase()}\n${instr}` : "";
    }),
    "",
    "## DIRECTOR GUIDANCE (OVERRIDE)",
    params.characterDirectives?.DIRECTOR_GUIDANCE || "Maintain standard dystopian pacing.",
    "",
    "## OUTPUT FORMAT (STRICT)",
    "You MUST output exactly one section per recipient label provided, in order.",
    "Use header syntax: === [LABEL] ===",
    "No extra conversational text outside these sections."
  ].join("\n");

  const memoryBlock = renderMemories(params.memories);
  const immutableBlock = renderImmutableContext(params.deterministicLore, params.activeQuests || [], params.questFlags);
  const flagsBlock = renderQuestFlags(params.questFlags);

  const user = [
    immutableBlock,
    "",
    flagsBlock,
    "",
    memoryBlock,
    "",
    "RECIPIENTS:",
    params.recipients.map((r, i) => `${i + 1}. ${r.label}`).join("\n"),
    "",
    "PLAYER INPUT (x+):",
    params.playerText,
    "",
    "TASK:",
    "- Continue reality based on the Immutable Context.",
    "- Respond as each character section requested.",
    "- Use QUEST FLAGS to dictate progress (do not repeat met beats)."
  ].join("\n");

  return { system, user };
}

function renderMemories(memories: VoxelSnapshot[]): string {
  if (!memories.length) return "MEMORY: (none retrieved)";
  return memories.map(m => {
    return `- @${m.id} [${m.spatial.g}.${m.spatial.s}.${m.spatial.o}] x+: ${m.faces["x+"]} | x-: ${m.faces["x-"]}`;
  }).join("\n");
}

function renderImmutableContext(lore: any, quests: any[], questFlags?: Record<string, any>): string {
  const lines = ["=== IMMUTABLE LORE & MISSIONS ==="];
  lines.push(`LOCATION LORE: ${typeof lore === 'string' ? lore : JSON.stringify(lore, null, 2)}`);

  if (quests && quests.length > 0) {
    lines.push("\nACTIVE QUESTS:");
    quests.forEach((qe, i) => {
      qe.quests?.forEach((q: any) => {
        const fPrefix = `q:${q.worldId}:${q.questId || q.id}`;
        const status = questFlags?.[`${fPrefix}:complete`] ? "[COMPLETE]" : "[ACTIVE]";
        lines.push(`${status} ${q.title}`);
        if (q.key_cast) {
          const g = questFlags?.[`${fPrefix}:giver_met`] ? "MET" : "PENDING";
          const m = questFlags?.[`${fPrefix}:intermediary_met`] ? "MET" : "PENDING";
          const c = questFlags?.[`${fPrefix}:closer_met`] ? "MET" : "PENDING";
          lines.push(`  - Giver (${q.key_cast.giver?.name}): ${g}`);
          lines.push(`  - Intermediary (${q.key_cast.intermediary?.name}): ${m}`);
          lines.push(`  - Closer (${q.key_cast.closer?.name}): ${c}`);
        }
      });
    });
  }
  return lines.join("\n");
}

export function parseLabeledSections(raw: string, recipients: TurnRecipient[]): AgentOutputSection[] {
  const sections: AgentOutputSection[] = [];
  const lines = raw.split("\n");
  const headerRe = /^={2,}\s*\[?([A-Za-z0-9_:\- ]+)\]?\s*={2,}\s*$/;

  let currentLabel: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const match = line.match(headerRe);
    if (match) {
      if (currentLabel) {
        saveSection(currentLabel, currentContent, sections, recipients);
      }
      currentLabel = match[1].trim().toUpperCase();
      currentContent = [];
    } else if (currentLabel) {
      currentContent.push(line);
    }
  }
  if (currentLabel) {
    saveSection(currentLabel, currentContent, sections, recipients);
  }

  // Fallback if no headers found
  if (sections.length === 0 && recipients.length > 0) {
    sections.push({
      id: recipients[0].id,
      label: recipients[0].label,
      mode: recipients[0].mode,
      markdown: raw.trim()
    });
  }

  return sections;
}

function saveSection(label: string, content: string[], sections: AgentOutputSection[], recipients: TurnRecipient[]) {
  const recipient = recipients.find(r => r.label.toUpperCase() === label || r.id.toUpperCase() === label);
  if (recipient) {
    sections.push({
      id: recipient.id,
      label: recipient.label,
      mode: recipient.mode,
      markdown: content.join("\n").trim()
    });
  }
}
