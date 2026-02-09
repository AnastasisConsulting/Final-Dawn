import React, { useMemo } from 'react';
import { useGame } from '../../../src/context/GameContext';
import { MARKETS, getMarket } from '../../../src/economy/markets';
import { useSim } from '../../../src/context/SimContext';

export const MarketPanel: React.FC = () => {
  const { state, actions } = useGame();
  const { economicScore, currentRegionName } = useSim();

  // Select current market based on location
  // Heuristic: Check if we are in a known system/market location
  // For now, default to Corporate Market (NEO_KYOTO) or switch based on some state
  const currentMarketId = 'NEO_KYOTO';
  const market = getMarket(currentMarketId);

  const inventory = useMemo(() => {
    if (!market) return [];
    return market.inventory.map(item => {
      // Price calculation logic
      // Base price * Market Mod * Economic Score
      const basePrice = 100; // Placeholder, item definitions needed for real prices
      const price = Math.floor(basePrice * (market.modifiers.priceMod || 1) * economicScore);
      return {
        ...item,
        price
      };
    });
  }, [market, economicScore]);

  if (!market) {
    return <div className="p-6 text-red-500 font-mono">NO MARKET SIGNAL DETECTED</div>;
  }

  return (
    <div className="h-full w-full flex flex-col p-4 text-cyan-100 font-mono overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="mb-6 border-b border-cyan-500/30 pb-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400 tracking-widest uppercase text-shadow-sm">
            MARKET_EXCHANGE
          </h2>
          <div className="text-[10px] text-cyan-600 uppercase tracking-[0.2em]">
            {market.name}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-yellow-400 font-bold">CREDITS: {state.credits || 0} ₡</div>
          <div className="text-[9px] text-cyan-700">ECON_FACTOR: {economicScore.toFixed(2)}</div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="space-y-1">
        {inventory.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center bg-cyan-950/20 p-2 rounded hover:bg-cyan-900/30 border border-transparent hover:border-cyan-500/30 transition-all group">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-cyan-200 group-hover:text-cyan-100">
                {item.itemKey.replace(/_/g, ' ')}
              </span>
              <span className="text-[9px] text-cyan-600 uppercase">
                Stock: {item.stock === Infinity ? 'UNLIMITED' : item.stock}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-yellow-500/80 font-mono">
                {item.price} ₡
              </div>
              <button
                className="px-3 py-1 bg-cyan-900/50 hover:bg-cyan-500 hover:text-black text-[10px] uppercase font-bold tracking-wider border border-cyan-700 hover:border-cyan-400 transition-colors rounded-sm"
                onClick={() => {
                  // TODO: Implement Buy Action
                  console.log('Buy', item.itemKey);
                }}
              >
                BUY
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-3 border border-dashed border-cyan-900/50 rounded bg-black/40 text-center">
        <span className="text-[10px] text-cyan-700 uppercase">Secure Connection Established via NetLink Protocol</span>
      </div>
    </div>
  );
};
