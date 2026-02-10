import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
    calculateLevelFromXp,
    getXpForNextLevel,
    XpLedger,
    initializeLedger,
    calculateAward,
    Mode as LedgerMode,
    Tier as LedgerTier
} from 'eideus-xp-system';
import { BestiaryManager } from 'eideus-bestiary';
import { rollD10Pool } from 'eideus-combat';
import { generateEnemyLoot } from '../economy/loot';
import { TEMPLATE, getAllowedSkillSlots } from '@eideus/class-skills';
import { SkillSlot } from '@eideus/class-skills';

// Initialize Bestiary singleton
// BestiaryManager uses pre-loaded static data from Galaxies_Folder
// --- Types ---

export interface Item {
    id: string;
    name: string;
    type: 'WEAPON' | 'ARMOR' | 'RESOURCE' | 'consumable';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    description?: string;
    count?: number;
}

export interface SkillState {
    unlocked: string[]; // Skill IDs
    slots: Partial<Record<SkillSlot, string>>; // Slot -> Skill ID
}

export interface GameState {
    xp: number;
    level: number;
    identity: {
        core: string | null;
        sub: string | null;
        cross: string | null;
        master: string | null;
        name?: string; // Player Name
    };
    ledger: XpLedger;
    inventory: Item[];
    skills: SkillState;
    attributes: Record<string, number>;
    skillLevels: Record<string, number>;
    combat: {
        wins: number;
        losses: number;
    };
    flightStats: {
        weaponLevel: number;
        armorLevel: number;
        maxHull: number;
        maxShield: number;
    };
    credits: number; // Added credits to state
    settings: {
        autoSaveInterval: number;
        autoSaveEnabled: boolean;
        llm: {
            model: string;
            baseUrl: string;
            temperature: number;
            vizzyModel?: string;
            embeddingModel?: string;
            minEmbeddings?: number;
            maxEmbeddings?: number;
            minTags?: number;
            maxTags?: number;
        };
    };
    relationships: {
        lyra: number;
        vizzy: number;
        navbot: number;
    };
    quests: Record<string, QuestState>;
    turnCount: number;
}

export interface QuestState {
    id: string;
    status: 'active' | 'completed' | 'failed';
    stepIndex: number; // 0=Giver, 1=Contact, 2=Target, 3=Complete
    log: string[];
}

// ... existing interfaces ...

type Action =
    | { type: 'ADD_XP'; amount: number }
    | { type: 'INCREMENT_TURN' }
    | { type: 'RECORD_KILL'; mode: LedgerMode; tier: LedgerTier; enemyTypeId: string; systemId: string }
    | { type: 'SET_IDENTITY'; core?: string; sub?: string; cross?: string }
    | { type: 'ADD_ITEM'; item: Item }
    | { type: 'REMOVE_ITEM'; itemId: string; count?: number }
    | { type: 'UNLOCK_SKILL'; skillId: string }
    | { type: 'EQUIP_SKILL'; slot: SkillSlot; skillId: string }
    | { type: 'RECORD_COMBAT_RESULT'; win: boolean }
    | { type: 'LOAD_GAME'; state: GameState }
    | { type: 'BUY_ATTRIBUTE'; attribute: string; cost: number }
    | { type: 'BUY_SKILL_LEVEL'; skill: string; cost: number }
    | { type: 'LEVEL_UP'; cost: number }
    | { type: 'UPGRADE_SHIP'; stat: 'weaponLevel' | 'armorLevel' | 'maxHull' | 'maxShield'; value?: number }
    | { type: 'UPDATE_SETTINGS'; payload: Partial<GameState['settings']> }
    | { type: 'UPDATE_SETTINGS_DEEP'; payload: Partial<GameState['settings']> }
    | { type: 'UPDATE_RELATIONSHIP'; target: 'lyra' | 'vizzy' | 'navbot'; value: number }
    | { type: 'START_QUEST'; questId: string }
    | { type: 'ADVANCE_QUEST'; questId: string; logEntry: string }
    | { type: 'COMPLETE_QUEST'; questId: string; rewardXp: number };

// --- Initial State ---

