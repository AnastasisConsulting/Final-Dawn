// packages/eideus-ollama-orchestrator/src/npc/index.ts
// NPC module exports

export * from "./npc.types.js";
export { createNpcGenerator, detectEntities, generateNpcsFromNarration } from "./NpcGenerator.js";
export { NpcChatService, createNpcChatService } from "./NpcChatService.js";
export type { NpcChatMessage } from "./NpcChatService.js";
