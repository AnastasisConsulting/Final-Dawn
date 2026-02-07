import { Galaxy, StarSystem, Planet, Civilization, City, RuralZone } from './types';
import { LORE_DATA } from './lore_data';

// Static Hierarchy Data provided by the user
const HIERARCHY_DATA = [
  {
    name: "The Core Syndicate",
    description: "An industrial conglomerate controlling the central resource hubs.",
    systems: [
      {
        name: "Aura-507",
        starType: "Neutron",
        planets: ["S-11 Drill", "Sentinel Dome", "The Gamma Hold", "The Isotope Garden", "The Quartz Furnace", "The Whispering Ion", "Xenon Scar"]
      },
      {
        name: "The Foundry Core",
        starType: "Red Giant",
        planets: ["Quiet Refuel", "Smelters Dusk", "Syncline", "The Hearth Forge", "The Scavengers Nest", "The Torque Belt", "The Waste Compactor"]
      },
      {
        name: "The Regulators Eye",
        starType: "Yellow Dwarf",
        planets: ["Aegis-1", "Censors Rock", "The Compliance Matrix", "The Gilded Cage", "The Silent Witness", "The Zero-G Court", "Vigilance Platform-7"]
      }
    ]
  },
  {
    name: "The Fading Echo",
    description: "Remnants of a lost era, drifting in the temporal wake.",
    systems: [
      {
        name: "Aethel-Prime",
        starType: "White Dwarf",
        planets: ["A-31 Reclaimer", "Echoes Deep", "Iron Fang", "Silent Shroud", "The Chronos Nexus", "The Frozen Crypt", "Xylos-Prime"]
      },
      {
        name: "Cygnus Rift-Delta",
        starType: "Binary",
        planets: ["Ophidian Scar", "Rust Nebula", "Slipstream Node", "Subjective Island", "The Chronal Glacier", "The Lag Gate", "The Void Mirror"]
      },
      {
        name: "The Shard Verge",
        starType: "Pulsar",
        planets: ["Axe Head", "Nexus Zero", "Quantum Dust", "Rogues Anchor", "The Chronometer", "The Glitch Forge", "The Quiet Vault"]
      }
    ]
  },
  {
    name: "The Void Sea",
    description: "The unknown expanse where physics begins to unravel.",
    systems: [
      {
        name: "Koreths Veil",
        starType: "Black Hole",
        planets: ["The Anomaly Bloom", "The Crystal Quarry", "The Oracles Pedestal", "The Prophets Eye", "The Relic Cache", "The Shadow Core", "The Stillness"]
      },
      {
        name: "The Great Labyrinth",
        starType: "Nebula",
        planets: ["Chiral Abyss", "Refugee Veil", "The Black Star", "The Maze World", "The Rift Runner", "The Scrambler", "The Transit Nexus"]
      },
      {
        name: "The Whisper Zone",
        starType: "Blue Giant",
        planets: ["Signal Tomb", "Stasis Shore", "The Cold Heart", "The Comm Null", "The Ghost Ship", "The Mute World", "The Unspoken"]
      }
    ]
  }
];

const FLAVOR_TEXTS = [
  "Navbot: Coordinates locked. Scanning for biological signatures.",
  "Vizzy: Signal interference high. Did you pay the subscription?",
  "Lyra: History records a massive conflict here in the 3rd era.",
  "System: Atmosphere nominal. Entry vector calculated.",
  "Navbot: Proximity alert. Debris field detected.",
];

const generateRural = (parentId: string, index: number): RuralZone => ({
  id: `${parentId}-r${index}`,
  name: `Sector ${index}`,
  description: `Rural extraction zone. ${FLAVOR_TEXTS[index % FLAVOR_TEXTS.length]}`,
  coordinates: `${parentId}-r${index}`,
  type: 'rural',
  resourceType: index % 2 === 0 ? 'Mining' : 'Agriculture',
});

