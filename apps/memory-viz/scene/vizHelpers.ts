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
    const res = CONFIG.gridResolution;
    const step = size / res;
    const geo = new THREE.BoxGeometry(step * 0.95, CONFIG.planeThickness, step * 0.95);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    const mesh = new THREE.InstancedMesh(geo, mat, res * res);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    const half = size / 2;
    const offset = step / 2;

    let i = 0;
    for (let z = 0; z < res; z++) {
        for (let x = 0; x < res; x++) {
            dummy.position.set(-half + x * step + offset, 0, -half + z * step + offset);
            dummy.updateMatrix();
            mesh.setMatrixAt(i++, dummy.matrix);
        }
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = false;
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

    const geo = new THREE.BoxGeometry(CONFIG.gridSize, CONFIG.planeThickness, CONFIG.gridSize);
    const wireGeo = new THREE.EdgesGeometry(geo);
    const cursorGeo = new THREE.BoxGeometry(CONFIG.gridSize / CONFIG.gridResolution, CONFIG.planeThickness * 2, CONFIG.gridSize / CONFIG.gridResolution);

    configs.forEach(cfg => {
        const layerGroup = new THREE.Group();
        layerGroup.position.y = cfg.y;

        const mat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.15 });
        const mesh = new THREE.Mesh(geo, mat);

        const wireMat = new THREE.LineBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.3 });
        const wireframe = new THREE.LineSegments(wireGeo, wireMat);
        mesh.add(wireframe);

        const cursorMat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.8 });
        const cursor = new THREE.Mesh(cursorGeo, cursorMat);
        cursor.visible = false;
        mesh.add(cursor);

        layerGroup.add(mesh);
        group.add(layerGroup);

        layers.push({
            group: layerGroup,
            mesh,
            wireframe,
            cursor,
            color: cfg.color,
            id: cfg.id,
            originalY: cfg.y,
            civName: cfg.civ
        });
    });

    return { group, layers };
}
