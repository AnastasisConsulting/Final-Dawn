import * as THREE from 'three';
import { ISceneState } from '../types';
import { CONFIG } from '../config';

export function handleMouseMove(s: ISceneState) {
  // 1. Hero Layer Hover (Level 1: 3 Civilizations)
  // Only if we are focused on a layer (Level 1) but haven't selected a civilization yet (Level 2)
  if (s.focusedState && !s.isClosingHero && !s.selectedCivId && s.heroAnimProgress >= 1.0) {
    s.raycaster.setFromCamera(s.mouse, s.camera);
    const targets = s.heroLayers.map(l => l.mesh);
    const intersects = s.raycaster.intersectObjects(targets, false);
    
    if (intersects.length > 0) {
      const hitLayer = s.heroLayers.find(l => l.mesh === intersects[0].object);
      s.heroLayers.forEach(l => {
        if (l === hitLayer) {
           l.group.scale.setScalar(1.05);
           (l.mesh.material as THREE.MeshBasicMaterial).opacity = 0.5;
           if (s.onCivHover) s.onCivHover(l.civName);
           // Optional: Tooltip if needed
           if (s.onTooltipUpdate) s.onTooltipUpdate(0,0, '', false);
        } else {
           l.group.scale.setScalar(1.0);
           (l.mesh.material as THREE.MeshBasicMaterial).opacity = 0.15;
        }
      });
      document.body.style.cursor = 'pointer';
    } else {
      s.heroLayers.forEach(l => {
        l.group.scale.setScalar(1.0);
        (l.mesh.material as THREE.MeshBasicMaterial).opacity = 0.15;
      });
      if (s.onCivHover) s.onCivHover(null);
      document.body.style.cursor = 'default';
    }
    return;
  }

  // 2. Interactive Grid Hover (Level 2: Voxel Grid)
  if (s.selectedCivId && s.selectedVoxelIndex === null) {
      s.raycaster.setFromCamera(s.mouse, s.camera);
      const intersects = s.raycaster.intersectObject(s.interactiveGrid, false);
      if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
          if (s.onTooltipUpdate) s.onTooltipUpdate(0, 0, `Coord: ${intersects[0].instanceId}`, true);
          document.body.style.cursor = 'pointer';
      } else {
          if (s.onTooltipUpdate) s.onTooltipUpdate(0, 0, '', false);
          document.body.style.cursor = 'default';
      }
      return;
  }

  // 3. Main Stack Hover (Level 0: Expanded or Overview)
  if (!s.focusedState && !s.isVoxelFocused) {
    s.contentGroup.updateMatrixWorld();
    s.raycaster.setFromCamera(s.mouse, s.camera);
    const intersects = s.raycaster.intersectObjects(s.stacks.map(st => st.mesh), false);
    
    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const hit = intersects[0];
      const flatStackIndex = s.stacks.findIndex(st => st.mesh === hit.object);
      
      if (flatStackIndex !== -1) {
        const cubeIndex = Math.floor(flatStackIndex / 3);
        const stackSubIndex = flatStackIndex % 3;
        const layerIndex = hit.instanceId!;

        s.currentHover.active = true;
        s.currentHover.stackIndex = flatStackIndex;
        s.currentHover.instanceIndex = layerIndex;
        s.currentHover.scale = 1.0;

        const stack = s.stacks[flatStackIndex];
        (hit.object as THREE.InstancedMesh).getMatrixAt(layerIndex, s.dummyObj.matrix);
        s.highlightMesh.matrix.multiplyMatrices(hit.object.matrixWorld, s.dummyObj.matrix);
        (s.highlightMesh.material as THREE.MeshBasicMaterial).color.setHex(stack.color);
        (s.highlightMesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
        s.highlightMesh.visible = true;

        if (s.onStackHover) s.onStackHover(cubeIndex, stackSubIndex, layerIndex, true);
        if (s.onTooltipUpdate) s.onTooltipUpdate(0, 0, '', false);
        document.body.style.cursor = 'pointer';
        return;
      }
    }
  }

  // Reset if no hit
  if (s.currentHover.active) {
    s.currentHover.active = false;
    if (s.onStackHover) s.onStackHover(0, 0, 0, false);
  }
  
  if (s.onTooltipUpdate) s.onTooltipUpdate(0,0,'', false);
  document.body.style.cursor = 'default';
}

export function handleClick(s: ISceneState, clientX: number, clientY: number, mouseDownPos: THREE.Vector2) {
  const moveDist = mouseDownPos.distanceTo(new THREE.Vector2(clientX, clientY));
  if (moveDist > 5 || s.camAnim.active) return;
  
  if (s.isPanelOpen && !s.focusedState && s.spreadFactor < 0.1) { s.closePanel(); return; }

  // Step 3: Voxel Selected (Level 3 -> Level 2)
  if (s.selectedVoxelIndex !== null) {
      s.raycaster.setFromCamera(s.mouse, s.camera);
      // In voxel view, other voxels are hidden (scale 0), so we basically check if we hit the current one.
      const intersects = s.raycaster.intersectObject(s.interactiveGrid, false);
      if (intersects.length > 0 && intersects[0].instanceId === s.selectedVoxelIndex) {
          // Clicked the active voxel again, do nothing or maybe toggle? 
          // For now, assume explicit click off is required to back out.
          return;
      }
      // Clicked background or invalid target -> Back to Grid
      s.exitVoxelMode();
      return;
  }

  // Step 2: Grid Selection (Level 2 -> Level 1 or Level 3)
  if (s.selectedCivId && s.selectedVoxelIndex === null) {
      s.raycaster.setFromCamera(s.mouse, s.camera);
      const intersects = s.raycaster.intersectObject(s.interactiveGrid, false);
      if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
          s.selectVoxel(intersects[0].instanceId);
      } else {
          // Clicked background -> Back to Hero Layers
          s.exitCivilization();
      }
      return;
  }

  // Step 1: Layer Selection (Level 1 -> Level 0 or Level 2)
  if (s.focusedState && !s.selectedCivId && s.heroAnimProgress >= 1.0) {
    s.raycaster.setFromCamera(s.mouse, s.camera);
    const targets = s.heroLayers.map(l => l.mesh);
    const intersects = s.raycaster.intersectObjects(targets, false);
    if (intersects.length > 0) {
        const hitLayer = s.heroLayers.find(l => l.mesh === intersects[0].object);
        if (hitLayer) s.selectCivilization(hitLayer);
    } else {
        // Clicked background -> Back to Overview
        s.closeHeroLayer();
    }
    return;
  }

  // Overview Stack Interaction (Level 0)
  if (!s.focusedState) {
    s.contentGroup.updateMatrixWorld();
    s.raycaster.setFromCamera(s.mouse, s.camera);
    const intersects = s.raycaster.intersectObjects(s.stacks.map(st => st.mesh), false);
    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const hit = intersects[0];
      const stackIndex = s.stacks.findIndex(st => st.mesh === hit.object);
      if (stackIndex !== -1) s.openHeroLayer(stackIndex, hit.instanceId!);
    } else if (s.spreadFactor > 0.001) {
      // Clicked background while expanded -> Collapse
      s.toggleExpand();
    }
  }
}