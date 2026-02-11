/**
 * CLIENT-SIDE ORCHESTRATOR BRIDGE
 * Connects Dawn UI (React) -> Eideus Backend (Node/Ollama)
 */

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
    };
};

// Response Type (Aligned with Backend)
export type TurnResponse = {
    response: string; // The markdown text from the AI
    audio?: string;   // Future
    actions?: any[];  // Future
    tool_calls?: any[]; // Ollama function calls (sc_* tools)
};

export async function runTurn(
    userText: string,
    recipient: string,
    ctx: TurnContext
): Promise<TurnResponse> {
    const BACKEND_URL = "http://localhost:4000/turn";

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
        recipients: [recipient],
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
            }
        }
    };

    try {
        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Server Error ${res.status}: ${txt}`);
        }

        const data = await res.json();

        // 3. Map Backend Response to UI Contract
        // Backend returns { outputs: [{ id, text, ... }] }
        // We need to find the specific recipient's output
        if (data.outputs && Array.isArray(data.outputs) && data.outputs.length > 0) {
            // Robust matching:
            // 1. Exact ID match
            // 2. Normalized ID match ("navbot" vs "nav")
            // 3. Label match (case-insensitive)
            // 4. Fallback to first item if single-recipient
            const target = recipient.toLowerCase();
            const myOutput = data.outputs.find((o: any) => {
                const oid = (o.id || "").toLowerCase();
                const olabel = (o.label || "").toLowerCase();
                if (oid === target) return true;
                if (target === "navbot" && oid === "nav") return true;
                if (olabel === target) return true;
                return false;
            }) || data.outputs[0];

            let responseText = myOutput ? myOutput.markdown : "(No response from entity)";
            const toolCalls = myOutput?.tool_calls || data.tool_calls || [];

            // --- CLIENT-SIDE PARSER for Text-based Tool Calls ---
            // Regex to find [toolname(key="val", ...)]
            const toolRegex = /\[(sc_[a-z_]+)\((.*?)\)\]/g;
            let match;
            // Check for matches first to avoid infinite loops if replacement logic is tricky, 
            // but here we just iterate matches on the original string or modify carefully?
            // Actually, exec interacts with lastIndex. If we modify string, we might mess up?
            // Safer to collect matches from original string, then replace all.
            const matches = Array.from(responseText.matchAll(toolRegex));

            for (const m of matches) {
                const fullMatch = m[0];
                const toolName = m[1];
                const paramsStr = m[2];

                const params: any = {};
                const paramRegex = /([a-z_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^,)\s]+))/g;
                let pMatch;
                while ((pMatch = paramRegex.exec(paramsStr)) !== null) {
                    const key = pMatch[1];
                    const valStr = pMatch[2] || pMatch[3] || pMatch[4];
                    let val: any = valStr;
                    if (val === 'true') val = true;
                    if (val === 'false') val = false;
                    // Try number?
                    if (!isNaN(Number(val)) && valStr.trim() !== "") val = Number(val);

                    params[key] = val;
                }

                toolCalls.push({ name: toolName, params });
                responseText = responseText.replace(fullMatch, "");
            }

            responseText = responseText.replace(/\n\s*\n/g, '\n\n').trim();

            return {
                response: responseText,
                tool_calls: toolCalls // Extract from output or root
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
