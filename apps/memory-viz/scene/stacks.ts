import * as THREE from 'three';
import { CONFIG } from '../config';
import { ISceneState } from '../types';

export function initStacks(s: ISceneState) {
  const { gridSize, gridResolution, planeThickness, cubeCount, cubeSpacing, extractDistanceY, extractDistanceX } = CONFIG;
  const geometry = new THREE.BoxGeometry(gridSize, planeThickness, gridSize);

  const baseFill = new THREE.MeshBasicMaterial({
    transparent: true, opacity: CONFIG.baseFillOpacity, blending: THREE.AdditiveBlending, depthWrite: false
  });
  const baseWire = new THREE.MeshBasicMaterial({
    transparent: true, opacity: CONFIG.baseWireOpacity, blending: THREE.AdditiveBlending, wireframe: true, depthWrite: false
  });

  // Consistent Layout Mapping for all galaxies
  // Red (X Axiis) -> Right
  // Green (Y Axis) -> Top
  // Blue (Z Axis) -> Left 
  const layoutDefs = [
    {
      color: 0x0088ff, // Blue
      axis: 'z' as const,
      targetPos: new THREE.Vector3(-extractDistanceX, 0, 0),
      rot: new THREE.Euler(Math.PI / 2, 0, 0)
    },
    {
      color: 0x00ff88, // Green
      axis: 'y' as const,
      targetPos: new THREE.Vector3(0, extractDistanceY, 0),
      rot: new THREE.Euler(0, 0, 0)
    },
    {
      color: 0xff0055, // Red
      axis: 'x' as const,
      targetPos: new THREE.Vector3(extractDistanceX, 0, 0),
      rot: new THREE.Euler(0, 0, Math.PI / 2)
    }
  ];

  for (let c = 0; c < cubeCount; c++) {
    const cubeOffset = new THREE.Vector3((c - (cubeCount - 1) / 2) * cubeSpacing, 0, 0);

    layoutDefs.forEach(def => {
      const fillMat = baseFill.clone();
      fillMat.color.setHex(def.color);
      const wireMat = baseWire.clone();
      wireMat.color.setHex(def.color);

      const mesh = new THREE.InstancedMesh(geometry, fillMat, gridResolution);
      const wireMesh = new THREE.InstancedMesh(geometry, wireMat, gridResolution);

      // Create instances along the specific axis
      for (let i = 0; i < gridResolution; i++) {
        const dummy = new THREE.Object3D();
        const step = gridSize / (gridResolution - 1);
        const halfSize = gridSize / 2;
        const offset = -halfSize + i * step;

        if (def.axis === 'y') dummy.position.set(0, offset, 0);
        else if (def.axis === 'x') dummy.position.set(offset, 0, 0);
        else if (def.axis === 'z') dummy.position.set(0, 0, offset);

        // Flattening rotation applied to the geometry within the instanced mesh
        dummy.rotation.copy(def.rot);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        wireMesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      wireMesh.instanceMatrix.needsUpdate = true;

      s.contentGroup.add(mesh);
      s.contentGroup.add(wireMesh);

      // Store in state for animation
      s.stacks.push({
        mesh,
        wireframe: wireMesh,
        color: def.color,
        axis: def.axis,
        startPos: cubeOffset.clone(), // FIX: Start from galaxy center, not world origin
        targetPos: cubeOffset.clone().add(def.targetPos),
        startRot: new THREE.Euler(0, 0, 0),
        targetRot: def.rot
      });
    });
  }
}

export function updateLayout(s: ISceneState) {
  s.stacks.forEach(stack => {
    stack.mesh.position.lerpVectors(stack.startPos, stack.targetPos, s.spreadFactor);
    stack.wireframe.position.copy(stack.mesh.position);

    const rX = THREE.MathUtils.lerp(stack.startRot.x, stack.targetRot.x, s.spreadFactor);
    const rY = THREE.MathUtils.lerp(stack.startRot.y, stack.targetRot.y, s.spreadFactor);
    const rZ = THREE.MathUtils.lerp(stack.startRot.z, stack.targetRot.z, s.spreadFactor);

    stack.mesh.rotation.set(rX, rY, rZ);
    stack.wireframe.rotation.set(rX, rY, rZ);
  });

  s.voxelGrids.forEach(vg => {
    vg.mesh.position.lerpVectors(new THREE.Vector3(0, 0, 0), vg.targetPos, s.spreadFactor);
  });
}
