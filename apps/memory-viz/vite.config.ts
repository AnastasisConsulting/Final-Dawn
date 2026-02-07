import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

type SectorMap = {
  version: string;
  worldId: string;
  gridSize: number;
  civilizations: { civId: string; index: number; seed: string }[];
};

type TopographySet = {
  version: string;
  worldId: string;
  gridSize: number;
  civs: { civId: string; seed: string; heightmap: number[] }[];
};

type CityMap = {
  version: string;
  worldId: string;
  civId: string;
  ctIndex: number;
  gridSize: number;
  districts: {
    id: string;
    name: string;
    keyLocations: {
      id: string;
      name: string;
      role: string;
      type: string;
      x: number;
      y: number;
      subLocations: {
        id: string;
        name: string;
        kind: string;
      }[];
    }[];
  }[];
};

const xmur3 = (str: string) => {
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

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const generateHeightmap = (seed: string, size: number) => {
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

const generateCityMap = (seed: string, worldId: string, civId: string, ctIndex: number, gridSize = 7): CityMap => {
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

  const districts: CityMap['districts'] = districtNames.map((districtName, dIndex) => ({
    id: `D${dIndex + 1}`,
    name: `${districtName} District`,
    keyLocations: []
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

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3003,
        host: '0.0.0.0',
        fs: {
          allow: [path.resolve(__dirname, '../../Galaxies_Folder')]
        }
      },
      plugins: [
        react(),
        {
          name: 'topography-api',
          configureServer(server) {
            server.middlewares.use('/api/topography', async (req, res) => {
              if (!req.url) {
                res.statusCode = 400;
                res.end('Missing request URL.');
                return;
              }
              const url = new URL(req.url, 'http://localhost');
              const galaxy = url.searchParams.get('galaxy');
              const system = url.searchParams.get('system');
              const object = url.searchParams.get('object');
              if (!galaxy || !system || !object) {
                res.statusCode = 400;
                res.end('Missing galaxy/system/object parameters.');
                return;
              }
              const baseDir = path.resolve(__dirname, '../../Galaxies_Folder', galaxy, system, object);
              const sectorPath = path.join(baseDir, 'sector_map.json');
              const topoPath = path.join(baseDir, 'topography.json');
              try {
                if (!fs.existsSync(sectorPath)) {
                  res.statusCode = 404;
                  res.end('Sector map not found.');
                  return;
                }
                let topoData: TopographySet | null = null;
                if (fs.existsSync(topoPath)) {
                  topoData = JSON.parse(fs.readFileSync(topoPath, 'utf8')) as TopographySet;
                } else {
                  const sector = JSON.parse(fs.readFileSync(sectorPath, 'utf8')) as SectorMap;
                  const gridSize = sector.gridSize || 7;
                  topoData = {
                    version: 'topography-v1',
                    worldId: sector.worldId,
                    gridSize,
                    civs: sector.civilizations.map((civ) => ({
                      civId: civ.civId,
                      seed: civ.seed,
                      heightmap: generateHeightmap(`${sector.worldId}:${civ.civId}:${civ.seed}`, gridSize)
                    }))
                  };
                  fs.writeFileSync(topoPath, JSON.stringify(topoData, null, 2), 'utf8');
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(topoData));
              } catch (err) {
                res.statusCode = 500;
                res.end('Failed to load topography.');
              }
            });
          }
        },
        {
          name: 'city-map-api',
          configureServer(server) {
            server.middlewares.use('/api/city-map', async (req, res) => {
              if (!req.url) {
                res.statusCode = 400;
                res.end('Missing request URL.');
                return;
              }
              const url = new URL(req.url, 'http://localhost');
              const galaxy = url.searchParams.get('galaxy');
              const system = url.searchParams.get('system');
              const object = url.searchParams.get('object');
              const civ = url.searchParams.get('civ');
              const ct = url.searchParams.get('ct');
              if (!galaxy || !system || !object || !civ || !ct) {
                res.statusCode = 400;
                res.end('Missing galaxy/system/object/civ/ct parameters.');
                return;
              }
              const baseDir = path.resolve(__dirname, '../../Galaxies_Folder', galaxy, system, object, `C${civ}`, `CT${ct}`);
              const sectorPath = path.resolve(__dirname, '../../Galaxies_Folder', galaxy, system, object, 'sector_map.json');
              const cityPath = path.join(baseDir, 'city_map.json');
              try {
                if (!fs.existsSync(sectorPath)) {
                  res.statusCode = 404;
                  res.end('Sector map not found.');
                  return;
                }
                let cityData: CityMap | null = null;
                if (fs.existsSync(cityPath)) {
                  cityData = JSON.parse(fs.readFileSync(cityPath, 'utf8')) as CityMap;
                }
                if (!cityData || cityData.version !== 'city-map-v2') {
                  const sector = JSON.parse(fs.readFileSync(sectorPath, 'utf8')) as SectorMap;
                  const civIndex = Number(civ);
                  const ctIndex = Number(ct);
                  const civEntry = sector.civilizations.find((c) => c.index === civIndex - 1) || sector.civilizations[0];
                  const civId = civEntry ? civEntry.civId : `CIV_${civ}`;
                  const seed = `${sector.worldId}:${civId}:CT${ctIndex}`;
                  cityData = generateCityMap(seed, sector.worldId, civId, ctIndex, sector.gridSize || 7);
                  fs.mkdirSync(baseDir, { recursive: true });
                  fs.writeFileSync(cityPath, JSON.stringify(cityData, null, 2), 'utf8');
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(cityData));
              } catch (err) {
                res.statusCode = 500;
                res.end('Failed to load city map.');
              }
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
