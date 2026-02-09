export enum ViewLevel {
  UNIVERSE = 'UNIVERSE',
  GALAXY = 'GALAXY',
  SYSTEM = 'SYSTEM',
  PLANET = 'PLANET',
  SURFACE = 'SURFACE',
  CITY = 'CITY',
  DISTRICT = 'DISTRICT'
}

export interface EntityBase {
  id: string;
  name: string;
  type: string;
  description: string;
  coordinates: string;
  lore?: any; // To attach the rich JSON data
}

export interface RuralZone extends EntityBase {
  type: 'rural';
  resourceType: string;
}

export interface City extends EntityBase {
  type: 'urban';
  districts: RuralZone[];
}

export interface Civilization extends EntityBase {
  type: 'civilization';
  archetype: 'STR' | 'INT' | 'DEX';
  cities: City[];
}

export interface Planet extends EntityBase {
  type: 'planet';
  biome: string;
  surfaceData: Civilization[];
}

export interface StarSystem extends EntityBase {
  type: 'system';
  starType: string;
  planets: Planet[];
}

export interface Galaxy extends EntityBase {
  type: 'galaxy';
  systems: StarSystem[];
}

export interface UniverseState {
  currentLevel: ViewLevel;
  selectedGalaxyId: string | null;
  selectedSystemId: string | null;
  selectedPlanetId: string | null;
  selectedCityId: string | null;
  selectedDistrictId: string | null;
}