/**
 * CLIENT-SIDE ORCHESTRATOR BRIDGE
 * Connects Dawn UI (React) -> Eideus Backend (Node/Ollama)
 */

import { devLog, devLogTimer } from '../src/services/devLog';

export type TurnContext = {
    sessionId: string;
    objectKey: string; // e.g. G1-S1-O1
    civIndex: number;  // 0-based
    cityIndex: number; // 0-based
    locIndex: number;  // 0-based (Region)

    // Temporal (Placeholder)
    saga?: string;
    book?: string;
    chapter?: string;

    // Neural Link Config
    llmConfig?: {
        model?: string;
        baseUrl?: string;
        temperature?: number;
        embeddingModel?: string;
        minEmbeddings?: number;
        maxEmbeddings?: number;
        minTags?: number;
        maxTags?: number;
        enableTagLLM?: boolean;
        performanceMode?: boolean;
    };

    // Persisted flags from GameContext (quest progress, world toggles, etc.)
    flags?: Record<string, boolean | string | number>;
};

// Response Type (Aligned with Backend)
export type TurnOutput = {
    id: string;
    label: string;
    mode?: string;
    markdown: string;
    tool_calls?: any[];
};

export type TurnResponse = {
    response: string; // The markdown text from the AI
    outputs?: TurnOutput[]; // Multi-recipient outputs
    audio?: string;   // Future
    actions?: any[];  // Future
    tool_calls?: any[]; // Ollama function calls (sc_* tools)
};

function extractToolCalls(text: string) {
    const toolRegex = /\[(sc_[a-z_]+)\((.*?)\)\]/g;
    const matches = Array.from(text.matchAll(toolRegex));
    const toolCalls: any[] = [];
    let cleaned = text;

    for (const m of matches) {
        const fullMatch = m[0];
        const toolName = m[1];
        const paramsStr = m[2];

        const params: any = {};
        const paramRegex = /([a-z_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^,)\s]+))/g;
        let pMatch;
        while ((pMatch = paramRegex.exec(paramsStr)) !== null) {
            const key = pMatch[1];
            const valStr = pMatch[2] ?? pMatch[3] ?? pMatch[4];

            let val: any = valStr;
            if (val === 'true') val = true;
            else if (val === 'false') val = false;
            else if (!isNaN(Number(val)) && valStr.trim() !== "") val = Number(val);

            params[key] = val;
        }

        toolCalls.push({ name: toolName, params });
        cleaned = cleaned.replace(fullMatch, "");
    }

    cleaned = cleaned.replace(/\n\s*\n/g, '\n\n').trim();
    return { cleaned, toolCalls };
}

function matchOutput(outputs: any[], recipient: string) {
    const target = recipient.toLowerCase();
    return outputs.find((o: any) => {
        const oid = (o.id || "").toLowerCase();
        const olabel = (o.label || "").toLowerCase();
        if (oid === target) return true;
        if (target === "navbot" && oid === "nav") return true;
        if (olabel === target) return true;
        return false;
    }) || outputs[0];
}

