// weedRobotMarker.ts - the weed robot on its garden bed in 3D, by build:
//   genesis-laser  gantry bridge across the bed + tool head (FarmBot Genesis, Project Cyclops)
//   rover-laser    small rover on the bed with a 2-DOF arm over the weed (LiteWeed-style)
//   arm-laser      arm on the bed corner reaching over the weed (arm service + laser module)
// All three show the aiming dot on the soil and the beam while the laser is on.
// Sizes are exaggerated (like the FarmBot marker) so the robot reads at yard scale.
import * as THREE from 'three';
import { bedMmToScene, type FlagItem, type FlagLayout } from './yardFlags';
import type { WeedRobotState, WeedRobotType } from '../../lib/yard/yardTypes';

const BED_TOP = 0.55;   // raised-bed soil height (ft) - matches the garden mesh
const HEAD_UP = 1.6;    // tool head height above the soil

const beamColor = (nm?: number) => new THREE.Color(nm && nm < 430 ? 0x8f3bff : 0x3b7bff); // 405 violet / 450 blue

/**
 * Build the marker for one robot build. Parts are named so placeWeedRobot can move them.
 *
 * @param type - Robot build
 * @param item - Garden bed item (feet)
 */
export function createWeedRobot(type: WeedRobotType, item: FlagItem): THREE.Group {
  const g = new THREE.Group();
  g.name = `weed-robot-${type}`;
  g.userData.type = type;
  const metal = new THREE.MeshStandardMaterial({ color: 0xd9dde0, metalness: 0.6, roughness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b2f33, roughness: 0.6 });

  if (type === 'genesis-laser') {
    const across = Math.min(item.width, item.depth) + 0.4;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(across, 0.3, 0.4), metal);
    bridge.name = 'bridge';
    g.add(bridge);
  } else if (type === 'rover-laser') {
    const rover = new THREE.Group();
    rover.name = 'rover';
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 1.05), new THREE.MeshStandardMaterial({ color: 0x4a7c59 }));
    body.position.y = 0.5;
    rover.add(body);
    for (const [dx, dz] of [[-0.55, -0.58], [0.55, -0.58], [-0.55, 0.58], [0.55, 0.58]]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.16, 14), dark);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(dx, 0.27, dz);
      rover.add(wheel);
    }
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.04, 0.95), new THREE.MeshStandardMaterial({ color: 0x1d3557, metalness: 0.4 }));
    panel.position.y = 0.8;
    rover.add(panel);
    g.add(rover);
  } else {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.5, 16), dark);
    base.name = 'arm-base';
    g.add(base);
  }
  // Arm links (rover + arm builds): upper and lower link as unit cylinders we stretch.
  if (type !== 'genesis-laser') {
    for (const name of ['link1', 'link2']) {
      const link = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1, 10), metal);
      link.name = name;
      g.add(link);
    }
  }
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.55), new THREE.MeshStandardMaterial({ color: 0xf0ede4, roughness: 0.4 }));
  head.name = 'head';
  g.add(head);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8),
    new THREE.MeshBasicMaterial({ color: 0x8f3bff, transparent: true, opacity: 0.9, toneMapped: false }));
  beam.name = 'beam';
  beam.visible = false;
  g.add(beam);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.18, 16),
    new THREE.MeshBasicMaterial({ color: 0xff3b3b, toneMapped: false }));
  dot.name = 'dot';
  dot.rotation.x = -Math.PI / 2;
  dot.visible = false;
  g.add(dot);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.6, 20),
    new THREE.MeshBasicMaterial({ color: 0xff8a3b, transparent: true, opacity: 0.6, toneMapped: false, depthWrite: false }));
  glow.name = 'glow';
  glow.rotation.x = -Math.PI / 2;
  glow.visible = false;
  g.add(glow);
  return g;
}

/** Stretch a unit-height cylinder between two points. */
function linkBetween(o: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  const d = new THREE.Vector3().subVectors(b, a);
  o.position.copy(a).addScaledVector(d, 0.5);
  o.scale.set(1, Math.max(0.01, d.length()), 1);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
}

