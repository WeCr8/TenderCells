// yardFlags.ts - 3D pop-up flags on the property map.
//
//   egg_ready / pickup_ready / alert  pole + pennant + label above the station
//   weed_detected                     pin at the weed's bed position (mm), colour by review status
//   headcount                         label over the roost + roaming birds wandering the patrol area
//
// Built into one THREE.Group that Viewport3D swaps when flags change (no scene
// rebuild); animateYardFlags() bobs pennants, pulses pending weeds and walks birds.
import * as THREE from 'three';
import { makeTextSprite } from './labels';
import { FLAG_COLORS, STATUS_COLORS, WATCHTOWER_RANGE_FT, roamingFrom, type YardFlag } from '../../lib/yard/yardTypes';
import { findingColor } from '../../lib/yard/detections';

const MM_PER_FT = 304.8;

export interface FlagItem { id: string; type: string; x: number; y: number; width: number; depth: number; scan?: { radiusFt?: number } }
export interface FlagLayout { property: { widthFt: number; depthFt: number } }

const center = (item: FlagItem, layout: FlagLayout) => ({
  x: item.x + item.width / 2 - layout.property.widthFt / 2,
  z: item.y + item.depth / 2 - layout.property.depthFt / 2,
});

/**
 * Map a bed position in mm (x along the long side, y across, from the origin
 * corner - FarmBot convention) to scene feet.
 */
export function bedMmToScene(item: FlagItem, layout: FlagLayout, mm: { x: number; y: number }): { x: number; z: number } {
  const { x, z } = center(item, layout);
  const alongZ = item.depth >= item.width;
  const long = Math.max(item.width, item.depth);
  const wide = Math.min(item.width, item.depth);
  const clamp = (v: number, hi: number) => Math.min(hi, Math.max(0, v));
  const xFt = clamp(mm.x / MM_PER_FT, long);
  const yFt = clamp(mm.y / MM_PER_FT, wide);
  const cornerX = x - item.width / 2;
  const cornerZ = z - item.depth / 2;
  return alongZ ? { x: cornerX + yFt, z: cornerZ + xFt } : { x: cornerX + xFt, z: cornerZ + yFt };
}

function stationFlag(flag: YardFlag, item: FlagItem, layout: FlagLayout): THREE.Group {
  const g = new THREE.Group();
  const { x, z } = center(item, layout);
  // Pole at the item's front-right corner so it doesn't hide inside the model.
  g.position.set(x + item.width / 2 - 0.3, 0, z + item.depth / 2 - 0.3);
  const color = new THREE.Color(FLAG_COLORS[flag.type]);
  const poleH = 6;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, poleH, 8), new THREE.MeshStandardMaterial({ color: 0xf0ede4 }));
  pole.position.y = poleH / 2;
  pole.castShadow = true;
  g.add(pole);

  const pennantShape = new THREE.Shape();
  pennantShape.moveTo(0, 0); pennantShape.lineTo(1.5, -0.45); pennantShape.lineTo(0, -0.9); pennantShape.lineTo(0, 0);
  const pennant = new THREE.Mesh(new THREE.ShapeGeometry(pennantShape),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, side: THREE.DoubleSide }));
  pennant.position.set(0.05, poleH, 0);
  pennant.userData.wave = true;
  g.add(pennant);

  const label = makeTextSprite({
    title: flag.count && flag.type !== 'alert' ? `${flag.title} · ${flag.count}` : flag.title,
    subtitle: flag.station ? `Pick up: ${flag.station}` : flag.detail,
    accent: FLAG_COLORS[flag.type], screenSize: 0.055,
  });
  label.position.y = poleH + 1.2;
  label.userData.bob = { base: label.position.y, phase: Math.random() * Math.PI * 2 };
  g.add(label);
  g.userData.flagId = `${flag.deviceId}:${flag.id}`;
  return g;
}

