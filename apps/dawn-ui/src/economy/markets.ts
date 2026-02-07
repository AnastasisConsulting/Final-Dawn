// /src/data/markets.ts
import { Market } from '../systems/market';
import { MarketType, MarketItem } from './items/market.types';

const corporateMarketInventory: MarketItem[] = [
  { itemKey: 'BLASTER_PISTOL', stock: 15 },
  { itemKey: 'MEDKIT', stock: Infinity },
  { itemKey: 'ISOTOPIC_FUEL', stock: 200 },
  { itemKey: 'COMBINE_ARMOR', stock: 5 },
  { itemKey: 'RATIONS_CORP', stock: Infinity },
  { itemKey: 'FTL_DRIVE_A_GRADE', stock: 1 },
  { itemKey: 'DATA_JACK', stock: 10 },
  { itemKey: 'MEDICAL_SUPPLIES', stock: 40 },
];

const corporateMarket = new Market(
  'NEO_KYOTO',
  'Neo-Kyoto Prestige Market',
  MarketType.CORPORATE,
  corporateMarketInventory,
  {
    priceMod: 1.1,
    sellMod: 0.5,
    illegalTypes: ['Illegal Cybernetics', 'Biowaste', 'Slag', 'Exotic Matter'],
  }
);

const fringeMarketInventory: MarketItem[] = [
  { itemKey: 'COMBAT_KNIFE', stock: 50 },
  { itemKey: 'SLAG_CANNON', stock: 3 },
  { itemKey: 'SYNTH_BOOZE', stock: Infinity },
  { itemKey: 'ILLEGAL_CYBERNETICS', stock: 2 },
  { itemKey: 'SCRAP_METAL', stock: 500 },
  { itemKey: 'JUNK_PARTS', stock: Infinity },
  { itemKey: 'KERENZIKOV_BOOSTER', stock: 1 },
  { itemKey: 'FTL_DRIVE_JURY_RIGGED', stock: 2 },
];

const fringeMarket = new Market(
  'GOLGOTHA',
  'Golgotha Scrap-Heap',
  MarketType.FRINGE,
  fringeMarketInventory,
  {
    faction: 'GOLGOTHA_SCRAPPERS',
    priceMod: 0.9,
    sellMod: 0.7,
    illegalTypes: ['Luxury Goods'],
  }
);

export const MARKETS: Record<string, Market> = {
  [corporateMarket.id]: corporateMarket,
  [fringeMarket.id]: fringeMarket,
};

export function getMarket(id: string): Market | undefined {
  return MARKETS[id];
}

export function getMarketOrThrow(id: string): Market {
  const m = MARKETS[id];
  if (!m) throw new Error(`Unknown market id: ${id}`);
  return m;
}
