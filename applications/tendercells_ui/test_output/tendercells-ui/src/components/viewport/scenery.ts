// scenery.ts - sky, light, ground and surroundings for the 3D yard.
//
// FIX(2026-09-27): the sky never showed. The Sky dome was scaled to 10000 while the
// camera's far plane is 1000, so it was clipped away and the transparent canvas let
// the page's white show through; without tone mapping the sky shader is also blown
// out. The dome now sits inside the far plane, the renderer uses ACES tone mapping,
// and the yard gets terrain presets, a surrounding field, grass tufts and a tree line
// instead of a flat green slab.
import * as THREE from 'three';
import { heightAt, TERRAIN_KINDS, zoneAt, type TerrainKind, type TerrainLayers, type TerrainZone } from '../property/terrain';

export type TerrainPreset = 'lawn' | 'pasture' | 'dry' | 'snow';

export const TERRAIN_PRESETS: Record<TerrainPreset, {
  label: string;
  base: string;          // ground base colour
  blades: [number, number, number, number, number, number]; // r/g/b min & range for speckle
  patch: string;         // worn / bare patch colour
  surround: number;      // colour of the field beyond the property
  tuft: number;          // grass tuft colour
  tufts: number;         // tufts per 100 sq ft
  stripes: boolean;      // mowing stripes
  fog: number;
}> = {
  lawn:    { label: 'Lawn',    base: '#3f7d3a', blades: [40, 30, 95, 70, 40, 25], patch: 'rgba(122,82,45,0.55)', surround: 0x4d7f3d, tuft: 0x4f8f3c, tufts: 3,  stripes: true,  fog: 0xcfe3f2 },
  pasture: { label: 'Pasture', base: '#56803a', blades: [60, 40, 100, 70, 35, 25], patch: 'rgba(140,110,60,0.6)', surround: 0x6b8a44, tuft: 0x7a9a45, tufts: 9,  stripes: false, fog: 0xd6e4ea },
  dry:     { label: 'Dry dirt', base: '#8c7650', blades: [120, 50, 100, 45, 60, 30], patch: 'rgba(96,70,42,0.7)', surround: 0x9b865d, tuft: 0x8a8a4a, tufts: 2, stripes: false, fog: 0xe8e0cf },
  snow:    { label: 'Snow',    base: '#e9eef2', blades: [210, 40, 215, 35, 225, 30], patch: 'rgba(120,110,100,0.35)', surround: 0xf2f5f7, tuft: 0x9aa58f, tufts: 1, stripes: false, fog: 0xe6ecf1 },
};

/**
 * Gradient sky dome: deep blue overhead, pale blue at the horizon, soft sun glow.
 * Not tone-mapped or fogged, so it reads as a clear blue sky on every GPU (the
 * physical Sky shader washed out to white near the horizon).
 */
function createSkyDome(radius: number, sunDir: THREE.Vector3, preset: TerrainPreset): THREE.Mesh {
  const overcast = preset === 'snow';
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    uniforms: {
      zenith: { value: new THREE.Color(overcast ? 0x7ea6c8 : 0x2f7fd0) },
      horizon: { value: new THREE.Color(overcast ? 0xdde7ef : 0xbfe0f7) },
      ground: { value: new THREE.Color(0xa9c7a0) },
      sunDir: { value: sunDir.clone().normalize() },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 zenith; uniform vec3 horizon; uniform vec3 ground; uniform vec3 sunDir;
      varying vec3 vDir;
      void main() {
        float h = vDir.y;
        vec3 col = h >= 0.0 ? mix(horizon, zenith, pow(clamp(h, 0.0, 1.0), 0.55)) : mix(horizon, ground, clamp(-h * 6.0, 0.0, 1.0));
        float sun = max(dot(normalize(vDir), sunDir), 0.0);
        col += vec3(1.0, 0.93, 0.75) * (pow(sun, 400.0) * 1.2 + pow(sun, 12.0) * 0.18);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), material);
  dome.name = 'sky-dome';
  dome.renderOrder = -1;
  return dome;
}

/** Small deterministic RNG so the scenery does not reshuffle on every rebuild. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function groundTexture(preset: TerrainPreset): THREE.CanvasTexture {
  const p = TERRAIN_PRESETS[preset];
  const rnd = seeded(7);
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, s, s);
  if (p.stripes) {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x < s; x += 64) ctx.fillRect(x, 0, 32, s);
  }
  const [r0, rr, g0, gr, b0, br] = p.blades;
  for (let i = 0; i < 3200; i++) {
    ctx.fillStyle = `rgb(${r0 + rnd() * rr},${g0 + rnd() * gr},${b0 + rnd() * br})`;
    ctx.fillRect(rnd() * s, rnd() * s, 1, 1 + rnd() * 2);
  }
  for (let i = 0; i < 5; i++) {
    const x = rnd() * s, y = rnd() * s, r = 10 + rnd() * 22;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, p.patch);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface SceneryOptions {
  widthFt: number;
  depthFt: number;
  viewMode: '2d' | '3d';
  preset: TerrainPreset;
  cameraFar: number;
  /** Terrain zones + elevation (property coords); omitted = flat single-preset yard. */
  terrain?: TerrainLayers;
}

