import { QuestOrchestrator } from '../llm/QuestOrchestrator';
import { QuestRegistry } from './QuestRegistry';
import { QuestDefinition } from './QuestTypes';
import { generateContract, QuestContract } from '../llm/LlmContracts';

export class QuestRunner {
  constructor(private orchestrator: QuestOrchestrator, private registry: QuestRegistry) { }

  runWorld(worldKey: string, playerAffinity: Record<string, number>) {
    const activeQuests = this.orchestrator.enterWorld(worldKey, playerAffinity);

    for (const quest of activeQuests) {
      const contract: QuestContract = generateContract(quest);

      console.log(`Starting Quest: ${quest.name} [Actions: ${contract.allowedActions.join(', ')}]`);

      for (const obj of quest.objectives) {
        if (!obj.completed && contract.allowedActions.length > 0) {
          console.log(`Completing Objective: ${obj.description}`);
          this.orchestrator.completeObjective(quest.questId, obj.id);
        }
      }

      const finalQuest = this.registry.getQuest(quest.questId);
      if (finalQuest?.phase === 'RESOLVED') {
        console.log(`Quest Resolved: ${finalQuest.name}`);
      }
    }
  }
}
