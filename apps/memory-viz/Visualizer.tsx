// memory-viz/Visualizer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ThreeScene } from './ThreeScene';
import { CivSelection, MemoryVizRootProps, SectorMap, SectorMapCivilization, TopographySet, MemoryVoxel } from './types';
import { getStyles } from './styles';
import { CONFIG } from './config';
import { formatCivName, getCellAt, getCivById, getNodeAt, loadSectorMapByNames, parseWorldId } from './sectorMaps';
import { defaultMemoryClient } from './memoryClient';

const defaultApi = {
    directVoxelRead: (args: any) => defaultMemoryClient.readVoxel(args.spatial, args.temporal),
    readVoxel: (args: any) => defaultMemoryClient.readVoxel(args.spatial, args.temporal),
    latestAtLocation: (args: any) => defaultMemoryClient.latestAtLocation(args.spatial, args.scope),
    directSpatialSlice: (args: any) => defaultMemoryClient.directSpatialSlice(args.spatial, args.filter)
};

const HIERARCHY = [
    {
        name: "The_Core_Syndicate",
        subs: [
            { name: "Aura-507", items: ["S-11_Drill", "Sentinel_Dome", "The_Gamma_Hold", "The_Isotope_Garden", "The_Quartz_Furnace", "The_Whispering_Ion", "Xenon_Scar"] },
            { name: "The_Foundry_Core", items: ["Quiet_Refuel", "Smelters_Dusk", "Syncline", "The_Hearth_Forge", "The_Scavengers_Nest", "The_Torque_Belt", "The_Waste_Compactor"] },
            { name: "The_Regulators_Eye", items: ["Aegis-1", "Censors_Rock", "The_Compliance_Matrix", "The_Gilded_Cage", "The_Silent_Witness", "The_Zero-G_Court", "Vigilance_Platform-7"] }
        ]
    },
    {
        name: "The_Fading_Echo",
        subs: [
            { name: "Aethel-Prime", items: ["A-31_Reclaimer", "Echoes_Deep", "Iron_Fang", "Silent_Shroud", "The_Chronos_Nexus", "The_Frozen_Crypt", "Xylos-Prime"] },
            { name: "Cygnus_Rift-Delta", items: ["Ophidian_Scar", "Rust_Nebula", "Slipstream_Node", "Subjective_Island", "The_Chronal_Glacier", "The_Lag_Gate", "The_Void_Mirror"] },
            { name: "The_Shard_Verge", items: ["Axe_Head", "Nexus_Zero", "Quantum_Dust", "Rogues_Anchor", "The_Chronometer", "The_Glitch_Forge", "The_Quiet_Vault"] }
        ]
    },
    {
        name: "The_Void_Sea",
        subs: [
            { name: "Koreths_Veil", items: ["The_Anomaly_Bloom", "The_Crystal_Quarry", "The_Oracles_Pedestal", "The_Prophets_Eye", "The_Relic_Cache", "The_Shadow_Core", "The_Stillness"] },
            { name: "The_Great_Labyrinth", items: ["Chiral_Abyss", "Refugee_Veil", "The_Black_Star", "The_Maze_World", "The_Rift_Runner", "The_Scrambler", "The_Transit_Nexus"] },
            { name: "The_Whisper_Zone", items: ["Signal_Tomb", "Stasis_Shore", "The_Cold_Heart", "The_Comm_Null", "The_Ghost_Ship", "The_Mute_World", "The_Unspoken"] }
        ]
    }
];

type LayerInfo = {
    galaxyIndex: number;
    systemIndex: number;
    objectIndex: number;
    galaxyName: string;
    systemName: string;
    objectName: string;
};

type ActiveSector = {
    map: SectorMap;
    world: { g: number; s: number; o: number };
    civs: CivSelection[];
    civLookup: Record<string, SectorMapCivilization>;
};

type VoxelPanelData = {
    locationKey: string;
    temporalKey: string;
    faces: { label: string; value: string }[];
    coord: { x: number; y: number };
    cellType?: string;
    nodeId?: string;
};

const DEFAULT_CIVS: CivSelection[] = [
    { id: 'CIV_1', name: 'Civilization 1', index: 0 },
    { id: 'CIV_2', name: 'Civilization 2', index: 1 },
    { id: 'CIV_3', name: 'Civilization 3', index: 2 }
];

const buildSpatialKey = (world: ActiveSector['world'], civIndex: number, x: number, y: number) => {
    const civSegment = Math.max(1, civIndex + 1);
    return `g${world.g}.s${world.s}.o${world.o}.c${civSegment}.ct${x + 1}.r${y + 1}`;
};

