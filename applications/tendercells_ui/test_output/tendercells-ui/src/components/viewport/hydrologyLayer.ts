// hydrologyLayer.ts - standing water and erosion risk from the watershed model, in 3D.
import * as THREE from 'three';
import type { HydrologyResult } from '../property/watershed';

const WET_FT = 0.25 / 12;
const CLEAR = 0.14; // sit above the ground mesh's small cosmetic undulation

/**
 * Build instanced water columns (depth-scaled) and erosion patches for a result.
 *
 * @param r - Watershed result (property-feet grid)
 * @param widthFt - Property width (scene is centred on the property)
 * @param depthFt - Property depth
 */
export function buildHydrologyLayer(r: HydrologyResult, widthFt: number, depthFt: number): THREE.Group {
  const g = new THREE.Group();
  g.name = 'hydrology';
  const { cols, cellFt, ground, water, erosion } = r;
  const at = (k: number) => ({ x: (k % cols + 0.5) * cellFt - widthFt / 2, z: (Math.floor(k / cols) + 0.5) * cellFt - depthFt / 2 });
  const m = new THREE.Matrix4();

  const wet: number[] = [];
  for (let k = 0; k < water.length; k++) if (water[k] > WET_FT) wet.push(k);
  if (wet.length) {
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x3f8fd2, transparent: true, opacity: 0.72, roughness: 0.15, metalness: 0.1 }),
      wet.length,
    );
    wet.forEach((k, i) => {
      const { x, z } = at(k);
      const d = Math.max(0.04, water[k]);
      m.compose(new THREE.Vector3(x, ground[k] + CLEAR + d / 2, z), new THREE.Quaternion(), new THREE.Vector3(cellFt, d, cellFt));
      mesh.setMatrixAt(i, m);
    });
    mesh.name = 'standing-water';
    g.add(mesh);
  }

  const risky: number[] = [];
  for (let k = 0; k < erosion.length; k++) if (erosion[k]) risky.push(k);
  if (risky.length) {
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false }),
      risky.length,
    );
    const high = new THREE.Color(0xcc3333), mod = new THREE.Color(0xe8a020);
    risky.forEach((k, i) => {
      const { x, z } = at(k);
      m.compose(new THREE.Vector3(x, ground[k] + CLEAR, z), new THREE.Quaternion(), new THREE.Vector3(cellFt, 0.03, cellFt));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, erosion[k] === 2 ? high : mod);
    });
    mesh.name = 'erosion-risk';
    g.add(mesh);
  }
  return g;
}
