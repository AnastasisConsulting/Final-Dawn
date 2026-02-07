/**
 * Test suite for sectorMaps utility functions
 * Tests parsing, formatting, and data access helpers for sector map visualization
 */

import { describe, it, expect } from 'vitest';
import {
    parseWorldId,
    formatCivName,
    getCellAt,
    getNodeAt,
    getCivById,
    type WorldIndices
} from './sectorMaps';
import type { SectorMapCell, SectorMapNode, SectorMapCivilization } from './types';

describe('sectorMaps - Utility Functions', () => {
    describe('parseWorldId', () => {
        it('should parse valid world ID format G1-S2-O3', () => {
            const result = parseWorldId('G1-S2-O3');
            expect(result).toEqual({ g: 1, s: 2, o: 3 });
        });

        it('should parse lowercase world ID', () => {
            const result = parseWorldId('g5-s10-o7');
            expect(result).toEqual({ g: 5, s: 10, o: 7 });
        });

        it('should parse mixed case world ID', () => {
            const result = parseWorldId('G2-s4-O6');
            expect(result).toEqual({ g: 2, s: 4, o: 6 });
        });

        it('should handle multi-digit indices', () => {
            const result = parseWorldId('G12-S34-O56');
            expect(result).toEqual({ g: 12, s: 34, o: 56 });
        });

        it('should return null for invalid format', () => {
            expect(parseWorldId('invalid')).toBeNull();
            expect(parseWorldId('G1-S2')).toBeNull();
            expect(parseWorldId('1-2-3')).toBeNull();
            expect(parseWorldId('')).toBeNull();
        });
    });

    describe('formatCivName', () => {
        it('should replace underscores with spaces', () => {
            expect(formatCivName('Ancient_Empire', 0)).toBe('Ancient Empire');
            expect(formatCivName('Tech_Allied_Nations', 1)).toBe('Tech Allied Nations');
        });

        it('should handle civId with no underscores', () => {
            expect(formatCivName('Romans', 0)).toBe('Romans');
        });

        it('should use index fallback for empty civId', () => {
            expect(formatCivName('', 0)).toBe('Civilization 1');
            expect(formatCivName('', 5)).toBe('Civilization 6');
        });

        it('should use index fallback for whitespace-only civId', () => {
            expect(formatCivName('   ', 2)).toBe('Civilization 3');
        });

        it('should preserve leading/trailing spaces in valid names', () => {
            expect(formatCivName(' Empire ', 0)).toBe(' Empire ');
        });
    });

    describe('getCellAt', () => {
        const mockCells: SectorMapCell[] = [
            { x: 0, y: 0, type: 'plains' },
            { x: 1, y: 0, type: 'forest' },
            { x: 0, y: 1, type: 'mountain' },
            { x: 5, y: 10, type: 'ocean' },
        ];

        it('should find cell at exact coordinates', () => {
            const cell = getCellAt(mockCells, 1, 0);
            expect(cell).toBeDefined();
            expect(cell?.type).toBe('forest');
        });

        it('should return null for non-existent coordinates', () => {
            expect(getCellAt(mockCells, 99, 99)).toBeNull();
        });

        it('should work with large coordinates', () => {
            const cell = getCellAt(mockCells, 5, 10);
            expect(cell?.type).toBe('ocean');
        });

        it('should handle empty cell array', () => {
            expect(getCellAt([], 0, 0)).toBeNull();
        });

        it('should find correct cell when multiple share one coordinate', () => {
            const cell1 = getCellAt(mockCells, 0, 0);
            const cell2 = getCellAt(mockCells, 0, 1);

            expect(cell1?.type).toBe('plains');
            expect(cell2?.type).toBe('mountain');
        });
    });

    describe('getNodeAt', () => {
        const mockNodes: SectorMapNode[] = [
            { id: 'node1', kind: 'city', x: 2, y: 3 },
            { id: 'node2', kind: 'outpost', x: 5, y: 7, ownerCityId: 'city_1' },
            { id: 'node3', kind: 'resource', x: 0, y: 0, tags: ['iron', 'rare'] },
        ];

        it('should find node at coordinates', () => {
            const node = getNodeAt(mockNodes, 2, 3);
            expect(node).toBeDefined();
            expect(node?.id).toBe('node1');
            expect(node?.kind).toBe('city');
        });

        it('should return null for missing coordinates', () => {
            expect(getNodeAt(mockNodes, 100, 100)).toBeNull();
        });

        it('should handle undefined nodes array', () => {
            expect(getNodeAt(undefined, 0, 0)).toBeNull();
        });

        it('should handle empty nodes array', () => {
            expect(getNodeAt([], 5, 7)).toBeNull();
        });

        it('should find node with additional properties', () => {
            const node = getNodeAt(mockNodes, 5, 7);
            expect(node?.ownerCityId).toBe('city_1');
        });

        it('should find node with tags', () => {
            const node = getNodeAt(mockNodes, 0, 0);
            expect(node?.tags).toEqual(['iron', 'rare']);
        });
    });

    describe('getCivById', () => {
        const mockCivs: SectorMapCivilization[] = [
            {
                civId: 'empire_alpha',
                index: 0,
                seed: 'seed1',
                grid: { cells: [] },
            },
            {
                civId: 'republic_beta',
                index: 1,
                seed: 'seed2',
                grid: { cells: [] },
            },
            {
                civId: 'federation_gamma',
                index: 2,
                seed: 'seed3',
                grid: { cells: [] },
                nodes: [],
            },
        ];

        it('should find civilization by ID', () => {
            const civ = getCivById(mockCivs, 'republic_beta');
            expect(civ).toBeDefined();
            expect(civ?.index).toBe(1);
            expect(civ?.seed).toBe('seed2');
        });

        it('should return null for non-existent civId', () => {
            expect(getCivById(mockCivs, 'nonexistent')).toBeNull();
        });

        it('should return null for null civId', () => {
            expect(getCivById(mockCivs, null)).toBeNull();
        });

        it('should handle empty civilizations array', () => {
            expect(getCivById([], 'any_id')).toBeNull();
        });

        it('should find civ with optional nodes property', () => {
            const civ = getCivById(mockCivs, 'federation_gamma');
            expect(civ?.nodes).toBeDefined();
            expect(civ?.nodes).toEqual([]);
        });

        it('should match exact civId (case sensitive)', () => {
            expect(getCivById(mockCivs, 'Empire_Alpha')).toBeNull();
            expect(getCivById(mockCivs, 'empire_alpha')).toBeDefined();
        });
    });

    describe('Integration - Combined Utilities', () => {
        it('should parse world ID and format civ names together', () => {
            const worldId = 'G3-S5-O7';
            const parsed = parseWorldId(worldId);

            expect(parsed).toBeDefined();

            const formatted = formatCivName('Ancient_Civilization', parsed!.g - 1);
            expect(formatted).toBe('Ancient Civilization');
        });

        it('should find cells and nodes in same grid space', () => {
            const cells: SectorMapCell[] = [
                { x: 5, y: 5, type: 'city_center' },
            ];
            const nodes: SectorMapNode[] = [
                { id: 'city1', kind: 'capital', x: 5, y: 5 },
            ];

            const cell = getCellAt(cells, 5, 5);
            const node = getNodeAt(nodes, 5, 5);

            expect(cell?.type).toBe('city_center');
            expect(node?.kind).toBe('capital');
        });
    });
});
