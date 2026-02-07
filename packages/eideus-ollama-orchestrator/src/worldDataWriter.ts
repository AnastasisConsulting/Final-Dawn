/**
 * World Data Writer Service
 * Handles file writes for AI-generated world content
 */

import fs from 'fs';
import path from 'path';

export interface Destination {
    galaxy: string;
    system: string;
    object: string;
    civ: number;
    city: number;
    region: number;
    name: string;
    address: string;
}

export interface CityMap {
    name: string;
    layout: 'grid' | 'radial' | 'organic' | 'vertical';
    atmosphere: {
        pollution: number;
        weather: string;
        lighting: string;
    };
    districts: Array<{
        name: string;
        type: string;
        position: { x: number; y: number; z: number };
        radius: number;
        buildingDensity: number;
    }>;
    landingPads: Array<{
        designation: string;
        position: { x: number; y: number; z: number };
        status: string;
        triggerRadius: number;
        clearanceSpeed: number;
    }>;
    waypoints: Array<{
        id: string;
        name: string;
        type: string;
        position: { x: number; y: number; z: number };
        description: string;
        npcs?: Array<{
            id: string;
            name: string;
            role: string;
            dialogue: string[];
            quests: string[];
        }>;
    }>;
}

export interface LorebookEntry {
    id: string;
    title: string;
    content: string;
    tags: string[];
    unlocked: boolean;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    questGiver: {
        name: string;
        location: string;
    };
    objectives: Array<{
        id: string;
        description: string;
        completed: boolean;
    }>;
    rewards: {
        xp: number;
        credits: number;
        items: string[];
        affinityChanges: Record<string, number>;
    };
    difficulty: number;
    prerequisites: string[];
    status: 'available' | 'active' | 'completed';
}

/**
 * World Data Writer - manages file I/O for generated content
 */
export class WorldDataWriter {
    private basePath: string;

    constructor(basePath: string = 'Galaxies_Folder') {
        // Resolve to project root
        this.basePath = path.resolve(process.cwd(), '..', '..', basePath);
        console.log('[WorldDataWriter] Base path:', this.basePath);
    }

    /**
     * Ensure directory exists, creating if necessary
     */
    private ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log('[WorldDataWriter] Created directory:', dirPath);
        }
    }

    /**
     * Sanitize path components
     */
    private sanitizePath(str: string): string {
        return str.replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    /**
     * Get directory path for destination
     */
    private getDestinationPath(destination: Destination): string {
        const galaxyDir = this.sanitizePath(destination.galaxy);
        const systemDir = this.sanitizePath(destination.system);
        const objectDir = this.sanitizePath(destination.object);

        return path.join(this.basePath, galaxyDir, systemDir, objectDir);
    }

    /**
     * Write city map JSON
     */
    async writeCityMap(destination: Destination, cityData: CityMap): Promise<string> {
        const destPath = this.getDestinationPath(destination);
        const citiesDir = path.join(destPath, 'cities');
        this.ensureDirectoryExists(citiesDir);

        const filename = `civ${destination.civ}_city${destination.city}.json`;
        const filePath = path.join(citiesDir, filename);

        await fs.promises.writeFile(filePath, JSON.stringify(cityData, null, 2));
        console.log('[WorldDataWriter] Wrote city map:', filePath);

        return filePath;
    }

    /**
     * Write lorebook JSON
     */
    async writeLorebook(destination: Destination, entries: LorebookEntry[]): Promise<string> {
        const destPath = this.getDestinationPath(destination);
        this.ensureDirectoryExists(destPath);

        const filePath = path.join(destPath, 'lorebook.json');

        // Check if file exists - append if so
        let existingData: any = { entries: [] };
        if (fs.existsSync(filePath)) {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            existingData = JSON.parse(content);
        }

        // Merge entries (avoid duplicates by ID)
        const existingIds = new Set(existingData.entries?.map((e: any) => e.id) || []);
        const newEntries = entries.filter(e => !existingIds.has(e.id));

        const lorebookData = {
            ...existingData,
            entries: [...(existingData.entries || []), ...newEntries],
            generated_at: new Date().toISOString(),
        };

        await fs.promises.writeFile(filePath, JSON.stringify(lorebookData, null, 2));
        console.log('[WorldDataWriter] Wrote lorebook:', filePath);

        return filePath;
    }

    /**
     * Write quests JSON
     */
    async writeQuests(destination: Destination, quests: Quest[]): Promise<string> {
        const destPath = this.getDestinationPath(destination);
        this.ensureDirectoryExists(destPath);

        const filePath = path.join(destPath, 'quests.json');

        // Check if file exists - append if so
        let existingData: any = { quests: [] };
        if (fs.existsSync(filePath)) {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            existingData = JSON.parse(content);
        }

        // Merge quests (avoid duplicates by ID)
        const existingIds = new Set(existingData.quests?.map((q: any) => q.id) || []);
        const newQuests = quests.filter(q => !existingIds.has(q.id));

        const questsData = {
            ...existingData,
            quests: [...(existingData.quests || []), ...newQuests],
            generated_at: new Date().toISOString(),
        };

        await fs.promises.writeFile(filePath, JSON.stringify(questsData, null, 2));
        console.log('[WorldDataWriter] Wrote quests:', filePath);

        return filePath;
    }

    /**
     * Update sector map with new location
     */
    async updateSectorMap(destination: Destination): Promise<void> {
        const destPath = this.getDestinationPath(destination);
        const filePath = path.join(destPath, 'sector_map.json');

        // Create basic sector map if doesn't exist
        if (!fs.existsSync(filePath)) {
            this.ensureDirectoryExists(destPath);

            const sectorMap = {
                address: destination.address,
                name: destination.name,
                type: 'planet',
                generated: true,
                generated_at: new Date().toISOString(),
                civilizations: destination.civ,
                cities_generated: [`civ${destination.civ}_city${destination.city}`],
            };

            await fs.promises.writeFile(filePath, JSON.stringify(sectorMap, null, 2));
            console.log('[WorldDataWriter] Created sector map:', filePath);
        } else {
            // Update existing sector map
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const sectorMap = JSON.parse(content);

            sectorMap.cities_generated = sectorMap.cities_generated || [];
            const cityId = `civ${destination.civ}_city${destination.city}`;
            if (!sectorMap.cities_generated.includes(cityId)) {
                sectorMap.cities_generated.push(cityId);
            }
            sectorMap.last_updated = new Date().toISOString();

            await fs.promises.writeFile(filePath, JSON.stringify(sectorMap, null, 2));
            console.log('[WorldDataWriter] Updated sector map:', filePath);
        }
    }
}
