export interface Item {
    id: string;
    name: string;
    description: string;
    resourceType?: string;
    itemType?: string;
    baseValue: number;
}

export const ITEMS: Record<string, Item> = {
    'item_scrap_metal': {
        id: 'item_scrap_metal',
        name: 'Scrap Metal',
        description: 'Usable scrap.',
        resourceType: 'material',
        baseValue: 10
    },
    'item_fuel_cell': {
        id: 'item_fuel_cell',
        name: 'Fuel Cell',
        description: 'Standard energy unit.',
        resourceType: 'fuel',
        baseValue: 50
    }
};
