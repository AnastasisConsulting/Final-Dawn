import questsData from '../data/generated_quests.json';

export interface QuestCast {
    giver: { name: string; id: string };
    contact: { name: string; id: string };
    target: { name: string; id: string };
}

export interface QuestData {
    title: string;
    narrative_guidance: string;
    improvisation_points: string[];
    cast: QuestCast;
}

export class QuestManager {
    static getQuest(locationId: string, affinity: string): QuestData | null {
        // @ts-ignore
        const location = questsData[locationId];
        if (!location) return null;

        // @ts-ignore
        const affinityData = location[affinity];
        if (!affinityData || !affinityData.quests || affinityData.quests.length === 0) return null;

        return affinityData.quests[0];
    }

    static getObjective(quest: QuestData, stepIndex: number): string {
        switch (stepIndex) {
            case 0:
                return `Find and accept mission from ${quest.cast.giver.name} (Quest Giver).`;
            case 1:
                return `Locate contact: ${quest.cast.contact.name}.`;
            case 2:
                return `Eliminate or Interdict target: ${quest.cast.target.name}.`;
            case 3:
                return `Quest Completed. Return to orbit.`;
            default:
                return `Unknown Objective`;
        }
    }

    static getTargetDetails(quest: QuestData, stepIndex: number): { name: string; id: string } | null {
        switch (stepIndex) {
            case 0: return quest.cast.giver;
            case 1: return quest.cast.contact;
            case 2: return quest.cast.target;
            default: return null;
        }
    }
}