/**
 * Move the marker to the robot's tool position (smoothly) and show aim dot / beam.
 *
 * @param g - Marker from createWeedRobot
 * @param item - Garden bed
 * @param layout - Property size
 * @param state - Robot state (tool position in bed mm)
 * @param groundAt - Scene ground height (the bed sits level at its centre)
 * @param tSec - Clock time for the flicker
 */
export function placeWeedRobot(g: THREE.Group, item: FlagItem, layout: FlagLayout, state: WeedRobotState,
  groundAt: (x: number, z: number) => number, tSec: number): void {
  const tool = state.tool ?? { x: 0, y: 0, z: 0, aim: false, laser: false };
  const target = bedMmToScene(item, layout, { x: tool.x, y: tool.y });
  const cx = item.x + item.width / 2 - layout.property.widthFt / 2, cz = item.y + item.depth / 2 - layout.property.depthFt / 2;
  const soil = groundAt(cx, cz) + BED_TOP;
  const cur = (g.userData.cur as { x: number; z: number } | undefined) ?? target;
  const k = 0.12; // ease toward the target each frame
  const pos = { x: cur.x + (target.x - cur.x) * k, z: cur.z + (target.z - cur.z) * k };
  g.userData.cur = pos;
  const type = g.userData.type as WeedRobotType;
  const headY = soil + HEAD_UP;
  const head = g.getObjectByName('head')!;
  head.position.set(pos.x, headY, pos.z);

  if (type === 'genesis-laser') {
    const bridge = g.getObjectByName('bridge')!;
    const alongZ = item.depth >= item.width;
    bridge.position.set(alongZ ? cx : pos.x, headY + 0.25, alongZ ? pos.z : cz);
    bridge.rotation.y = alongZ ? 0 : Math.PI / 2;
  } else if (type === 'rover-laser') {
    const rover = g.getObjectByName('rover')!;
    rover.position.set(pos.x - 1.1, soil, pos.z);
    const shoulder = new THREE.Vector3(pos.x - 0.8, soil + 0.9, pos.z);
    const elbow = new THREE.Vector3(pos.x - 0.35, headY + 0.5, pos.z);
    linkBetween(g.getObjectByName('link1')!, shoulder, elbow);
    linkBetween(g.getObjectByName('link2')!, elbow, head.position);
  } else {
    const alongZ = item.depth >= item.width;
    const bx = alongZ ? item.x - layout.property.widthFt / 2 - 0.3 : cx;
    const bz = alongZ ? cz : item.y - layout.property.depthFt / 2 - 0.3;
    const base = g.getObjectByName('arm-base')!;
    base.position.set(bx, groundAt(bx, bz) + 0.15, bz);
    const shoulder = new THREE.Vector3(bx, groundAt(bx, bz) + 1.6, bz);
    const mid = new THREE.Vector3((bx + pos.x) / 2, headY + 1.1, (bz + pos.z) / 2);
    linkBetween(g.getObjectByName('link1')!, shoulder, mid);
    linkBetween(g.getObjectByName('link2')!, mid, head.position);
  }

  const dot = g.getObjectByName('dot')!;
  dot.visible = tool.aim || tool.laser;
  dot.position.set(pos.x, soil + 0.02, pos.z);
  const beam = g.getObjectByName('beam') as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  beam.visible = tool.laser;
  if (tool.laser) {
    beam.material.color.copy(beamColor(state.laser.wavelengthNm));
    linkBetween(beam, new THREE.Vector3(pos.x, soil + 0.02, pos.z), new THREE.Vector3(pos.x, headY - 0.3, pos.z));
    beam.scale.x = beam.scale.z = 1 + Math.sin(tSec * 40) * 0.3; // flicker
  }
  const glow = g.getObjectByName('glow')!;
  glow.visible = tool.laser;
  glow.position.set(pos.x, soil + 0.03, pos.z);
}