const buildTemporalKey = (world: ActiveSector['world'], civIndex: number, pageIndex: number) => {
    const saga = Math.max(0, world.g - 1);
    const book = Math.max(0, world.s - 1);
    const chapter = Math.max(0, civIndex);
    return `s${saga}.b${book}.c${chapter}.p${pageIndex}`;
};

const buildVoxelFaces = (
    worldId: string,
    civId: string,
    civIndex: number,
    x: number,
    y: number,
    cellType: string | null,
    nodeId: string | null,
    nodeKind: string | null
) => {
    const typeLabel = cellType || 'UNCLASSIFIED';
    const nodeLabel = nodeId ? `${nodeId}${nodeKind ? ` (${nodeKind})` : ''}` : 'NONE';
    return [
        { label: 'X+ (InputFace)', value: `Ingress ${typeLabel}` },
        { label: 'X- (OutputFace)', value: `Egress ${nodeLabel}` },
        { label: 'Y+ (EmbeddingsFace)', value: `Embeddings seed ${worldId}:${civIndex}` },
        { label: 'Y- (TagsFace)', value: `Tags ${typeLabel}${nodeKind ? `, ${nodeKind}` : ''}` },
        { label: 'Z+ (EntitiesFace)', value: nodeId ? `Entity ${nodeId}` : 'Entities none' },
        { label: 'Z- (LoreKeyFace)', value: `${worldId}:${civId}:${x}.${y}` }
    ];
};

