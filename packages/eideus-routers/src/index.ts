import masterIndex from './data/master_locations_index.json';

// --- Type---

export type LocationID = keyof typeof masterIndex.registry;

export const ROOT_DIRECTORY = masterIndex.meta.root_directory;

// Accessor for all IDs (excluding comments)
export const getAllLocationIds = (): string[] => {
    return Object.keys(masterIndex.registry).filter(k => !k.startsWith('//'));
};

export const getDefaultLocationId = (): string => {
    const ids = getAllLocationIds();
    return ids.length > 0 ? ids[0] : 'G1-S1-O1';
};

export interface LocationEntry {
    name: string;
    directory: string;
    files: {
        act: string;
        lorebook: string;
        quests: string;
        sector_map: string;
        texture?: string;
    };
}

// --- Internal Helper ---

const getEntry = (id: string): LocationEntry | null => {
    // @ts-ignore
    const entry = masterIndex.registry[id];
    return entry ? (entry as LocationEntry) : null;
};

// --- Routers ---

/**
 * Returns the base directory for a location ID (e.g. "The_Core_Syndicate/Aura-507/S-11_Drill")
 */
export const getDirectory = (id: string): string | null => {
    const entry = getEntry(id);
    return entry ? entry.directory : null;
};

/**
 * Returns the relative path to the lorebook.json file
 */
export const getLorePath = (id: string): string | null => {
    const entry = getEntry(id);
    return entry ? `${entry.directory}/${entry.files.lorebook}` : null;
};

/**
 * Returns the relative path to the quests.json file
 */
export const getQuestPath = (id: string): string | null => {
    const entry = getEntry(id);
    return entry ? `${entry.directory}/${entry.files.quests}` : null;
};

/**
 * Returns the relative path to the sector_map.json file
 */
export const getSectorMapPath = (id: string): string | null => {
    const entry = getEntry(id);
    return entry ? `${entry.directory}/${entry.files.sector_map}` : null;
};

/**
 * Returns the relative path to an Act file.
 * Defaults to the act defined in registry if no actNumber is provided.
 * Otherwise, constructs path for act{N}.json.
 */
export const getActPath = (id: string, actNumber?: number): string | null => {
    const entry = getEntry(id);
    if (!entry) return null;

    const filename = actNumber ? `act${actNumber}.json` : entry.files.act;
    return `${entry.directory}/${filename}`;
};

/**
 * Returns the relative path for a generic file in the directory
 */
export const getFilePath = (id: string, filename: string): string | null => {
    const dir = getDirectory(id);
    return dir ? `${dir}/${filename}` : null;
}

/**
 * Returns the human-readable name of the location
 */
export const getLocationName = (id: string): string | null => {
    const entry = getEntry(id);
    return entry ? entry.name : null;
};
