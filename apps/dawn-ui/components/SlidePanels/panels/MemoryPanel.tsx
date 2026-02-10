import React, { useEffect, useState, useMemo } from 'react';
import MemoryVizRoot from 'memory-viz';
import { useSim } from '../../../src/context/SimContext';
import { FileSystemMemoryClient } from '../../../src/api/FileSystemMemoryClient';

export const MemoryPanel: React.FC = () => {
  const { simState } = useSim();
  const [hierarchyData, setHierarchyData] = useState<{ macro: any[], micro: any } | null>(null);

  // Memoize the API client so it doesn't recreate on every render
  const memoryClient = useMemo(() => new FileSystemMemoryClient(), []);

  // Constructing the Eideus Dawn Hierarchy (Macro 3x3x7)
  const sampleMacro = [
    {
      name: "The_Core_Syndicate",
      subs: [
        {
          name: "Aura-507",
          items: ["S-11_Drill", "Sentinel_Dome", "The_Gamma_Hold", "The_Isotope_Garden", "The_Quartz_Furnace", "The_Whispering_Ion", "Xenon_Scar"]
        },
        {
          name: "The_Foundry_Core",
          items: ["Quiet_Refuel", "Smelters_Dusk", "Syncline", "The_Hearth_Forge", "The_Scavengers_Nest", "The_Torque_Belt", "The_Waste_Compactor"]
        },
        {
          name: "The_Regulators_Eye",
          items: ["Aegis-1", "Censors_Rock", "The_Compliance_Matrix", "The_Gilded_Cage", "The_Silent_Witness", "The_Zero-G_Court", "Vigilance_Platform-7"]
        }
      ]
    },
    {
      name: "The_Fading_Echo",
      subs: [
        { name: "Aethel-Prime", items: ["A-31_Reclaimer", "Echoes_Deep", "Iron_Fang", "Silent_Shroud", "The_Chronos_Nexus", "The_Frozen_Crypt", "Xylos-Prime"] },
        { name: "Cygnus_Rift-Delta", items: ["Ophidian_Scar", "Rust_Nebula", "Slipstream_Node", "Subjective_Island", "The_Chronal_Glacier", "The_Lag_Gate", "The_Void_Mirror"] },
        { name: "The_Shard_Verge", items: ["Axe_Head", "Nexus_Zero", "Quantum_Dust", "Rogues_Anchor", "The_Chronometer", "The_Glitch_Forge", "The_Quiet_Vault"] }
      ]
    },
    {
      name: "The_Void_Sea",
      subs: [
        { name: "Koreths_Veil", items: ["The_Anomaly_Bloom", "The_Crystal_Quarry", "The_Oracles_Pedestal", "The_Prophets_Eye", "The_Relic_Cache", "The_Shadow_Core", "The_Stillness"] },
        { name: "The_Great_Labyrinth", items: ["Chiral_Abyss", "Refugee_Veil", "The_Black_Star", "The_Maze_World", "The_Rift_Runner", "The_Scrambler", "The_Transit_Nexus"] },
        { name: "The_Whisper_Zone", items: ["Signal_Tomb", "Stasis_Shore", "The_Cold_Heart", "The_Comm_Null", "The_Ghost_Ship", "The_Mute_World", "The_Unspoken"] }
      ]
    }
  ];

  // Micro Structure (3 Civilizations each with 3 Cities governed by 7 Regions)
  const sampleMicro = {
    name: "S-11_Drill",
    civilizations: [
      {
        name: "CIV_STR",
        cities: [
          { name: "A0", regions: ["B0", "B1", "B2", "B3", "B4", "B5", "B6"] },
          { name: "A1", regions: ["B7", "B8", "B9", "B10", "B11", "B12", "B13"] },
          { name: "A2", regions: ["B14", "B15", "B16", "B17", "B18", "B19", "B20"] }
        ]
      },
      {
        name: "CIV_DEX",
        cities: [
          { name: "CityD-X", regions: ["Reg 1", "Reg 2", "Reg 3", "Reg 4", "Reg 5", "Reg 6", "Reg 7"] },
          { name: "CityD-Y", regions: ["Reg 8", "Reg 9", "Reg 10", "Reg 11", "Reg 12", "Reg 13", "Reg 14"] },
          { name: "CityD-Z", regions: ["Reg 15", "Reg 16", "Reg 17", "Reg 18", "Reg 19", "Reg 20", "Reg 21"] }
        ]
      },
      {
        name: "CIV_INT",
        cities: [
          { name: "CityI-X", regions: ["Reg 1", "Reg 2", "Reg 3", "Reg 4", "Reg 5", "Reg 6", "Reg 7"] },
          { name: "CityI-Y", regions: ["Reg 8", "Reg 9", "Reg 10", "Reg 11", "Reg 12", "Reg 13", "Reg 14"] },
          { name: "CityI-Z", regions: ["Reg 15", "Reg 16", "Reg 17", "Reg 18", "Reg 19", "Reg 20", "Reg 21"] }
        ]
      }
    ]
  };

  // Initialize with sample data immediately
  useEffect(() => {
    console.log("[MemoryPanel] Initializing Eideus Dawn Lattice Data");
    setHierarchyData({ macro: sampleMacro, micro: sampleMicro });
  }, []);

  if (!hierarchyData) return null;

  return (
    <div className="w-full h-full bg-black relative">
      <MemoryVizRoot
        embedded
        api={memoryClient}
        hierarchyData={hierarchyData}
      />
    </div>
  );
};
