import { Item } from '../../types';
import { WEAPONS } from './weapons';
import { SHIP_WEAPONS } from './ship_weapons';
import { ARMOR } from './armor';
import { SHIP_MODULES } from './ship_modules';
import { CYBERNETICS } from './cybernetics';
import { CONSUMABLES } from './consumables';
import { COMMODITIES } from './commodities';
import { RESOURCES } from './resources';
import { DATA_ITEMS } from './data';
import { JUNK } from './junk';
import { LUXURY } from './luxury';
import { QUEST_ITEMS } from './quest';

// Aggregate all items into the master registry
export const ITEMS: Record<string, Item> = {
    ...WEAPONS,
    ...SHIP_WEAPONS,
    ...ARMOR,
    ...SHIP_MODULES,
    ...CYBERNETICS,
    ...CONSUMABLES,
    ...COMMODITIES,
    ...RESOURCES,
    ...DATA_ITEMS,
    ...JUNK,
    ...LUXURY,
    ...QUEST_ITEMS,
};
