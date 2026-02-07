export declare class WorldLoader {
    /**
     * Performs deterministic world entry based on player affinity.
     */
    ingestWorld(params: {
        playerAffinity: any;
        worldFiles: {
            lorebook: any;
            sectorMap: any;
            quests: any;
            sourceSeed: any;
        };
    }): Promise<{
        startKey: import("../../eideus-world-bundle-binder/src/types").SpatialKey1;
        startLore: string;
        caches: {
            lore: Map<string, any>;
            cast: Map<string, any>;
            quests: Map<string, any>;
        };
    }>;
}
//# sourceMappingURL=worldLoader.d.ts.map