function weedPin(flag: YardFlag, item: FlagItem, layout: FlagLayout): THREE.Group | null {
  if (!flag.bedMm && !flag.propFt) return null;
  const g = new THREE.Group();
  // Bed robots report bed mm; rovers report the property position (feet) directly.
  const p = flag.propFt
    ? { x: flag.propFt.x - layout.property.widthFt / 2, z: flag.propFt.y - layout.property.depthFt / 2 }
    : bedMmToScene(item, layout, flag.bedMm!);
  g.position.set(p.x, 0, p.z);
  const pending = flag.status === 'pending_review';
  const hex = pending ? FLAG_COLORS.weed_detected : (STATUS_COLORS[flag.status] ?? '#8A7D55');
  const color = new THREE.Color(hex);
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: pending ? 0.5 : 0.15 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 6), mat);
  stem.position.y = 0.7;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), mat);
  head.position.y = 1.45;
  g.add(stem, head);
  if (pending) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.32, 28),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    ring.userData.pulse = true;
    g.add(ring);
    const label = makeTextSprite({
      title: `Weed${flag.confidence != null ? ` ${Math.round(flag.confidence * 100)}%` : ''}`,
      subtitle: 'needs review', accent: hex, screenSize: 0.034,
    });
    label.position.y = 2.05;
    g.add(label);
  } else if (flag.status === 'treated') {
    // A scorched spot where the laser pulsed.
    const burn = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), new THREE.MeshBasicMaterial({ color: 0x2a1a0e }));
    burn.rotation.x = -Math.PI / 2;
    burn.position.y = 0.04;
    g.add(burn);
  }
  g.userData.flagId = `${flag.deviceId}:${flag.id}`;
  return g;
}

function makeBird(): THREE.Group {
  const bird = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), new THREE.MeshStandardMaterial({ color: 0xa0522d }));
  body.scale.set(1.25, 0.9, 0.85);
  body.position.y = 0.4;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: 0xb5653a }));
  head.position.set(0.36, 0.72, 0);
  const comb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), new THREE.MeshStandardMaterial({ color: 0xcc3333 }));
  comb.position.set(0.38, 0.88, 0);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), new THREE.MeshStandardMaterial({ color: 0xe8a020 }));
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.55, 0.7, 0);
  [body, head].forEach((m) => { m.castShadow = true; });
  bird.add(body, head, comb, beak);
  bird.scale.setScalar(1.8); // readable from a whole-yard camera
  return bird;
}

function roostHeadcount(flag: YardFlag, item: FlagItem, layout: FlagLayout, groundAt: (x: number, z: number) => number): THREE.Group {
  const g = new THREE.Group();
  const { x, z } = center(item, layout);
  const label = makeTextSprite({ title: flag.title, subtitle: flag.detail, accent: FLAG_COLORS.headcount, screenSize: 0.055 });
  const base = 6.2 + groundAt(x, z);
  label.position.set(x, base, z);
  label.userData.bob = { base, phase: 0 };
  g.add(label);
  // Roaming birds wander inside the patrol ring, outside the roost footprint.
  const patrolR = item.scan?.radiusFt ?? Math.max(item.width, item.depth) * 3.5;
  const inner = Math.max(item.width, item.depth) / 2 + 1;
  const roaming = Math.min(12, roamingFrom(flag));
  for (let i = 0; i < roaming; i++) {
    const bird = makeBird();
    bird.userData.wander = {
      cx: x, cz: z, inner, outer: Math.max(inner + 1, patrolR - 1),
      angle: (i / Math.max(1, roaming)) * Math.PI * 2 + i * 0.7,
      radius: inner + (patrolR - inner) * (0.3 + ((i * 37) % 60) / 100),
      speed: 0.05 + ((i * 13) % 10) / 200,
      phase: i * 1.3,
      groundAt,
    };
    g.add(bird);
  }
  return g;
}

/** Scene direction for a map bearing (0 = north / up on the 2D map = scene -z, clockwise). */
const bearingDir = (deg: number) => {
  const r = THREE.MathUtils.degToRad(deg);
  return { x: Math.sin(r), z: -Math.cos(r) };
};

