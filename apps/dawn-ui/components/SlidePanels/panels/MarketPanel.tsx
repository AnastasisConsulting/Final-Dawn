// Final_Dawn_of_Eideus/apps/dawn-ui/components/SlidePanels/panels/MarketPanel.tsx

import React, { useMemo, useState } from 'react';

type Currency = 'CrypC' | 'Slag';

type MarketItem = {
  key: string;
  name: string;
  description: string;
  price: number;
  stock: number | '∞';
};

const STARTING_PLAYER = {
  crypCredits: 3200,
  slag: 12,
  inventory: {
    BLASTER_PISTOL: 1,
    NANITE_KIT: 3,
    DATA_CHIP: 5,
    PLASMA_RIFLE: 0,
  } as Record<string, number>,
};

const ITEMS: MarketItem[] = [
  {
    key: 'BLASTER_PISTOL',
    name: 'Blaster Pistol',
    description: 'Reliable sidearm used by forward scouts.',
    price: 450,
    stock: '∞',
  },
  {
    key: 'PLASMA_RIFLE',
    name: 'Plasma Rifle',
    description: 'Superheated plasma projectiles. Illegal in most sectors.',
    price: 2800,
    stock: 2,
  },
  {
    key: 'NANITE_KIT',
    name: 'Nanite Repair Kit',
    description: 'Self-propagating nanites that patch hull and flesh.',
    price: 900,
    stock: 7,
  },
  {
    key: 'DATA_CHIP',
    name: 'Encrypted Datachip',
    description: 'Contains an unknown route. Fence it or decrypt it.',
    price: 1200,
    stock: '∞',
  },
];

const UI_MAX_BULK = 999;

