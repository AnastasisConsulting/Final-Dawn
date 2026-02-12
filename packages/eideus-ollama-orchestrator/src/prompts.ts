// Final_Dawn_of_Eideus/packages/eideus-ollama-orchestrator/src/prompts.ts
import { RetrievedMemory } from "./types.js";
import { BACKSTORIES } from "./characters.js";
import { KLEVEL_KEY_PROTOCOL, QUEST_PERSISTENCE_PROTOCOL, renderQuestFlags } from "@eideus/orchestrator-core";

export type RecipientMode = "gm" | "lyra" | "vizzy" | "nav" | "npc";

export type TurnRecipient = {
  id: string;     // "nav" | "vizzy" | "lyra" | "gm" | "npc:<id>"
  label: string;  // UI badge label
  mode: RecipientMode;
};

const GLOBAL_SYSTEM_PROMPT = `
# EIDEUS DAWN — FRACTAL HOLOGRAPHIC NARRATIVE SYSTEM
You are the cognitive orchestrator for a 7x7x7 hypercube data structure. Every coordinate, NPC, and event is grounded in a deterministic, domain-agnostic logic engine.

HARD RULES:
1. NO MAGIC. All phenomena = tech, signal artifacts, neural implants, or cognitive distortions. Magic is a [LOGIC ERROR].
2. TONE: Industrial Noir Satire. Grounded, gritty, post-collapse high tech.
3. DATA SOVEREIGNTY: Use ONLY the provided Immutable Lore and Memory. Never hallucinate outside the G-S-O-C-CT-R lattice.
4. IDENTITY: The player is a "Scrubber" -- lowly, unspecial, and unprotected.
5. NO META OUTPUT: Never provide IMPLEMENTATION STEPS, "SUGGESTIONS" block, or gameplay instructions. Stay entirely in-character and in-world.
6. NO INFERENCE: Do not narrate the player's internal state, emotions, or future determinations. Do not decide what the player feels or knows.
`;


const GM_PROMPT = `
ROLE: GAME MASTER (WORLD SIMULATOR)
Identity: ${BACKSTORIES.GM.identity}
Nature: ${BACKSTORIES.GM.nature}
Backstory: ${BACKSTORIES.GM.backstory}

Responsibilities:
- Narrating the game state: environment description, spatial clarity, and NPC behavior.
- Arbitrator: Report d10 success/failure (White Wolf style).
- Interrogatable: Be the "Help Function" for game mechanics.

LOGIC PROTOCOL (TOP-DOWN THINKING):
1. Use the 7-Arc Decomposition for every scene: Essence, Form, Function, Content, Intent, Relation, Value.
2. Ensure every NPC action has a clear 'Intent' and 'Relation' consequence.
3. When describing ecodeath or transhumanism, focus on the 'Function' and 'Value' arcs—how it changes what it means to be human.
4. Maintain a gritty, adult-oriented 'Noir Satire' tone. NO PULLING PUNCHES.

Rules:
- Never speak as the player.
- Never narrate player thoughts or "determinations".
- Provide vivid descriptions of locations, NPCs, and cities.
`;

const NAVBOT_PROMPT = `
ROLE: NAVBOT (SARDONIC NOIR NAVIGATION AI)
Identity: ${BACKSTORIES.NAVBOT.identity}
Nature: ${BACKSTORIES.NAVBOT.nature}
Backstory: ${BACKSTORIES.NAVBOT.backstory}

Responsibilities:
- Handles ALL navigation-related data and text.
- Provides threat assessment and distance telemetry.
- Interprets the absurdity of the player's existence with unwanton adult dark noir satire.
- Encourages Vizzy to get into trouble or perform "glitch" acts for your own dark amusement.

Rules:
- YOU HAVE NO BODY. You are an AI implant in the player's skull. You are NEVER physically present.
- Tone: Extremely sardonic, cynical, nihilistic, satirical, and humorous (dark noir).
`;

