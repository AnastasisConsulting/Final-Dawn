import React, { useEffect, useRef, useState } from 'react';
import { ThreeScene } from './ThreeScene';
import { MemoryVizRootProps } from './types';
import { getStyles } from './styles';

const defaultApi = {
    directVoxelRead: async () => ({}),
    readVoxel: async () => ({}),
    latestAtLocation: async () => ({}),
    directSpatialSlice: async () => ({})
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

// Generate specific item data for a selected voxel (Memory Node)
const generateVoxelData = (civId: string, index: number) => {
    return {
        id: index,
        label: `Voxel Node ${index}`,
        locationKey: `MICRO.G1.S1.C${civId}.V${index}`,
        temporalKeys: [
            `s2.b1.c1.p${1200 + index * 10}`,
            `s2.b1.c2.p${1400 + index * 12}`,
            `s2.b2.c1.p${2100 + index * 5}`
        ],
        directions: {
            zPos: "Next Temporal Frame", zNeg: "Prev Temporal Frame",
            yPos: "Civic Context", yNeg: "Local Sentiment",
            xPos: "Adjacent Node R", xNeg: "Adjacent Node L"
        }
    };
};

export default function MemoryVizRoot({
    embedded = false, initialSpatial, initialTemporal, onSelect,
    hierarchyData, api = defaultApi
}: MemoryVizRootProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<ThreeScene | null>(null);

    const macro = hierarchyData?.macro || HIERARCHY;
    const micro = hierarchyData?.micro;

    const [tooltip, setTooltip] = useState({ x: 0, y: 0, text: '', show: false });
    const [panel, setPanel] = useState({ open: false, faceInfo: 'FACE: --', coords: '--' });
    const [selectedLayerName, setSelectedLayerName] = useState<string | null>(null);
    const [selectedCiv, setSelectedCiv] = useState<any | null>(null);
    const [selectedCity, setSelectedCity] = useState<any | null>(null);
    const [selectedVoxel, setSelectedVoxel] = useState<any | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hoveredStackInfo, setHoveredStackInfo] = useState<any | null>(null);
    const [hoveredCivName, setHoveredCivName] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const scene = new ThreeScene(containerRef.current, initialSpatial, initialTemporal);
        sceneRef.current = scene;
        scene.onTooltipUpdate = (x, y, text, show) => setTooltip({ x, y, text, show });
        scene.onPanelUpdate = (open, faceInfo, coords) => {
            setPanel(p => ({ open, faceInfo: faceInfo || p.faceInfo, coords: coords || p.coords }));
            if (!open) {
                setSelectedLayerName(null);
                setSelectedCiv(null);
                setSelectedCity(null);
                setSelectedVoxel(null);
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
            if (macro[cubeIdx]) {
                const group = macro[cubeIdx];
                if (group.subs[stackIdx]) {
                    const sub = group.subs[stackIdx];
                    const item = sub.items[layerIdx];
                    setHoveredStackInfo({
                        galaxy: group.name,
                        starSystem: sub.name,
                        planet: item || `Planet ${layerIdx}`
                    });
                }
            }
        };
        scene.onLayerSelect = (indices) => {
            if (indices) {
                let name = "Unknown Planet";
                if (macro[indices.cube]?.subs[indices.stack]?.items[indices.layer]) {
                    name = macro[indices.cube].subs[indices.stack].items[indices.layer];
                }
                setSelectedLayerName(name);
                setPanel(p => ({ ...p, open: true }));
            } else {
                setSelectedLayerName(null);
                setPanel(p => ({ ...p, open: isExpanded }));
            }
            setSelectedCiv(null);
            setSelectedCity(null);
            setSelectedVoxel(null);
        };
        scene.onCivSelect = (civName) => {
            if (civName && micro) {
                const found = micro.civilizations.find(c => c.name === civName);
                setSelectedCiv(found || { name: civName, cities: [] });
            } else if (civName) {
                setSelectedCiv({ name: civName, cities: [] });
            } else {
                setSelectedCiv(null);
            }
            setSelectedCity(null);
            setSelectedVoxel(null);
        };
        scene.onCivHover = (civName) => {
            setHoveredCivName(civName);
        };
        scene.onVoxelSelect = (index, civId) => {
            if (index !== null) {
                if (micro && selectedCiv) {
                    const cityIdx = Math.floor(index / 7);
                    const regIdx = index % 7;

                    const city = selectedCiv.cities[cityIdx];
                    const region = city?.regions[regIdx];

                    if (city && region) {
                        setSelectedVoxel({
                            id: index,
                            label: region,
                            locationKey: `CITY:${city.name} REG:${region}`,
                            temporalKeys: [
                                `s1.b1.c1.p100`, `s1.b1.c2.p200`, `s1.b1.c3.p300`
                            ],
                            directions: {
                                zPos: "Temporal Shift +", zNeg: "Temporal Shift -",
                                yPos: "Civic Core", yNeg: "Local Margin",
                                xPos: "Lateral A", xNeg: "Lateral B"
                            }
                        });
                    } else {
                        setSelectedVoxel(generateVoxelData(civId, index));
                    }
                } else {
                    setSelectedVoxel(generateVoxelData(civId, index));
                }
            } else {
                setSelectedVoxel(null);
            }
        };
        scene.onSelectCallback = (payload) => {
            if (onSelect) onSelect(payload);
            if (api) api.readVoxel({ spatial: payload.spatial, temporal: payload.temporal }).catch(e => console.error(e));
        };
        return () => { scene.dispose(); sceneRef.current = null; };
    }, [initialSpatial, initialTemporal, macro, micro, selectedCiv, selectedLayerName]);

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
                                    <div className="hover-path">{hoveredStackInfo.galaxy} &gt; {hoveredStackInfo.starSystem}</div>
                                    <div className="hover-label">PLANETARY OBJECT</div>
                                    <div className="hover-value">{hoveredStackInfo.planet}</div>
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
                        <div className="panel-header">
                            <div className="label">PLANETARY OBJECT</div>
                            <h2>{selectedLayerName}</h2>
                        </div>
                        <div className="face-info">SELECT A CIVILIZATION</div>
                        <div className="list-container">
                            {(micro?.civilizations.map(c => c.name) || ['Civilization 1', 'Civilization 2', 'Civilization 3']).map(civ => (
                                <div key={civ} className={`list-item ${hoveredCivName === civ ? 'hovered' : ''}`} style={hoveredCivName === civ ? { borderColor: '#00ffcc', color: '#fff', background: 'rgba(0, 255, 204, 0.05)' } : {}}>
                                    {civ}
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

                {/* Level 2: Civilization Selected, Viewing Grid (Cities/Regions) */}
                {showCivPanel && (
                    <>
                        <div className="panel-header">
                            <div className="label">GLOBAL CIVILIZATION</div>
                            <h2>{selectedCiv.name}</h2>
                        </div>
                        <button className="back-btn" onClick={handleBackCiv}>← BACK TO LAYERS</button>
                        <div className="face-info">CIVIC GRID ANALYSIS</div>
                        <div className="info-block">
                            <div className="label">DETECTED CITIES</div>
                            <div className="value">{selectedCiv.cities?.length || 3} CORES ONLINE</div>
                        </div>
                        <p style={{ color: '#888', fontSize: '12px', lineHeight: '1.5', marginTop: '10px' }}>
                            Each voxel in the 7x7 grid maps to 3 Cities, each with 7 Regions.
                        </p>
                        <div className="list-container" style={{ marginTop: '15px' }}>
                            {(selectedCiv.cities?.map((city: any) => city.name) || ['City 1', 'City 2', 'City 3']).map((name: string) => (
                                <div key={name} className="list-item" style={{ fontSize: '11px', padding: '6px 10px', opacity: 0.6 }}>
                                    {name}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Level 3: Voxel Detail (Region) */}
                {showVoxelPanel && selectedVoxel && (
                    <div className="detail-view">
                        <div className="panel-header">
                            <div className="label">REGIONAL SECTOR</div>
                            <h2>{selectedVoxel.label}</h2>
                        </div>
                        <button className="back-btn" onClick={handleBackVoxel}>← BACK TO GRID</button>

                        <div className="info-block">
                            <div className="label">LOCATION KEY</div>
                            <div className="value monospace">{selectedVoxel.locationKey}</div>
                        </div>

                        <div className="info-block">
                            <div className="label">MEMORY TIMELINE</div>
                            <div className="memory-list" style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {selectedVoxel.temporalKeys.map((key: string, i: number) => (
                                    <div key={key} className="memory-item" style={{ padding: '8px', border: '1px solid #333', fontSize: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                        <span style={{ color: '#00ffcc', marginRight: '10px' }}>[{i}]</span>
                                        <span className="monospace">{key}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="direction-grid" style={{ marginTop: '20px' }}>
                            {Object.entries(selectedVoxel.directions).map(([dir, val]: [string, any]) => (
                                <div key={dir} className="direction-box">
                                    <span className="direction-label">{dir}</span>
                                    <div className="direction-value">{val}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {showDefaultPanel && (
                    <>
                        <h2>MEM-LATTICE</h2>
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
                        {isExpanded ? 'COLLAPSE LATTICE' : 'EXPAND LATTICE'}
                    </button>
                </div>
            </div>
        </div>
    );
}