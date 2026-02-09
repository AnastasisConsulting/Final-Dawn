import { ITEMS } from '../data/items';
import type { Item } from '../../types';
import { MarketType, type Currency, type MarketItem, type MarketOptions, type PlayerState, type PricedItem } from './market.types';

const clampPrice = (value: number): number => Math.max(1, Math.round(value));

const isIllegal = (item: Item, illegalTypes: string[] | undefined): boolean => {
  if (!illegalTypes || illegalTypes.length === 0) return false;
  return illegalTypes.includes(item.resourceType || '') || illegalTypes.includes(item.itemType as unknown as string);
};

export class Market {
  public readonly id: string;
  public readonly name: string;
  public readonly type: MarketType;
  public readonly currency: Currency;
  public readonly inventory: MarketItem[]; // Changed to public
  private readonly priceMod: number;
  private readonly sellMod: number;
  private readonly illegalTypes?: string[];

  constructor(id: string, name: string, type: MarketType, inventory: MarketItem[], options: MarketOptions = {}) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.inventory = inventory;
    this.priceMod = options.priceMod ?? 1;
    this.sellMod = options.sellMod ?? 0.5;
    this.illegalTypes = options.illegalTypes;
    this.currency = options.currency ?? 'CrypC';
  }

  // Getter for modifiers
  public get modifiers() {
    return {
      priceMod: this.priceMod,
      sellMod: this.sellMod,
      illegalTypes: this.illegalTypes
    };
  }

  private hydrate(itemKey: string): Item | null {
    const details = ITEMS[itemKey];
    return details ?? null;
  }

  private computeBuyPrice(item: Item): number {
    return clampPrice(item.baseValue * this.priceMod);
  }

  private computeSellPrice(item: Item): number {
    return clampPrice(item.baseValue * this.sellMod);
  }

  public getBuyList(_state: PlayerState | null): PricedItem[] {
    return this.inventory
      .map((entry) => {
        const item = this.hydrate(entry.itemKey);
        if (!item || isIllegal(item, this.illegalTypes)) return null;
        return {
          ...item,
          price: entry.priceOverride ?? this.computeBuyPrice(item),
          stock: entry.stock,
        } as PricedItem;
      })
      .filter(Boolean) as PricedItem[];
  }

  public getSellList(state: PlayerState | null): PricedItem[] {
    const inventory = state?.inventory ?? {};
    return Object.entries(inventory)
      .map(([itemKey, qty]) => {
        if (qty <= 0) return null;
        const item = this.hydrate(itemKey);
        if (!item || isIllegal(item, this.illegalTypes)) return null;
        return {
          ...item,
          price: this.computeSellPrice(item),
          stock: qty,
        } as PricedItem;
      })
      .filter(Boolean) as PricedItem[];
  }
}
