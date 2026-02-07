import type { Item } from '../../types';

export type Currency = 'CrypC' | 'Slag';

export enum MarketType {
  CORPORATE = 'CORPORATE',
  FRINGE = 'FRINGE',
  BLACK_MARKET = 'BLACK_MARKET',
  MILITARY = 'MILITARY',
}

export interface MarketItem {
  itemKey: string;
  stock: number; // Infinity means unlimited
  priceOverride?: number;
}

export interface PricedItem extends Item {
  price: number;
  stock: number;
}

export interface MarketOptions {
  priceMod?: number;
  sellMod?: number;
  faction?: string;
  illegalTypes?: string[];
  currency?: Currency;
}

// Mirror the player state used by the kernel so market panels can consume it.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type PlayerState = import('../kernel/reducer').PlayerState;
