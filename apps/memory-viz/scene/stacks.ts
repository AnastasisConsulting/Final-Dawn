import * as THREE from 'three';
import { CONFIG } from '../config';
import { ISceneState } from '../types';

export function initStacks(s: ISceneState) {
  const { gridSize, gridResolution, planeThickness, cubeCount, cubeSpacing } = CONFIG;
  const geometry = new THREE.BoxGeometry(gridSize, planeThickness, gridSize);
  const baseFill = new THREE.MeshBasicMaterial({ transparent: true, opacity: CONFIG.baseFillOpacity, blending: THREE.AdditiveBlending, depthWrite: false });
  const baseWire = new THREE.MeshBasicMaterial({ transparent: true, opacity: CONFIG.baseWireOpacity, blending: THREE.AdditiveBlending, wireframe: true, depthWrite: false });

  const axisData = [
    { color: 0x0088ff, axis: 'z' as const, flattenRot: new THREE.Euler(Math.PI / 2, 0, 0) },
    { color: 0x00ff88, axis: 'y' as const, flattenRot: new THREE.Euler(0, 0, 0) },
    { color: 0xff0055, axis: 'x' as const, flattenRot: new THREE.Euler(0, 0, Math.PI / 2) }
  ];
  // Calculate linear layout positions
  const totalStacks = cubeCount * 3;
  // 7 slices per stack. Spacing between slices ~1.2. Stack width ~8.4. Spacing between stacks ~12.
  const LAYOUT_SPACING = 12.0;
  const startX = -((totalStacks - 1) * LAYOUT_SPACING / 2); // Center around 0 using actual spacing

  let stackIndex = 0;
  for (let c = 0; c < cubeCount; c++) {
    // Current Cube Logic (Collapsed State)
    const offsetX = (c - (cubeCount - 1) / 2) * cubeSpacing;
    const cubeOffset = new THREE.Vector3(offsetX, 0, 0);

    // Axis assignment logic (cycling)
    let topIndex, leftIndex, rightIndex;
    if (c === 0) { topIndex = 1; leftIndex = 0; rightIndex = 2; }
    else if (c === 1) { topIndex = 2; leftIndex = 1; rightIndex = 0; }
    else { topIndex = 0; leftIndex = 2; rightIndex = 1; }

    const stackDefs = [
      axisData[leftIndex],
      axisData[topIndex],
      axisData[rightIndex]
    ];

    stackDefs.forEach(def => {
      const fillMat = baseFill.clone(); fillMat.color.setHex(def.color); s.fillMaterials.push(fillMat);
      const wireMat = baseWire.clone(); wireMat.color.setHex(def.color); s.wireframeMaterials.push(wireMat);
      const mesh = new THREE.InstancedMesh(geometry, fillMat, gridResolution);
      const wireMesh = new THREE.InstancedMesh(geometry, wireMat, gridResolution);
      const step = gridSize / (gridResolution - 1);
      const halfSize = gridSize / 2;

      // Store initial matrices for lerping
      const initialMatrices: THREE.Matrix4[] = [];

      for (let i = 0; i < gridResolution; i++) {
        const offset = -halfSize + i * step;
        s.dummyObj.position.set(0, 0, 0); s.dummyObj.rotation.set(0, 0, 0); s.dummyObj.scale.set(1, 1, 1);

        // Setup initial collapsed orientation
        if (def.axis === 'y') s.dummyObj.position.y = offset;
        else if (def.axis === 'x') { s.dummyObj.rotation.z = Math.PI / 2; s.dummyObj.position.x = offset; }
        else if (def.axis === 'z') { s.dummyObj.rotation.x = Math.PI / 2; s.dummyObj.position.z = offset; }

        s.dummyObj.updateMatrix();
        mesh.setMatrixAt(i, s.dummyObj.matrix);
        wireMesh.setMatrixAt(i, s.dummyObj.matrix);
        initialMatrices.push(s.dummyObj.matrix.clone());
      }
      mesh.instanceMatrix.needsUpdate = true; wireMesh.instanceMatrix.needsUpdate = true;
      s.contentGroup.add(mesh); s.contentGroup.add(wireMesh);

      const linearX = startX + (stackIndex * LAYOUT_SPACING);

      s.stacks.push({
        mesh, wireframe: wireMesh, color: def.color, axis: def.axis,
        startPos: new THREE.Vector3(0, 0, 0),
        targetPos: new THREE.Vector3(linearX, 0, 0),
        startRot: new THREE.Euler(0, 0, 0),
        targetRot: new THREE.Euler(0, 0, 0),
        initialMatrices: initialMatrices // Store for animation
      });
      stackIndex++;
    });
  }
}

export function updateLayout(s: ISceneState) {
  const dummy = new THREE.Object3D();
  const SLICE_SPACING = 1.2;
  const gridResolution = CONFIG.gridResolution;

  s.stacks.forEach(stack => {
    // 1. Interpolate Stack Position/Rotation (Global)
    stack.mesh.position.lerpVectors(stack.startPos, stack.targetPos, s.spreadFactor);
    stack.wireframe.position.copy(stack.mesh.position);

    const rX = THREE.MathUtils.lerp(stack.startRot.x, stack.targetRot.x, s.spreadFactor);
    const rY = THREE.MathUtils.lerp(stack.startRot.y, stack.targetRot.y, s.spreadFactor);
    const rZ = THREE.MathUtils.lerp(stack.startRot.z, stack.targetRot.z, s.spreadFactor);
    stack.mesh.rotation.set(rX, rY, rZ); stack.wireframe.rotation.set(rX, rY, rZ);

    // 2. Interpolate Internal Instances (Slices)
    if (stack.initialMatrices) {
      for (let i = 0; i < gridResolution; i++) {
        // A. Get Initial State
        const initMat = stack.initialMatrices[i];

        // B. Calculate Target State (Local to Stack)
        // Laid out horizontally: (index - center) * spacing
        const targetX = (i - (gridResolution - 1) / 2) * SLICE_SPACING;

        // Use dummy to interpolate props, harder with raw matrices.
        // Reconstruct initial transform
        dummy.matrix.copy(initMat);
        dummy.matrix.decompose(dummy.position, dummy.rotation as any, dummy.scale);
        const startP = dummy.position.clone();
        const startQ = dummy.quaternion.clone();

        // Target: Flat (Rot 0), Spaced X
        const targetP = new THREE.Vector3(targetX, 0, 0);
        const targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));

        // Lerp
        dummy.position.lerpVectors(startP, targetP, s.spreadFactor);
        dummy.quaternion.slerpQuaternions(startQ, targetQ, s.spreadFactor);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();

        stack.mesh.setMatrixAt(i, dummy.matrix);
        stack.wireframe.setMatrixAt(i, dummy.matrix);
      }
      stack.mesh.instanceMatrix.needsUpdate = true;
      stack.wireframe.instanceMatrix.needsUpdate = true;
    }
  });

  s.voxelGrids.forEach(vg => {
    vg.mesh.position.lerpVectors(new THREE.Vector3(0, 0, 0), vg.targetPos, s.spreadFactor);
  });
}