/** Scene-space ground height function: (sceneX, sceneZ) -> y, feet. */
export type SceneHeightFn = (x: number, z: number) => number;

/**
 * Ground height in scene coordinates (the scene is centred on the property).
 *
 * @param terrain - Zones / elevation points / grid in property feet
 * @param widthFt - Property width
 * @param depthFt - Property depth
 */
export function sceneHeightFn(terrain: TerrainLayers | undefined, widthFt: number, depthFt: number): SceneHeightFn {
  if (!terrain) return () => 0;
  return (x, z) => heightAt(terrain, x + widthFt / 2, z + depthFt / 2);
}

const GRASSY: ReadonlySet<TerrainKind> = new Set(['lawn', 'pasture', 'woods', 'wetland']);

function zoneTexture(kind: TerrainKind): THREE.CanvasTexture {
  const rnd = seeded(kind.length * 97 + kind.charCodeAt(0));
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  const base = new THREE.Color(TERRAIN_KINDS[kind].color);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, s, s);
  const coarse = kind === 'gravel' || kind === 'mulch' || kind === 'woods';
  for (let i = 0; i < (coarse ? 1400 : 2200); i++) {
    const k = 0.75 + rnd() * 0.5;
    ctx.fillStyle = `rgb(${Math.min(255, base.r * 255 * k)},${Math.min(255, base.g * 255 * k)},${Math.min(255, base.b * 255 * k)})`;
    const w = coarse ? 1 + rnd() * (kind === 'mulch' ? 5 : 2.5) : 1;
    ctx.fillRect(rnd() * s, rnd() * s, w, coarse ? 1 + rnd() * 2 : 1 + rnd() * 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** One zone draped over the terrain, slightly above the ground to avoid z-fighting. */
function zoneMesh(zone: TerrainZone, W: number, D: number, h: SceneHeightFn): THREE.Mesh {
  let geo: THREE.BufferGeometry;
  if (zone.polygon && zone.polygon.length >= 3) {
    // Shape in the plane's local XY (local y = -scene z).
    const shape = new THREE.Shape(zone.polygon.map((p) => new THREE.Vector2(p.x - W / 2, -(p.y - D / 2))));
    geo = new THREE.ShapeGeometry(shape);
  } else {
    const segX = Math.max(2, Math.min(64, Math.round(zone.width))), segY = Math.max(2, Math.min(64, Math.round(zone.depth)));
    geo = new THREE.PlaneGeometry(zone.width, zone.depth, segX, segY);
    geo.translate(zone.x + zone.width / 2 - W / 2, -(zone.y + zone.depth / 2 - D / 2), 0);
  }
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, h(pos.getX(i), -pos.getY(i)) + 0.05);
  // World-scale UVs so texture density matches across zones of any size.
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) { uv[i * 2] = pos.getX(i) / 6; uv[i * 2 + 1] = pos.getY(i) / 6; }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map: zoneTexture(zone.kind), roughness: zone.kind === 'paved' ? 0.8 : 1,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.name = `terrain-zone-${zone.id}`;
  return mesh;
}

/**
 * Add sky, lights, ground and surroundings to a yard scene.
 *
 * @param scene    - Scene to populate
 * @param renderer - Renderer (tone mapping is configured here)
 * @param opts     - Property size, view mode, terrain preset, camera far plane
 * @returns The yard ground mesh (items sit on it)
 */