/** Camera coverage sectors around a WatchTower (3 cameras × 120°, heading 0 = camera 1 north). */
function watchtowerCoverage(item: FlagItem, layout: FlagLayout, groundAt: (x: number, z: number) => number): THREE.Group {
  const g = new THREE.Group();
  const { x, z } = center(item, layout);
  const range = item.scan?.radiusFt ?? WATCHTOWER_RANGE_FT;
  const tints = [0xcc3333, 0xe8a020, 0xc8b882];
  for (let cam = 0; cam < 3; cam++) {
    const c = cam * 120;
    // CircleGeometry angles run counter-clockwise from +x in the plane's local XY; after
    // rotating flat, local angle θ points along bearing 90° - θ.
    const sector = new THREE.Mesh(
      new THREE.CircleGeometry(range, 40, THREE.MathUtils.degToRad(90 - (c + 60)), THREE.MathUtils.degToRad(120)),
      new THREE.MeshBasicMaterial({ color: tints[cam], transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide }),
    );
    sector.rotation.x = -Math.PI / 2;
    sector.position.set(x, groundAt(x, z) + 0.15, z);
    g.add(sector);
    const edge = bearingDir(c + 60);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, groundAt(x, z) + 0.2, z),
        new THREE.Vector3(x + edge.x * range, groundAt(x + edge.x * range, z + edge.z * range) + 0.2, z + edge.z * range)]),
      new THREE.LineBasicMaterial({ color: 0xcc3333, transparent: true, opacity: 0.35 }),
    );
    g.add(line);
  }
  g.name = 'watchtower-coverage';
  return g;
}

/** A predator detection placed by bearing (and distance) from its tower. */
function predatorMarker(flag: YardFlag, item: FlagItem, layout: FlagLayout, groundAt: (x: number, z: number) => number): THREE.Group {
  const { x, z } = center(item, layout);
  const range = item.scan?.radiusFt ?? WATCHTOWER_RANGE_FT;
  const d = flag.distanceFt ?? range * 0.6;
  const dir = bearingDir(flag.bearingDeg ?? 0);
  return sightingMarker(flag, { x: x + dir.x * d, z: z + dir.z * d }, groundAt, { x, z });
}

/**
 * An animal / plant sighting at a scene position, with an optional dashed sight line
 * from the device that saw it (a WatchTower).
 */
function sightingMarker(flag: YardFlag, at: { x: number; z: number }, groundAt: (x: number, z: number) => number,
  from?: { x: number; z: number }): THREE.Group {
  const g = new THREE.Group();
  const px = at.x, pz = at.z, py = groundAt(px, pz);
  const active = flag.status === 'active';
  const leak = flag.finding === 'leak';
  const color = new THREE.Color(active ? findingColor(flag) : '#8A7D55');
  if (from) {
    g.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(from.x, groundAt(from.x, from.z) + 4, from.z), new THREE.Vector3(px, py + 0.6, pz)]),
      new THREE.LineDashedMaterial({ color, dashSize: 1, gapSize: 0.6, transparent: true, opacity: active ? 0.8 : 0.3 }),
    ).computeLineDistances());
  }
  if (leak) {
    // A leak is a puddle on the ground plus a droplet above it.
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(active ? 1.6 : 0.8, 28),
      new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.6, roughness: 0.05, metalness: 0.2, depthWrite: false }));
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(px, py + 0.05, pz);
    g.add(puddle);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(active ? 0.45 : 0.25, 16, 12),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: active ? 0.5 : 0.1 }));
    drop.scale.y = 1.4;
    drop.position.set(px, py + 1.1, pz);
    g.add(drop);
  } else {
    const body = new THREE.Mesh(new THREE.SphereGeometry(active ? 0.7 : 0.35, 16, 12),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: active ? 0.6 : 0.1 }));
    body.position.set(px, py + 0.7, pz);
    g.add(body);
  }
  if (active) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.2, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(px, py + 0.08, pz);
    ring.userData.pulse = true;
    g.add(ring);
    const mins = Math.max(0, Math.round((Date.now() - flag.ts) / 60000));
    const label = makeTextSprite({
      title: `${flag.label ?? 'Predator'}${flag.confidence != null ? ` ${Math.round(flag.confidence * 100)}%` : ''}`,
      subtitle: `${mins ? `${mins} min ago` : 'just now'}${flag.distanceFt != null ? ` · ~${Math.round(flag.distanceFt)} ft` : ''}`,
      accent: active ? findingColor(flag) : FLAG_COLORS.alert, screenSize: 0.045,
    });
    label.position.set(px, py + 2.4, pz);
    label.userData.bob = { base: py + 2.4, phase: 1 };
    g.add(label);
  }
  g.userData.flagId = `${flag.deviceId}:${flag.id}`;
  return g;
}

