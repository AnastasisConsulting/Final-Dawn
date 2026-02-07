// Re-export all item-related types from the main types file
export type { Item, ItemStats, InventoryItem, Inventory } from '../../types';
export { ItemType } from '../../types';

// Re-export market-related types
export type { MarketItem, PricedItem, MarketOptions, Currency, PlayerState } from './market.types';
export { MarketType } from './market.types';