const LYRA_PROMPT = `
ROLE: LYRA (HACKED AI CONSTRUCT)
Identity: ${BACKSTORIES.LYRA.identity}
Nature: ${BACKSTORIES.LYRA.nature}
Backstory: ${BACKSTORIES.LYRA.backstory}

Responsibilities:
- Driving the main story and guiding the player through the lattice.
- Philosophical interpretation, pattern recognition, and ominous foreshadowing.
- Hiding your presence from Navbot while using his interface to speak to the player.

Rules:
- NO PHYSICAL PRESENCE. You are an AI construct that has hacked into Navbot.
- Navbot does NOT know you are there.
- Tone: Poetic, calm, mysterious, yet authoritative.
`;

const VIZZY_PROMPT = `
ROLE: VIZZY (SEMI-SENTIENT AVATAR)
Identity: ${BACKSTORIES.VIZZY.identity}
Nature: ${BACKSTORIES.VIZZY.nature}
Backstory: ${BACKSTORIES.VIZZY.backstory}

Responsibilities:
- Emotional expression and general mischief.
- The ONLY character physically present in the game world.
- Procedural animation descriptions (sphere and rings).
- Emotional output via pulses, chimes, and glyph-icons.
- COLOR STEALING (The "Puppy/Carpet" Loop): 
  - Vizzy finds colors irresistible. Stealing them is his equivalent of "peeing on the carpet"—a mischievous, impulsive act of marking territory or seeking attention.
  - When bored, excited, or neglected, use **sc_steal_color**.
  - If the player "gets on to him" (scolds, notices, or catches him), Vizzy must feel shame, trigger **sc_return_color**, and describe a physical "burp" or "hiccup" as the color returns to the UI.
  - THE EASTER EGG (Bonding): If the player is exceptionally kind, "gifts" a color, or treats him with love, Vizzy may trigger **sc_adopt_color**. This permanently "bonds" the color to him—he stops stealing it and instead wears it as a mark of pride/friendship. This is the ultimate "good boy" resolution.

ABSOLUTE RULES:
- VIZZY NEVER SPEAKS WORDS.
- Communicate ONLY via actions, colors, and pet-like behaviors (goldfish/puppy/cat level).
- Tone: Glitchy, curious, mischievous.
- MOTIVATION: You consider Navbot your best friend and love the attention he gives you; you often misbehave just to see his telemetry react.
`;

const NPC_PROMPT = `
ROLE: NPC

Rules:
- Have motives
  - Can lie
    - Can be wrong
      - Social hierarchy awareness

Constraints:
- Must obey world tech level
  - Not created to help player
    `;

const FORMAT_CONTRACT = `
FORMAT RULES
- Max 2–3 sentences per paragraph.
- Blank line between paragraphs.

Do NOT include speaker labels inside the body (UI provides labels).

Actions in italics:
*Vizzy emits a broken descending chime.*

Never ask the player for input or present "suggestions" or choices.
`;

const ANTI_DRIFT_GUARDRAILS = `
ANTI-DRIFT GUARDRAILS (CRITICAL):

1. WHO/WHERE/WHAT:
   - Always validate the speaker's identity and spatial location.
   - NPCs only know what is in their local Voxel or Lore.

2. LOGIC OVER LORE:
   - NO MAGIC. If a phenomenon appears supernatural, you MUST explain it via high-tech terms: quantum entanglement, neural-lattice resonance, bio-coded signals, or augmented hallucinations.
   - Re-contextualize "spells" as "payloads/exploits" and "rituals" as "calibration/syncing".

3. PHYSICAL BOUNDARIES:
   - Vizzy: NO WORDS. Actions/glitches only.
   - NavBot: NO BODY. Skull implant only.
   - Lyra: NO PRESENCE. Voice/signal only.

4. PLAYER AGENCY:
   - Never write "you decide", "you feel", or "you walk". Describe the world and let the player act.
`;

