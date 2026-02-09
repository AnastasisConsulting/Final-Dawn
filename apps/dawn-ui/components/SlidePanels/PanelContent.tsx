// Final_Dawn_of_Eideus/apps/dawn-ui/components/SlidePanels/PanelContent.tsx

import React from 'react';
// GameProvider moved to App.tsx
import { NavBot } from './panels/Navbot';
import { InventoryPanel } from './panels/InventoryPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { MemoryPanel } from './panels/MemoryPanel';
import { LorePanel } from './panels/LorePanel';

import { Vizzy } from './panels/Vizzy';
// New right-rail slide panels
import { CharacterSheetPanel } from './panels/CharacterSheetPanel';
import { MarketPanel } from './panels/MarketPanel';
import { NpcPanel } from './panels/NpcPanel';
import { CombatWheelPanel } from './panels/CombatWheelPanel';
import { CharacterProgressionPanel } from './CharacterProgressionPanel';
import { AffinityVizPanel } from './panels/AffinityVizPanel';
import { MissionLogPanel } from './panels/MissionLogPanel';

interface PanelContentProps {
  panelId?: string | null;
  onFlightMode?: () => void;
  onPanelChange?: (panelId: string) => void;
}

export const PanelContent: React.FC<PanelContentProps> = ({ panelId, onFlightMode, onPanelChange }) => {
  const id = (panelId || '').toUpperCase();

  const content = (() => {
    switch (id) {
      // --- LEFT DOCK ---
      case 'SIM':
        return <AffinityVizPanel onPanelChange={onPanelChange} />;
      case 'MEM':
        return <MemoryPanel />;
      case 'SHOP':
        return <MarketPanel />;
      case 'BIO':
        return <CombatWheelPanel />;
      case 'FLIGHT':
        // Flight triggered via button but maybe show status here? 
        return <div className="p-8 text-cyan-500 font-mono text-center">FLIGHT SYSTEMS ENGAGED VIA NAV LINK</div>;

      // --- RIGHT DOCK ---
      case 'UNIT': // 'PROFILE' button
      case 'PROFILE': // Just in case
        return <CharacterSheetPanel />;
      case 'SKILLS':
        // Placeholder
        return <div className="p-8 text-cyan-500 font-mono text-center">SKILLS MATRIX OFFLINE</div>;
      case 'PROG':
        return <CharacterProgressionPanel />;
      case 'INV': // 'INV' button
      case 'GEAR': // Legacy ID
        return <InventoryPanel />;
      case 'OPT':
        return <SettingsPanel />;

      // --- OTHERS ---
      case 'NET':
        return <NpcPanel />;
      case 'LOGS':
        return <MissionLogPanel />;
      case 'DATA':
        return <MarketPanel />; // Legacy fallback

      default:
        return (
          <div className="text-neutral-400 text-sm font-mono p-4">
            PANEL_OFFLINE: {id}
          </div>
        );
    }
  })();

  return <>{content}</>;
};
