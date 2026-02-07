import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

export type SpatialKey = { g: number; s: number; o: number; c: number; ct: number; r: number };
export type TemporalKey = { saga: number; book: number; chapter: number; page: number };

export interface EntityCard {
  id: string;
  name: string;
  class?: string;
  aliases?: string[];
  meta?: Record<string, unknown>;
}

export type VoxelFaces = {
  "x+": string; // summed input
  "x-": string; // summed output
  "y+": number[][]; // up to 7 embeddings
  "y-": string[]; // up to 7 tags
  "z+": EntityCard[]; // entities present
  "z-": string; // lorekey
};

export interface MemoryVoxel {
  id: string;
  spatial: SpatialKey;
  temporal: TemporalKey;
  faces: VoxelFaces;
  createdAtUnixMs: number;
}

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
  civId: string;
  civIndex: number;
}

export interface SectorMapCell {
  x: number;
  y: number;
  type: string;
  meta?: Record<string, unknown>;
}

export interface SectorMapNode {
  id: string;
  kind: string;
  x: number;
  y: number;
  ownerCityId?: string | null;
  tags?: string[];
}

export interface SectorMapCivilization {
  civId: string;
  index: number;
  seed: string;
  grid: {
    cells: SectorMapCell[];
  };
  nodes?: SectorMapNode[];
}

export interface SectorMap {
  version: string;
  worldId: string;
  gridSize: number;
  civilizations: SectorMapCivilization[];
}

export interface CivSelection {
  id: string;
  name: string;
  index: number;
}

export interface TopographyCivilization {
  civId: string;
  seed: string;
  heightmap: number[];
}

export interface TopographySet {
  version: string;
  worldId: string;
  gridSize: number;
  civs: TopographyCivilization[];
}

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
  onCivSelect?: (civ: CivSelection | null) => void;
  onCivHover?: (civName: string | null) => void;
  onVoxelSelect?: (index: number | null, civId: string) => void;
  onStackHover?: (cubeIndex: number, stackIndex: number, layerIndex: number, active: boolean) => void;
  onExpand?: (expanded: boolean) => void;

  gridHoverLabel?: (index: number, civId: string | null) => string | null;
  setGridCellColors?: (cells: SectorMapCell[] | null, palette: Record<string, number>, fallbackColor?: number) => void;
  setGridHeightColors?: (heightmap: number[], gradient: { stop: number; color: number }[], fallbackColor?: number) => void;
  setVoxelHighlights: (indices: number[]) => void;
}