const initialState: GameState = {
    xp: 0,
    level: 1,
    turnCount: 0,
    identity: {
        core: null,
        sub: null,
        cross: null,
        master: null
    },
    ledger: initializeLedger('default-saga', 0), // Group 0 (L1-3)
    inventory: [],
    skills: {
        unlocked: [],
        slots: {}
    },
    attributes: { STR: 5, DEX: 5, INT: 5, CON: 5, WIS: 5, CHA: 5 },
    skillLevels: { Attack: 1, Defend: 1, Evade: 1, Hack: 1, Pilot: 1, Negotiate: 1, Scan: 1 },
    combat: {
        wins: 0,
        losses: 0
    },
    flightStats: {
        weaponLevel: 0,
        armorLevel: 0,
        maxHull: 100,
        maxShield: 100
    },
    credits: 1000,
    settings: {
        autoSaveInterval: 10,
        autoSaveEnabled: true,
        llm: {
            model: 'llama3',
            baseUrl: 'http://127.0.0.1:11434',
            temperature: 0.7,
            vizzyModel: 'llama3', // Dedicated model for Vizzy animation
            embeddingModel: 'nomic-embed-text', // Default embedding model
            minEmbeddings: 1,
            maxEmbeddings: 7,
            minTags: 1,
            maxTags: 7,
        }
    },
    relationships: {
        lyra: 50,
        vizzy: 50,
        navbot: 50
    },
    quests: {}
};

// --- Reducer ---

