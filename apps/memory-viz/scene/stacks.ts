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
  const posTop = new THREE.Vector3(0, CONFIG.extractDistanceY, 0);
  const posLeft = new THREE.Vector3(-CONFIG.extractDistanceX, 0, 0);
  const posRight = new THREE.Vector3(CONFIG.extractDistanceX, 0, 0);

  for (let c = 0; c < cubeCount; c++) {
    const offsetX = (c - (cubeCount - 1) / 2) * cubeSpacing;
    const cubeOffset = new THREE.Vector3(offsetX, 0, 0);
    let topIndex, leftIndex, rightIndex;
    if (c === 0) { topIndex = 1; leftIndex = 0; rightIndex = 2; }
    else if (c === 1) { topIndex = 2; leftIndex = 1; rightIndex = 0; }
    else { topIndex = 0; leftIndex = 2; rightIndex = 1; }

    const stackDefs = [
      { ...axisData[leftIndex], targetPos: posLeft },
      { ...axisData[topIndex], targetPos: posTop },
      { ...axisData[rightIndex], targetPos: posRight }
    ];
    stackDefs.forEach(def => {
      const fillMat = baseFill.clone(); fillMat.color.setHex(def.color); s.fillMaterials.push(fillMat);
      const wireMat = baseWire.clone(); wireMat.color.setHex(def.color); s.wireframeMaterials.push(wireMat);
      const mesh = new THREE.InstancedMesh(geometry, fillMat, gridResolution);
      const wireMesh = new THREE.InstancedMesh(geometry, wireMat, gridResolution);
      const step = gridSize / (gridResolution - 1);
      const halfSize = gridSize / 2;

      for (let i = 0; i < gridResolution; i++) {
        const offset = -halfSize + i * step;
        s.dummyObj.position.set(0, 0, 0); s.dummyObj.rotation.set(0, 0, 0); s.dummyObj.scale.set(1, 1, 1);
        if (def.axis === 'y') s.dummyObj.position.y = offset;
        else if (def.axis === 'x') { s.dummyObj.rotation.z = Math.PI / 2; s.dummyObj.position.x = offset; }
        else if (def.axis === 'z') { s.dummyObj.rotation.x = Math.PI / 2; s.dummyObj.position.z = offset; }
        s.dummyObj.updateMatrix();
        mesh.setMatrixAt(i, s.dummyObj.matrix);
        wireMesh.setMatrixAt(i, s.dummyObj.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true; wireMesh.instanceMatrix.needsUpdate = true;
      s.contentGroup.add(mesh); s.contentGroup.add(wireMesh);
      s.stacks.push({
        mesh, wireframe: wireMesh, color: def.color, axis: def.axis,
        startPos: new THREE.Vector3(0,0,0), targetPos: cubeOffset.clone().add(def.targetPos),
        startRot: new THREE.Euler(0, 0, 0), targetRot: def.flattenRot
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
    stack.mesh.rotation.set(rX, rY, rZ); stack.wireframe.rotation.set(rX, rY, rZ);
  });
  s.voxelGrids.forEach(vg => {
    vg.mesh.position.lerpVectors(new THREE.Vector3(0,0,0), vg.targetPos, s.spreadFactor);
  });
}