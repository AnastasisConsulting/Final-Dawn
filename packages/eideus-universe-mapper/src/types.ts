// /src/types.ts
export type SpatialKey = { g: number; s: number; o: number; c: number; ct: number; r: number };

export type UniverseNodeKind = "Galaxy" | "StarSystem" | "PlanetaryObject";

export type UniverseNode = {
  kind: UniverseNodeKind;
  name: string;
  path: string;
  key: SpatialKey;
  children?: UniverseNode[];
};

export type UniverseMap = {
  rootPath: string;
  generatedAtUnixMs: number;
  mappingRule: "lexicographic";
  expectedObjectsPerSystem: number;
  galaxies: UniverseNode[];
  warnings: string[];
};