const gameReducer = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        case 'INCREMENT_TURN':
            return {
                ...state,
                turnCount: (state.turnCount || 0) + 1
            };
        case 'ADD_XP': {
            const newXp = state.xp + action.amount;
            const newLevel = calculateLevelFromXp(newXp);

            // Check if we stepped into a new ledger group
            const oldGroup = Math.floor((state.level - 1) / 3);
            const newGroup = Math.floor((newLevel - 1) / 3);

            let newLedger = state.ledger;
            if (newGroup > oldGroup && newGroup < 7) {
                newLedger = initializeLedger(state.ledger.sagaKey, newGroup);
            }

            return {
                ...state,
                xp: newXp,
                level: newLevel,
                ledger: newLedger
            };
        }
        case 'RECORD_KILL': {
            const { award, capped } = calculateAward(
                state.ledger,
                action.mode,
                action.tier,
                action.enemyTypeId
            );

            // Generate loot
            const loot = generateEnemyLoot(action.systemId, action.enemyTypeId);

            // Re-run the ADD_XP logic with the calculated award
            const newXp = state.xp + award;
            const newLevel = calculateLevelFromXp(newXp);

            const oldGroup = Math.floor((state.level - 1) / 3);
            const newGroup = Math.floor((newLevel - 1) / 3);

            let newLedger = { ...state.ledger };
            if (newGroup > oldGroup && newGroup < 7) {
                newLedger = initializeLedger(state.ledger.sagaKey, newGroup);
            }

            // Merge loot into inventory
            let newInventory = [...state.inventory];
            loot.forEach(item => {
                const existing = newInventory.find(i => i.id === item.id);
                if (existing) {
                    newInventory = newInventory.map(i =>
                        i.id === item.id ? { ...i, count: (i.count || 1) + (item.count || 1) } : i
                    );
                } else {
                    newInventory.push(item);
                }
            });

            return {
                ...state,
                xp: newXp,
                level: newLevel,
                ledger: newLedger,
                inventory: newInventory
            };
        }
        case 'SET_IDENTITY': {
            return {
                ...state,
                identity: {
                    core: action.core ?? state.identity.core,
                    sub: action.sub ?? state.identity.sub,
                    cross: action.cross ?? state.identity.cross,
                    master: state.identity.master
                }
            };
        }
        case 'ADD_ITEM': {
            const existing = state.inventory.find(i => i.id === action.item.id);
            if (existing && action.item.count) {
                return {
                    ...state,
                    inventory: state.inventory.map(i =>
                        i.id === action.item.id ? { ...i, count: (i.count || 1) + (action.item.count || 1) } : i
                    )
                };
            }
            return { ...state, inventory: [...state.inventory, { ...action.item, count: action.item.count || 1 }] };
        }
        case 'REMOVE_ITEM': {
            return {
                ...state,
                inventory: state.inventory.map(i => {
                    if (i.id === action.itemId) {
                        return { ...i, count: Math.max(0, (i.count || 1) - (action.count || 1)) };
                    }
                    return i;
                }).filter(i => (i.count || 0) > 0)
            };
        }
        case 'UNLOCK_SKILL':
            if (state.skills.unlocked.includes(action.skillId)) return state;

            // Check level requirements? 
            // In a real game, we'd look up the skill in TEMPLATE to find levelReq.
            // For now, let's assume the UI passes a valid request but we can add a safety check if we pass metadata.

            return {
                ...state,
                skills: { ...state.skills, unlocked: [...state.skills.unlocked, action.skillId] }
            };
        case 'EQUIP_SKILL':
            return {
                ...state,
                skills: {
                    ...state.skills,
                    slots: { ...state.skills.slots, [action.slot]: action.skillId }
                }
            };
        case 'RECORD_COMBAT_RESULT':
            return {
                ...state,
                combat: {
                    wins: state.combat.wins + (action.win ? 1 : 0),
                    losses: state.combat.losses + (action.win ? 0 : 1)
                }
            };
        case 'LOAD_GAME':
            return { ...action.state };
        case 'BUY_ATTRIBUTE':
            if (state.xp < action.cost) return state;
            return {
                ...state,
                xp: state.xp - action.cost,
                attributes: { ...state.attributes, [action.attribute]: (state.attributes[action.attribute] || 0) + 1 }
            };
        case 'BUY_SKILL_LEVEL':
            if (state.xp < action.cost) return state;
            return {
                ...state,
                xp: state.xp - action.cost,
                skillLevels: { ...state.skillLevels, [action.skill]: (state.skillLevels[action.skill] || 0) + 1 }
            };
        case 'LEVEL_UP':
            if (state.xp < action.cost) return state;
            return {
                ...state,
                xp: state.xp - action.cost,
                level: state.level + 1
            };
        case 'UPGRADE_SHIP':
            return {
                ...state,
                flightStats: {
                    ...state.flightStats,
                    [action.stat]: action.value ?? (state.flightStats[action.stat] + 1)
                }
            };
        case 'UPDATE_SETTINGS':
            return {
                ...state,
                settings: { ...state.settings, ...action.payload }
            };
        case 'UPDATE_SETTINGS_DEEP':
            return {
                ...state,
                settings: {
                    ...state.settings,
                    ...action.payload,
                    // If payload has llm, merge it too
                    llm: {
                        ...(state.settings.llm || { model: 'llama3', baseUrl: 'http://127.0.0.1:11434', temperature: 0.7 }),
                        ...((action.payload as any).llm || {})
                    }
                }
            };
        case 'UPDATE_RELATIONSHIP':
            return {
                ...state,
                relationships: {
                    ...state.relationships,
                    [action.target]: action.value
                }
            };
        case 'START_QUEST':
            return {
                ...state,
                quests: {
                    ...state.quests,
                    [action.questId]: {
                        id: action.questId,
                        status: 'active',
                        stepIndex: 0,
                        log: ['Quest Started']
                    }
                }
            };
        case 'ADVANCE_QUEST': {
            const q = state.quests[action.questId];
            if (!q) return state;
            return {
                ...state,
                quests: {
                    ...state.quests,
                    [action.questId]: {
                        ...q,
                        stepIndex: q.stepIndex + 1,
                        log: [...q.log, action.logEntry]
                    }
                }
            };
        }
        case 'COMPLETE_QUEST': {
            const q = state.quests[action.questId];
            if (!q) return state;

            // Auto-grant XP
            const newXp = state.xp + action.rewardXp;
            const newLevel = calculateLevelFromXp(newXp);

            return {
                ...state,
                xp: newXp,
                level: newLevel,
                quests: {
                    ...state.quests,
                    [action.questId]: {
                        ...q,
                        status: 'completed',
                        stepIndex: 3, // Final state
                        log: [...q.log, 'Quest Completed']
                    }
                }
            };
        }
        default:
            return state;
    }
};

// --- Context ---

