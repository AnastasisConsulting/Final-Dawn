import React, { useState, useMemo } from 'react';
import { useGame, Item } from '../../../src/context/GameContext';

// Filter types
type FilterCategory = 'All' | 'WEAPON' | 'ARMOR' | 'RESOURCE' | 'consumable';

export const InventoryPanel: React.FC = () => {
    const { state } = useGame();
    const [activeTab, setActiveTab] = useState<FilterCategory>('All');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    const filteredInventory = useMemo(() => {
        if (activeTab === 'All') return state.inventory;
        // Case-insensitive match for type
        return state.inventory.filter(item => item.type.toUpperCase() === activeTab);
    }, [state.inventory, activeTab]);

    const selectedItem = useMemo(() => {
        if (!selectedItemId) return null;
        return state.inventory.find(item => item.id === selectedItemId);
    }, [selectedItemId, state.inventory]);

    const itemCategories: FilterCategory[] = ['All', 'WEAPON', 'ARMOR', 'RESOURCE', 'consumable'];

    // Placeholder currency (could be added to GameState)
    // Placeholder currency (could be added to GameState)
    const slag = 12;

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-green-300 sci-fi-glow uppercase">Inventory</h2>
                <div className="bg-gray-900/50 border border-green-500/30 px-4 py-2 text-right">
                    <p className="text-lg font-bold text-green-200">{(state.credits || 0).toLocaleString()} <span className="text-xs text-gray-400">CrypC</span></p>
                    <p className="text-sm font-bold text-orange-300">{slag.toLocaleString()} <span className="text-xs text-gray-400">Slag</span></p>
                </div>
            </div>

            <div className="flex border-b border-green-500/30 mb-4 overflow-x-auto">
                {itemCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === cat ? 'bg-green-800/50 text-green-200 border-b-2 border-green-400' : 'text-gray-400 hover:bg-green-900/50 hover:text-green-300'}`}
                    >
                        {cat === 'consumable' ? 'Supplies' : cat}
                    </button>
                ))}
            </div>

            <div className="flex-grow flex gap-4 overflow-hidden">
                <div className="w-1/2 flex-shrink-0 bg-black/30 p-2 border border-gray-700 overflow-y-auto custom-scrollbar">
                    {filteredInventory.length > 0 ? (
                        <ul className="space-y-1">
                            {filteredInventory.map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => setSelectedItemId(item.id)}
                                        className={`w-full text-left p-2 flex justify-between items-center transition-colors ${selectedItemId === item.id ? 'bg-green-900/70' : 'hover:bg-gray-800/50'}`}
                                    >
                                        <span className={`font-semibold ${item.rarity === 'legendary' ? 'text-yellow-400' : item.rarity === 'epic' ? 'text-purple-400' : 'text-green-300'}`}>
                                            {item.name}
                                        </span>
                                        <span className="text-gray-400 font-roboto-mono text-sm">x{item.count || 1}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            <p>No items in this category.</p>
                        </div>
                    )}
                </div>

                <div className="w-1/2 flex-shrink-0 bg-black/30 p-4 border border-gray-700 overflow-y-auto custom-scrollbar">
                    {selectedItem ? (
                        <div className="animate-fade-in">
                            <h3 className={`text-xl font-bold sci-fi-glow ${selectedItem.rarity === 'legendary' ? 'text-yellow-400' : 'text-green-200'}`}>
                                {selectedItem.name}
                            </h3>
                            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                                {selectedItem.rarity} {selectedItem.type}
                            </p>
                            <p className="text-sm text-gray-500 font-roboto-mono mt-1 border-b border-gray-700 pb-2 mb-2">
                                ID: {selectedItem.id.substring(0, 8)}...
                            </p>
                            <p className="text-gray-300">{selectedItem.description || "No description available."}</p>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <i className="fas fa-info-circle text-3xl mb-2"></i>
                                <p>Select an item to view details.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