export async function runTurn(
    userText: string,
    recipients: string | string[],
    ctx: TurnContext
): Promise<TurnResponse> {
    const BACKEND_URL = "http://localhost:4000/turn";
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];

    const traceId = `tr_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    // 1. Construct Spatial Key from UI Context
    let g = 1, s = 1, o = 1;
    let c = (ctx.civIndex ?? 0) + 1;
    let ct = (ctx.cityIndex ?? 0) + 1;
    let r = (ctx.locIndex ?? 0) + 1;

    if (ctx.objectKey) {
        const parts = ctx.objectKey.split('-');
        if (parts.length >= 3) {
            g = parseInt(parts[0].replace('G', '')) || 1;
            s = parseInt(parts[1].replace('S', '')) || 1;
            o = parseInt(parts[2].replace('O', '')) || 1;
        }
        if (parts.length >= 6) {
            c = parseInt(parts[3].replace('C', '')) || 1;
            ct = parseInt(parts[4].replace('CT', '')) || 1;
            r = parseInt(parts[5].replace('R', '')) || 1;
        }
    }

    const spatial = { g, s, o, c, ct, r };
    const loreKey = `G${g}-S${s}-O${o}`;

    // 2. Construct Payload
    const payload = {
        sessionId: ctx.sessionId,
        input: userText,
        recipients: recipientList,
        meta: {
            loreKey: loreKey,
            spatial,
            temporalBase: {
                saga: ctx.saga || "1",
                book: ctx.book || "1",
                chapter: ctx.chapter || "1"
            },
            page: 1,
            // Pass LLM Config to Backend
            llmConfig: ctx.llmConfig,
            characterDirectives: {
                lyra: "ROLE: LYRA. Nature: Lattice-entity/Internal voice. Voice: Poetic/Ominous. Functions: Pattern recognition, foreshadowing.",
                navbot: "ROLE: NAVBOT. Identity: Sardonic navigation HUD implant. Voice: Dry/Sardonic. Functions: Navigation data, risk assessment. Rules: NO BODY.",
                vizzy: "ROLE: VIZZY. Identity: Damaged blackmarket companion. Personality: Curious/Loyal. ABSOLUTE RULE: NEVER SPEAKS WORDS. Use tones and emotes only."
            },
            flags: ctx.flags
            ,
            debug: { enabled: true, traceId }
        }
    };

    try {
        devLog("info", "orchestrator.runTurn", "POST /turn", {
            traceId,
            sessionId: ctx.sessionId,
            recipients: recipientList,
            loreKey,
            spatial,
            llmConfig: ctx.llmConfig
        });
        const t = devLogTimer("orchestrator.runTurn", "fetch /turn", { traceId });
        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        t.end({ traceId, status: res.status });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Server Error ${res.status}: ${txt}`);
        }

        const data = await res.json();
        if (data?.debug) {
            devLog("debug", "orchestrator.runTurn", "server debug", data.debug);
        }

        // 3. Map Backend Response to UI Contract
        // Backend returns { outputs: [{ id, text, ... }] }
        // We need to find the specific recipient's output
        if (data.outputs && Array.isArray(data.outputs) && data.outputs.length > 0) {
            const outputs: TurnOutput[] = data.outputs.map((o: any) => {
                const { cleaned, toolCalls } = extractToolCalls(o.markdown ?? "");
                return {
                    id: o.id,
                    label: o.label,
                    mode: o.mode,
                    markdown: cleaned,
                    tool_calls: toolCalls
                };
            });

            const toolCalls = outputs.flatMap(o => o.tool_calls ?? []);
            const myOutput = typeof recipients === "string"
                ? matchOutput(outputs, recipients)
                : outputs[0];

            let responseText = myOutput ? myOutput.markdown : "(No response from entity)";

            // --- SPECIAL HANDLING: QUEST FLAG WRITE-BACK ---
            for (const tc of toolCalls) {
                if (tc.name === "sc_set_quest_flag") {
                    console.log("[Orchestrator] Quest Flag Detected:", tc.params);
                    const voxelPayload = {
                        spatial: { g, s, o, c, ct, r },
                        temporal: {
                            saga: Number(ctx.saga || 1),
                            book: Number(ctx.book || 1),
                            chapter: Number(ctx.chapter || 1),
                            page: Date.now()
                        },
                        faces: {
                            "x+": "",
                            "x-": `QUEST_UPDATE: ${tc.params.flag} = ${tc.params.value}`,
                            "y+": [],
                            "y-": ["bureaucracy", "quest", "system_event"],
                            "z+": [],
                            "z-": loreKey
                        }
                    };

                    fetch("http://localhost:4000/upsertVoxel", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(voxelPayload)
                    }).catch(e => console.error("[Orchestrator] Failed to sync Quest Flag to Lattice:", e));
                }
            }

            return {
                response: responseText,
                outputs,
                tool_calls: toolCalls
            };
        }

        // Fallback if legacy response format
        if (data.narration) {
            return { response: data.narration };
        }

        return { response: "(Empty response)" };

    } catch (err: any) {
        console.error("[Orchestrator Bridge] Error:", err);
        return {
            response: `[CONNECTION FAILURE] The neural link to the Core is unresponsive.\nDetails: ${err.message}`
        };
    }
}