/**
 * Build the flag group for the current flags.
 *
 * @param flags  - Flags resolved to layout items
 * @param items  - Items as placed on the map (feet)
 * @param layout - Property size
 */
export function buildYardFlags(flags: YardFlag[], items: FlagItem[], layout: FlagLayout,
  groundAt: (x: number, z: number) => number = () => 0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'yard-flags';
  const byId = new Map(items.map((i) => [i.id, i]));
  // WatchTower camera coverage is always shown so detections have context.
  items.filter((i) => i.type === 'watchtower').forEach((i) => group.add(watchtowerCoverage(i, layout, groundAt)));
  for (const flag of flags) {
    const item = byId.get(flag.itemId);
    if (!item) continue;
    let obj: THREE.Object3D | null = null;
    if (flag.type === 'alert' && flag.bearingDeg != null && item.type === 'watchtower') {
      group.add(predatorMarker(flag, item, layout, groundAt)); // placed in scene coords already
      continue;
    }
    // Sightings from robots: by property position (mobile robots) or bed position (garden robots).
    if (flag.type === 'alert' && (flag.propFt || flag.bedMm)) {
      const at = flag.propFt
        ? { x: flag.propFt.x - layout.property.widthFt / 2, z: flag.propFt.y - layout.property.depthFt / 2 }
        : bedMmToScene(item, layout, flag.bedMm!);
      group.add(sightingMarker(flag, at, groundAt));
      continue;
    }
    if (flag.type === 'weed_detected') obj = weedPin(flag, item, layout);
    else if (flag.type === 'headcount') obj = roostHeadcount(flag, item, layout, groundAt);
    else if (flag.status === 'active' || flag.status === 'pending_review') obj = stationFlag(flag, item, layout);
    if (!obj) continue;
    // Stand on the terrain: station flags / pins at their own spot, gardens level at the bed centre.
    if (flag.type !== 'headcount') {
      const c = center(item, layout);
      // Bed weeds level with the bed centre; rover weeds stand on the ground where they grow.
      obj.position.y = flag.type === 'weed_detected' && !flag.propFt ? groundAt(c.x, c.z) : groundAt(obj.position.x, obj.position.z);
    }
    group.add(obj);
  }
  return group;
}

/** Per-frame animation: bob labels, wave pennants, pulse weed rings, walk birds. */
export function animateYardFlags(group: THREE.Object3D, tSec: number): void {
  group.traverse((o) => {
    const d = o.userData;
    if (d.bob) o.position.y = d.bob.base + Math.sin(tSec * 2 + d.bob.phase) * 0.18;
    if (d.wave) o.rotation.y = Math.sin(tSec * 3) * 0.25;
    if (d.pulse) { const s = 1 + ((tSec * 0.8) % 1) * 1.6; o.scale.set(s, s, s); (o as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>).material.opacity = 0.85 * (1 - ((tSec * 0.8) % 1)); }
    if (d.wander) {
      const w = d.wander;
      const angle = w.angle + tSec * w.speed;
      const r = Math.min(w.outer, Math.max(w.inner, w.radius + Math.sin(tSec * 0.4 + w.phase) * 1.5));
      const bx = w.cx + Math.cos(angle) * r, bz = w.cz + Math.sin(angle) * r;
      o.position.set(bx, w.groundAt ? w.groundAt(bx, bz) : 0, bz);
      // Face the direction of travel; peck now and then.
      o.rotation.y = -angle - Math.PI / 2;
      const head = o.children[1];
      if (head) head.position.y = 0.72 - Math.max(0, Math.sin(tSec * 3 + w.phase)) * 0.25;
    }
  });
}

/** Free GPU resources of a flag group. */
export function disposeYardFlags(group: THREE.Object3D): void {
  group.traverse((o) => {
    const mesh = o as THREE.Mesh | THREE.Sprite;
    if ('geometry' in mesh && mesh.geometry) mesh.geometry.dispose();
    const mat = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((m) => {
      (m as THREE.SpriteMaterial).map?.dispose();
      m.dispose();
    });
  });
}
