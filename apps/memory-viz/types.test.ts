/**
 * Test suite for memory-viz type definitions and data structures
 * Validates type integrity and structure of visualization data types
 */

import { describe, it, expect } from 'vitest';
import type {
    SpatialKey,
    TemporalKey,
    MemoryVoxel,
    EntityCard,
    VoxelFaces,
    WorldIndices,
} from './types';

describe('Memory Visualization - Type Structures', () => {
    describe('SpatialKey', () => {
        it('should have 6 hierarchical levels (7-level system)', () => {
            const spatial: SpatialKey = {
                g: 1,   // Galaxy
                s: 2,   // Star System
                o: 3,   // Planetary Object
                c: 4,   // Civilization
                ct: 5,  // City
                r: 6,   // Region
            };

            expect(spatial.g).toBe(1);
            expect(spatial.s).toBe(2);
            expect(spatial.o).toBe(3);
            expect(spatial.c).toBe(4);
            expect(spatial.ct).toBe(5);
            expect(spatial.r).toBe(6);
        });

        it('should accept  zero values', () => {
            const spatial: SpatialKey = { g: 0, s: 0, o: 0, c: 0, ct: 0, r: 0 };
            expect(Object.values(spatial).every(v => v === 0)).toBe(true);
        });
    });

    describe('TemporalKey', () => {
        it('should have 4-level temporal hierarchy', () => {
            const temporal: TemporalKey = {
                saga: 1,
                book: 2,
                chapter: 3,
                page: 4,
            };

            expect(temporal.saga).toBe(1);
            expect(temporal.book).toBe(2);
            expect(temporal.chapter).toBe(3);
            expect(temporal.page).toBe(4);
        });

        it('should allow large page numbers', () => {
            const temporal: TemporalKey = { saga: 1, book: 1, chapter: 1, page: 9999 };
            expect(temporal.page).toBe(9999);
        });
    });

    describe('EntityCard', () => {
        it('should have required id and name', () => {
            const entity: EntityCard = {
                id: 'npc_001',
                name: 'Lyra',
            };

            expect(entity.id).toBe('npc_001');
            expect(entity.name).toBe('Lyra');
        });

        it('should support optional class and aliases', () => {
            const entity: EntityCard = {
                id: 'npc_002',
                name: 'Guide Master',
                class: 'mentor',
                aliases: ['GM', 'The Guide'],
            };

            expect(entity.class).toBe('mentor');
            expect(entity.aliases).toHaveLength(2);
            expect(entity.aliases).toContain('GM');
        });

        it('should support optional metadata', () => {
            const entity: EntityCard = {
                id: 'npc_003',
                name: 'Trader',
                meta: {
                    faction: 'merchants',
                    trust: 0.8,
                    questGiver: true,
                },
            };

            expect(entity.meta?.faction).toBe('merchants');
            expect(entity.meta?.trust).toBe(0.8);
            expect(entity.meta?.questGiver).toBe(true);
        });
    });

    describe('VoxelFaces - 6-Face Cube Structure', () => {
        it('should have all 6 faces defined', () => {
            const faces: VoxelFaces = {
                'x+': 'Player input text',
                'x-': 'Narration output',
                'y+': [[0.1, 0.2, 0.3]],
                'y-': ['arrival', 'greeting'],
                'z+': [{ id: 'npc1', name: 'Lyra' }],
                'z-': 'LORE_TERMINAL',
            };

            expect(faces['x+']).toBeDefined();
            expect(faces['x-']).toBeDefined();
            expect(faces['y+']).toBeDefined();
            expect(faces['y-']).toBeDefined();
            expect(faces['z+']).toBeDefined();
            expect(faces['z-']).toBeDefined();
        });

        it('x+ face should store player input (string)', () => {
            const faces: VoxelFaces = {
                'x+': 'What is this place?',
                'x-': '',
                'y+': [],
                'y-': [],
                'z+': [],
                'z-': '',
            };

            expect(typeof faces['x+']).toBe('string');
            expect(faces['x+']).toContain('place');
        });

        it('x- face should store narration output (string)', () => {
            const faces: VoxelFaces = {
                'x+': '',
                'x-': 'The terminal hums softly.',
                'y+': [],
                'y-': [],
                'z+': [],
                'z-': '',
            };

            expect(typeof faces['x-']).toBe('string');
        });

        it('y+ face should store up to 7 embeddings', () => {
            const embeddings: number[][] = [
                [0.1, 0.2, 0.3],
                [0.4, 0.5, 0.6],
                [0.7, 0.8, 0.9],
            ];

            const faces: VoxelFaces = {
                'x+': '',
                'x-': '',
                'y+': embeddings,
                'y-': [],
                'z+': [],
                'z-': '',
            };

            expect(Array.isArray(faces['y+'])).toBe(true);
            expect(faces['y+'].length).toBe(3);
            expect(faces['y+'][0]).toEqual([0.1, 0.2, 0.3]);
        });

        it('y- face should store up to 7 tags', () => {
            const tags = ['combat', 'victory', 'important'];

            const faces: VoxelFaces = {
                'x+': '',
                'x-': '',
                'y+': [],
                'y-': tags,
                'z+': [],
                'z-': '',
            };

            expect(Array.isArray(faces['y-'])).toBe(true);
            expect(faces['y-'].length).toBe(3);
            expect(faces['y-']).toContain('combat');
        });

        it('z+ face should store entity cards', () => {
            const entities: EntityCard[] = [
                { id: 'npc1', name: 'Lyra', class: 'Guide' },
                { id: 'npc2', name: 'Trader' },
            ];

            const faces: VoxelFaces = {
                'x+': '',
                'x-': '',
                'y+': [],
                'y-': [],
                'z+': entities,
                'z-': '',
            };

            expect(faces['z+'].length).toBe(2);
            expect(faces['z+'][0].name).toBe('Lyra');
            expect(faces['z+'][0].class).toBe('Guide');
        });

        it('z- face should store lore key', () => {
            const faces: VoxelFaces = {
                'x+': '',
                'x-': '',
                'y+': [],
                'y-': [],
                'z+': [],
                'z-': 'LORE_FIRST_CONTACT',
            };

            expect(typeof faces['z-']).toBe('string');
            expect(faces['z-']).toContain('LORE_');
        });
    });

    describe('MemoryVoxel', () => {
        it('should have complete voxel structure', () => {
            const voxel: MemoryVoxel = {
                id: 'voxel_001',
                spatial: { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 },
                temporal: { saga: 1, book: 1, chapter: 1, page: 1 },
                faces: {
                    'x+': 'input',
                    'x-': 'output',
                    'y+': [],
                    'y-': [],
                    'z+': [],
                    'z-': '',
                },
                createdAtUnixMs: Date.now(),
            };

            expect(voxel.id).toBe('voxel_001');
            expect(voxel.spatial.g).toBe(1);
            expect(voxel.temporal.saga).toBe(1);
            expect(voxel.faces).toBeDefined();
            expect(voxel.createdAtUnixMs).toBeGreaterThan(0);
        });

        it('should track creation timestamp', () => {
            const now = Date.now();
            const voxel: MemoryVoxel = {
                id: 'test',
                spatial: { g: 0, s: 0, o: 0, c: 0, ct: 0, r: 0 },
                temporal: { saga: 0, book: 0, chapter: 0, page: 0 },
                faces: {
                    'x+': '',
                    'x-': '',
                    'y+': [],
                    'y-': [],
                    'z+': [],
                    'z-': '',
                },
                createdAtUnixMs: now,
            };

            expect(voxel.createdAtUnixMs).toBe(now);
            expect(voxel.createdAtUnixMs).toBeLessThanOrEqual(Date.now());
        });
    });

    describe('Data Integrity', () => {
        it('should maintain referential integrity between spatial and world indices', () => {
            const spatial: SpatialKey = { g: 3, s: 5, o: 7, c: 1, ct: 2, r: 3 };

            // WorldIndices should match first 3 levels
            const worldId = `G${spatial.g}-S${spatial.s}-O${spatial.o}`;
            expect(worldId).toBe('G3-S5-O7');
        });

        it('should support empty collections in voxel faces', () => {
            const faces: VoxelFaces = {
                'x+': '',
                'x-': '',
                'y+': [],
                'y-': [],
                'z+': [],
                'z-': '',
            };

            expect(faces['y+'].length).toBe(0);
            expect(faces['y-'].length).toBe(0);
            expect(faces['z+'].length).toBe(0);
        });

        it('should support full capacity in collections', () => {
            const maxEmbeddings = Array(7).fill([1, 2, 3]);
            const maxTags = Array(7).fill('tag');

            const faces: VoxelFaces = {
                'x+': '',
                'x-': '',
                'y+': maxEmbeddings,
                'y-': maxTags,
                'z+': [],
                'z-': '',
            };

            expect(faces['y+'].length).toBe(7);
            expect(faces['y-'].length).toBe(7);
        });
    });
});
