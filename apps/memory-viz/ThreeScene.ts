// memory-viz/ThreeScene.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ISceneState, SpatialKey, TemporalKey, StackData, FocusedLayerState, HoverState, HeroLayerData, CivSelection } from './types';
import { CONFIG } from './config';
import { createHighlightMesh, createHeroLayer, createVoxelGroup, initVoxelGrid, createInteractiveGrid } from './scene/objects';
import { initStacks, updateLayout } from './scene/stacks';
import { animateScene } from './scene/animations';
import { handleMouseMove, handleClick } from './scene/interactions';

export class ThreeScene implements ISceneState {
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

  currentSpatial: SpatialKey = { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 };
  currentTemporal: TemporalKey = { saga: 1, book: 1, chapter: 1, page: 123456 };

  container: HTMLElement; renderer: THREE.WebGLRenderer; composer: EffectComposer;
  scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; clock: THREE.Clock;
  contentGroup = new THREE.Group(); heroGroup: THREE.Group; voxelGroup: THREE.Group;
  interactiveGrid: THREE.InstancedMesh;

  heroLayers: HeroLayerData[] = [];
  voxelMesh: THREE.Mesh; voxelWireframe: THREE.LineSegments; highlightMesh: THREE.Mesh;

  stacks: StackData[] = []; voxelGrids: { mesh: THREE.Points; targetPos: THREE.Vector3 }[] = [];
  voxelMaterials: THREE.MeshBasicMaterial[] = []; wireframeMaterials: THREE.MeshBasicMaterial[] = []; fillMaterials: THREE.MeshBasicMaterial[] = [];

  raycaster = new THREE.Raycaster(); mouse = new THREE.Vector2(999, 999); mouseDownPos = new THREE.Vector2(0, 0);
  dummyObj = new THREE.Object3D(); tempMatrix = new THREE.Matrix4();

  currentHover: HoverState = { active: false, stackIndex: -1, instanceIndex: -1, scale: 1.0 };
  focusedState: FocusedLayerState | null = null; suspendedFocusedState: { stackIndex: number; instanceIndex: number } | null = null;

  isVoxelFocused = false; isClosingHero = false; isPanelOpen = false; isClosingToVoxel = false;
  selectedLayerId: string | null = null;
  selectedCivId: string | null = null;
  selectedVoxelIndex: number | null = null;
  voxelHighlights: Set<number> = new Set();

  spreadFactor = 0.0; targetSpread: number | null = null; opacityMultiplier = 1.0;

  heroAnimProgress = 1.0; heroAnimStartPos = new THREE.Vector3(); heroAnimTargetPos = new THREE.Vector3();
  heroAnimStartRot = new THREE.Quaternion(); heroAnimTargetRot = new THREE.Quaternion();

  voxelExtractionProgress = 0.0; voxelStartPos = new THREE.Vector3(); voxelEndPos = new THREE.Vector3(); voxelTargetRot = new THREE.Quaternion();

  camAnim = { active: false, startPos: new THREE.Vector3(), targetPos: new THREE.Vector3(), startTarget: new THREE.Vector3(), targetTarget: new THREE.Vector3(), progress: 0 };
  selectedFaceIndex = -1; hoveredFaceIndex = -1; animationFrameId = 0;

