
import { PlayerData, Quest, Achievement, PlayerStats } from '../types';

const STORAGE_KEY = 'GEMINI_FLIGHT_DATA_V1';

export const INITIAL_PLAYER_DATA: PlayerData = {
    credits: 0,
    inventory: {
        repairKits: 1,
        shieldCells: 1
    },
    weaponLevel: 0,
    stats: {
        totalKills: 0,
        totalCreditsEarned: 0,
        totalTimePlayed: 0,
        highestHeat: 0
    },
    unlockedAchievements: []
};

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'FIRST_BLOOD',
        title: 'First Blood',
        description: 'Destroy your first hostile target.',
        icon: '⚔️',
        unlocked: false,
        condition: (s) => s.totalKills >= 1
    },
    {
        id: 'ACE_PILOT',
        title: 'Ace Pilot',
        description: 'Destroy 50 hostile targets.',
        icon: '🦅',
        unlocked: false,
        condition: (s) => s.totalKills >= 50
    },
    {
        id: 'WEALTHY',
        title: 'Mercenary',
        description: 'Earn 5,000 Credits.',
        icon: '💎',
        unlocked: false,
        condition: (s) => s.totalCreditsEarned >= 5000
    },
    {
        id: 'SURVIVOR',
        title: 'Heat Rising',
        description: 'Reach Heat Level 5.',
        icon: '🔥',
        unlocked: false,
        condition: (s) => s.highestHeat >= 5
    }
];

export const saveGame = (data: PlayerData) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Save failed", e);
    }
};

export const loadGame = (): PlayerData => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return { ...INITIAL_PLAYER_DATA, ...parsed, stats: { ...INITIAL_PLAYER_DATA.stats, ...(parsed.stats || {}) } };
        }
    } catch (e) {
        console.error("Load failed", e);
    }
    return INITIAL_PLAYER_DATA;
};

export const generateQuest = (difficultyLevel: number): Quest => {
    const types: Quest['type'][] = ['KILL_COUNT', 'KILL_ELITE', 'COLLECT_SCRAP'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Scale requirements based on difficulty/weapon level
    const baseCount = 3 + difficultyLevel * 2;
    const baseReward = 200 + difficultyLevel * 150;

    if (type === 'KILL_ELITE') {
        const count = Math.max(1, Math.floor(baseCount / 3));
        return {
            id: `q-${Date.now()}`,
            type: 'KILL_ELITE',
            description: `Destroy ${count} Elite Interceptors`,
            targetCount: count,
            currentCount: 0,
            rewardCredits: baseReward * 2,
            completed: false
        };
    } else if (type === 'COLLECT_SCRAP') {
        const count = baseCount;
        return {
             id: `q-${Date.now()}`,
             type: 'COLLECT_SCRAP',
             description: `Collect ${count} Cargo Pods`,
             targetCount: count,
             currentCount: 0,
             rewardCredits: baseReward * 1.5,
             completed: false
        };
    } else {
        return {
            id: `q-${Date.now()}`,
            type: 'KILL_COUNT',
            description: `Eliminate ${baseCount} Hostiles`,
            targetCount: baseCount,
            currentCount: 0,
            rewardCredits: baseReward,
            completed: false
        };
    }
};