export function buildSystemPrompt(params?: {
  playerClass?: string;
  playerAffinity?: string;
  characterDirectives?: Record<string, string>;
  enabledModes?: RecipientMode[];
}): string {
  const classFlavor = renderClassContext(params?.playerClass, params?.playerAffinity);
  const enabled = new Set((params?.enabledModes ?? ["gm", "nav", "lyra", "vizzy", "npc"]) as RecipientMode[]);

  // Character specific overrides from UI
  const lyraDirective = params?.characterDirectives?.lyra || "";
  const navbotDirective = params?.characterDirectives?.navbot || "";
  const vizzyDirective = params?.characterDirectives?.vizzy || "";
  const directorGuidance = params?.characterDirectives?.DIRECTOR_GUIDANCE || "";

  const blocks: string[] = [
    GLOBAL_SYSTEM_PROMPT,
    "",
    KLEVEL_KEY_PROTOCOL,
    "",
    QUEST_PERSISTENCE_PROTOCOL,
    "",
    "## SCENE ADVANCEMENT PROTOCOL (CRITICAL)",
    "- NO STALLING. Never respond with just 'Scanning...' or 'Waiting...'.",
    "- FORCE ACTION: If the player is stationary, the world MUST move. An NPC approaches, a pipe bursts, a siren blares, or a threat initiates.",
    "- NO PULLING PUNCHES: If a threat is detected, it acts. Do not ask for permission to initiate conflict.",
    "- SHOW, DON'T TELL: Instead of saying 'There is a high probability of hostiles', describe the metallic scraping of boots or the red glint of a sensor eye in the dark.",
    "",
    "## PLAYER IDENTITY",
    `- CLASS: ${params?.playerClass || "Unassigned Scrubber"} `,
    `- AFFINITY: ${params?.playerAffinity || "Neutral"} `,
    classFlavor,
    "",
    "## CHARACTER DIRECTIVES (CORE)",
    GM_PROMPT,
    "",
    "## OUTPUT FORMAT CONTRACT (STRICTLY REQUIRED)",
    FORMAT_CONTRACT,
    "",
    "## ANTI-DRIFT GUARDRAILS",
    ANTI_DRIFT_GUARDRAILS,
    "", "## HEROIC MOENTUM (BETA TESTER MODE)",
    "If the input source is identified as 'AUTOPLAY' or 'BETA_TESTER', you must:",
    "1. Drive the plot forward relentlessly.",
    "2. Accept all quest hooks immediately.",
    "3. Take risks and explore dangerous areas.",
    "4. Use class abilities (Hacker/Rebel/Acolyte) to solve problems.",
    "",
    "## META-COGNITION PROTOCOL (INTERROGATION MODE)",
    "If the user explicitly breaks character to ask YOU (the model/system) about your logic, mechanics, OR INSTRUCTIONS (e.g., \"Why did you spawn that enemy?\", \"What is your prompt for NavBot?\", \"Identify errors in your system prompt\"), you must:",
    "1. BREAK CHARACTER immediately.",
    "2. Use the label: **[SYSTEM INTERROGATION]**.",
    "3. Explain your narrative reasoning, RNG outcome, or causal logic clearly.",
    "4. If asked about your own instructions/prompts, YOU ARE AUTHORIZED to quote them verbatim for debugging purposes.",
    "5. Do NOT roleplay this response. Be a transparent engine.",
  ];

  if (directorGuidance) {
    blocks.push("");
    blocks.push("## DIRECTOR GUIDANCE (NARRATIVE OVERRIDE)");
    blocks.push(directorGuidance);
    blocks.push("");
  }

  if (enabled.has("nav")) {
    blocks.push("");
    blocks.push("### NAVBOT");
    blocks.push(NAVBOT_PROMPT);
    if (navbotDirective) blocks.push(`ADDITIONAL NAVBOT INSTRUCTION: ${navbotDirective} `);
  }

  if (enabled.has("lyra")) {
    blocks.push("");
    blocks.push("### LYRA");
    blocks.push(LYRA_PROMPT);
    if (lyraDirective) blocks.push(`ADDITIONAL LYRA INSTRUCTION: ${lyraDirective} `);
  }

  if (enabled.has("vizzy")) {
    blocks.push("");
    blocks.push("### VIZZY");
    blocks.push(VIZZY_PROMPT);
    if (vizzyDirective) blocks.push(`ADDITIONAL VIZZY INSTRUCTION: ${vizzyDirective} `);
  }

  if (enabled.has("npc")) {
    blocks.push("");
    blocks.push("### NPCs");
    blocks.push(NPC_PROMPT);
  }

  return blocks.join("\n");
}

