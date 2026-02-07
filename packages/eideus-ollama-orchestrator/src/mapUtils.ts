// packages/eideus-ollama-orchestrator/src/mapUtils.ts

export const xmur3 = (str: string) => {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return () => {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    };
};

export const mulberry32 = (a: number) => () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const generateHeightmap = (seed: string, size: number) => {
    const seedFn = xmur3(seed);
    const rng = mulberry32(seedFn());
    const values: number[] = new Array(size * size).fill(0).map(() => rng());
    const smoothPass = (input: number[]) => {
        const output = new Array(size * size).fill(0);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let sum = 0;
                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                            sum += input[ny * size + nx];
                            count += 1;
                        }
                    }
                }
                output[y * size + x] = sum / count;
            }
        }
        return output;
    };
    let smoothed = smoothPass(values);
    smoothed = smoothPass(smoothed);
    const min = Math.min(...smoothed);
    const max = Math.max(...smoothed);
    return smoothed.map((v) => (max - min > 0 ? (v - min) / (max - min) : 0.5));
};

export const generateCityMap = (seed: string, worldId: string, civId: string, ctIndex: number, gridSize = 7) => {
    const seedFn = xmur3(seed);
    const rng = mulberry32(seedFn());
    const locationsTotal = gridSize * gridSize;
    const indices = new Array(locationsTotal).fill(0).map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const required = [
        { role: 'GOVERNORS_PALACE', type: 'GOV' },
        { role: 'LAW_ENFORCEMENT', type: 'LAW' },
        { role: 'SOCIAL_SERVICES', type: 'CIV' },
        { role: 'FIRE_DEPT', type: 'FIRE' },
        { role: 'EMS', type: 'EMS' },
        { role: 'AI_HUB', type: 'AI' },
        { role: 'CITY_PLANNING', type: 'PLAN' },
        { role: 'MAJOR_MANUFACTURE', type: 'MFG' },
        { role: 'UNDERWORLD_DEN', type: 'DEN' }
    ];
    const subLocationKinds = [
        'Neighborhood', 'Market', 'Clinic', 'Vet Office', 'Transit Hub', 'Arcade',
        'Dockyard', 'Foundry', 'Library', 'Gym', 'Garden', 'School', 'Cafe'
    ];

    const districtNames = ['North', 'Central', 'South'];
    const pickIndex = (pos: number) => {
        const flat = indices[pos % indices.length];
        const x = flat % gridSize;
        const y = Math.floor(flat / gridSize);
        return { x, y };
    };

    const requiredPool = [...required];
    for (let i = requiredPool.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [requiredPool[i], requiredPool[j]] = [requiredPool[j], requiredPool[i]];
    }

    const districts = districtNames.map((districtName, dIndex) => ({
        id: `D${dIndex + 1}`,
        name: `${districtName} District`,
        keyLocations: [] as any[]
    }));

    let cursor = 0;
    let roleIndex = 0;
    districts.forEach((district) => {
        for (let k = 0; k < 3; k++) {
            const req = requiredPool[roleIndex++ % requiredPool.length];
            const { x, y } = pickIndex(cursor++);
            const subLocations = new Array(7).fill(0).map((_, idx) => {
                const kind = subLocationKinds[Math.floor(rng() * subLocationKinds.length)];
                return {
                    id: `SUB-${district.id}-${k + 1}-${idx + 1}`,
                    name: `${kind} ${Math.floor(rng() * 90 + 10)}`,
                    kind
                };
            });
            district.keyLocations.push({
                id: `${district.id}-K${k + 1}`,
                name: req.role.replace(/_/g, ' '),
                role: req.role,
                type: req.type,
                x,
                y,
                subLocations
            });
        }
    });

    return {
        version: 'city-map-v2',
        worldId,
        civId,
        ctIndex,
        gridSize,
        districts
    };
};
