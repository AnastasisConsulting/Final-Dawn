import { QuestDefinition, QuestPhase } from './QuestTypes';

export class QuestRegistry {
  private quests: Map<string, QuestDefinition> = new Map();

  registerQuest(quest: QuestDefinition) {
    if (this.quests.has(quest.questId)) {
      throw new Error(`Quest ${quest.questId} already registered`);
    }
    this.quests.set(quest.questId, quest);
  }

  getQuest(questId: string): QuestDefinition | undefined {
    return this.quests.get(questId);
  }

  listAvailable(worldKey: string): QuestDefinition[] {
    return Array.from(this.quests.values()).filter(
      q => q.worldKey === worldKey && q.phase === 'AVAILABLE'
    );
  }

  advanceQuestPhase(questId: string, newPhase: QuestPhase) {
    const quest = this.quests.get(questId);
    if (!quest) throw new Error(`Quest ${questId} not found`);
    quest.phase = newPhase;
  }
}
