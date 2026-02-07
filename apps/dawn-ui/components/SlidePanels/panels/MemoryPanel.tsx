import React from 'react';
import MemoryVizRoot from '../../../../memory-viz/Visualizer';

export const MemoryPanel: React.FC = () => {
  return (
    <div className="w-full h-full bg-black">
      <MemoryVizRoot embedded />
    </div>
  );
};
