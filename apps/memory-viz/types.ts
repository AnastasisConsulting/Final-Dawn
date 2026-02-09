import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

export type SpatialKey = { g: number; s: number; o: number; c: number; ct: number; r: number };
export type TemporalKey = { saga: number; book: number; chapter: number; page: number };

export interface MemoryVizRootProps {
  embedded?: boolean;
  initialSpatial?: SpatialKey;
  initialTemporal?: TemporalKey;
  onSelect?: (payload: any) => void;
  api?: {
    directVoxelRead: (args: any) => Promise<any>;
    readVoxel: (args: any) => Promise<any>;
    latestAtLocation: (args: any) => Promise<any>;
    directSpatialSlice: (args: any) => Promise<any>;
  };
  hierarchyData?: any[];
}

export interface StackData {
  mesh: THREE.InstancedMesh;
  wireframe: THREE.InstancedMesh;
  color: number;
  axis: 'x' | 'y' | 'z';
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startRot: THREE.Euler;
  targetRot: THREE.Euler;
  initialMatrices?: THREE.Matrix4[];
}

export interface FocusedLayerState {
  stackIndex: number;
  instanceIndex: number;
  originalMatrix: THREE.Matrix4;
}

export interface HoverState {
  active: boolean;
  stackIndex: number;
  instanceIndex: number;
  scale: number;
}

export interface HeroLayerData {
  group: THREE.Group;
  mesh: THREE.Mesh;
  wireframe: THREE.LineSegments;
  cursor: THREE.Mesh;
  color: number;
  id: string;
  originalY: number;
  civName: string;
}

export interface SectorMapCell {
  x: number;
  y: number;
  type: string;
}

export interface SectorMapNode {
  x: number;
  y: number;
  id: string;
  kind: string;
  ownerCityId?: string;
}

export interface SectorMapCivilization {
  civId: string;
  index: number;
  grid: { cells: SectorMapCell[] };
  nodes: SectorMapNode[];
}

export interface SectorMap {
  worldId: string;
  civilizations: SectorMapCivilization[];
}

export type TopographySet = {
  version: string;
  worldId: string;
  gridSize: number;
  civs: { civId: string; seed: string; heightmap: number[] }[];
};

export interface MemoryVoxel {
  id: string;
  spatial: { g: number; s: number; o: number; c: number; ct: number; r: number };
  temporal: { saga: number; book: number; chapter: number; page: number };
  faces: Record<string, string>;
  createdAtUnixMs?: number;
}

export type CivSelection = {
  id: string;
  name: string;
  index: number;
};

export interface ISceneState {
  container: HTMLElement;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  controls: OrbitControls;

  contentGroup: THREE.Group;
  heroGroup: THREE.Group;
  voxelGroup: THREE.Group;
  interactiveGrid: THREE.InstancedMesh;

  heroLayers: HeroLayerData[];
  voxelMesh: THREE.Mesh;
  voxelWireframe: THREE.LineSegments;
  highlightMesh: THREE.Mesh;

  stacks: StackData[];
  voxelGrids: { mesh: THREE.Points; targetPos: THREE.Vector3 }[];
  voxelMaterials: THREE.MeshBasicMaterial[];
  wireframeMaterials: THREE.MeshBasicMaterial[];
  fillMaterials: THREE.MeshBasicMaterial[];

  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  dummyObj: THREE.Object3D;
  tempMatrix: THREE.Matrix4;

  currentHover: HoverState;
  focusedState: FocusedLayerState | null;
  suspendedFocusedState: { stackIndex: number; instanceIndex: number } | null;

  isVoxelFocused: boolean;
  isClosingHero: boolean;
  isPanelOpen: boolean;
  isClosingToVoxel: boolean;
  selectedLayerId: string | null;
  selectedCivId: string | null;
  selectedVoxelIndex: number | null;

  spreadFactor: number;
  targetSpread: number | null;
  opacityMultiplier: number;

  heroAnimProgress: number;
  heroAnimStartPos: THREE.Vector3;
  heroAnimTargetPos: THREE.Vector3;
  heroAnimStartRot: THREE.Quaternion;
  heroAnimTargetRot: THREE.Quaternion;

  voxelExtractionProgress: number;
  voxelStartPos: THREE.Vector3;
  voxelEndPos: THREE.Vector3;
  voxelTargetRot: THREE.Quaternion;

  camAnim: {
    active: boolean;
    startPos: THREE.Vector3;
    targetPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    targetTarget: THREE.Vector3;
    progress: number;
  };

  selectedFaceIndex: number;
  hoveredFaceIndex: number;

  currentSpatial: SpatialKey;
  currentTemporal: TemporalKey;

  startCameraAnim(pos: THREE.Vector3, target: THREE.Vector3): void;
  openHeroLayer(stackIndex: number, instanceId: number): void;
  closeHeroLayer(toVoxelFocus?: boolean): void;
  selectCivilization(layer: HeroLayerData): void;
  exitCivilization(): void;
  selectVoxel(index: number): void;
  exitVoxelMode(): void;
  activateVoxelFocus(point: THREE.Vector3): void;
  resetVoxelFocus(): void;
  selectFace(index: number, normal: THREE.Vector3): void;
  closePanel(): void;
  updateVoxelFaces(): void;
  toggleExpand(): void;
  onHeroAnimationComplete(): void;

  onTooltipUpdate?: (x: number, y: number, text: string, show: boolean) => void;
  onPanelUpdate?: (open: boolean, faceInfo: string, coords: string) => void;
  onSelectCallback?: (payload: any) => void;
  onLayerSelect?: (indices: { cube: number, stack: number, layer: number } | null) => void;
  onCivSelect?: (civ: { name: string; id: string } | null) => void;
  onCivHover?: (civName: string | null) => void;
  onVoxelSelect?: (index: number | null, layerId: string) => void;
  onStackHover?: (cubeIndex: number, stackIndex: number, layerIndex: number, active: boolean) => void;
  onExpand?: (expanded: boolean) => void;

  // Visualizer compatibility
  setVoxelHighlights(highlights: any[]): void;
  setHeroCivs(civs: any[]): void;
  setGridHeightColors(heights: number[], gradient: any[], baseColor: number): void;
  setGridCellColors(cells: any[], palette: any, defaultColor: number): void;
  gridHoverLabel?: (index: number, civId: string) => string;
}