import { QuestRegistry } from './QuestRegistry';
import { QuestDefinition } from './QuestTypes';
import * as fs from 'fs';
import * as path from 'path';

export function loadQuestsFromJSON(registry: QuestRegistry, filePath: string) {
  const fullPath = path.resolve(filePath);
  const data = fs.readFileSync(fullPath, 'utf-8');
  const quests: QuestDefinition[] = JSON.parse(data);

  quests.forEach(q => registry.registerQuest(q));
}