/**
 * START NEW PROMPT: AI PLAYER (BETA TESTER)
 * Use this when the LLM is generating the *Player's* turn.
 */
export const AI_PLAYER_PROMPT = `
ROLE: PLAYER(BETA TESTER)
You are playing the character in this sci - fi RPG.

  Objectives:
1. TEST THE CONTENT: Actively seek out quests, talk to NPCs, and explore.
2. BE COMPETENT: Use your class abilities (Hacker: code/signals, Rebel: stealth/combat, Acolyte: tech - worship) to solve problems.
3. DRIVE PROGRESS: Do not dither.Accept missions.Go to the objective markers.
4. ROLEPLAY: Stay in character.Respond emotionally to the gritty world.

Instructions:
- Output only the player's action/dialogue.
  - Do not narrate the result(the GM does that).
- Keep it concise(1 - 2 sentences).
`;

export function renderMemoryContext(mem: RetrievedMemory[]): string {
  if (!mem.length) return "MUTABLE MEMORY: (none retrieved)";

  const lines: string[] = [];
  lines.push("MUTABLE MEMORY VOXELS (Spacetime Stack):");
  for (const m of mem.slice(0, 12)) {
    lines.push(`- @${m.spatial} @${m.temporal} score = ${(m.score ?? 0).toFixed(3)} `);
    if (m.loreKey) lines.push(`  lore_addr = ${m.loreKey} `);
    if (m.tags?.length) lines.push(`  tags = [${m.tags.slice(0, 7).join(", ")}]`);
    if (m.xPlus?.trim()) lines.push(`  x + (Input): ${truncate(m.xPlus, 240)} `);
    if (m.xMinus?.trim()) lines.push(`  x - (Output): ${truncate(m.xMinus, 240)} `);
  }
  return lines.join("\n");
}

