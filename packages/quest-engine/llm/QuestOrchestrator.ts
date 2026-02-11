import { QuestRegistry } from '../src/QuestRegistry';
import { QuestDefinition, QuestPhase } from '../src/QuestTypes';

export class QuestOrchestrator {
  constructor(private registry: QuestRegistry) { }

  enterWorld(worldKey: string, playerAffinity: Record<string, number>) {
    const quests = this.registry.listAvailable(worldKey);
    for (const quest of quests) {
      if (this.meetsAffinity(quest, playerAffinity)) {
        this.registry.advanceQuestPhase(quest.questId, 'ACTIVE');
      }
    }
    return quests.filter(q => q.phase === 'ACTIVE');
  }

  completeObjective(questId: string, objectiveId: string) {
    const quest = this.registry.getQuest(questId);
    if (!quest) throw new Error('Quest not found');

    const obj = quest.objectives.find(o => o.id === objectiveId);
    if (!obj) throw new Error('Objective not found');

    obj.completed = true;

    if (quest.objectives.every(o => o.completed)) {
      this.registry.advanceQuestPhase(quest.questId, 'RESOLVED');
      return true;
    }
    return false;
  }

  private meetsAffinity(
    quest: QuestDefinition,
    playerAffinity: Record<string, number>
  ) {
    if (!quest.affinityRequired) return true;
    return Object.entries(quest.affinityRequired).every(
      ([attr, val]) => (playerAffinity[attr] || 0) >= val
    );
  }
}
