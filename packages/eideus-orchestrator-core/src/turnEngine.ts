// packages/eideus-orchestrator-core/src/turnEngine.ts
import { Ollama } from 'ollama';
import type {
  TurnContext,
  TurnResult,
  EntityCard,
  QuestUpdatePayload,
  AgentOutputSection,
  RecipientMode,
  TurnRecipient
} from './types.js';
import { buildMultiRecipientPrompt, parseLabeledSections } from './templates/templates.js';

export class TurnEngine {
  private ollama: Ollama;

  constructor(endpoint: string = 'http://localhost:11434') {
    this.ollama = new Ollama({ host: endpoint });
  }

  /**
   * Resolve specific mission guidance based on proximity to quest cast members.
   * Part of the 3-Part Quest Logic (Initiation -> Development -> Resolution).
   */
  private resolveDirectorGuidance(context: TurnContext): string {
    // MVP: Focus on the first available quest in the local context
    const allWorldQuests = new Set<any>();
    for (const qEntry of context.activeQuests) {
      if (Array.isArray(qEntry.quests)) {
        qEntry.quests.forEach((q: any) => allWorldQuests.add(q));
      }
    }

    const activeQuest = Array.from(allWorldQuests)[0];
    if (!activeQuest) return "";

    const worldId = activeQuest.worldId || "G1-S1-O1";
    const questId = activeQuest.questId || activeQuest.id;
    const fPrefix = `q:${worldId}:${questId}`;

    const giverMet = !!context.flags[`${fPrefix}:giver_met`];
    const intermediaryMet = !!context.flags[`${fPrefix}:intermediary_met`];
    const isComplete = !!context.flags[`${fPrefix}:complete`];

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

  /**
   * Flip quest flags autonomously if the player is in the presence of key NPCs.
   */
  private resolveFlagUpdates(context: TurnContext): Record<string, boolean> | undefined {
    const allWorldQuests = new Set<any>();
    for (const qEntry of context.activeQuests) {
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

    const currentIds = context.entitiesPresent.map(e => e.id);
    const updates: Record<string, any> = {};

    // Phase 1: Giver
    if (cast.giver?.npc_key && currentIds.includes(cast.giver.npc_key) && !context.flags[`${fPrefix}:giver_met`]) {
      updates[`${fPrefix}:giver_met`] = true;
    }
    // Phase 2: Intermediary (only if Giver met)
    if (context.flags[`${fPrefix}:giver_met`] && cast.intermediary?.npc_key && currentIds.includes(cast.intermediary.npc_key) && !context.flags[`${fPrefix}:intermediary_met`]) {
      updates[`${fPrefix}:intermediary_met`] = true;
    }
    // Phase 3: Closer (only if Intermediary met)
    if (context.flags[`${fPrefix}:intermediary_met`] && cast.closer?.npc_key && currentIds.includes(cast.closer.npc_key) && !context.flags[`${fPrefix}:closer_met`]) {
      updates[`${fPrefix}:closer_met`] = true;
      updates[`${fPrefix}:complete`] = true;
    }

    return Object.keys(updates).length > 0 ? updates : undefined;
  }

  async processTurn(context: TurnContext): Promise<TurnResult> {
    const directorGuidance = this.resolveDirectorGuidance(context);

    // Build directives with the narrative override
    const characterDirectives = {
      ...context.characterDirectives,
      "DIRECTOR_GUIDANCE": directorGuidance
    };

    const { system, user } = buildMultiRecipientPrompt({
      playerText: context.playerText,
      memories: context.memories,
      deterministicLore: context.loreEntry,
      activeQuests: context.activeQuests,
      questFlags: context.flags,
      recipients: context.recipients,
      playerClass: context.playerClass,
      playerAffinity: context.playerAffinity,
      characterDirectives
    });

    const model = context.llmConfig?.model || 'llama3:latest';
    const temp = context.llmConfig?.temperature ?? 0.7;

    const response = await this.ollama.generate({
      model,
      system,
      prompt: user,
      options: { temperature: temp }
    });

    const raw = response.response.trim();
    let outputs = parseLabeledSections(raw, context.recipients);

    if (outputs.length === 0 && raw.length > 0 && context.recipients.length > 0) {
      outputs = [{
        id: context.recipients[0].id,
        label: context.recipients[0].label,
        mode: context.recipients[0].mode,
        markdown: raw
      }];
    }

    const narration = outputs.map(o => `=== ${o.label} ===\n${o.markdown}`).join("\n\n");

    const newFlags = this.resolveFlagUpdates(context);
    let questUpdates: QuestUpdatePayload | undefined;

    if (newFlags) {
      const activeQuest = Array.from(new Set(context.activeQuests.flatMap(q => q.quests)))[0];
      if (activeQuest && newFlags[`q:${activeQuest.worldId}:${activeQuest.questId || activeQuest.id}:complete`]) {
        questUpdates = { status: 'ADVANCE', message: `Quest "${activeQuest.title}" Completed.` };
      }
    }

    return {
      narration,
      outputs,
      newFlags,
      questUpdates
    };
  }
}