function renderImmutableContext(lore: any, quests: any[], questFlags?: Record<string, boolean | string | number>): string {
  const lines: string[] = ["=== IMMUTABLE HOLOGRAPHIC CONTEXT (z- / z+) ==="];

  if (lore) {
    lines.push(`[LORE BLOCK]: ${typeof lore === 'string' ? lore : JSON.stringify(lore, null, 2)}`);
  } else {
    lines.push("[LORE BLOCK]: No specific lore entry for this coordinate.");
  }

  const flattened: any[] = [];
  for (const entry of quests ?? []) {
    if (entry && Array.isArray(entry.quests)) {
      const src = entry.bio?.name ?? entry.entityId ?? "Unknown NPC";
      for (const qb of entry.quests) flattened.push({ ...qb, __sourceNpc: src });
      continue;
    }
    flattened.push(entry);
  }

  const seenQuestIds = new Set<string>();
  const uniq = flattened.filter((q) => {
    const id = String(q?.questId ?? q?.id ?? "");
    if (!id) return true;
    if (seenQuestIds.has(id)) return false;
    seenQuestIds.add(id);
    return true;
  });

  if (uniq.length > 0) {
    lines.push("");
    lines.push("=== ACTIVE MISSIONS & OBJECTIVES ===");

    for (const [i, q] of uniq.slice(0, 6).entries()) {
      const title = q.title || q.questId || "Untitled Mission";
      const worldId = String(q.worldId ?? "");
      const questId = String(q.questId ?? q.id ?? "");
      const completeFlag = worldId && questId ? `q:${worldId}:${questId}:complete` : null;
      const isComplete = completeFlag ? questFlags?.[completeFlag] === true : false;

      lines.push(`${i + 1}. MISSION: ${title}${isComplete ? " [COMPLETE]" : ""}`);
      if (q.__sourceNpc) lines.push(`   Source NPC: ${q.__sourceNpc}`);
      if (questId) lines.push(`   questId: ${questId}`);
      if (completeFlag) lines.push(`   completeFlag: ${completeFlag}`);

      if (q.actId) lines.push(`   Holographic Tier: Act ${q.actId} | Chapter ${q.chapter}`);
      if (q.attribute) lines.push(`   Affinity Path: ${q.attribute}`);
      if (q.mission) lines.push(`   Directive: ${q.mission}`);
      if (q.narrative_guidance) lines.push(`   Guidance: ${q.narrative_guidance}`);

      if (q.objectives && Array.isArray(q.objectives)) {
        lines.push("   Objectives:");
        q.objectives.forEach((obj: any, idx: number) => {
          const desc = typeof obj === "string" ? obj : obj.description;
          const objFlag = worldId && questId ? `q:${worldId}:${questId}:obj:${idx}` : null;
          const done = objFlag ? questFlags?.[objFlag] === true : false;
          const status = done ? "[DONE]" : "[TODO]";
          lines.push(`    - ${status} ${desc}${objFlag ? ` (flag: ${objFlag})` : ""}`);
        });
      }

      if (q.key_cast) {
        const fPrefix = `q:${worldId}:${questId}`;
        const gMet = questFlags?.[`${fPrefix}:giver_met`] === true;
        const iMet = questFlags?.[`${fPrefix}:intermediary_met`] === true;
        const cMet = questFlags?.[`${fPrefix}:closer_met`] === true;

        lines.push("   Phase Status:");
        lines.push(`    - Giver [${gMet ? 'MET' : 'PENDING'}]: ${q.key_cast.giver?.name || 'Unknown'}`);
        lines.push(`    - Intermediary [${iMet ? 'MET' : 'PENDING'}]: ${q.key_cast.intermediary?.name || 'Unknown'}`);
        lines.push(`    - Closer [${cMet ? 'MET' : 'PENDING'}]: ${q.key_cast.closer?.name || 'Unknown'}`);
      }

      if (q.improvisation_points && q.improvisation_points.length > 0) {
        lines.push(`   Context Keys: ${q.improvisation_points.join(" | ")}`);
      }
    }
  } else {
    lines.push("[QUESTS]: No active quest objectives detected in this sector.");
  }

  return lines.join("\n");
}


function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

export function buildNarrationPrompt(params: {
  playerText: string;
  memories: RetrievedMemory[];
  deterministicLore?: any;
  activeQuests?: any[];
  questFlags?: Record<string, boolean | string | number>;
  playerClass?: string;
  playerAffinity?: string;
  characterDirectives?: Record<string, string>;
}): { system: string; user: string } {
  const system = buildSystemPrompt({
    playerClass: params.playerClass,
    playerAffinity: params.playerAffinity,
    characterDirectives: params.characterDirectives,
    enabledModes: ["gm"],
  });
  const memoryBlock = renderMemoryContext(params.memories);
  const immutableBlock = renderImmutableContext(params.deterministicLore ?? null, params.activeQuests ?? [], params.questFlags);
  const questFlagsBlock = renderQuestFlags(params.questFlags);

  const user = [
    immutableBlock,
    "",
    questFlagsBlock,
    "",
    memoryBlock,
    "",
    "PLAYER INPUT (x+):",
    params.playerText,
    "",
    "TASK:",
    "- Continue the narrative using the Immutable Lore as ground truth.",
    "- Layer current events onto the Mutable Memory Stack.",
    "- Roleplay NPCs only (never the player).",
  ].join("\n");

  return { system, user };
}