export const MarketPanel: React.FC = () => {
  const [currency, setCurrency] = useState<Currency>('CrypC');
  const [player, setPlayer] = useState(() => ({ ...STARTING_PLAYER }));
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const selected = useMemo(() => ITEMS.find((i) => i.key === selectedKey) ?? null, [selectedKey]);

  const balance = currency === 'CrypC' ? player.crypCredits : player.slag;
  const owned = selected ? player.inventory[selected.key] ?? 0 : 0;

  const maxQty = useMemo(() => {
    if (!selected) return 1;
    const raw = tab === 'buy' ? selected.stock : owned;
    const n = raw === '∞' ? UI_MAX_BULK : raw;
    return Math.max(1, n);
  }, [selected, tab, owned]);

  const total = selected ? selected.price * qty : 0;
  const canAfford = selected ? balance >= total : false;
  const canTransact = !!selected && qty >= 1 && qty <= maxQty && (tab === 'sell' || canAfford);

  const transact = () => {
    if (!selected || !canTransact) return;
    setPlayer((p) => {
      const next = { ...p, inventory: { ...p.inventory } };
      const take = (cur: Currency, amount: number) => {
        if (cur === 'CrypC') next.crypCredits = Math.max(0, next.crypCredits - amount);
        else next.slag = Math.max(0, next.slag - amount);
      };
      const give = (cur: Currency, amount: number) => {
        if (cur === 'CrypC') next.crypCredits += amount;
        else next.slag += amount;
      };

      if (tab === 'buy') {
        take(currency, total);
        next.inventory[selected.key] = (next.inventory[selected.key] ?? 0) + qty;
      } else {
        next.inventory[selected.key] = Math.max(0, (next.inventory[selected.key] ?? 0) - qty);
        give(currency, total);
      }
      return next;
    });
    setSelectedKey(null);
    setQty(1);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-green-300/70">DATA</div>
          <h2 className="text-2xl font-bold text-green-200 uppercase">Market Access</h2>
          <div className="text-xs text-neutral-400 font-mono mt-1">Local exchange · prices are placeholder</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrency('CrypC')}
            className={`text-xs uppercase tracking-widest px-3 py-2 rounded border ${
              currency === 'CrypC'
                ? 'border-green-500/60 bg-green-900/20 text-green-100'
                : 'border-neutral-800 bg-black/20 text-neutral-400 hover:border-neutral-600'
            }`}
          >
            CrypC
          </button>
          <button
            onClick={() => setCurrency('Slag')}
            className={`text-xs uppercase tracking-widest px-3 py-2 rounded border ${
              currency === 'Slag'
                ? 'border-orange-500/60 bg-orange-900/20 text-orange-100'
                : 'border-neutral-800 bg-black/20 text-neutral-400 hover:border-neutral-600'
            }`}
          >
            Slag
          </button>
          <div className="border border-neutral-800 bg-black/30 rounded px-4 py-3 text-right min-w-[140px]">
            <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Balance</div>
            <div className="text-lg font-bold text-white">{balance.toLocaleString()}</div>
            <div className="text-[10px] text-neutral-500 font-mono">{currency}</div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-green-500/30 mb-4">
        <button
          onClick={() => {
            setTab('buy');
            setSelectedKey(null);
            setQty(1);
          }}
          className={`px-6 py-2 text-sm font-semibold transition-colors ${
            tab === 'buy'
              ? 'bg-green-800/50 text-green-200 border-b-2 border-green-400'
              : 'text-gray-400 hover:bg-green-900/50'
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => {
            setTab('sell');
            setSelectedKey(null);
            setQty(1);
          }}
          className={`px-6 py-2 text-sm font-semibold transition-colors ${
            tab === 'sell'
              ? 'bg-green-800/50 text-green-200 border-b-2 border-green-400'
              : 'text-gray-400 hover:bg-green-900/50'
          }`}
        >
          SELL
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="w-1/2 flex-shrink-0 bg-black/30 p-2 border border-gray-700 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1">
            {ITEMS.map((item) => {
              const active = selectedKey === item.key;
              const stock = item.stock === '∞' ? '∞' : item.stock;
              const ownedQty = player.inventory[item.key] ?? 0;
              const disabled = tab === 'sell' && ownedQty <= 0;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => {
                      if (disabled) return;
                      setSelectedKey(item.key);
                      setQty(1);
                    }}
                    className={`w-full text-left p-2 flex justify-between items-center transition-colors ${
                      active ? 'bg-green-900/70' : disabled ? 'opacity-40' : 'hover:bg-gray-800/50'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-green-300">{item.name}</span>
                      <span className="text-xs text-gray-500 ml-2">Stock: {stock}</span>
                      <span className="text-xs text-gray-600 ml-2">Owned: {ownedQty}</span>
                    </div>
                    <span className="font-roboto-mono text-sm text-green-300">{item.price}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="w-1/2 flex-shrink-0 bg-black/30 p-4 border border-gray-700">
          {selected ? (
            <div className="animate-fade-in flex flex-col h-full">
              <h3 className="text-xl font-bold text-green-200 sci-fi-glow">{selected.name}</h3>
              <p className="text-gray-300 mt-2 flex-1 overflow-y-auto custom-scrollbar">{selected.description}</p>
              <div className="mt-4 border-t border-gray-700 pt-4">
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={qty}
                    min={1}
                    max={maxQty}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      const safe = Number.isFinite(v) ? v : 1;
                      setQty(Math.max(1, Math.min(maxQty, safe)));
                    }}
                    className="bg-gray-900 border border-cyan-500/50 p-3 w-24 text-center focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    onClick={transact}
                    disabled={!canTransact}
                    className="flex-1 bg-green-800 hover:bg-green-700 text-white font-bold py-3 px-6 rounded uppercase disabled:bg-gray-700 disabled:cursor-not-allowed"
                  >
                    {tab} ({total} {currency})
                  </button>
                </div>
                {tab === 'buy' && !canAfford && (
                  <p className="text-red-400 text-xs mt-2 text-center">Insufficient funds.</p>
                )}
                {tab === 'sell' && owned <= 0 && (
                  <p className="text-gray-500 text-xs mt-2 text-center">You don’t have any of this item.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p>Select an item to trade.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
