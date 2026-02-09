import React, { useEffect, useState, useMemo } from 'react';
import MemoryVizRoot from 'memory-viz';
import { useSim } from '../../../src/context/SimContext';
import { FileSystemMemoryClient } from '../../../src/api/FileSystemMemoryClient';

export const MemoryPanel: React.FC = () => {
  const { simState } = useSim();
  const [hierarchyData, setHierarchyData] = useState<any[]>([]);

  // Memoize the API client so it doesn't recreate on every render
  const memoryClient = useMemo(() => new FileSystemMemoryClient(), []);

  // Hardcoded data for verification as per user request to decouple from sector_map.json
  const sampleHierarchy = [
    {
      name: "S-11_Drill",
      subs: [
        { name: "City A0", items: ["Region B0", "Region B1"] },
        { name: "City A1", items: ["Region C0", "Region C1"] },
        { name: "City A2", items: ["Region D0", "Region D1"] }
      ]
    },
    {
      name: "Temporal Lattice",
      subs: [
        { name: "Past Echoes", items: ["Fragment 1", "Fragment 2"] },
        { name: "Present Flow", items: ["Stream A", "Stream B"] },
        { name: "Future Casts", items: ["Probability 1"] }
      ]
    },
    {
      name: "Spatial Lattice",
      subs: [
        { name: "Grid Alpha", items: ["Node 0"] },
        { name: "Grid Beta", items: ["Node 1"] },
        { name: "Grid Gamma", items: ["Node 2"] }
      ]
    }
  ];

  // Initialize with sample data immediately
  useEffect(() => {
    console.log("[MemoryPanel] Using Hardcoded Hierarchy Data");
    setHierarchyData(sampleHierarchy);
  }, []);

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
