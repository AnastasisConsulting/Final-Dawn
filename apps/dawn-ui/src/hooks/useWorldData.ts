import { useState, useEffect } from 'react';
import { bindWorldBundle, BinderOutputs } from 'eideus-world-bundle-binder';
import { getLorePath, getQuestPath, getSectorMapPath } from 'eideus-routers';

// Cache to prevent re-fetching/re-binding same data
const cache = new Map<string, BinderOutputs>();

export const useWorldData = (locationId: string | null) => {
    const [data, setData] = useState<BinderOutputs | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!locationId) {
            setData(null);
            return;
        }

        if (cache.has(locationId)) {
            setData(cache.get(locationId)!);
            return;
        }

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const lorePath = getLorePath(locationId);
                const sectorPath = getSectorMapPath(locationId);
                const questPath = getQuestPath(locationId);

                if (!lorePath || !sectorPath || !questPath) {
                    throw new Error(`Invalid location entry in registry for ${locationId}`);
                }

                // Load all 3 files in parallel
                const [lore, sector, quests] = await Promise.all([
                    fetch(`/Galaxies_Folder/${lorePath}`).then(r => {
                        if (!r.ok) throw new Error(`Failed to load lorebook: ${r.statusText}`);
                        return r.json();
                    }),
                    fetch(`/Galaxies_Folder/${sectorPath}`).then(r => {
                        if (!r.ok) throw new Error(`Failed to load sector_map: ${r.statusText}`);
                        return r.json();
                    }),
                    fetch(`/Galaxies_Folder/${questPath}`).then(r => {
                        if (!r.ok) {
                            console.warn(`[useWorldData] Quests missing for ${locationId}, using empty.`);
                            return { quests: [] };
                        }
                        return r.json();
                    })
                ]);

                // Bind
                const bound = bindWorldBundle({
                    lorebook: lore,
                    sectorMap: sector,
                    quests: quests,
                    sourceSeed: {}
                });

                cache.set(locationId, bound);
                setData(bound);
            } catch (e: any) {
                console.error(`Failed to load world data for ${locationId}`, e);
                setError(e.message || 'Unknown error');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [locationId]);

    return { data, loading, error };
};
