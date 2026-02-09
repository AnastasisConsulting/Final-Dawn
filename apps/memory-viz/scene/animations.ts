import * as THREE from 'three';
import { CONFIG } from '../config';
import { ISceneState } from '../types';
import { updateLayout } from './stacks';

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function animateScene(s: ISceneState, delta: number, elapsedTime: number) {
  // Rotation
  if (!s.focusedState && !s.isVoxelFocused && s.spreadFactor < 0.99 && s.targetSpread !== 1.0) {
    s.contentGroup.rotation.y += delta * 0.1;
    s.contentGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.05;
  }

  // Spread
  if (s.targetSpread !== null) {
    if (Math.abs(s.spreadFactor - s.targetSpread) > 0.001) {
      s.spreadFactor = THREE.MathUtils.lerp(s.spreadFactor, s.targetSpread, delta * 3.0);
      updateLayout(s);
    } else {
      s.spreadFactor = s.targetSpread;
      updateLayout(s);
      s.targetSpread = null;
    }
  }

  // Hero
  if (s.focusedState && s.heroAnimProgress < 1.0) {
    s.heroAnimProgress = Math.min(1.0, s.heroAnimProgress + delta * 2.0);
    const t = easeInOutCubic(s.heroAnimProgress);
    s.heroGroup.position.lerpVectors(s.heroAnimStartPos, s.heroAnimTargetPos, t);
    s.heroGroup.quaternion.slerpQuaternions(s.heroAnimStartRot, s.heroAnimTargetRot, t);
    if (s.heroAnimProgress === 1.0) s.onHeroAnimationComplete();
  }

  // Voxel
  if (s.isVoxelFocused) {
    s.voxelGroup.quaternion.slerp(s.voxelTargetRot, delta * 5);
    if (s.voxelExtractionProgress < 1.0) {
      s.voxelExtractionProgress = Math.min(1.0, s.voxelExtractionProgress + delta * 1.5);
      const t = easeInOutCubic(s.voxelExtractionProgress);
      s.voxelGroup.position.lerpVectors(s.voxelStartPos, s.voxelEndPos, t);
      if (s.voxelExtractionProgress >= 0.8 && !s.isClosingHero) {
        s.closeHeroLayer(true);
        s.startCameraAnim(s.voxelEndPos.clone().add(new THREE.Vector3(2, 2, 2)), s.voxelEndPos);
      }
    }
    if (!s.isPanelOpen && s.voxelExtractionProgress >= 1.0) {
      s.raycaster.setFromCamera(s.mouse, s.camera);
      const intersects = s.raycaster.intersectObject(s.voxelMesh, false);
      let hoveredIndex = -1;
      if (intersects.length > 0 && intersects[0].face) hoveredIndex = intersects[0].face.materialIndex;
      if (s.hoveredFaceIndex !== hoveredIndex) {
        s.hoveredFaceIndex = hoveredIndex;
        s.updateVoxelFaces();
      }
    }
  }

  // Camera
  if (s.camAnim.active) {
    s.camAnim.progress = Math.min(1.0, s.camAnim.progress + delta * 1.5);
    if (s.camAnim.progress >= 1.0) s.camAnim.active = false;
    const t = easeInOutCubic(s.camAnim.progress);
    s.camera.position.lerpVectors(s.camAnim.startPos, s.camAnim.targetPos, t);
    s.controls.target.lerpVectors(s.camAnim.startTarget, s.camAnim.targetTarget, t);
  }
  
  // Ensure controls are updated every frame for damping and manual interaction
  s.controls.update();

  // General Visuals (Pulse, Highlight Lerping)
  if (!s.focusedState && !s.isVoxelFocused) {
    s.currentHover.scale = THREE.MathUtils.lerp(s.currentHover.scale, s.currentHover.active ? CONFIG.hoverScale : 1.0, delta * 10);
    
    // Highlight Mesh Update
    if (s.highlightMesh.visible) {
      if (!s.currentHover.active && Math.abs(s.currentHover.scale - 1.0) < 0.01) {
         s.highlightMesh.visible = false;
      } else {
        s.highlightMesh.matrix.decompose(s.dummyObj.position, s.dummyObj.quaternion, s.dummyObj.scale);
        s.dummyObj.scale.set(1, 1, 1).multiplyScalar(s.currentHover.scale);
        s.highlightMesh.matrix.compose(s.dummyObj.position, s.dummyObj.quaternion, s.dummyObj.scale);
        s.highlightMesh.matrixWorldNeedsUpdate = true;
      }
    }
    
    const pulse = 0.5 + Math.sin(elapsedTime * CONFIG.pulseSpeed) * 0.5;
    s.wireframeMaterials.forEach(m => m.opacity = CONFIG.baseWireOpacity * s.opacityMultiplier * (0.8 + 0.4 * pulse));
    s.fillMaterials.forEach(m => m.opacity = Math.min(CONFIG.baseFillOpacity * (s.opacityMultiplier * 2.0), 0.8));
  }
  s.composer.render();
}