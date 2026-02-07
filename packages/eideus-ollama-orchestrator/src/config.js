// /src/config.ts
export const CONFIG = {
    // Default API port aligns with local UI dev server expectations.
    PORT: parseInt(process.env.PORT ?? "4000", 10),
    OLLAMA_HOST: process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434",
    LLM_MODEL: process.env.LLM_MODEL ?? "jimscard/adult-film-screenwriter-nsfw:latest",
    EMBED_MODEL: process.env.EMBED_MODEL ?? "nomic-embed-text",
    MAX_CONTEXT_VOXELS: parseInt(process.env.MAX_CONTEXT_VOXELS ?? "12", 10),
    TEMPORAL_WINDOW_PAGES: parseInt(process.env.TEMPORAL_WINDOW_PAGES ?? "3", 10),
    TOPK_EMBED: parseInt(process.env.TOPK_EMBED ?? "20", 10),
    TOPK_KEYWORD: parseInt(process.env.TOPK_KEYWORD ?? "12", 10),
};
