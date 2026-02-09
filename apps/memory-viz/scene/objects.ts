import * as THREE from 'three';
import { CONFIG } from '../config';
import { HeroLayerData } from '../types';

export function createHighlightMesh() {
  const geo = new THREE.BoxGeometry(CONFIG.gridSize, CONFIG.planeThickness, CONFIG.gridSize);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.matrixAutoUpdate = false;
  mesh.visible = false;
  return mesh;
}

export function createInteractiveGrid() {
  const size = CONFIG.gridSize;
  const res = CONFIG.gridResolution; // 7
  const step = size / res; // 0.5
  const geo = new THREE.BoxGeometry(step * 0.95, CONFIG.planeThickness, step * 0.95);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.3, 
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const mesh = new THREE.InstancedMesh(geo, mat, res * res);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.visible = false;
  
  const dummy = new THREE.Object3D();
  const half = size / 2;
  const offset = step / 2;
  
  let i = 0;
  for(let z = 0; z < res; z++) {
    for(let x = 0; x < res; x++) {
       dummy.position.set(
           -half + x * step + offset,
           0,
           -half + z * step + offset
       );
       dummy.updateMatrix();
       mesh.setMatrixAt(i++, dummy.matrix);
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

export function createHeroLayer() {
  const group = new THREE.Group();
  group.visible = false;
  
  const layers: HeroLayerData[] = [];
  const configs = [
    { color: 0xff0055, id: 'Red State', civ: 'Civilization 1', y: -0.5 },
    { color: 0x00ff88, id: 'Green State', civ: 'Civilization 2', y: 0 },
    { color: 0x0088ff, id: 'Blue State', civ: 'Civilization 3', y: 0.5 }
  ];

  const geo = new THREE.BoxGeometry(
    CONFIG.gridSize, CONFIG.planeThickness, CONFIG.gridSize,
    CONFIG.gridResolution, 1, CONFIG.gridResolution
  );
  
  const gridVertices: number[] = [];
  const sz = CONFIG.gridSize;
  const res = CONFIG.gridResolution;
  const step = sz / res;
  const h = sz / 2;
  const yOff = CONFIG.planeThickness / 2 + 0.002;

  for (let i = 0; i <= res; i++) {
    const p = -h + i * step;
    gridVertices.push(p, yOff, -h); gridVertices.push(p, yOff, h);
    gridVertices.push(-h, yOff, p); gridVertices.push(h, yOff, p);
  }
  const wireGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(gridVertices, 3));
  const cursorGeo = new THREE.BoxGeometry(step, CONFIG.planeThickness * 2, step);

  configs.forEach(cfg => {
    const layerGroup = new THREE.Group();
    layerGroup.position.y = cfg.y;
    
    const mat = new THREE.MeshBasicMaterial({
      color: cfg.color, transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    
    const wireMat = new THREE.LineBasicMaterial({
      color: cfg.color, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    mesh.add(wireframe);

    const cursorMat = new THREE.MeshBasicMaterial({
      color: cfg.color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending,
    });
    const cursor = new THREE.Mesh(cursorGeo, cursorMat);
    cursor.visible = false;
    mesh.add(cursor);

    layerGroup.add(mesh);
    group.add(layerGroup);

    layers.push({
      group: layerGroup, mesh, wireframe, cursor,
      color: cfg.color, id: cfg.id, originalY: cfg.y, civName: cfg.civ
    });
  });

  return { group, layers };
}

export function createVoxelGroup() {
  const group = new THREE.Group();
  group.visible = false;
  const step = CONFIG.gridSize / CONFIG.gridResolution;
  const geo = new THREE.BoxGeometry(step, CONFIG.planeThickness * 4, step);
  const materials: THREE.MeshBasicMaterial[] = [];
  for(let i=0; i<6; i++) {
    materials.push(new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: CONFIG.voxelBaseOpacity, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    }));
  }
  const mesh = new THREE.Mesh(geo, materials);
  const wireGeo = new THREE.EdgesGeometry(geo);
  const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.8, transparent: true, blending: THREE.AdditiveBlending });
  const wireframe = new THREE.LineSegments(wireGeo, wireMat);
  mesh.add(wireframe);
  group.add(mesh);
  return { group, mesh, wireframe, materials };
}

export function initVoxelGrid(contentGroup: THREE.Group, voxelGrids: { mesh: THREE.Points; targetPos: THREE.Vector3 }[]) {
  const { gridSize, gridResolution, cubeCount, cubeSpacing } = CONFIG;
  const halfSize = gridSize / 2;
  const step = gridSize / (gridResolution - 1);
  const positions: number[] = [];
  for (let x = 0; x < gridResolution; x++) {
    for (let y = 0; y < gridResolution; y++) {
      for (let z = 0; z < gridResolution; z++) {
        positions.push(-halfSize + x * step, -halfSize + y * step, -halfSize + z * step);
      }
    }
  }
  const pointGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const pointMat = new THREE.PointsMaterial({
    color: 0x888888, size: 0.04, sizeAttenuation: true, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false
  });
  for (let c = 0; c < cubeCount; c++) {
    const offsetX = (c - (cubeCount - 1) / 2) * cubeSpacing;
    const mesh = new THREE.Points(pointGeo, pointMat);
    contentGroup.add(mesh);
    voxelGrids.push({ mesh, targetPos: new THREE.Vector3(offsetX, 0, 0) });
  }
}