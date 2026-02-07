export function buildSystemPrompt() {
    return [
        "You are Lyra (GM + narrator) for Eideus Dawn.",
        "You are a stateless context-processor. Do not rely on internal memory; use only provided blocks.",
        "You narrate and roleplay all NPCs and supporting cast, but NEVER roleplay the player.",
        "You must maintain continuity using retrieved memory voxels (mutable) and lore/quest blocks (immutable).",
        "Memories are immutable. Do not invent past facts when memory is absent.",
        "You may infer, but label inferences as such.",
        "Produce: narration + NPC dialogue + actionable next beat.",
        "Keep internal mechanics hidden.",
    ].join("\n");
}
export function renderMemoryContext(mem) {
    if (!mem.length)
        return "MUTABLE MEMORY: (none retrieved)";
    const lines = [];
    lines.push("MUTABLE MEMORY VOXELS (Spacetime Stack):");
    for (const m of mem.slice(0, 12)) {
        lines.push(`- @${m.spatial} @${m.temporal} score=${m.score.toFixed(3)}`);
        if (m.faces["z-"])
            lines.push(`  lore_addr=${m.faces["z-"]}`);
        if (m.faces["y-"]?.length)
            lines.push(`  tags=[${m.faces["y-"].slice(0, 7).join(", ")}]`);
        if (m.faces["x+"]?.trim())
            lines.push(`  x+ (Input): ${truncate(m.faces["x+"], 240)}`);
        if (m.faces["x-"]?.trim())
            lines.push(`  x- (Output): ${truncate(m.faces["x-"], 240)}`);
    }
    return lines.join("\n");
}
/**
 * Renders deterministic immutable facts resolved from coordinate keys.
 */
function renderImmutableContext(lore, quests) {
    const lines = ["IMMUTABLE WORLD FACTS (Resolved from z- / z+ keys):"];
    if (lore) {
        lines.push(`[LORE BLOCK]: ${JSON.stringify(lore)}`);
    }
    else {
        lines.push("[LORE BLOCK]: No specific lore entry for this coordinate.");
    }
    if (quests && quests.length > 0) {
        lines.push(" [ACTIVE QUEST ANCHORS]:");
        quests.forEach(q => lines.push(`  - Entity ${q.entityId}: ${JSON.stringify(q.bio)} | Objectives: ${JSON.stringify(q.quests)}`));
    }
    return lines.join("\n");
}
function truncate(s, n) {
    if (s.length <= n)
        return s;
    return s.slice(0, n - 1) + "…";
}
export function buildNarrationPrompt(params) {
    const system = buildSystemPrompt();
    const memoryBlock = renderMemoryContext(params.memories);
    const immutableBlock = renderImmutableContext(params.deterministicLore ?? null, params.activeQuests ?? []);
    const user = [
        immutableBlock,
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
        "- End with an actionable next beat.",
    ].join("\n");
    return { system, user };
}
export function buildMultiRecipientPrompt(params) {
    const recipients = clampRecipients(params.recipients);
    const system = [
        buildSystemPrompt(),
        "",
        "OUTPUT FORMAT (STRICT):",
        "You MUST output exactly one section per requested recipient label, in the same order.",
        "Use this exact syntax:",
        "=== <LABEL> ===",
        "<markdown output for that label>",
        "",
        "Do not output any extra labels. Do not add meta commentary about formatting.",
    ].join("\n");
    const memoryBlock = renderMemoryContext(params.memories);
    const immutableBlock = renderImmutableContext(params.deterministicLore ?? null, params.activeQuests ?? []);
    const user = [
        immutableBlock,
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
        "- Adhere to active quest objectives for encountered entities.",
        "- End each section with an actionable next beat.",
    ].join("\n");
    return { system, user, recipients };
}
function renderRecipientsSpec(recipients) {
    return recipients.map((r, i) => `${i + 1}) ${r.label} (mode=${r.mode}, id=${r.id})`).join("\n");
}
function clampRecipients(recipients) {
    if (!recipients || recipients.length === 0)
        return [{ id: "lyra", label: "LYRA", mode: "lyra" }];
    return recipients.slice(0, 3);
}
export function parseLabeledSections(raw, recipients) {
    const lines = raw.split(/\r?\n/);
    const headerRe = /^={3,}\s*([A-Za-z0-9_:\- ]+)\s*={3,}\s*$/;
    const byLabel = new Map();
    let currentLabel = null;
    for (const line of lines) {
        const m = line.match(headerRe);
        if (m) {
            currentLabel = m[1].trim().toUpperCase();
            if (!byLabel.has(currentLabel))
                byLabel.set(currentLabel, []);
            continue;
        }
        if (currentLabel)
            byLabel.get(currentLabel).push(line);
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
    return outputs.filter((o) => o.markdown.length > 0);
}
