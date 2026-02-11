import { QuestDefinition, QuestObjective } from '../src/QuestTypes';

export interface QuestContract {
  questId: string;
  allowedActions: string[]; // e.g., ['TALK', 'COLLECT', 'TRAVEL']
  maxAttempts?: number; // optional, for time/pressure-limited quests
}

export function generateContract(quest: QuestDefinition): QuestContract {
  const actions: string[] = [];

  for (const obj of quest.objectives) {
    if (/talk/i.test(obj.description)) actions.push('TALK');
    if (/collect|gather|harvest/i.test(obj.description)) actions.push('COLLECT');
    if (/travel|reach|visit/i.test(obj.description)) actions.push('TRAVEL');
    if (/defeat|kill|eliminate/i.test(obj.description)) actions.push('COMBAT');
  }

  return {
    questId: quest.questId,
    allowedActions: Array.from(new Set(actions)),
    maxAttempts: quest.objectives.length * 2
  };
}
