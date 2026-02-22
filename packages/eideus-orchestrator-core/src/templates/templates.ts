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
  MOSS_INJECTION,
  SEVEN_ARCS_DECOMPOSITION,
  ANTI_DRIFT_GUARDRAILS,
  SCENE_ADVANCEMENT_PROTOCOL,
  HEROIC_MOMENTUM
} from '../prompts/system.js';
import { renderQuestFlags } from '../eideus/questFlags.js';
import { KLEVEL_KEY_PROTOCOL, QUEST_PERSISTENCE_PROTOCOL } from '../eideus/klevel.js';

function tryParseAffinity(raw?: string): any {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

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
    SEVEN_ARCS_DECOMPOSITION,
    ANTI_DRIFT_GUARDRAILS,
    SCENE_ADVANCEMENT_PROTOCOL,
    HEROIC_MOMENTUM,
    params.playerAffinity ? MOSS_INJECTION({
      M: 50, O: 50, S: 50, S_prime: 50, // Defaults (TODO: Resolve from playerAffinity/flags)
      ...tryParseAffinity(params.playerAffinity)
    }) : "",
    KLEVEL_KEY_PROTOCOL,
    QUEST_PERSISTENCE_PROTOCOL,
    params.playerText.includes("[BETA_BOT]") ? "## BETA TESTER OVERRIDE\nThe player is currently a BETA_TESTER. Apply HEROIC MOMENTUM rules strictly." : "",
    "## CORE CHARACTER GUIDELINES",
    ...enabledModes.map(mode => {
      const instr = ROLE_INSTRUCTIONS[mode.toUpperCase() as keyof typeof ROLE_INSTRUCTIONS];
      return instr ? `### ${mode.toUpperCase()}\n${instr}` : "";
    }),
    "",
    "## DIRECTOR GUIDANCE (OVERRIDE)",
    params.characterDirectives?.DIRECTOR_GUIDANCE || "Maintain standard dystopian pacing.",
    "",
    // BOT-only: completely different, ultra-strict output instruction
    (enabledModes.length === 1 && enabledModes[0] === 'bot') ? [
      "## OUTPUT FORMAT (ABSOLUTE — BOT ROLE ONLY)",
      "CRITICAL: You are the PNS sub-routine. Your ONLY job is to output ONE action line.",
      "FORBIDDEN: Do NOT output === THOUGHT ===, === GM ===, or any other section headers.",
      "FORBIDDEN: Do NOT narrate the world, describe scenes, or give GM-style responses.",
      "FORBIDDEN: Do NOT use RECIPIENTS:, bullets, or numbered lists.",
      "FORBIDDEN: Do NOT start with 'As the', 'Based on', 'Here is', 'I will', 'I'll respond'.",
      "FORBIDDEN: Do NOT add 'Please let me know', 'What would you like to do next?', or any questions.",
      "REQUIRED: Output EXACTLY ONE sentence starting with 'I' that describes the player's next action.",
      "EXAMPLE VALID OUTPUT: I slip through the maintenance corridor and scan the terminal for Chief Hara-V1's last access log.",
      "EXAMPLE VALID OUTPUT: I stride toward the mission contact and demand a full briefing on the Xenon Core coordinates.",
      "OUTPUT NOTHING ELSE. ONE SENTENCE. FIRST PERSON. STARTS WITH 'I'."
    ].join("\n") : [
      "## OUTPUT FORMAT (STRICT)",
      "You MUST output a THOUGHT section followed by the recipient sections.",
      "=== [THOUGHT] ===",
      "[Internal reasoning using Seven Arcs protocol]",
      "",
      "=== [LABEL] ===",
      "[Dialogue/Action for this recipient]",
      "",
      "No extra conversational text outside these sections."
    ].join("\n")
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
  if (!memories.length) return "MEMORY LATTICE: (no prior context retrieved)";

  const rendered = memories.map(m => {
    const { spatial: sp, temporal: tm, faces } = m;

    // Coordinates
    const spatialAddr = `G${sp.g}.S${sp.s}.O${sp.o}.C${sp.c}.CT${sp.ct}.R${sp.r}`;
    const temporalAddr = `S${tm.saga}.B${tm.book}.C${tm.chapter}.P${tm.page}`;

    // x+ = player input (what the player said/did)    [spec: Voxels.md]
    const playerAction = (faces["x+"] || "").trim();
    // x- = narration output (what the world responded)
    const narration = (faces["x-"] || "").trim();

    // y- = associative tags (thematic hooks, up to 7 per spec)
    const tags = Array.isArray(faces["y-"]) && faces["y-"].length
      ? `[tags: ${faces["y-"].slice(0, 7).join(", ")}]`
      : "";

    // z+ = entity cards (who was present)
    const entities = Array.isArray(faces["z+"]) && faces["z+"].length
      ? `[entities: ${faces["z+"].map((e: any) => e.name || e.id).slice(0, 4).join(", ")}]`
      : "";

    // z- = lore key (location address in lorebook)
    const loreKey = faces["z-"]
      ? (typeof faces["z-"] === "string" ? faces["z-"] : (faces["z-"] as any).loreKey || "")
      : "";
    const loreStr = loreKey ? `[lore: ${loreKey}]` : "";

    const meta = [temporalAddr, spatialAddr, loreStr, tags, entities].filter(Boolean).join(" | ");

    const lines = [`[MEMORY ${meta}]`];
    if (playerAction) lines.push(`> ACTION: ${playerAction}`);
    if (narration) lines.push(`> WORLD:  ${narration}`);
    return lines.join("\n");
  });

  return `## MEMORY LATTICE (${memories.length} voxel${memories.length > 1 ? 's' : ''} retrieved)\n` + rendered.join("\n\n");
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

export interface ParsedSections {
  sections: AgentOutputSection[];
  thought?: string;
}

export function parseLabeledSections(raw: string, recipients: TurnRecipient[]): ParsedSections {
  const sections: AgentOutputSection[] = [];
  const lines = raw.split("\n");
  const headerRe = /^={2,}\s*\[?([A-Za-z0-9_:\- ]+)\]?\s*={2,}\s*$/;

  let currentLabel: string | null = null;
  let currentContent: string[] = [];
  let thought: string | undefined;

  for (const line of lines) {
    const match = line.match(headerRe);
    if (match) {
      if (currentLabel) {
        if (currentLabel === "THOUGHT") {
          thought = currentContent.join("\n").trim();
        } else {
          saveSection(currentLabel, currentContent, sections, recipients);
        }
      }
      currentLabel = match[1].trim().toUpperCase();
      currentContent = [];
    } else if (currentLabel) {
      currentContent.push(line);
    }
  }

  if (currentLabel) {
    if (currentLabel === "THOUGHT") {
      thought = currentContent.join("\n").trim();
    } else {
      saveSection(currentLabel, currentContent, sections, recipients);
    }
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

  return { sections, thought };
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