const generateCity = (parentId: string, index: number): City => ({
  id: `${parentId}-ct${index}`,
  name: `Urban Center ${index}`,
  description: `High density population node.`,
  coordinates: `${parentId}-ct${index}`,
  type: 'urban',
  districts: Array.from({ length: 7 }, (_, i) => generateRural(`${parentId}-ct${index}`, i)),
});

const generateCiv = (parentId: string, index: number): Civilization => ({
  id: `${parentId}_c${index}`,
  name: `Civilization ${index}`,
  description: `Dominant cultural archetype detected.`,
  coordinates: `${parentId}_c${index}`,
  type: 'civilization',
  archetype: index === 0 ? 'STR' : index === 1 ? 'INT' : 'DEX',
  cities: Array.from({ length: 3 }, (_, i) => generateCity(`${parentId}_c${index}`, i)),
});

const generatePlanets = (sysId: string, planetNames: string[]): Planet[] => 
  planetNames.map((name, i) => {
    // Use 1-based indexing for Objects to match O1, O2...
    const planetId = `${sysId}-O${i + 1}`;
    
    // Check if we have specific lore data for this planet (specifically S-11 Drill)
    let surfaceData;
    if (planetId === 'G1-S1-O1') {
       surfaceData = LORE_DATA.civilizations.map((civ, cIdx) => ({
           id: `${planetId}_c${cIdx}`,
           name: civ.name,
           description: civ.summary,
           coordinates: `${planetId}_c${cIdx}`,
           type: 'civilization',
           archetype: civ.attribute_key as 'STR' | 'INT' | 'DEX',
           cities: civ.cities.map((city, ctIdx) => ({
               id: `${planetId}_c${cIdx}-ct${ctIdx}`,
               name: city.name,
               description: `Governed by ${city.governor.name}. ${city.governor.title}.`,
               coordinates: `${planetId}_c${cIdx}-ct${ctIdx}`,
               type: 'urban',
               districts: city.districts.map((dist, rIdx) => ({
                   id: `${planetId}_c${cIdx}-ct${ctIdx}-r${rIdx}`,
                   name: dist.name,
                   description: dist.description || 'Restricted Area.',
                   coordinates: `${planetId}_c${cIdx}-ct${ctIdx}-r${rIdx}`,
                   type: 'rural',
                   resourceType: dist.type
               }))
           }))
       }));
    } else {
       // Procedural Fallback
       surfaceData = Array.from({ length: 3 }, (_, c) => generateCiv(planetId, c));
    }

    return {
      id: planetId,
      name: name,
      description: `Planetary body. Class M habitable. ${FLAVOR_TEXTS[i % FLAVOR_TEXTS.length]}`,
      coordinates: planetId,
      type: 'planet',
      biome: ['Arid', 'Terran', 'Ice', 'Volcanic', 'Gas', 'Oceanic', 'Cybernetic'][i % 7],
      surfaceData
    };
  });

const generateSystems = (galId: string, galIndex: number): StarSystem[] => {
  const galaxyData = HIERARCHY_DATA[galIndex];
  return galaxyData.systems.map((sys, i) => ({
    // Use 1-based indexing for Systems to match S1, S2...
    id: `${galId}-S${i + 1}`,
    name: sys.name,
    description: `Interstellar object in ${galaxyData.name}.`,
    coordinates: `${galId}-S${i + 1}`,
    type: 'system',
    starType: sys.starType,
    planets: generatePlanets(`${galId}-S${i + 1}`, sys.planets),
  }));
};

export const UNIVERSE_DATA: Galaxy[] = HIERARCHY_DATA.map((gal, i) => ({
  // Use 1-based indexing for Galaxies to match G1, G2...
  id: `G${i + 1}`,
  name: gal.name,
  description: gal.description,
  coordinates: `G${i + 1}`,
  type: 'galaxy',
  systems: generateSystems(`G${i + 1}`, i),
}));