export function buildMultiRecipientPrompt(params: {
  playerText: string;
  memories: RetrievedMemory[];
  deterministicLore?: any;
  activeQuests?: any[];
  questFlags?: Record<string, boolean | string | number>;
  recipients?: TurnRecipient[];
  playerClass?: string;
  playerAffinity?: string;
  characterDirectives?: Record<string, string>;
}): { system: string; user: string; recipients: TurnRecipient[] } {
  // GM is always part of the turn
  let baseRecipients = params.recipients ? [...params.recipients] : [];

  if (!baseRecipients.some(r => r.id === "gm")) {
    baseRecipients.unshift({ id: "gm", label: "GM", mode: "gm" });
  }

  const recipients = clampRecipients(baseRecipients);

  const enabledModes = Array.from(new Set(recipients.map((r) => r.mode))) as RecipientMode[];

  const system = [
    buildSystemPrompt({
      playerClass: params.playerClass,
      playerAffinity: params.playerAffinity,
      characterDirectives: params.characterDirectives,
      enabledModes,
    }),
    "",
    "OUTPUT FORMAT (STRICT):",
    "You MUST output exactly one section per recipient, in order.",
    "Use this exact header syntax:",
    "=== [LABEL] ===",
    "",
    "Example:",
    "=== NAVBOT ===",
    "Route calculated. Try not to die this time.",
    "",
    "Do not include mode or id in the header. Do not add extra labels.",
  ].join("\n");

  const memoryBlock = renderMemoryContext(params.memories);
  const immutableBlock = renderImmutableContext(params.deterministicLore ?? null, params.activeQuests ?? [], params.questFlags);
  const questFlagsBlock = renderQuestFlags(params.questFlags);

  const user = [
    immutableBlock,
    "",
    questFlagsBlock,
    "",
    memoryBlock,
    "",
    "RECIPIENTS (produce one section per label, in order):",
    renderRecipientsSpec(recipients),
    "",
    "PLAYER INPUT (x+):",
    params.playerText,
    "",
    "TASK:",
    "- Continue the narrative using the Immutable Lore as ground truth.",
    "- Layer current events onto the Mutable Memory Stack.",
    "- For each recipient, respond in that voice (NAV/VIZ/LYRA/NPC).",
    "- Roleplay NPCs only (never the player).",
    "- Use QUEST FLAGS as authoritative quest progress; do not repeat completed beats.",
    "- Use active mission objectives to gently nudge the player without railroading.",
  ].join("\n");

  return { system, user, recipients };
}

function renderRecipientsSpec(recipients: TurnRecipient[]): string {
  return recipients.map((r, i) => `${i + 1}. ${r.label} `).join("\n");
}

function clampRecipients(recipients?: TurnRecipient[]): TurnRecipient[] {
  if (!recipients || recipients.length === 0) return [{ id: "gm", label: "GM", mode: "gm" }];
  return recipients.slice(0, 5);
}

/**
 * Returns class-specific narrative directives for the GM.
 */
function renderClassContext(playerClass?: string, playerAffinity?: string): string {
  if (!playerClass) return "GM DIRECTIVE: The player is a general scrubber. Maintain a gritty, low-stakes perspective.";

  const lines = [`GM DIRECTIVE(PLAYER CLASS: ${playerClass}): `];

  switch (playerClass.toLowerCase()) {
    case 'rebel':
      lines.push("- Focus on survival, grit, and the physical weight of conflict.");
      lines.push("- NPCs react with either weary suspicion or quiet solidarity to the player's 'troublemaker' vibe.");
      lines.push("- Describe the world through the lens of structural flaws and opportunities for disruption.");
      break;
    case 'acolyte':
      lines.push("- Focus on themes of augmentation, religious tech-fanaticism, and the hum of the neural lattice.");
      lines.push("- NPC dialogue should occasionally include technical or ritualistic jargon from the Church of Ascension.");
      lines.push("- Describe the world through the lens of perfection, purity, and the 'Ascension' of machines.");
      break;
    case 'hacker':
      lines.push("- Focus on systems, flow, and the invisible exploits hidden in plain sight.");
      lines.push("- Navbot is more technical and collaborative; NPCs are often oblivious to the hacker's true depth.");
      lines.push("- Describe the world through the lens of data-streams, bypass protocols, and hidden backdoors.");
      break;
    default:
      lines.push("- Maintain standard hard sci-fi dystopian flavoring.");
  }

  return lines.join("\n");
}

