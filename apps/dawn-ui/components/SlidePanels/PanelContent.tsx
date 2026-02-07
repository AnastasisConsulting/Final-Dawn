// Final_Dawn_of_Eideus/apps/dawn-ui/components/SlidePanels/PanelContent.tsx

import React from 'react';
// GameProvider moved to App.tsx
import { NavBot } from './panels/Navbot';
import { InventoryPanel } from './panels/InventoryPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { MemoryPanel } from './panels/MemoryPanel';

import { Vizzy } from './panels/Vizzy';
// New right-rail slide panels
import { CharacterSheetPanel } from './panels/CharacterSheetPanel';
import { MarketPanel } from './panels/MarketPanel';
import { NpcPanel } from './panels/NpcPanel';
import { CombatWheelPanel } from './panels/CombatWheelPanel';
import { CharacterProgressionPanel } from './CharacterProgressionPanel';
import { AffinityVizPanel } from './panels/AffinityVizPanel';

interface PanelContentProps {
  panelId?: string | null;
  onFlightMode?: () => void;
}

export const PanelContent: React.FC<PanelContentProps> = ({ panelId, onFlightMode }) => {
  const id = (panelId || '').toUpperCase();

  const content = (() => {
    switch (id) {
      case 'NAV':
        return <NavBot />;
      case 'DEX':
        return <Vizzy />;
      case 'UNIT':
        // UNIT = Player Operator Profile / Character Sheet
        return <CharacterSheetPanel />;
      case 'GEAR':
        return <InventoryPanel />;
      case 'NET':
        // NET = NPC comms + lorebook
        return <NpcPanel />;
      case 'DATA':
        // DATA = market / trade (placeholder implementation)
        return <MarketPanel />;
      case 'MEM':
        // MEM = Memory visualization
        return <MemoryPanel />;
      case 'SIM':
        // SIM = Affinity system visualizer
        return <AffinityVizPanel />;

      case 'BIO':
        // BIO = combat wheel (replaces buggy legacy CombatPanel)
        return <CombatWheelPanel />;
      case 'PROG':
        return <CharacterProgressionPanel />;
      case 'OPT':
        return <SettingsPanel />;
      case 'INT':
        return (
          <div className="flex items-center justify-center h-full p-6 text-center">
            <div className="space-y-2">
              <div className="text-cyan-500/50 text-[10px] font-mono animate-pulse uppercase tracking-[0.2em]">
                Signal Found: Internal Lattice Origin
              </div>
              <div className="text-neutral-500 text-xs font-mono italic">
                "There is no terminal for the voice within."
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-neutral-400 text-sm font-mono p-4">
            Select a terminal from the right rail to initialize interface.
          </div>
        );
    }
  })();

  return <>{content}</>;
};
