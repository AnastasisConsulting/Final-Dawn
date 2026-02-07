// /src/config.ts

// Sanitize OLLAMA_HOST
let host = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

// 1. Ensure Protocol
if (!host.startsWith("http://") && !host.startsWith("https://")) {
  host = "http://" + host;
}

// 2. Fix 0.0.0.0 -> 127.0.0.1 for client usage (Windows fetch compatibility)
host = host.replace("0.0.0.0", "127.0.0.1");

// 3. Ensure Port (if missing)
// Basic check: if it ends with a number (IP segment) or 'localhost', it needs a port.
// URL parsing is safer, but let's do a simple check for colon after the protocol
const protocolStripped = host.replace(/https?:\/\//, "");
if (!protocolStripped.includes(":")) {
  host = `${host}:11434`;
}

export const CONFIG = {
  // Default API port aligns with local UI dev server expectations.
  PORT: parseInt(process.env.PORT ?? "4000", 10),
  OLLAMA_HOST: host,
  LLM_MODEL: process.env.LLM_MODEL ?? "llama3",
  EMBED_MODEL: process.env.EMBED_MODEL ?? "nomic-embed-text",
  MAX_CONTEXT_VOXELS: parseInt(process.env.MAX_CONTEXT_VOXELS ?? "12", 10),
  TEMPORAL_WINDOW_PAGES: parseInt(process.env.TEMPORAL_WINDOW_PAGES ?? "3", 10),
  TOPK_EMBED: parseInt(process.env.TOPK_EMBED ?? "20", 10),
  TOPK_KEYWORD: parseInt(process.env.TOPK_KEYWORD ?? "12", 10),
} as const;