export default function MemoryVizRoot({
    embedded = false, initialSpatial, initialTemporal, onSelect, api = defaultApi
}: MemoryVizRootProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<ThreeScene | null>(null);
    const activeSectorRef = useRef<ActiveSector | null>(null);
    const loadTokenRef = useRef(0);
    const [tooltip, setTooltip] = useState({ x: 0, y: 0, text: '', show: false });
    const [panel, setPanel] = useState({ open: false, faceInfo: 'FACE: --', coords: '--' });
    const [selectedLayerName, setSelectedLayerName] = useState<string | null>(null);
    const [selectedLayerInfo, setSelectedLayerInfo] = useState<LayerInfo | null>(null);
    const [selectedCiv, setSelectedCiv] = useState<string | null>(null);
    const [selectedCivId, setSelectedCivId] = useState<string | null>(null);
    const [selectedVoxel, setSelectedVoxel] = useState<VoxelPanelData | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hoveredStackInfo, setHoveredStackInfo] = useState<any | null>(null);
    const [hoveredCivName, setHoveredCivName] = useState<string | null>(null);
    const [activeSector, setActiveSector] = useState<ActiveSector | null>(null);
    const [civOptions, setCivOptions] = useState<CivSelection[]>(DEFAULT_CIVS);
    const [layerLoadError, setLayerLoadError] = useState<string | null>(null);
    const [topography, setTopography] = useState<TopographySet | null>(null);
    const [fetchedVoxels, setFetchedVoxels] = useState<MemoryVoxel[]>([]);
    const [isLoadingVoxels, setIsLoadingVoxels] = useState(false);
    const topographyRef = useRef<TopographySet | null>(null);

    useEffect(() => {
        activeSectorRef.current = activeSector;
    }, [activeSector]);

    useEffect(() => {
        topographyRef.current = topography;
    }, [topography]);

    useEffect(() => {
        if (selectedCivId) applyCivGridColors(selectedCivId);
    }, [selectedCivId, topography]);

    const applyCivGridColors = (civId: string | null) => {
        const scene = sceneRef.current;
        const sector = activeSectorRef.current;
        if (!scene || !sector || !civId) return;
        const civ = getCivById(sector.map.civilizations, civId);
        if (!civ) return;
        const topo = topographyRef.current;
        const topoCiv = topo?.civs.find((entry) => entry.civId === civId);
        const typePalette: Record<string, number> = {
            A: 0x6edc84,
            B: 0x3ba46c,
            C: 0x4f7edb,
            D: 0x9a7a52
        };
        const gradient = [
            { stop: 0.0, color: 0x102b3f },
            { stop: 0.25, color: 0x1f6f5c },
            { stop: 0.5, color: 0x6ba368 },
            { stop: 0.75, color: 0xbfa36c },
            { stop: 1.0, color: 0xe3e2d3 }
        ];
        if (topoCiv && topoCiv.heightmap.length) {
            scene.setGridHeightColors?.(topoCiv.heightmap, gradient, 0x22313f);
        } else {
            scene.setGridCellColors?.(civ.grid.cells, typePalette, 0x2b2b2b);
        }
    };

    useEffect(() => {
        const active = activeSector;
        if (!active) {
            setFetchedVoxels([]);
            return;
        }

        // Prefix for the entire Object/Planet
        const prefix = { g: active.world.g, s: active.world.s, o: active.world.o };

        setIsLoadingVoxels(true);
        defaultApi.directSpatialSlice({ spatial: prefix })
            .then((response: any) => {
                const voxels = response?.voxels || response; // Handle both wrapper and direct array
                if (Array.isArray(voxels)) {
                    setFetchedVoxels(voxels);
                } else {
                    console.warn("[Visualizer] Invalid voxels response:", response);
                    setFetchedVoxels([]);
                }
                setIsLoadingVoxels(false);
            })
            .catch(err => {
                console.error(err);
                setFetchedVoxels([]);
                setIsLoadingVoxels(false);
            });
    }, [activeSector]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        if (selectedCivId && activeSector) {
            const civ = getCivById(activeSector.map.civilizations, selectedCivId);
            if (civ) {
                const civIndex = civ.index + 1;
                const relevant = fetchedVoxels.filter(v =>
                    v.spatial.g === activeSector.world.g &&
                    v.spatial.s === activeSector.world.s &&
                    v.spatial.o === activeSector.world.o &&
                    v.spatial.c === civIndex
                );
                const indices = relevant.map(v => (v.spatial.r - 1) * CONFIG.gridResolution + (v.spatial.ct - 1));
                scene.setVoxelHighlights(indices);
                applyCivGridColors(selectedCivId);
            }
        } else {
            scene.setVoxelHighlights([]);
        }
    }, [selectedCivId, fetchedVoxels]);

    useEffect(() => {
        if (!containerRef.current) return;

        // React 18 Fix: Explicitly clear container to prevent double canvas on re-mount
        while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
        }

        const scene = new ThreeScene(containerRef.current, initialSpatial, initialTemporal);
        sceneRef.current = scene;

        scene.onTooltipUpdate = (x, y, text, show) => setTooltip({ x, y, text, show });
        scene.onPanelUpdate = (open, faceInfo, coords) => {
            setPanel(p => ({ open, faceInfo: faceInfo || p.faceInfo, coords: coords || p.coords }));
            if (!open) {
                loadTokenRef.current += 1;
                setSelectedLayerName(null);
                setSelectedLayerInfo(null);
                setSelectedCiv(null);
                setSelectedCivId(null);
                setSelectedVoxel(null);
                setHoveredCivName(null);
                setLayerLoadError(null);
                activeSectorRef.current = null;
                setActiveSector(null);
                setCivOptions(DEFAULT_CIVS);
                setTopography(null);
                scene.setHeroCivs(DEFAULT_CIVS);
            }
        };
        scene.onExpand = (expanded) => {
            setIsExpanded(expanded);
            if (expanded) setPanel(p => ({ ...p, open: true }));
            else if (!selectedLayerName) setPanel(p => ({ ...p, open: false }));
            setHoveredStackInfo(null);
        };
        scene.onStackHover = (cubeIdx, stackIdx, layerIdx, active) => {
            if (!active) {
                setHoveredStackInfo(null);
                return;
            }
            if (HIERARCHY[cubeIdx]) {
                const group = HIERARCHY[cubeIdx];
                if (group.subs[stackIdx]) {
                    const sub = group.subs[stackIdx];
                    const item = sub.items[layerIdx];
                    setHoveredStackInfo({
                        group: group.name,
                        sub: sub.name,
                        item: item || `Layer ${layerIdx}`
                    });
                }
            }
        };
        scene.onLayerSelect = (indices) => {
            if (indices) {
                const galaxy = HIERARCHY[indices.cube];
                const system = galaxy?.subs[indices.stack];
                const objectName = system?.items[indices.layer];
                const layerName = objectName || "Unknown Layer";
                const layerInfo: LayerInfo = {
                    galaxyIndex: indices.cube,
                    systemIndex: indices.stack,
                    objectIndex: indices.layer,
                    galaxyName: galaxy?.name || "Unknown Galaxy",
                    systemName: system?.name || "Unknown System",
                    objectName: objectName || "Unknown Layer"
                };
                setSelectedLayerInfo(layerInfo);
                setSelectedLayerName(layerName);
                setPanel(p => ({ ...p, open: true }));
                setSelectedCiv(null);
                setSelectedCivId(null);
                setSelectedVoxel(null);
                setHoveredCivName(null);
                setLayerLoadError(null);
                activeSectorRef.current = null;
                setActiveSector(null);
                setCivOptions(DEFAULT_CIVS);
                setTopography(null);
                scene.setHeroCivs(DEFAULT_CIVS);

                if (galaxy && system && objectName) {
                    const token = ++loadTokenRef.current;
                    loadSectorMapByNames(galaxy.name, system.name, objectName)
                        .then((map) => {
                            if (token !== loadTokenRef.current) return;
                            const parsed = parseWorldId(map.worldId);
                            const fallbackWorld = {
                                g: indices.cube + 1,
                                s: indices.stack + 1,
                                o: indices.layer + 1
                            };
                            const world = parsed || fallbackWorld;
                            const civs = map.civilizations
                                .slice()
                                .sort((a, b) => a.index - b.index)
                                .map((civ) => ({
                                    id: civ.civId,
                                    name: formatCivName(civ.civId, civ.index),
                                    index: civ.index
                                }));
                            const resolvedCivs = civs.length >= 3 ? civs : DEFAULT_CIVS;
                            const civLookup: Record<string, SectorMapCivilization> = {};
                            map.civilizations.forEach((civ) => {
                                civLookup[civ.civId] = civ;
                            });
                            const sector = { map, world, civs: resolvedCivs, civLookup };
                            activeSectorRef.current = sector;
                            setActiveSector(sector);
                            setCivOptions(resolvedCivs);
                            scene.setHeroCivs(resolvedCivs);
                            const query = `galaxy=${encodeURIComponent(layerInfo.galaxyName)}&system=${encodeURIComponent(layerInfo.systemName)}&object=${encodeURIComponent(layerInfo.objectName)}`;
                            fetch(`http://localhost:4000/api/topography?${query}`)
                                .then((res) => (res.ok ? res.json() : null))
                                .then((data: TopographySet | null) => {
                                    if (token !== loadTokenRef.current) return;
                                    setTopography(data);
                                })
                                .catch((err) => {
                                    if (token !== loadTokenRef.current) return;
                                    console.error(err);
                                    setTopography(null);
                                });
                        })
                        .catch((err: Error) => {
                            if (token !== loadTokenRef.current) return;
                            console.error(err);
                            setLayerLoadError(err.message);
                            activeSectorRef.current = null;
                            setActiveSector(null);
                            setCivOptions(DEFAULT_CIVS);
                            setTopography(null);
                            scene.setHeroCivs(DEFAULT_CIVS);
                        });
                }
            } else {
                loadTokenRef.current += 1;
                setSelectedLayerName(null);
                setSelectedLayerInfo(null);
                setPanel(p => ({ ...p, open: isExpanded }));
                setSelectedCiv(null);
                setSelectedCivId(null);
                setSelectedVoxel(null);
                setHoveredCivName(null);
                setLayerLoadError(null);
                activeSectorRef.current = null;
                setActiveSector(null);
                setCivOptions(DEFAULT_CIVS);
                setTopography(null);
                scene.setHeroCivs(DEFAULT_CIVS);
            }
        };
        scene.onCivSelect = (civ) => {
            setSelectedCiv(civ ? civ.name : null);
            setSelectedCivId(civ ? civ.id : null);
            if (!civ) setSelectedVoxel(null);
            if (civ) applyCivGridColors(civ.id);
        };
        scene.onCivHover = (civName) => {
            setHoveredCivName(civName);
        };
        scene.onVoxelSelect = (index, civId) => {
            if (index !== null) {
                const active = activeSectorRef.current;
                if (!active) {
                    setSelectedVoxel(null);
                    return;
                }
                const civ = getCivById(active.map.civilizations, civId);
                if (!civ) {
                    setSelectedVoxel(null);
                    return;
                }
                const res = CONFIG.gridResolution;
                const x = index % res;
                const y = Math.floor(index / res);
                const cell = getCellAt(civ.grid.cells, x, y);
                const node = getNodeAt(civ.nodes, x, y);
                const locationKey = buildSpatialKey(active.world, civ.index, x, y);
                const temporalKey = buildTemporalKey(active.world, civ.index, index);
                const faces = buildVoxelFaces(
                    active.map.worldId,
                    civ.civId,
                    civ.index,
                    x,
                    y,
                    cell?.type ?? null,
                    node?.id ?? null,
                    node?.kind ?? null
                );
                setSelectedVoxel({
                    locationKey,
                    temporalKey,
                    faces,
                    coord: { x, y },
                    cellType: cell?.type,
                    nodeId: node?.id
                });
                if (selectedLayerInfo) {
                    const cityQuery = `galaxy=${encodeURIComponent(selectedLayerInfo.galaxyName)}&system=${encodeURIComponent(selectedLayerInfo.systemName)}&object=${encodeURIComponent(selectedLayerInfo.objectName)}&civ=${civ.index + 1}&ct=${x + 1}`;
                    fetch(`http://localhost:4000/api/city-map?${cityQuery}`).catch(() => undefined);
                }
            } else {
                setSelectedVoxel(null);
            }
        };
        scene.gridHoverLabel = (index, civId) => {
            const active = activeSectorRef.current;
            if (!active) return null;
            const civ = getCivById(active.map.civilizations, civId);
            if (!civ) return null;
            const res = CONFIG.gridResolution;
            const x = index % res;
            const y = Math.floor(index / res);
            const cell = getCellAt(civ.grid.cells, x, y);
            const node = getNodeAt(civ.nodes, x, y);
            const type = cell?.type ?? '--';
            const nodeLabel = node ? `${node.id}${node.kind ? `:${node.kind}` : ''}` : 'none';
            return `x:${x} y:${y} type:${type} node:${nodeLabel}`;
        };
        scene.onSelectCallback = (payload) => {
            if (onSelect) onSelect(payload);
            if (api) api.readVoxel({ spatial: payload.spatial, temporal: payload.temporal }).catch(e => console.error(e));
        };
        return () => { scene.dispose(); sceneRef.current = null; };
    }, [initialSpatial, initialTemporal]);

    const handleBackCiv = () => {
        sceneRef.current?.exitCivilization();
    };

    const handleBackVoxel = () => {
        sceneRef.current?.exitVoxelMode();
    };

    const showExpandedPanel = isExpanded && !selectedLayerName;
    const showLayerPanel = !!selectedLayerName && !selectedCiv;
    const showCivPanel = !!selectedCiv && !selectedVoxel;
    const showVoxelPanel = !!selectedVoxel;
    const showDefaultPanel = !showExpandedPanel && !showLayerPanel && !showCivPanel && !showVoxelPanel;

    return (
        <div className="visualizer-container">
            <style>{getStyles(embedded)}</style>
            <div ref={containerRef} id="canvas-container" />
            <div className="tooltip" style={{ display: tooltip.show ? 'block' : 'none', left: tooltip.x, top: tooltip.y }}>{tooltip.text}</div>

            <div className={`side-panel ${panel.open ? 'open' : ''}`}>

                {/* Level 0: Expanded Overview */}
                {showExpandedPanel && (
                    <div className="glitch-container">
                        <div className="glitch-title" data-text="EIDEUS DAWN">EIDEUS DAWN</div>
                        {hoveredStackInfo ? (
                            <div className="detail-view">
                                <div className="hover-info">
                                    <div className="hover-path">{hoveredStackInfo.group} &gt; {hoveredStackInfo.sub}</div>
                                    <div className="hover-label">SELECTED ENTITY</div>
                                    <div className="hover-value">{hoveredStackInfo.item}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="face-info" style={{ marginTop: '20px', opacity: 0.5 }}>HOVER OVER LAYERS TO DECRYPT</div>
                        )}
                    </div>
                )}

                {/* Level 1: Layer Selected, Viewing Civilizations */}
                {showLayerPanel && (
                    <>
                        <h2>{selectedLayerName}</h2>
                        <div className="face-info">SELECT A CIVILIZATION</div>
                        {layerLoadError && (
                            <div className="face-info" style={{ color: '#ff6b6b' }}>
                                DATA LINK ERROR: {layerLoadError}
                            </div>
                        )}
                        <div className="list-container">
                            {/* Static list just for visuals, actual interaction is on 3D canvas */}
                            {civOptions.map((civ) => (
                                <div key={civ.id} className={`list-item ${hoveredCivName === civ.name ? 'hovered' : ''}`} style={hoveredCivName === civ.name ? { borderColor: '#00ffcc', color: '#fff', background: 'rgba(0, 255, 204, 0.05)' } : {}}>
                                    {civ.name}
                                </div>
                            ))}
                        </div>
                        {hoveredCivName && (
                            <div className="hover-info" style={{ marginTop: '20px' }}>
                                <div className="hover-label">DETECTED SIGNAL</div>
                                <div className="hover-value">{hoveredCivName}</div>
                            </div>
                        )}
                    </>
                )}

                {/* Level 2: Civilization Selected, Viewing Grid */}
                {showCivPanel && (
                    <>
                        <h2>{selectedCiv}</h2>
                        <button className="back-btn" onClick={handleBackCiv}>← BACK TO LAYERS</button>
                        <div className="face-info">COGNITIVE INDEX</div>

                        <div className="list-container custom-scrollbar" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                            {isLoadingVoxels ? (
                                <div className="face-info">DECRYPTING MEMORY STREAM...</div>
                            ) : fetchedVoxels.length === 0 ? (
                                <div className="face-info" style={{ opacity: 0.3 }}>NO MEMORIES RECORDED AT THIS SCALE</div>
                            ) : (
                                fetchedVoxels
                                    .filter(v => {
                                        const civ = activeSector && getCivById(activeSector.map.civilizations, selectedCivId);
                                        return civ && v.spatial.c === (civ.index + 1);
                                    })
                                    .sort((a, b) => (a.createdAtUnixMs || 0) - (b.createdAtUnixMs || 0))
                                    .map((v, i) => (
                                        <div
                                            key={v.id || i}
                                            className={`list-item ${selectedVoxel?.temporalKey === `s${v.temporal.saga}.b${v.temporal.book}.c${v.temporal.chapter}.p${v.temporal.page}` ? 'active' : ''}`}
                                            onClick={() => {
                                                const index = (v.spatial.r - 1) * CONFIG.gridResolution + (v.spatial.ct - 1);
                                                sceneRef.current?.selectVoxel(index);
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', marginBottom: '4px' }}>
                                                <span>T-{v.temporal.page}</span>
                                                <span>CT{v.spatial.ct}.R{v.spatial.r}</span>
                                            </div>
                                            <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                {v.faces?.['z-'] || 'CORRUPTED_LoreKey'}
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>

                        <div className="face-info">GRID ANALYSIS</div>
                        <p style={{ color: '#888', fontSize: '11px', lineHeight: '1.4' }}>
                            Interactive mapping of spatialized memory units. Highlights indicate active cognitive voxels.
                        </p>
                    </>
                )}

                {/* Level 3: Voxel Detail */}
                {showVoxelPanel && selectedVoxel && (
                    <div className="detail-view">
                        <h2>{selectedCiv}</h2>
                        <button className="back-btn" onClick={handleBackVoxel}>← BACK TO GRID</button>

                        <div className="info-block">
                            <div className="label">LOCATION KEY</div>
                            <div className="value monospace">{selectedVoxel.locationKey}</div>
                        </div>

                        <div className="info-block">
                            <div className="label">TEMPORAL KEY</div>
                            <div className="value monospace">{selectedVoxel.temporalKey}</div>
                        </div>

                        <div className="info-block">
                            <div className="label">GRID COORD</div>
                            <div className="value monospace">
                                x{selectedVoxel.coord.x} y{selectedVoxel.coord.y}
                                {selectedVoxel.cellType ? ` | ${selectedVoxel.cellType}` : ''}
                                {selectedVoxel.nodeId ? ` | ${selectedVoxel.nodeId}` : ''}
                            </div>
                        </div>

                        <div className="direction-grid">
                            {selectedVoxel.faces.map((face) => (
                                <div key={face.label} className="direction-box">
                                    <span className="direction-label">{face.label}</span>
                                    <div className="direction-value">{face.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {showDefaultPanel && (
                    <>
                        <h2>Voxel Analysis</h2>
                        <div className="face-info">{panel.faceInfo}</div>
                        <div className="panel-content">
                            <p>COORDINATE: <span>{panel.coords}</span></p>
                            <p>INTEGRITY: <span>98.4%</span></p>
                            <div className="data-graph"></div>
                            <div className="data-graph" style={{ width: '70%' }}></div>
                            <div className="data-graph" style={{ width: '40%' }}></div>
                        </div>
                    </>
                )}
            </div>

            <div className="ui-overlay" style={{ opacity: panel.open ? 0 : 1 }}>
                <div className="button-row">
                    <button className="expand-btn" onClick={() => sceneRef.current?.toggleExpand()}>
                        {isExpanded ? 'COLLAPSE LAYERS' : 'EXPAND LAYERS'}
                    </button>
                </div>
            </div>
        </div>
    );
}