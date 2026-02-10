import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ISceneState, SpatialKey, TemporalKey, StackData, FocusedLayerState, HoverState, HeroLayerData } from './types';
import { CONFIG } from './config';
import { createHighlightMesh, createHeroLayer, createVoxelGroup, initVoxelGrid, createInteractiveGrid } from './scene/objects';
import { initStacks, updateLayout } from './scene/stacks';
import { animateScene } from './scene/animations';
import { handleMouseMove, handleClick } from './scene/interactions';

export class ThreeScene implements ISceneState {
  onTooltipUpdate?: (x: number, y: number, text: string, show: boolean) => void;
  onPanelUpdate?: (open: boolean, faceInfo: string, coords: string) => void;
  onSelectCallback?: (payload: any) => void;
  onLayerSelect?: (indices: {cube: number, stack: number, layer: number} | null) => void;
  onCivSelect?: (civName: string | null) => void;
  onCivHover?: (civName: string | null) => void;
  onVoxelSelect?: (index: number | null, layerId: string) => void;
  onStackHover?: (cubeIndex: number, stackIndex: number, layerIndex: number, active: boolean) => void;
  onExpand?: (expanded: boolean) => void;

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

  spreadFactor = 0.0; targetSpread: number | null = null; opacityMultiplier = 0.5;
  
  heroAnimProgress = 1.0; heroAnimStartPos = new THREE.Vector3(); heroAnimTargetPos = new THREE.Vector3();
  heroAnimStartRot = new THREE.Quaternion(); heroAnimTargetRot = new THREE.Quaternion();
  
  voxelExtractionProgress = 0.0; voxelStartPos = new THREE.Vector3(); voxelEndPos = new THREE.Vector3(); voxelTargetRot = new THREE.Quaternion();
  
  camAnim = { active: false, startPos: new THREE.Vector3(), targetPos: new THREE.Vector3(), startTarget: new THREE.Vector3(), targetTarget: new THREE.Vector3(), progress: 0 };
  selectedFaceIndex = -1; hoveredFaceIndex = -1; animationFrameId = 0;

  constructor(container: HTMLElement, initialSpatial?: SpatialKey, initialTemporal?: TemporalKey) {
    this.container = container; this.clock = new THREE.Clock();
    if (initialSpatial) this.currentSpatial = { ...initialSpatial };
    if (initialTemporal) this.currentTemporal = { ...initialTemporal };
    
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);
    
