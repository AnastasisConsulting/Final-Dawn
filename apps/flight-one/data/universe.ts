
import { SystemNode } from '../types';

export const universeTree: SystemNode[] = [
  {
    "id": "gal:01",
    "name": "The Core Syndicate",
    "type": "GALAXY",
    "tags": ["galaxy", "industrial"],
    "locKey": "t0.m0.e3",
    "children": [
      {
        "id": "G1-S1",
        "name": "Aura-507",
        "type": "SYSTEM",
        "tags": ["system"],
        "children": [
          // 1. THE QUARTZ FURNACE (Parent of S-11 Drill)
          {
            "id": "G1-S1-O5",
            "name": "The Quartz Furnace",
            "type": "PLANET",
            "tags": ["object", "planet", "industrial"],
            "color": "#f97316", // Orange
            "radius": 140,
            "data": { 
              "metadata": { 
                "Type": "Planet", 
                "Subtype": "Geo-Thermal Foundry", 
                "Description": "A churning world of molten silica and industrial machinery. The surface is a grid of heat-sinks and massive foundries harnessing the planet's core." 
              } 
            },
            "children": [
              {
                "id": "G1-S1-O1",
                "name": "S-11 Drill",
                "type": "MOON",
                "tags": ["object", "moon", "extraction_post"],
                "color": "#78716c", // Stone
                "data": { 
                  "metadata": { 
                    "Type": "Moon", 
                    "Subtype": "Extraction Post", 
                    "Description": "A small, rocky moon used exclusively as a staging ground for deep-core radiation drilling operations into the Quartz Furnace." 
                  } 
                }
              }
            ]
          },

          // 2. THE ISOTOPE GARDEN (Parent of Sentinel Dome)
          {
            "id": "G1-S1-O4",
            "name": "The Isotope Garden",
            "type": "PLANET",
            "tags": ["object", "bio_industrial_habitat"],
            "color": "#84cc16", // Lime Green
            "radius": 130,
            "data": { 
              "metadata": { 
                "Type": "Bio-Industrial Habitat", 
                "Subtype": "Irradiated Ecosystem", 
                "Description": "A sprawling biome of engineered flora that thrives on unstable isotopes. Each organism glows faintly with radioactive energy." 
              } 
            },
            "children": [
              {
                "id": "G1-S1-O2",
                "name": "Sentinel Dome",
                "type": "MOON",
                "tags": ["object", "outpost", "defense"],
                "color": "#1e293b", // Slate
                "data": { 
                  "metadata": { 
                    "Type": "Outpost", 
                    "Subtype": "Defensive Observation Facility", 
                    "Description": "A heavily fortified dome overseeing Aura-507's primary drilling operations. It serves as both a military checkpoint and a sensor hub." 
                  } 
                }
              }
            ]
          },

          // 3. XENON SCAR (Parent of Whispering Ion)
          {
            "id": "G1-S1-O7",
            "name": "Xenon Scar",
            "type": "PLANET",
            "tags": ["object", "planetary_rift"],
            "color": "#3b82f6", // Blue
            "radius": 150,
            "data": { 
              "metadata": { 
                "Type": "Planetary Rift", 
                "Subtype": "Irradiated Canyon System", 
                "Description": "A colossal wound carved across the face of the planet, glowing with blue-white xenon radiation. Houses outlaw enclaves and strange growths." 
              } 
            },
            "children": [
              {
                "id": "G1-S1-O6",
                "name": "The Whispering Ion",
                "type": "MOON",
                "tags": ["object", "anomaly", "ion_storm"],
                "color": "#a855f7", // Purple
                "data": { 
                  "metadata": { 
                    "Type": "Anomaly", 
                    "Subtype": "Ion Storm Cluster", 
                    "Description": "A constantly shifting storm of electrical discharge, filling the void with luminous auroras and dissonant sub-harmonics." 
                  } 
                }
              }
            ]
          },

          // 4. THE GAMMA HOLD (Standalone Station)
          {
            "id": "G1-S1-O3",
            "name": "The Gamma Hold",
            "type": "STATION",
            "tags": ["object", "space_station", "containment"],
            "color": "#fbbf24", // Amber
            "data": { 
              "metadata": { 
                "Type": "Space Station", 
                "Subtype": "Containment Vault", 
                "Description": "A heavily shielded, lead-lined station that acts as the primary transfer point for radioactive materials in Aura-507." 
              } 
            }
          }
        ]
      }
    ]
  }
];
