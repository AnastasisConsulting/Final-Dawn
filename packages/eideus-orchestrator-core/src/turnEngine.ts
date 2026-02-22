import { Ollama } from 'ollama';
import type {
  TurnContext,
  TurnResult,
  EntityCard,
  QuestUpdatePayload,
  AgentOutputSection,
  RecipientMode,
  TurnRecipient,
  VoxelFaces
} from './types.js';
import { buildMultiRecipientPrompt, parseLabeledSections } from './templates/templates.js';
import { resolveDeterministicContext } from './resolver.js';
import { VoxelWriter } from './persistence.js';
import { ScaffoldingService } from './scaffolding/ScaffoldingService.js';
import { InMemoryLattice } from 'eideus-memory-lattice-api';

export interface TurnEngineOptions {
  endpoint?: string;
  ollama?: Ollama;
  lattice: InMemoryLattice;
  embedModel?: string;
  llmModel?: string;
}

export class TurnEngine {
  private ollama: Ollama;
  private lattice: InMemoryLattice;
  private writer: VoxelWriter;
  private scaffolding: ScaffoldingService;
  private model: string;

  constructor(options: TurnEngineOptions) {
    this.ollama = options.ollama || new Ollama({ host: options.endpoint || 'http://localhost:11434' });
    this.lattice = options.lattice;
    this.model = options.llmModel || 'llama3:latest';
    this.writer = new VoxelWriter({ ollama: this.ollama, embedModel: options.embedModel, llmModel: this.model });
    this.scaffolding = new ScaffoldingService(this.ollama);
  }

  /**
   * Resolve specific mission guidance based on proximity to quest cast members.
   */
  private resolveDirectorGuidance(activeQuests: any[], flags: Record<string, any>): string {
    const allWorldQuests = new Set<any>();
    for (const qEntry of activeQuests) {
      if (Array.isArray(qEntry.quests)) {
        qEntry.quests.forEach((q: any) => allWorldQuests.add(q));
      }
    }

    const activeQuest = Array.from(allWorldQuests)[0];
    if (!activeQuest) return "";

    const worldId = activeQuest.worldId || "G1-S1-O1";
    const questId = activeQuest.questId || activeQuest.id;
    const fPrefix = `q:${worldId}:${questId}`;

    const giverMet = !!flags[`${fPrefix}:giver_met`];
    const intermediaryMet = !!flags[`${fPrefix}:intermediary_met`];
    const isComplete = !!flags[`${fPrefix}:complete`];

    const cast = activeQuest.key_cast;

    if (isComplete) {
      return `GM DIRECTIVE: Quest "${activeQuest.title}" is COMPLETED. Narrative focus shifts to secondary fallout or new rewards.`;
    }

    if (!giverMet) {
      const tgt = cast?.giver?.name || "the quest giver";
      return `GM DIRECTIVE (PHASE 1 - INITIATION): Drive the player toward ${tgt} to begin the mission. NPCs should nudge the player toward this contact.`;
    }

    if (!intermediaryMet) {
      const tgt = cast?.intermediary?.name || "the intermediary contact";
      return `GM DIRECTIVE (PHASE 2 - DEVELOPMENT): The Giver was met. Now "fill the space" between contacts. Guide the player toward ${tgt} to advance the mission.`;
    }

    const tgt = cast?.closer?.name || "the closer";
    return `GM DIRECTIVE (PHASE 3 - RESOLUTION): Guide the player to ${tgt} for final resolution.`;
  }

  private resolveFlagUpdates(activeQuests: any[], entitiesPresent: EntityCard[], flags: Record<string, any>): Record<string, boolean> | undefined {
    const allWorldQuests = new Set<any>();
    for (const qEntry of activeQuests) {
      if (Array.isArray(qEntry.quests)) {
        qEntry.quests.forEach((q: any) => allWorldQuests.add(q));
      }
    }

    const activeQuest = Array.from(allWorldQuests)[0];
    if (!activeQuest || !activeQuest.key_cast) return undefined;

    const worldId = activeQuest.worldId || "G1-S1-O1";
    const questId = activeQuest.questId || activeQuest.id;
    const fPrefix = `q:${worldId}:${questId}`;
    const cast = activeQuest.key_cast;

    const currentIds = entitiesPresent.map(e => e.id);
    const updates: Record<string, any> = {};

    if (cast.giver?.npc_key && currentIds.includes(cast.giver.npc_key) && !flags[`${fPrefix}:giver_met`]) {
      updates[`${fPrefix}:giver_met`] = true;
    }
    if (flags[`${fPrefix}:giver_met`] && cast.intermediary?.npc_key && currentIds.includes(cast.intermediary.npc_key) && !flags[`${fPrefix}:intermediary_met`]) {
      updates[`${fPrefix}:intermediary_met`] = true;
    }
    if (flags[`${fPrefix}:intermediary_met`] && cast.closer?.npc_key && currentIds.includes(cast.closer.npc_key) && !flags[`${fPrefix}:closer_met`]) {
      updates[`${fPrefix}:closer_met`] = true;
      updates[`${fPrefix}:complete`] = true;
    }

    return Object.keys(updates).length > 0 ? updates : undefined;
  }