export function buildScenery(scene: THREE.Scene, renderer: THREE.WebGLRenderer, opts: SceneryOptions): THREE.Mesh {
  const { widthFt: W, depthFt: D, viewMode, preset, terrain } = opts;
  const p = TERRAIN_PRESETS[preset];
  const span = Math.max(W, D);
  const h = sceneHeightFn(terrain, W, D);
  const detailed = !!terrain && !!(terrain.elevationPoints?.length || terrain.elevationGrid || terrain.terrainZones?.some((z) => z.elevationFt));

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = viewMode === '3d' ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  renderer.toneMappingExposure = 0.95;

  // Light: sky/ground bounce + a sun that matches the sky's sun direction.
  const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(55), THREE.MathUtils.degToRad(35));
  scene.add(new THREE.HemisphereLight(0xcfe6ff, preset === 'snow' ? 0xdfe6ea : 0x4a5f32, viewMode === '3d' ? 1.6 : 1.1));
  const sun = new THREE.DirectionalLight(0xfff4e0, viewMode === '3d' ? 2.4 : 1.2);
  sun.position.copy(sunDir).multiplyScalar(span);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -span * 0.7; sc.right = span * 0.7; sc.top = span * 0.7; sc.bottom = -span * 0.7;
  sc.near = 1; sc.far = span * 3;
  scene.add(sun);

  if (viewMode === '3d') {
    scene.add(createSkyDome(opts.cameraFar * 0.8, sunDir, preset)); // inside the far plane
    scene.background = new THREE.Color(0x8fc3ec); // fallback if the shader fails
    scene.fog = new THREE.Fog(p.fog, span * 1.4, span * 4.2);
  }

  // Surrounding field so the yard does not float in space.
  const surround = new THREE.Mesh(
    new THREE.CircleGeometry(span * 4, 64),
    new THREE.MeshStandardMaterial({ color: p.surround, roughness: 1 }),
  );
  surround.rotation.x = -Math.PI / 2;
  surround.position.y = -0.05;
  surround.receiveShadow = true;
  scene.add(surround);

  // The property itself (textured, gently undulating, plus any elevation).
  const tex = groundTexture(preset);
  tex.repeat.set(Math.max(2, Math.round(W / 12)), Math.max(2, Math.round(D / 12)));
  const seg = detailed ? Math.min(160, Math.max(48, Math.round(span))) : 48;
  const geo = new THREE.PlaneGeometry(W, D, seg, seg);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, (Math.sin(x * 0.18) + Math.cos(y * 0.21)) * 0.12 + h(x, -y));
  }
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Terrain zones (garden soil, mulch, gravel ...) draped over the ground.
  (terrain?.terrainZones ?? []).forEach((z) => scene.add(zoneMesh(z, W, D, h)));

  if (viewMode === '2d') return ground;

  const rnd = seeded(Math.round(W * 31 + D));

  // Grass tufts (instanced - one draw call).
  const tuftCount = Math.min(2500, Math.round((W * D) / 100 * p.tufts));
  if (tuftCount > 0) {
    const tufts = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.12, 0.45, 5),
      new THREE.MeshStandardMaterial({ color: p.tuft, roughness: 1 }),
      tuftCount,
    );
    const m = new THREE.Matrix4();
    let placed = 0;
    for (let i = 0; i < tuftCount; i++) {
      const s = 0.6 + rnd() * 0.9;
      const tx = (rnd() - 0.5) * W, tz = (rnd() - 0.5) * D;
      // No grass tufts on gravel, mulch, soil, sand or paving.
      const zone = terrain ? zoneAt(terrain, tx + W / 2, tz + D / 2) : undefined;
      if (zone && !GRASSY.has(zone.kind)) continue;
      m.compose(
        new THREE.Vector3(tx, 0.18 * s + h(tx, tz), tz),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rnd() * Math.PI, (rnd() - 0.5) * 0.4)),
        new THREE.Vector3(s, s, s),
      );
      tufts.setMatrixAt(placed++, m);
    }
    tufts.count = placed;
    tufts.receiveShadow = true;
    scene.add(tufts);
  }

  // Tree line around the property (instanced trunks + canopies).
  const trees = 70;
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.5, 4, 6), new THREE.MeshStandardMaterial({ color: 0x5b4028 }), trees);
  const canopy = new THREE.InstancedMesh(
    new THREE.ConeGeometry(2.4, 7, 7),
    new THREE.MeshStandardMaterial({ color: preset === 'snow' ? 0x4f6b58 : 0x2f5d34, roughness: 0.9 }),
    trees,
  );
  const m = new THREE.Matrix4();
  for (let i = 0; i < trees; i++) {
    const a = (i / trees) * Math.PI * 2 + rnd() * 0.08;
    const r = span * (0.95 + rnd() * 0.9);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const s = 0.8 + rnd() * 0.9;
    m.compose(new THREE.Vector3(x, 2 * s, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
    trunks.setMatrixAt(i, m);
    m.compose(new THREE.Vector3(x, (4 + 3.2) * s, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
    canopy.setMatrixAt(i, m);
  }
  trunks.castShadow = canopy.castShadow = true;
  scene.add(trunks, canopy);

  // Low distant hills on the horizon.
  const hillMat = new THREE.MeshStandardMaterial({ color: preset === 'snow' ? 0xe4eaee : 0x557a47, roughness: 1 });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(span * (0.5 + rnd() * 0.4), 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), hillMat);
    hill.scale.y = 0.18 + rnd() * 0.12;
    hill.position.set(Math.cos(a) * span * 3.1, -0.5, Math.sin(a) * span * 3.1);
    scene.add(hill);
  }
  return ground;
}