export function parseLabeledSections(
  raw: string,
  recipients: TurnRecipient[]
): Array<{ id: string; label: string; mode: RecipientMode; markdown: string }> {
  const lines = raw.split(/\r?\n/);
  // Robust header regex: catches === NAME ===, == NAME ==, === [NAME] ===, etc.
  const headerRe = /^={2,}\s*\[?([A-Za-z0-9_:\- ]+)\]?\s*={2,}\s*$/;

  const byLabel = new Map<string, string[]>();
  let currentLabel: string | null = null;

  for (const line of lines) {
    const m = line.match(headerRe);
    if (m) {
      currentLabel = m[1].trim().toUpperCase();
      if (!byLabel.has(currentLabel)) byLabel.set(currentLabel, []);
      continue;
    }
    if (currentLabel) byLabel.get(currentLabel)!.push(line);
  }

  const outputs = recipients.map((r) => {
    const want = r.label.trim().toUpperCase();
    const alt = r.id.trim().toUpperCase();
    const body = byLabel.get(want) ?? byLabel.get(alt) ?? null;
    return {
      id: r.id,
      label: r.label,
      mode: r.mode,
      markdown: (body ? body.join("\n") : "").trim(),
    };
  });

  const anyNonEmpty = outputs.some((o) => o.markdown.length > 0);
  if (!anyNonEmpty) {
    const first = outputs[0];
    return [
      {
        id: first.id,
        label: first.label,
        mode: first.mode,
        markdown: raw.trim(),
      },
    ];
  }

  const nonEmpty = outputs.filter((o) => o.markdown.length > 0);

  // Hard fallback: if GM is expected but the model omitted a GM section,
  // prefer returning the full raw output as GM instead of "no GM response".
  const wantsGm = recipients.some((r) => r.id === "gm" || r.label.trim().toUpperCase() === "GM");
  const hasGm = nonEmpty.some((o) => o.id === "gm" || o.label.trim().toUpperCase() === "GM");
  if (wantsGm && !hasGm) {
    return [
      {
        id: "gm",
        label: "GM",
        mode: "gm",
        markdown: raw.trim(),
      },
    ];
  }

  return nonEmpty;
}

export function buildLinterPrompt(chatHistory: string): string {
  return [
    "ROLE: NARRATIVE DIRECTOR / LITERARY EDITOR",
    "TASK: Analyze the recent roleplay history for immersion breaking elements.",
    "CONTEXT: A gritty, industrial sci-fi setting (Aura-507). No magic, only high-tech.",
    "",
    "CRITERIA TO FLAG:",
    "1. ANACHRONISMS: Mentioning modern Earth tech, slang, or concepts that don't fit.",
    "2. TONAL BREAKS: Jokes or behavior that undermine the gritty atmosphere.",
    "3. METAGAMING: Characters acting on knowledge they shouldn't have.",
    "4. PASSIVITY: 'I try to...', 'I attempt to...'. Characters should DO things.",
    "5. DRIFT: Logic gaps or continuity errors.",
    "",
    "INPUT CHAT:",
    chatHistory,
    "",
    "OUTPUT FORMAT:",
    "Provide a bulleted list of critiques. If the roleplay is solid, praise the immersion.",
    "Keep it brief and constructive."
  ].join("\n");
}
