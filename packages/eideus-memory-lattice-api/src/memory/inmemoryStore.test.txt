// /src/memory/inmemoryStore.test.ts
/**
 * Comprehensive test suite for InMemoryLattice (7×7×7 fractal memory system)
 * 
 * Tests the complete memory lattice implementation:
 * - Spatial addressing (g/s/o/c/ct/r hierarchy)
 * - Temporal addressing (saga/book/chapter/page)
 * - 6-face voxel structure (x+, x-, y+, y-, z+, z-)
 * - Index-based search (location, personage, tags, lore, entity)
 * - Embedding-based semantic search
 * - Spatial/temporal expansion (neighbors, BFS, time ranges)
 * - Coordinate resolution and ranking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryLattice } from './inmemoryStore.js';
import type { MemoryVoxel, SpatialKey, TemporalKey, EntityCard, LoreContext } from './types.js';

describe('InMemoryLattice - Voxel Storage', () => {
    let lattice: InMemoryLattice;

    beforeEach(() => {
        lattice = new InMemoryLattice();
    });

    describe('Basic Voxel Operations', () => {
        it('should create a voxel with all 6 faces', async () => {
            const spatial: SpatialKey = { g: 1, s: 2, o: 3, c: 4, ct: 5, r: 6 };
            const temporal: TemporalKey = { saga: 1, book: 1, chapter: 1, page: 1 };
            const loreContext: LoreContext = {
                loreKey: 'LORE_SECTOR_ALPHA',
                landmarks: [],
            };

            const voxel = await lattice.upsertVoxel({
                spatial,
                temporal,
                faces: {
                    'x+': 'Player explores the rusted corridor',
                    'x-': 'You find yourself in a decaying hallway with flickering lights',
                    'y+': [[0.1, 0.2, 0.3]], // Embedding vector
                    'y-': ['exploration', 'abandoned', 'facility'],
                    'z+': [{ id: 'NPC_LYRA', name: 'Lyra', class: 'Guide' }],
                    'z-': loreContext,
                },
            });

            expect(voxel.id).toBe('g1.s2.o3.c4.ct5.r6|s1.b1.c1.p1');
            expect(voxel.spatial).toEqual(spatial);
            expect(voxel.temporal).toEqual(temporal);
            expect(voxel.faces['x+']).toBe('Player explores the rusted corridor');
            expect(voxel.faces['z-']).toEqual(loreContext);
            expect(voxel.createdAtUnixMs).toBeGreaterThan(0);
        });

        it('should prevent duplicate voxels (immutability)', async () => {
            const spatial: SpatialKey = { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 };
            const temporal: TemporalKey = { saga: 1, book: 1, chapter: 1, page: 1 };

            await lattice.upsertVoxel({
                spatial,
                temporal,
                faces: {
                    'x+': 'First entry',
                    'x-': '',
                    'y+': [],
                    'y-': [],
                    'z+': [],
                    'z-': { loreKey: 'TEST', landmarks: [] },
                },
            });

            await expect(
                lattice.upsertVoxel({
                    spatial,
                    temporal,
                    faces: {
                        'x+': 'Second entry',
                        'x-': '',
                        'y+': [],
                        'y-': [],
                        'z+': [],
                        'z-': { loreKey: 'TEST', landmarks: [] },
                    },
                })
            ).rejects.toThrow('already exists');
        });

        it('should read a voxel by spatial + temporal coordinates', async () => {
            const spatial: SpatialKey = { g: 2, s: 3, o: 1, c: 2, ct: 1, r: 3 };
            const temporal: TemporalKey = { saga: 1, book: 2, chapter: 5, page: 10 };

            await lattice.upsertVoxel({
                spatial,
                temporal,
                faces: {
                    'x+': 'Test entry',
                    'x-': '',
                    'y+': [],
                    'y-': [],
                    'z+': [],
                    'z-': { loreKey: 'TEST', landmarks: [] },
                },
            });

            const result = await lattice.readVoxel({ spatial, temporal });
            expect(result.voxel).not.toBeNull();
            expect(result.voxel?.faces['x+']).toBe('Test entry');
        });
    });

    describe('Spatial Hierarchy Tests (7-level fractal)', () => {
        beforeEach(async () => {
            // Create test voxels across spatial hierarchy
            const temporal: TemporalKey = { saga: 1, book: 1, chapter: 1, page: 1 };

            await lattice.upsertVoxel({
                spatial: { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 },
                temporal,
                faces: {
                    'x+': 'Deep location',
                    'x-': '',
                    'y+': [],
                    'y-': ['test'],
                    'z+': [],
                    'z-': { loreKey: 'DEEP', landmarks: [] },
                },
            });

            await lattice.upsertVoxel({
                spatial: { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 2 },
                temporal,
                faces: {
                    'x+': 'Adjacent region',
                    'x-': '',
                    'y+': [],
                    'y-': ['test'],
                    'z+': [],
                    'z-': { loreKey: 'ADJACENT', landmarks: [] },
                },
            });

            await lattice.upsertVoxel({
                spatial: { g: 1, s: 1, o: 2, c: 1, ct: 1, r: 1 },
                temporal,
                faces: {
                    'x+': 'Different planet',
                    'x-': '',
                    'y+': [],
                    'y-': ['test'],
                    'z+': [],
                    'z-': { loreKey: 'PLANET2', landmarks: [] },
                },
            });
        });

        it('should query by galaxy prefix', async () => {
            const result = await lattice.rangeReadSpatialHierarchy({
                prefix: { g: 1 },
            });
            expect(result.voxels.length).toBeGreaterThanOrEqual(3);
        });

        it('should query by star system prefix', async () => {
            const result = await lattice.rangeReadSpatialHierarchy({
                prefix: { g: 1, s: 1 },
            });
            expect(result.voxels.length).toBeGreaterThanOrEqual(3);
        });

        it('should query by planetary object', async () => {
            const result = await lattice.rangeReadSpatialHierarchy({
                prefix: { g: 1, s: 1, o: 1 },
            });
            expect(result.voxels.length).toBe(2); // Only o=1 voxels
        });

        it('should query by region (deepest level)', async () => {
            const result = await lattice.rangeReadSpatialHierarchy({
                prefix: { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 },
            });
            expect(result.voxels.length).toBe(1);
            expect(result.voxels[0].faces['x+']).toBe('Deep location');
        });
    });

    describe('Temporal Range Queries', () => {
        beforeEach(async () => {
            const spatial: SpatialKey = { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 };

            for (let page = 1; page <= 10; page++) {
                await lattice.upsertVoxel({
                    spatial,
                    temporal: { saga: 1, book: 1, chapter: 1, page },
                    faces: {
                        'x+': `Page ${page} entry`,
                        'x-': '',
                        'y+': [],
                        'y-': [],
                        'z+': [],
                        'z-': { loreKey: 'STORY', landmarks: [] },
                    },
                });
            }
        });

        it('should retrieve page range', async () => {
            const result = await lattice.rangeReadTemporal({
                bounds: {
                    kind: 'pageRange',
                    base: { saga: 1, book: 1, chapter: 1 },
                    fromPage: 3,
                    toPage: 7,
                },
            });

            expect(result.voxels.length).toBe(5); // Pages 3, 4, 5, 6, 7
            expect(result.voxels[0].faces['x+']).toBe('Page 3 entry');
            expect(result.voxels[4].faces['x+']).toBe('Page 7 entry');
        });

        it('should retrieve exact temporal coordinate', async () => {
            const result = await lattice.rangeReadTemporal({
                bounds: {
                    kind: 'exact',
                    key: { saga: 1, book: 1, chapter: 1, page: 5 },
                },
            });

            expect(result.voxels.length).toBe(1);
            expect(result.voxels[0].faces['x+']).toBe('Page 5 entry');
        });
    });

    describe('Index-Based Search', () => {
        beforeEach(async () => {
            const spatial: SpatialKey = { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 };
            const temporal: TemporalKey = { saga: 1, book: 1, chapter: 1, page: 1 };

            await lattice.upsertVoxel({
                spatial,
                temporal,
                faces: {
                    'x+': 'The player arrives at the Terminal',
                    'x-': 'Lyra greets you at the corroded terminal',
                    'y+': [],
                    'y-': ['arrival', 'greeting', 'terminal'],
                    'z+': [
                        { id: 'NPC_LYRA', name: 'Lyra', class: 'Guide', aliases: ['GM', 'Narrator'] },
                    ],
                    'z-': {
                        loreKey: 'LORE_TERMINAL', landmarks: [
                            { id: 'LOC_TERMINAL', name: 'Corroded Terminal', type: 'LOCATION', tags: ['tech', 'abandoned'] },
                        ]
                    },
                },
            });
        });

        it('should search by location keyword', async () => {
            const result = await lattice.resolveCoordinatesByIndex({
                kind: 'LocationEntity',
                query: 'terminal',
            });

            expect(result.candidates.length).toBeGreaterThan(0);
            expect(result.candidates[0].score).toBeGreaterThan(0);
        });

        it('should search by personage (NPC name)', async () => {
            const result = await lattice.resolveCoordinatesByIndex({
                kind: 'PersonageEntity',
                query: 'lyra',
            });

            expect(result.candidates.length).toBe(1);
        });

        it('should search by entity alias', async () => {
            const result = await lattice.resolveCoordinatesByIndex({
                kind: 'PersonageEntity',
                query: 'gm',
            });

            expect(result.candidates.length).toBe(1);
        });

        it('should search by tag', async () => {
            const result = await lattice.resolveCoordinatesByIndex({
                kind: 'AssociativeTags',
                query: ['arrival', 'greeting'],
            });

            expect(result.candidates.length).toBeGreaterThan(0);
            expect(result.candidates[0].score).toBe(2); // Both tags found
        });

        it('should search by lore key', async () => {
            const result = await lattice.resolveCoordinatesByIndex({
                kind: 'LoreKey',
                query: 'LORE_TERMINAL',
            });

            expect(result.candidates.length).toBe(1);
        });

        it('should search by entity class', async () => {
            const result = await lattice.resolveCoordinatesByIndex({
                kind: 'EntityClass',
                query: 'guide',
            });

            expect(result.candidates.length).toBe(1);
        });
    });

    describe('Embedding-Based Semantic Search', () => {
        beforeEach(async () => {
            const spatial: SpatialKey = { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 };
            const temporal: TemporalKey = { saga: 1, book: 1, chapter: 1, page: 1 };

            await lattice.upsertVoxel({
                spatial,
                temporal,
                faces: {
                    'x+': 'Combat encounter',
                    'x-': '',
                    'y+': [[1.0, 0.0, 0.0]], // Combat-related embedding
                    'y-': ['combat'],
                    'z+': [],
                    'z-': { loreKey: 'COMBAT', landmarks: [] },
                },
            });

            await lattice.upsertVoxel({
                spatial: { ...spatial, r: 2 },
                temporal,
                faces: {
                    'x+': 'Exploration scene',
                    'x-': '',
                    'y+': [[0.0, 1.0, 0.0]], // Exploration-related embedding
                    'y-': ['exploration'],
                    'z+': [],
                    'z-': { loreKey: 'EXPLORE', landmarks: [] },
                },
            });
        });

        it('should find semantically similar voxels via embeddings', async () => {
            const result = await lattice.searchEmbeddings({
                queryEmbedding: [0.9, 0.1, 0.0], // Similar to combat
                limit: 10,
            });

            expect(result.matches.length).toBeGreaterThan(0);
            expect(result.matches[0].item.spatial.r).toBe(1); // Combat voxel
            expect(result.matches[0].score).toBeGreaterThan(0.8); // High similarity
        });

        it('should rank by cosine similarity', async () => {
            const result = await lattice.searchEmbeddings({
                queryEmbedding: [0.5, 0.5, 0.0],
                limit: 10,
            });

            expect(result.matches.length).toBe(2);
            // Both should have similar scores but sorted by descending
            expect(result.matches[0].score).toBeGreaterThanOrEqual(result.matches[1].score);
        });
    });

    describe('Spatial Expansion (Neighbor Discovery)', () => {
        beforeEach(async () => {
            const temporal: TemporalKey = { saga: 1, book: 1, chapter: 1, page: 1 };
            const base: SpatialKey = { g: 1, s: 1, o: 1, c: 2, ct: 3, r: 4 };

            // Create center voxel
            await lattice.upsertVoxel({
                spatial: base,
                temporal,
                faces: {
                    'x+': 'Center',
                    'x-': '',
                    'y+': [],
                    'y-': ['center'],
                    'z+': [],
                    'z-': { loreKey: 'CENTER', landmarks: [] },
                },
            });

            // Create 2D4 neighbors (ct±1, r±1)
            await lattice.upsertVoxel({
                spatial: { ...base, r: 5 },
                temporal,
                faces: {
                    'x+': 'R+1',
                    'x-': '',
                    'y+': [],
                    'y-': ['neighbor'],
                    'z+': [],
                    'z-': { loreKey: 'R_PLUS', landmarks: [] },
                },
            });

            await lattice.upsertVoxel({
                spatial: { ...base, ct: 4 },
                temporal,
                faces: {
                    'x+': 'CT+1',
                    'x-': '',
                    'y+': [],
                    'y-': ['neighbor'],
                    'z+': [],
                    'z-': { loreKey: 'CT_PLUS', landmarks: [] },
                },
            });
        });

        it('should expand with 2D4 neighbors (1 hop)', async () => {
            const result = await lattice.expandSpatial({
                entry: {
                    spatial: { g: 1, s: 1, o: 1, c: 2, ct: 3, r: 4 },
                    temporal: { saga: 1, book: 1, chapter: 1, page: 1 },
                },
                expansion: { mode: '2D4', hops: 1 },
            });

            // Should include center + 2D4 neighbors
            expect(result.voxels.length).toBeGreaterThanOrEqual(1);
        });

        it('should expand with 3D6 neighbors', async () => {
            const base: SpatialKey = { g: 1, s: 1, o: 1, c: 2, ct: 3, r: 4 };
            const temporal: TemporalKey = { saga: 1, book: 1, chapter: 1, page: 1 };

            // Add c-axis neighbor
            await lattice.upsertVoxel({
                spatial: { ...base, c: 3 },
                temporal,
                faces: {
                    'x+': 'C+1',
                    'x-': '',
                    'y+': [],
                    'y-': [],
                    'z+': [],
                    'z-': { loreKey: 'C_PLUS', landmarks: [] },
                },
            });

            const result = await lattice.expandSpatial({
                entry: { spatial: base, temporal },
                expansion: { mode: '3D6', hops: 1 },
            });

            // Should include 3D neighbors
            expect(result.voxels.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Temporal Expansion', () => {
        beforeEach(async () => {
            const spatial: SpatialKey = { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 };

            for (let page = 5; page <= 15; page++) {
                await lattice.upsertVoxel({
                    spatial,
                    temporal: { saga: 1, book: 1, chapter: 3, page },
                    faces: {
                        'x+': `Page ${page}`,
                        'x-': '',
                        'y+': [],
                        'y-': [],
                        'z+': [],
                        'z-': { loreKey: 'STORY', landmarks: [] },
                    },
                });
            }
        });

        it('should expand plus/minus pages', async () => {
            const result = await lattice.expandTemporal({
                entry: {
                    spatial: { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 },
                    temporal: { saga: 1, book: 1, chapter: 3, page: 10 },
                },
                expansion: { mode: 'plusMinusPages', n: 2 },
            });

            expect(result.voxels.length).toBe(5); // Pages 8, 9, 10, 11, 12
        });

        it('should expand to entire chapter', async () => {
            const result = await lattice.expandTemporal({
                entry: {
                    spatial: { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 },
                    temporal: { saga: 1, book: 1, chapter: 3, page: 10 },
                },
                expansion: { mode: 'chapter', saga: 1, book: 1, chapter: 3 },
            });

            expect(result.voxels.length).toBe(11); // All pages 5-15
        });
    });

    describe('Latest/First at Location', () => {
        beforeEach(async () => {
            const spatial: SpatialKey = { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 };

            await lattice.upsertVoxel({
                spatial,
                temporal: { saga: 1, book: 1, chapter: 1, page: 1 },
                faces: {
                    'x+': 'First visit',
                    'x-': '',
                    'y+': [],
                    'y-': [],
                    'z+': [],
                    'z-': { loreKey: 'FIRST', landmarks: [] },
                },
            });

            await lattice.upsertVoxel({
                spatial,
                temporal: { saga: 1, book: 1, chapter: 3, page: 5 },
                faces: {
                    'x+': 'Second visit',
                    'x-': '',
                    'y+': [],
                    'y-': [],
                    'z+': [],
                    'z-': { loreKey: 'SECOND', landmarks: [] },
                },
            });

            await lattice.upsertVoxel({
                spatial,
                temporal: { saga: 1, book: 2, chapter: 1, page: 1 },
                faces: {
                    'x+': 'Latest visit',
                    'x-': '',
                    'y+': [],
                    'y-': [],
                    'z+': [],
                    'z-': { loreKey: 'LATEST', landmarks: [] },
                },
            });
        });

        it('should retrieve latest voxel at location', async () => {
            const result = await lattice.latestAtLocation({
                spatial: { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 },
            });

            expect(result.voxels.length).toBe(1);
            expect(result.voxels[0].faces['x+']).toBe('Latest visit');
        });

        it('should retrieve first voxel at location', async () => {
            const result = await lattice.firstAtLocation({
                spatial: { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 },
            });

            expect(result.voxels.length).toBe(1);
            expect(result.voxels[0].faces['x+']).toBe('First visit');
        });
    });

    describe('Join and Rerank', () => {
        beforeEach(async () => {
            const spatial: SpatialKey = { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 };
            const temporal: TemporalKey = { saga: 1, book: 1, chapter: 1, page: 1 };

            await lattice.upsertVoxel({
                spatial,
                temporal,
                faces: {
                    'x+': 'Combat with Lyra',
                    'x-': '',
                    'y+': [[1.0, 0.0, 0.0]], // Combat embedding
                    'y-': ['combat', 'boss'],
                    'z+': [{ id: 'NPC_LYRA', name: 'Lyra', class: 'Guide' }],
                    'z-': { loreKey: 'COMBAT', landmarks: [] },
                },
            });
        });

        it('should boost by tags', async () => {
            const seed = [
                {
                    item: {
                        spatial: { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 },
                        temporal: { saga: 1, book: 1, chapter: 1, page: 1 },
                    },
                    score: 1.0,
                },
            ];

            const result = await lattice.joinAndRerank({
                seed,
                boostTags: ['boss'],
            });

            expect(result.matches.length).toBe(1);
            expect(result.matches[0].score).toBe(1.25); // 1.0 + 0.25 for tag boost
        });

        it('should filter by required entities', async () => {
            const seed = [
                {
                    item: {
                        spatial: { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 },
                        temporal: { saga: 1, book: 1, chapter: 1, page: 1 },
                    },
                    score: 1.0,
                },
            ];

            const result = await lattice.joinAndRerank({
                seed,
                requireEntities: ['lyra'],
            });

            expect(result.matches.length).toBe(1);
        });

        it('should exclude voxels without required entities', async () => {
            const seed = [
                {
                    item: {
                        spatial: { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 },
                        temporal: { saga: 1, book: 1, chapter: 1, page: 1 },
                    },
                    score: 1.0,
                },
            ];

            const result = await lattice.joinAndRerank({
                seed,
                requireEntities: ['navbot'], // Entity not present
            });

            expect(result.matches.length).toBe(0);
        });
    });

    describe('Face Keyword Search', () => {
        beforeEach(async () => {
            const spatial: SpatialKey = { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 };
            const temporal: TemporalKey = { saga: 1, book: 1, chapter: 1, page: 1 };

            await lattice.upsertVoxel({
                spatial,
                temporal,
                faces: {
                    'x+': 'Player explores the terminal',
                    'x-': 'You discover ancient technology',
                    'y+': [],
                    'y-': ['tech', 'ancient'],
                    'z+': [{ id: 'NPC_VIZZY', name: 'Vizzy', class: 'Companion' }],
                    'z-': {
                        loreKey: 'LORE_TECH', landmarks: [
                            { id: 'LOC_TERM', name: 'Ancient Terminal', type: 'OBJECT', tags: ['relic'] },
                        ]
                    },
                },
            });
        });

        it('should search x+ face (player input)', async () => {
            const result = await lattice.searchFacesByKeyword({
                query: 'explores',
                faces: ['x+'],
            });

            expect(result.matches.length).toBe(1);
            expect(result.matches[0].score).toBe(1);
        });

        it('should search x- face (narration)', async () => {
            const result = await lattice.searchFacesByKeyword({
                query: 'technology',
                faces: ['x-'],
            });

            expect(result.matches.length).toBe(1);
        });

        it('should search y- face (tags)', async () => {
            const result = await lattice.searchFacesByKeyword({
                query: 'ancient',
                faces: ['y-'],
            });

            expect(result.matches.length).toBe(1);
        });

        it('should search z+ face (entities)', async () => {
            const result = await lattice.searchFacesByKeyword({
                query: 'vizzy',
                faces: ['z+'],
            });

            expect(result.matches.length).toBe(1);
        });

        it('should search z- face (lore and landmarks)', async () => {
            const result = await lattice.searchFacesByKeyword({
                query: 'ancient terminal',
                faces: ['z-'],
            });

            expect(result.matches.length).toBe(1);
        });

        it('should search multiple faces simultaneously', async () => {
            const result = await lattice.searchFacesByKeyword({
                query: 'ancient',
                faces: ['x-', 'y-', 'z-'],
            });

            expect(result.matches.length).toBe(1);
            expect(result.matches[0].score).toBeGreaterThanOrEqual(2); // Found in multiple faces
        });
    });
});
