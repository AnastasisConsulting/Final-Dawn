// /src/mapper.ts
import { UniverseMap, UniverseNode, SpatialKey } from "./types";
import { listDirs, join, isGalaxyFolderName, isSystemFolderName, isWorldObjectFolderName } from "./fsUtil";

type MapperConfig = {
  rootPath: string;
  expectedObjectsPerSystem: number; // you said 7
  // NOTE: We intentionally do *not* infer c/ct/r here (those come from on-world civ/city/region templates).
  // So we set c=0 ct=0 r=0 for the "planetary object root address".
};

function mkKey(g: number, s: number, o: number): SpatialKey {
  return { g, s, o, c: 0, ct: 0, r: 0 };
}

export function buildUniverseMap(cfg: MapperConfig): UniverseMap {
  const warnings: string[] = [];
  const galaxies = listDirs(cfg.rootPath).filter(isGalaxyFolderName);

  const galaxyNodes: UniverseNode[] = [];

  for (let gi = 0; gi < galaxies.length; gi++) {
    const gName = galaxies[gi];
    const gPath = join(cfg.rootPath, gName);

    const systems = listDirs(gPath).filter(isSystemFolderName);
    const systemNodes: UniverseNode[] = [];

    for (let si = 0; si < systems.length; si++) {
      const sName = systems[si];
      const sPath = join(gPath, sName);

      const objects = listDirs(sPath).filter(isWorldObjectFolderName);

      if (objects.length !== cfg.expectedObjectsPerSystem) {
        warnings.push(
          `System '${gName}/${sName}' has ${objects.length} objects (expected ${cfg.expectedObjectsPerSystem}). ` +
            `Mapping will still proceed using lexicographic order.`
        );
      }

      const objNodes: UniverseNode[] = [];
      for (let oi = 0; oi < objects.length; oi++) {
        const oName = objects[oi];
        const oPath = join(sPath, oName);
        objNodes.push({
          kind: "PlanetaryObject",
          name: oName,
          path: oPath,
          key: mkKey(gi, si, oi),
        });
      }

      systemNodes.push({
        kind: "StarSystem",
        name: sName,
        path: sPath,
        key: mkKey(gi, si, 0),
        children: objNodes,
      });
    }

    galaxyNodes.push({
      kind: "Galaxy",
      name: gName,
      path: gPath,
      key: mkKey(gi, 0, 0),
      children: systemNodes,
    });
  }

  return {
    rootPath: cfg.rootPath,
    generatedAtUnixMs: Date.now(),
    mappingRule: "lexicographic",
    expectedObjectsPerSystem: cfg.expectedObjectsPerSystem,
    galaxies: galaxyNodes,
    warnings,
  };
}