    this.scene = new THREE.Scene(); this.scene.fog = new THREE.FogExp2(0x000000, 0.02); this.scene.add(this.contentGroup);
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200); this.camera.position.set(0, 12, 55);
    
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 1.5, 0.4, 0.85));

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
  
  startCameraAnim(targetPos: THREE.Vector3, targetLookAt: THREE.Vector3) {
    this.camAnim.active = true; this.camAnim.progress = 0;
    this.camAnim.startPos.copy(this.camera.position); this.camAnim.targetPos.copy(targetPos);
    this.camAnim.startTarget.copy(this.controls.target); this.camAnim.targetTarget.copy(targetLookAt);
  }

  // Calculate an offset position and target to center the object in the remaining space (Window - Panel)
  getOffsetCameraState(targetPos: THREE.Vector3, targetLookAt: THREE.Vector3) {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const PANEL_WIDTH = 350;
    
    // We shift the camera RIGHT so the target object appears LEFT in the view.
    // The amount to shift is exactly half the panel width.
    // Explanation: 
    // Screen Center = W/2. 
    // Visual Center (left of panel) = (W - Panel)/2.
    // Difference = W/2 - (W/2 - P/2) = P/2.
    const pixelShift = PANEL_WIDTH / 2;
    
    const forward = new THREE.Vector3().subVectors(targetLookAt, targetPos).normalize();
    let up = new THREE.Vector3(0, 1, 0);
    // Correct up vector for top-down views
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

  // Level 0 -> Level 1 (Hero View)
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
    
    // Panel opens. Use (8,6,8) for a nice isometric overview that fits comfortably
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
    if (this.onLayerSelect) this.onLayerSelect({cube: cubeIndex, stack: stackSubIndex, layer: instanceId});
  }

  // Level 1 -> Level 2 (Grid View)
  selectCivilization(layer: HeroLayerData) {
    this.selectedCivId = layer.civName;
    this.heroLayers.forEach(l => {
        if (l === layer) {
            this.interactiveGrid.visible = true;
            (this.interactiveGrid.material as THREE.MeshBasicMaterial).color.setHex(l.color);
            this.interactiveGrid.position.copy(l.group.position);
            this.interactiveGrid.position.y = 0;
            l.group.visible = false; 
        } else {
            l.group.visible = false;
        }
    });
    // Panel Open. Zoom in top-down.
    const camState = this.getOffsetCameraState(new THREE.Vector3(0, 4.2, 0), new THREE.Vector3(0, 0, 0.5));
    this.startCameraAnim(camState.pos, camState.target);

    if (this.onCivSelect) this.onCivSelect(layer.civName);
  }

  exitCivilization() {
    this.selectedCivId = null;
    this.interactiveGrid.visible = false;
    this.heroLayers.forEach(l => {
      l.group.visible = true;
      l.group.position.y = l.originalY;
      l.group.scale.set(1, 1, 1);
    });
    // Return to Level 1
    const camState = this.getOffsetCameraState(new THREE.Vector3(8, 6, 8), new THREE.Vector3(0, 0, 0));
    this.startCameraAnim(camState.pos, camState.target);

    if (this.onCivSelect) this.onCivSelect(null);
  }

  // Level 2 -> Level 3 (Voxel Detail)
  selectVoxel(index: number) {
      this.selectedVoxelIndex = index;
      const size = CONFIG.gridSize;
      const res = CONFIG.gridResolution;
      const step = size / res;
      const half = size / 2;
      const offset = step / 2;
      const dummy = new THREE.Object3D();
      let i = 0;
      for(let z = 0; z < res; z++) {
        for(let x = 0; x < res; x++) {
           if (i === index) {
             dummy.position.set(-half + x * step + offset, 0, -half + z * step + offset);
             dummy.scale.set(1,1,1);
           } else {
             dummy.position.set(0,0,0);
             dummy.scale.set(0,0,0);
           }
           dummy.updateMatrix();
           this.interactiveGrid.setMatrixAt(i++, dummy.matrix);
        }
      }
      this.interactiveGrid.instanceMatrix.needsUpdate = true;
      const row = Math.floor(index / res);
      const col = index % res;
      const vX = -half + col * step + offset;
      const vZ = -half + row * step + offset;
      
      const camState = this.getOffsetCameraState(new THREE.Vector3(vX, 4, vZ + 2), new THREE.Vector3(vX, 0, vZ));
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
    for(let z = 0; z < res; z++) {
        for(let x = 0; x < res; x++) {
           dummy.position.set(-half + x * step + offset, 0, -half + z * step + offset);
           dummy.scale.set(1,1,1);
           dummy.updateMatrix();
           this.interactiveGrid.setMatrixAt(i++, dummy.matrix);
        }
    }
    this.interactiveGrid.instanceMatrix.needsUpdate = true;
    
    // Return to Grid View
    const camState = this.getOffsetCameraState(new THREE.Vector3(0, 4.2, 0), new THREE.Vector3(0, 0, 0.5));
    this.startCameraAnim(camState.pos, camState.target);

    if (this.onVoxelSelect && this.selectedCivId) this.onVoxelSelect(null, this.selectedCivId);
  }

  // Level 1 -> Level 0
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
    if (this.onTooltipUpdate) this.onTooltipUpdate(0,0,'', false);
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
  activateVoxelFocus(pt: THREE.Vector3) {}
  resetVoxelFocus() {} 
  selectFace(i: number, n: THREE.Vector3) {}
  closePanel() {}
  updateVoxelFaces() {}
  onResize = () => { if(this.container) { const w=this.container.clientWidth, h=this.container.clientHeight; this.camera.aspect=w/h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w,h); this.composer.setSize(w,h); } };
  animate = () => { this.animationFrameId = requestAnimationFrame(this.animate); animateScene(this, this.clock.getDelta(), this.clock.getElapsedTime()); };
  
  toggleExpand() { 
    if (!this.focusedState) {
      const expanding = Math.round(this.spreadFactor) === 0;
      this.targetSpread = expanding ? 1.0 : 0.0;
      if (this.onExpand) this.onExpand(expanding);
      
      // Animate Camera
      if (expanding) {
          // Center Y=2.5 to account for stack height, 350px offset
          const camState = this.getOffsetCameraState(new THREE.Vector3(0, 12, 55), new THREE.Vector3(0, 2.5, 0));
          this.startCameraAnim(camState.pos, camState.target);
      } else {
          this.startCameraAnim(new THREE.Vector3(0, 12, 55), new THREE.Vector3(0, 0, 0));
      }
    }
  }
  
  dispose() { cancelAnimationFrame(this.animationFrameId); this.renderer.dispose(); }
}