  async processTurn(context: TurnContext, caches: any): Promise<TurnResult> {
    // 1. Resolve Deterministic State
    const deterministic = await resolveDeterministicContext({
      spatial: context.spatial,
      temporal: context.temporal,
      loreKey: context.loreKey,
      entitiesPresent: context.entitiesPresent,
      memoryOrchestrator: { lattice: this.lattice },
      caches: caches
    });

    const activeQuests = deterministic.activeQuests;
    const entitiesResolved = deterministic.entitiesResolved;

    const directorGuidance = this.resolveDirectorGuidance(activeQuests, context.flags);

    // 2. Build Prompt
    const { system, user } = buildMultiRecipientPrompt({
      playerText: context.playerText,
      memories: context.memories,
      deterministicLore: deterministic.loreEntry,
      activeQuests,
      questFlags: context.flags,
      recipients: context.recipients,
      playerClass: context.playerClass,
      playerAffinity: context.playerAffinity,
      characterDirectives: {
        ...context.characterDirectives,
        "DIRECTOR_GUIDANCE": directorGuidance
      }
    });

    // 3. Generate Turn — use per-request llmConfig if provided
    const requestModel = context.llmConfig?.model || this.model;
    const requestTemp = context.llmConfig?.temperature ?? 0.7;

    // If client specified a different Ollama host, use a transient client
    const ollamaClient = (context.llmConfig?.baseUrl && context.llmConfig.baseUrl !== 'http://127.0.0.1:11434' && context.llmConfig.baseUrl !== 'http://localhost:11434')
      ? new (this.ollama.constructor as any)({ host: context.llmConfig.baseUrl })
      : this.ollama;

    const response = await ollamaClient.generate({
      model: requestModel,
      system,
      prompt: user,
      options: { temperature: requestTemp }
    });

    const raw = response.response.trim();
    const parsed = parseLabeledSections(raw, context.recipients);
    let outputs = parsed.sections;
    const thought = parsed.thought;

    if (outputs.length === 0 && raw.length > 0 && context.recipients.length > 0) {
      outputs = [{
        id: context.recipients[0].id,
        label: context.recipients[0].label,
        mode: context.recipients[0].mode,
        markdown: raw
      }];
    }

    const narration = outputs.map(o => `=== ${o.label} ===\n${o.markdown}`).join("\n\n");

    // 4. Procedural Scaffolding
    this.scaffolding.registerKnownEntities(entitiesResolved.map(e => e.name));
    const { npcs, landmarks } = await this.scaffolding.processNarration(
      narration, context.spatial, context.loreKey, context.loreKey, this.model
    );

    // 5. Persistence
    // Bot probe turns WRITE to the lattice — the bot has no natural recall and needs its
    // own prior turns as memories. The old guard was preventing contamination from the raw
    // '[BETA_BOT]' probe string — fixed by using the LLM's resolved action output as x+.
    const isBotProbe = context.playerText.includes('[BETA_BOT]') || context.playerText.includes('[PNS_OVERRIDE]');

    // For bot turns, use the first output section (the bot's resolved action) as the player-side
    // x+ face, not the raw probe text. For human turns, use playerText directly.
    const actionText = isBotProbe
      ? (outputs[0]?.markdown?.trim() || context.playerText)
      : context.playerText;

    const combinedLog = `[Action] ${actionText}\n[Thought] ${thought || ""}\n[Narrative] ${narration}`;
    const tags = await this.writer.generateTags(combinedLog);
    const embeddings = await this.writer.generateEmbeddings(combinedLog);

    const faces: VoxelFaces = {
      "x+": actionText,   // spec: x+ = player/bot action (what was done)
      "x-": narration,    // spec: x- = narration output (world's response)
      "y+": embeddings,
      "y-": tags,
      "z+": [...entitiesResolved, ...npcs.map(n => n.entityRef)],
      "z-": {
        loreKey: context.loreKey,
        landmarks: landmarks.map(l => l.landmarkRef)
      }
    };

    await this.writer.upsertWithRetry(this.lattice, context.spatial, context.temporal, faces);


    // 6. State Updates
    const newFlags = this.resolveFlagUpdates(activeQuests, entitiesResolved, context.flags);
    let questUpdates: QuestUpdatePayload | undefined;

    if (newFlags) {
      const activeQuest = Array.from(new Set(activeQuests.flatMap(q => q.quests)))[0];
      if (activeQuest && newFlags[`q:${activeQuest.worldId}:${activeQuest.questId || activeQuest.id}:complete`]) {
        questUpdates = { status: 'ADVANCE', message: `Quest "${activeQuest.title}" Completed.` };
      }
    }

    return {
      narration,
      outputs,
      thought,
      newFlags,
      questUpdates
    };
  }
}
