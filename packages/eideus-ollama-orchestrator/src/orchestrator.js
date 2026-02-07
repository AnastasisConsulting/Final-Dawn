// /src/orchestrator.ts
import { OllamaClient } from "./ollamaClient.js";
import { decideMemoryEntryPoint } from "./router.js";
import { HttpMemoryApi } from "./memoryApi.js";
import { buildNarrationPrompt, buildMultiRecipientPrompt, parseLabeledSections } from "./prompts.js";
function hasRecipients(input) {
    return Array.isArray(input?.recipients) && input.recipients.length > 0;
}
export class EideusOllamaOrchestrator {
    cfg;
    ollama;
    memory;
    constructor(cfg) {
        this.cfg = cfg;
        this.ollama = new OllamaClient(cfg.ollamaBaseUrl);
        this.memory = new HttpMemoryApi(cfg.memoryApiBaseUrl);
    }
    async runTurn(input) {
        // 1) embeddings model (y+) drives semantic intent recall
        const intentEmbedding = await this.ollama.embed(this.cfg.embedModel, input.playerText);
        // 2) decide which memory endpoint to use this turn
        const decision = decideMemoryEntryPoint(input);
        // 3) retrieve relevant memory
        const retrieved = await this.retrieveMemories(decision.plan, intentEmbedding);
        // 4) prompt build (single or multi-recipient)
        let system;
        let user;
        let recipients = null;
        if (hasRecipients(input)) {
            const r = buildMultiRecipientPrompt({
                playerText: input.playerText,
                memories: retrieved,
                deterministicLore: null,
                activeQuests: [],
                recipients: input.recipients,
            });
            system = r.system;
            user = r.user;
            recipients = r.recipients;
        }
        else {
            const r = buildNarrationPrompt({
                playerText: input.playerText,
                memories: retrieved,
                deterministicLore: null,
                activeQuests: [],
            });
            system = r.system;
            user = r.user;
        }
        const chat = await this.ollama.chat({
            model: this.cfg.chatModel,
            messages: [
                { role: "system", content: system },
                { role: "user", content: user },
            ],
        });
        const raw = chat.message.content ?? "";
        let narration = raw;
        let outputs = undefined;
        if (recipients) {
            const parsed = parseLabeledSections(raw, recipients);
            outputs = parsed.map((p) => ({
                id: p.id,
                label: p.label,
                mode: p.mode,
                markdown: p.markdown,
            }));
            narration =
                outputs.length === 0
                    ? raw.trim()
                    : outputs
                        .map((o) => `=== ${o.label} ===\n${o.markdown}`.trim())
                        .join("\n\n");
        }
        const out = {
            narration,
            outputs,
            debug: this.cfg.debug
                ? {
                    routerPlan: decision,
                    memorySelection: {
                        entryPoint: decision.plan.op,
                        rationale: decision.reason,
                        memory: retrieved,
                    },
                    llmModel: this.cfg.chatModel,
                    embedModel: this.cfg.embedModel,
                }
                : undefined,
        };
        return out;
    }
    async retrieveMemories(plan, intentEmbedding) {
        if (plan.op === "DirectVoxelRead") {
            const r = await this.memory.directVoxelRead({ spatial: plan.spatial, temporal: plan.temporal });
            if (!r.voxel)
                return [];
            return [this.toRetrieved(r.voxel, 1)];
        }
        if (plan.op === "LatestAtLocation") {
            const r = await this.memory.latestAtLocation({ spatial: plan.spatial, saga: plan.saga, book: plan.book });
            return r.voxels.map((v) => this.toRetrieved(v, 1));
        }
        if (plan.op === "DirectSpatialSlice") {
            const r = await this.memory.directSpatialSlice({
                spatial: plan.spatial,
                saga: plan.saga,
                book: plan.book,
                chapter: plan.chapter
            });
            return r.voxels.slice(-12).map((v) => this.toRetrieved(v, 1));
        }
        if (plan.op === "EmbeddingTopKThenRerank") {
            const top = await this.memory.searchEmbeddings({
                queryEmbedding: intentEmbedding,
                topK: plan.topK ?? 25,
                spatialPrefix: plan.spatialPrefix,
            });
            const reranked = await this.memory.joinAndRerank({
                seed: top.matches,
                intentEmbedding,
                limit: 12,
            });
            const voxels = [];
            for (const m of reranked.matches) {
                const coord = m.coord;
                const r = await this.memory.readVoxel({ spatial: coord.spatial, temporal: coord.temporal });
                if (r.voxel)
                    voxels.push(this.toRetrieved(r.voxel, m.score));
            }
            return voxels;
        }
        return [];
    }
    toRetrieved(v, score) {
        return {
            spatial: v.spatial,
            temporal: v.temporal,
            score,
            faces: {
                "x+": v.faces?.["x+"] ?? "",
                "x-": v.faces?.["x-"] ?? "",
                "y-": v.faces?.["y-"] ?? [],
                "z-": v.faces?.["z-"] ?? "",
                "z+": v.faces?.["z+"] ?? [],
            },
        };
    }
}