const GameContext = createContext<{
    state: GameState;
    dispatch: React.Dispatch<Action>;
    actions: {
        incrementTurn: () => void;
        gainXp: (amount: number) => void;
        recordKill: (mode: LedgerMode, tier: LedgerTier, enemyTypeId: string, systemId: string) => void;
        setIdentity: (core?: string, sub?: string, cross?: string) => void;
        addItem: (item: Item) => void;
        unlockSkill: (id: string) => void;
        loadGame: (state: GameState) => void;
        buyAttribute: (attr: string, cost: number) => void;
        buySkillLevel: (skill: string, cost: number) => void;
        levelUp: (cost: number) => void;
        upgradeShip: (stat: 'weaponLevel' | 'armorLevel' | 'maxHull' | 'maxShield', value?: number) => void;
        updateSettings: (settings: Partial<GameState['settings']>) => void;
        updateSettingsDeep: (settings: any) => void;
        updateRelationship: (target: 'lyra' | 'vizzy' | 'navbot', value: number) => void;
        recordCombatResult: (win: boolean) => void;
        startQuest: (questId: string) => void;
        advanceQuest: (questId: string, logEntry: string) => void;
        completeQuest: (questId: string, rewardXp: number) => void;
    }
} | null>(null);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState, (initial) => {
        try {
            const saved = localStorage.getItem('eideus-gamestate');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with initial to ensure new schema fields exist
                return { ...initial, ...parsed };
            }
        } catch (e) {
            console.error("Failed to load game state", e);
        }
        return initial;
    });

    // Auto-Save
    React.useEffect(() => {
        if (state.settings.autoSaveEnabled) {
            const saveHandler = setTimeout(() => {
                localStorage.setItem('eideus-gamestate', JSON.stringify(state));
                console.log('[GameContext] Auto-saved game state.');
            }, 1000); // 1s debounce
            return () => clearTimeout(saveHandler);
        }
    }, [state]);

    // Helper actions for cleaner usage
    const actions = {
        incrementTurn: () => dispatch({ type: 'INCREMENT_TURN' }),
        gainXp: (amount: number) => dispatch({ type: 'ADD_XP', amount }),
        recordKill: (mode: LedgerMode, tier: LedgerTier, enemyTypeId: string, systemId: string) =>
            dispatch({ type: 'RECORD_KILL', mode, tier, enemyTypeId, systemId }),
        setIdentity: (core?: string, sub?: string, cross?: string) =>
            dispatch({ type: 'SET_IDENTITY', core, sub, cross }),
        addItem: (item: Item) => dispatch({ type: 'ADD_ITEM', item }),
        unlockSkill: (id: string) => dispatch({ type: 'UNLOCK_SKILL', skillId: id }),
        loadGame: (savedState: GameState) => dispatch({ type: 'LOAD_GAME', state: savedState }),
        buyAttribute: (attribute: string, cost: number) => dispatch({ type: 'BUY_ATTRIBUTE', attribute, cost }),
        buySkillLevel: (skill: string, cost: number) => dispatch({ type: 'BUY_SKILL_LEVEL', skill, cost }),
        levelUp: (cost: number) => dispatch({ type: 'LEVEL_UP', cost }),
        upgradeShip: (stat: 'weaponLevel' | 'armorLevel' | 'maxHull' | 'maxShield', value?: number) => dispatch({ type: 'UPGRADE_SHIP', stat, value }),
        updateSettings: (payload: Partial<GameState['settings']>) => dispatch({ type: 'UPDATE_SETTINGS', payload }),
        updateSettingsDeep: (payload: any) => dispatch({ type: 'UPDATE_SETTINGS_DEEP', payload }),
        updateRelationship: (target: 'lyra' | 'vizzy' | 'navbot', value: number) => dispatch({ type: 'UPDATE_RELATIONSHIP', target, value }),
        recordCombatResult: (win: boolean) => dispatch({ type: 'RECORD_COMBAT_RESULT', win }),
        startQuest: (questId: string) => dispatch({ type: 'START_QUEST', questId }),
        advanceQuest: (questId: string, logEntry: string) => dispatch({ type: 'ADVANCE_QUEST', questId, logEntry }),
        completeQuest: (questId: string, rewardXp: number) => dispatch({ type: 'COMPLETE_QUEST', questId, rewardXp }),
    };

    return (
        <GameContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within a GameProvider');
    return context;
};