  constructor(container: HTMLElement, initialSpatial?: SpatialKey, initialTemporal?: TemporalKey) {
    this.container = container; this.clock = new THREE.Clock();
    if (initialSpatial) this.currentSpatial = { ...initialSpatial };
    if (initialTemporal) this.currentTemporal = { ...initialTemporal };

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'default' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene(); this.scene.fog = new THREE.FogExp2(0x000000, 0.02); this.scene.add(this.contentGroup);
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200); this.camera.position.set(0, 12, 55);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    // Reduced Bloom Resolution for Performance
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(container.clientWidth / 2, container.clientHeight / 2), 1.5, 0.4, 0.98));

    this.highlightMesh = createHighlightMesh(); this.scene.add(this.highlightMesh);
    const hero = createHeroLayer(); this.heroGroup = hero.group; this.heroLayers = hero.layers; this.scene.add(this.heroGroup);
    const voxel = createVoxelGroup(); this.voxelGroup = voxel.group; this.voxelMesh = voxel.mesh; this.voxelWireframe = voxel.wireframe; this.voxelMaterials = voxel.materials; this.scene.add(this.voxelGroup);

    this.interactiveGrid = createInteractiveGrid();
    this.heroGroup.add(this.interactiveGrid);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 150;

    initVoxelGrid(this.contentGroup, this.voxelGrids);
    initStacks(this);
    updateLayout(this);

    window.addEventListener('resize', this.onResize);
    this.container.addEventListener('mousemove', e => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1; this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      handleMouseMove(this);
    });
    this.container.addEventListener('mousedown', e => this.mouseDownPos.set(e.clientX, e.clientY));
    this.container.addEventListener('click', e => handleClick(this, e.clientX, e.clientY, this.mouseDownPos));
    this.animate();
  }

  setHeroCivs(civs: CivSelection[]) {
    const fallback: CivSelection[] = [
      { id: 'CIV_1', name: 'Civilization 1', index: 0 },
      { id: 'CIV_2', name: 'Civilization 2', index: 1 },
      { id: 'CIV_3', name: 'Civilization 3', index: 2 }
    ];
    const resolved = civs.length ? civs : fallback;
    this.heroLayers.forEach((layer, idx) => {
      const civ = resolved[idx] || resolved[0];
      layer.civName = civ.name;
      layer.civId = civ.id;
      layer.civIndex = civ.index;
    });
  }

  startCameraAnim(targetPos: THREE.Vector3, targetLookAt: THREE.Vector3) {
    this.camAnim.active = true; this.camAnim.progress = 0;
    this.camAnim.startPos.copy(this.camera.position); this.camAnim.targetPos.copy(targetPos);
    this.camAnim.startTarget.copy(this.controls.target); this.camAnim.targetTarget.copy(targetLookAt);
  }

  getOffsetCameraState(targetPos: THREE.Vector3, targetLookAt: THREE.Vector3) {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const PANEL_WIDTH = 350;
    const pixelShift = PANEL_WIDTH / 2;

    const forward = new THREE.Vector3().subVectors(targetLookAt, targetPos).normalize();
    let up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(forward.y) > 0.95) up.set(0, 0, -1);

    const right = new THREE.Vector3().crossVectors(forward, up).normalize();
    const dist = targetPos.distanceTo(targetLookAt);
    const fov = this.camera.fov * (Math.PI / 180);
    const aspect = width / height;

    const visibleHeight = 2 * dist * Math.tan(fov / 2);
    const visibleWidth = visibleHeight * aspect;

    const worldShift = (pixelShift / width) * visibleWidth;
    const shiftVec = right.multiplyScalar(worldShift);

    return {
      pos: targetPos.clone().add(shiftVec),
      target: targetLookAt.clone().add(shiftVec)
    };
  }

  openHeroLayer(stackIndex: number, instanceId: number) {
    const stack = this.stacks[stackIndex];
    stack.mesh.getMatrixAt(instanceId, this.tempMatrix);
    const worldMatrix = this.tempMatrix.clone().premultiply(stack.mesh.matrixWorld);

    this.focusedState = { stackIndex, instanceIndex: instanceId, originalMatrix: this.tempMatrix.clone() };
    this.dummyObj.scale.set(0, 0, 0); this.dummyObj.updateMatrix();
    stack.mesh.setMatrixAt(instanceId, this.dummyObj.matrix); stack.wireframe.setMatrixAt(instanceId, this.dummyObj.matrix);
    stack.mesh.instanceMatrix.needsUpdate = true; stack.wireframe.instanceMatrix.needsUpdate = true;

    this.currentHover.scale = 0; this.highlightMesh.visible = false;
    worldMatrix.decompose(this.heroGroup.position, this.heroGroup.quaternion, this.heroGroup.scale);
    this.heroGroup.scale.set(1, 1, 1);

    this.heroAnimTargetPos.set(0, 0, 0); this.heroAnimTargetRot.setFromEuler(new THREE.Euler(0, 0, 0));

    const camState = this.getOffsetCameraState(new THREE.Vector3(8, 6, 8), new THREE.Vector3(0, 0, 0));
    this.startCameraAnim(camState.pos, camState.target);

    this.heroAnimStartPos.copy(this.heroGroup.position); this.heroAnimStartRot.copy(this.heroGroup.quaternion);
    this.heroGroup.visible = true; this.heroAnimProgress = 0.0; this.isClosingHero = false;

    this.heroLayers.forEach(l => {
      l.group.visible = true; l.group.position.y = l.originalY;
      l.group.scale.set(1, 1, 1); l.wireframe.visible = true;
      l.mesh.visible = true;
    });
    this.interactiveGrid.visible = false;
    this.selectedVoxelIndex = null;
    this.selectedCivId = null;

    const cubeIndex = Math.floor(stackIndex / 3);
    const stackSubIndex = stackIndex % 3;
    if (this.onLayerSelect) this.onLayerSelect({ cube: cubeIndex, stack: stackSubIndex, layer: instanceId });
  }

  selectCivilization(layer: HeroLayerData) {
    this.selectedCivId = layer.civId;

    this.heroLayers.forEach(l => {
      l.group.visible = false;
    });

    // CRITICAL FIX: Reset transformations to prevent visual desync in real browsers
    this.heroGroup.position.set(0, 0, 0);
    this.heroGroup.rotation.set(0, 0, 0);
    this.heroGroup.scale.set(1, 1, 1);
    this.heroGroup.updateMatrixWorld(true);

    this.interactiveGrid.visible = true;
    this.interactiveGrid.position.set(0, 0, 0);
    this.interactiveGrid.scale.set(1, 1, 1);

    const gridMat = this.interactiveGrid.material as THREE.MeshBasicMaterial;
    gridMat.color.setHex(0xffffff);
    gridMat.transparent = false;
    gridMat.opacity = 1.0;
    gridMat.blending = THREE.NormalBlending;
    gridMat.depthTest = true;
    gridMat.depthWrite = true;
    gridMat.needsUpdate = true;

    // Center view on origin with panel offset
    const camState = this.getOffsetCameraState(new THREE.Vector3(0, 6, 0.05), new THREE.Vector3(0, 0, 0));
    this.startCameraAnim(camState.pos, camState.target);

    if (this.onCivSelect) this.onCivSelect({ id: layer.civId, name: layer.civName, index: layer.civIndex });
  }

  exitCivilization() {
    this.selectedCivId = null;
    this.interactiveGrid.visible = false;
    this.heroLayers.forEach(l => {
      l.group.visible = true;
      l.group.position.y = l.originalY;
      l.group.scale.set(1, 1, 1);
    });
    const camState = this.getOffsetCameraState(new THREE.Vector3(8, 6, 8), new THREE.Vector3(0, 0, 0));
    this.startCameraAnim(camState.pos, camState.target);

    if (this.onCivSelect) this.onCivSelect(null);
  }

  selectVoxel(index: number) {
    this.selectedVoxelIndex = index;
    const size = CONFIG.gridSize;
    const res = CONFIG.gridResolution;
    const step = size / res;
    const half = size / 2;
    const offset = step / 2;
    const dummy = new THREE.Object3D();

    let targetX = 0, targetZ = 0;
    let i = 0;
    for (let z = 0; z < res; z++) {
      for (let x = 0; x < res; x++) {
        const posX = -half + x * step + offset;
        const posZ = -half + z * step + offset;
        if (i === index) {
          dummy.position.set(posX, 0, posZ);
          dummy.scale.set(1, 1, 1);
          targetX = posX; targetZ = posZ;
        } else {
          dummy.position.set(0, 0, 0);
          dummy.scale.set(0, 0, 0);
        }
        dummy.updateMatrix();
        this.interactiveGrid.setMatrixAt(i++, dummy.matrix);
      }
    }
    this.interactiveGrid.instanceMatrix.needsUpdate = true;

    const camState = this.getOffsetCameraState(new THREE.Vector3(targetX, 4, targetZ + 1), new THREE.Vector3(targetX, 0, targetZ));
    this.startCameraAnim(camState.pos, camState.target);

    if (this.onVoxelSelect && this.selectedCivId) this.onVoxelSelect(index, this.selectedCivId);
  }

  exitVoxelMode() {
    if (!this.selectedCivId) return;
    this.selectedVoxelIndex = null;
    const size = CONFIG.gridSize;
    const res = CONFIG.gridResolution;
    const step = size / res;
    const half = size / 2;
    const offset = step / 2;
    const dummy = new THREE.Object3D();
    let i = 0;
    for (let z = 0; z < res; z++) {
      for (let x = 0; x < res; x++) {
        dummy.position.set(-half + x * step + offset, 0, -half + z * step + offset);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        this.interactiveGrid.setMatrixAt(i++, dummy.matrix);
      }
    }
    this.interactiveGrid.instanceMatrix.needsUpdate = true;
    const camState = this.getOffsetCameraState(new THREE.Vector3(0, 6, 0.05), new THREE.Vector3(0, 0, 0));
    this.startCameraAnim(camState.pos, camState.target);

    if (this.onVoxelSelect && this.selectedCivId) this.onVoxelSelect(null, this.selectedCivId);
  }

  closeHeroLayer(toVoxelFocus = false) {
    if (!this.focusedState) return;
    this.isClosingToVoxel = toVoxelFocus;
    this.selectedLayerId = null;
    this.selectedCivId = null;
    this.selectedVoxelIndex = null;
    this.interactiveGrid.visible = false;
    const stack = this.stacks[this.focusedState.stackIndex];
    stack.mesh.updateMatrixWorld();
    const targetWorldMatrix = this.focusedState.originalMatrix.clone().premultiply(stack.mesh.matrixWorld);
    targetWorldMatrix.decompose(this.heroAnimTargetPos, this.heroAnimTargetRot, this.dummyObj.scale);

    if (!toVoxelFocus) {
      this.startCameraAnim(new THREE.Vector3(0, 12, 55), new THREE.Vector3(0, 0, 0));
    }

    this.heroAnimStartPos.copy(this.heroGroup.position); this.heroAnimStartRot.copy(this.heroGroup.quaternion);
    this.heroAnimProgress = 0.0; this.isClosingHero = true;
    if (this.onTooltipUpdate) this.onTooltipUpdate(0, 0, '', false);
    if (this.onLayerSelect) this.onLayerSelect(null);
  }

  onHeroAnimationComplete() {
    if (!this.focusedState) return;
    if (this.isClosingHero) {
      const stack = this.stacks[this.focusedState.stackIndex];
      const idx = this.focusedState.instanceIndex;
      stack.mesh.setMatrixAt(idx, this.focusedState.originalMatrix); stack.wireframe.setMatrixAt(idx, this.focusedState.originalMatrix);
      stack.mesh.instanceMatrix.needsUpdate = true; stack.wireframe.instanceMatrix.needsUpdate = true;
      if (this.isClosingToVoxel) {
        this.suspendedFocusedState = { stackIndex: this.focusedState.stackIndex, instanceIndex: this.focusedState.instanceIndex };
        this.contentGroup.visible = false;
      } else this.contentGroup.visible = true;
      this.heroGroup.visible = false; this.focusedState = null;
    } else this.contentGroup.visible = false;
  }

  activateVoxelFocus(pt: THREE.Vector3) { }
  resetVoxelFocus() { }
  selectFace(i: number, n: THREE.Vector3) { }
  closePanel() { }
  updateVoxelFaces() { }

  setGridCellColors(cells: any[] | null, palette: Record<string, number>, fallbackColor = 0xffffff) {
    if (!this.interactiveGrid.instanceColor) return;
    const color = new THREE.Color();
    const res = CONFIG.gridResolution;
    for (let i = 0; i < res * res; i++) {
      let hex = fallbackColor;
      if (cells) {
        const x = i % res;
        const y = Math.floor(i / res);
        const cell = cells.find((c) => c.x === x && c.y === y);
        if (cell && palette[cell.type]) { hex = palette[cell.type]; }
      }
      color.setHex(hex);

      // Memory highlight overlay
      if (this.voxelHighlights.has(i)) {
        color.offsetHSL(0, 0, 0.3);
        color.lerp(new THREE.Color(0x00ffcc), 0.4);
      }

      this.interactiveGrid.setColorAt(i, color);
    }
    this.interactiveGrid.instanceColor.needsUpdate = true;
  }

  setGridHeightColors(heightmap: number[], gradient: { stop: number; color: number }[], fallbackColor = 0xffffff) {
    if (!this.interactiveGrid.instanceColor) return;
    const color = new THREE.Color();
    const res = CONFIG.gridResolution;
    const total = res * res;
    for (let i = 0; i < total; i++) {
      const h = heightmap[i];
      if (typeof h !== 'number') {
        color.setHex(fallbackColor);
        this.interactiveGrid.setColorAt(i, color);
        continue;
      }
      const clamped = Math.min(1, Math.max(0, h));
      let lower = gradient[0], upper = gradient[gradient.length - 1];
      for (let g = 0; g < gradient.length - 1; g++) {
        if (clamped >= gradient[g].stop && clamped <= gradient[g + 1].stop) {
          lower = gradient[g]; upper = gradient[g + 1]; break;
        }
      }
      const t = upper.stop === lower.stop ? 0 : (clamped - lower.stop) / (upper.stop - lower.stop);
      const lowerColor = new THREE.Color(lower.color), upperColor = new THREE.Color(upper.color);
      color.copy(lowerColor).lerp(upperColor, t);

      // Memory highlight overlay
      if (this.voxelHighlights.has(i)) {
        color.offsetHSL(0, 0, 0.3);
        color.lerp(new THREE.Color(0x00ffcc), 0.4);
      }

      this.interactiveGrid.setColorAt(i, color);
    }
    this.interactiveGrid.instanceColor.needsUpdate = true;
  }

  setVoxelHighlights(indices: number[]) {
    this.voxelHighlights = new Set(indices);
    // Trigger redraw by re-applying current colors
    // This is a bit hacky but works since we don't store base colors separately
    // Ideally we would trigger a refresh from the Visualizer
  }

  onResize = () => { if (this.container) { const w = this.container.clientWidth, h = this.container.clientHeight; this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h); this.composer.setSize(w, h); } };
  animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    if (this.container.clientWidth === 0 || this.container.clientHeight === 0) return;
    animateScene(this, this.clock.getDelta(), this.clock.getElapsedTime());
  };

  toggleExpand() {
    if (!this.focusedState) {
      const expanding = Math.round(this.spreadFactor) === 0;
      this.targetSpread = expanding ? 1.0 : 0.0;
      if (this.onExpand) this.onExpand(expanding);
      if (expanding) {
        const camState = this.getOffsetCameraState(new THREE.Vector3(0, 12, 55), new THREE.Vector3(0, 2.5, 0));
        this.startCameraAnim(camState.pos, camState.target);
      } else {
        this.startCameraAnim(new THREE.Vector3(0, 12, 55), new THREE.Vector3(0, 0, 0));
      }
    }
  }

  dispose() { cancelAnimationFrame(this.animationFrameId); this.renderer.dispose(); this.composer.dispose(); if (this.container && this.renderer.domElement) { this.container.removeChild(this.renderer.domElement); } }
}
