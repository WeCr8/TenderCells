// CoopDemoPage.tsx - /demo/coop: Chicken Tender coop (CT_COOP_A) in 3D with the
// DoorCell V1.4 rack-and-pinion slide door, tier switch and a simulated E-STOP.
//
// Models: public/models/chicken-tender/CT_COOP_A_showcase_{base,starter,plus,pro}.glb
// (exported from cad/chicken-tender-coop, door closed at t=0). Parts are in mm under
// a root node with scale 0.001 (so the scene is in metres) and a -90° X rotation.
// The embedded "day_in_the_coop_and_build" animation is NOT played: node rest poses
// are the assembled coop, and the door is driven here from doorKinematics.ts.
//
// Query params (handy for screenshots/tests): ?tier=base|starter|plus|pro&door=<mm>&view=overview|door|flock
// set the tier (default Plus, or Starter on phones / data saver), an instant initial door travel and the camera preset. The years simulator takes
// &years=1..5&week=<0-based>&loc=socal|midwest|north&light=1.
//
// Flock: the GLBs carry 4 hens (hen1 Leghorn white, hen2 Australorp black, hen3 barred Rock grey,
// hen4 buff Orpington; sc_params HEN_BREEDS). At rest they stand on the bedding inside the closed
// house where nobody can see them, so the viewer moves them out into the run (HEN_RUN_SPOTS).
// The "Coop through the years" panel (lib/coop/yearsSim.ts) drives season lighting and which
// hens are shown.
// The pop door sits on the house wall that faces the run (CAD y ~2.4 m), so the
// "Door close-up" view looks at it from inside the run.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Alert, Box, Button, Chip, LinearProgress, Paper, Slider, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { createGltfLoader, describeModelLoadError } from '../lib/three/gltfLoader';
import { COOP_TIERS, FULL_COOP_TIER, LIGHT_COOP_TIER, prefersLightCoop, showcaseCoopUrl, type CoopTier } from '../lib/coop/showcaseModel';
import CoopYearsPanel, { type LocationId } from '../components/demo/CoopYearsPanel';
import { BREEDS, BREED_IDS, DEFAULT_CONFIG, LOCATIONS, SEASON_TINT, simulateYears, type BreedId } from '../lib/coop/yearsSim';
import {
  DOOR_TRAVEL_MAX_MM,
  DOOR_TRAVEL_MIN_MM,
  clampTravel,
  doorStatus,
  doorTransforms,
  stepTravel,
  type Vec3,
} from '../lib/coop/doorKinematics';

const C = {
  bg: '#0D2B1E',
  surface: '#1A3D2B',
  accent: '#4A7C59',
  gold: '#C8B882',
  goldMuted: '#8A7D55',
  warning: '#E8A020',
  danger: '#CC3333',
  white: '#F0EDE4',
};

const TIER_LABEL: Record<CoopTier, string> = { base: 'Base', starter: 'Starter', plus: 'Plus', pro: 'Pro' };

/** Simulated DoorCell speed: full 280 mm stroke in 4 s. */
const DOOR_SPEED_MM_PER_S = 70;

const tierUrl = showcaseCoopUrl;

const isTier = (v: string | null): v is CoopTier => !!v && (COOP_TIERS as readonly string[]).includes(v);

type CameraView = 'overview' | 'door' | 'flock';

/** Where each hen stands in the run (CAD mm, z = run floor) and which way she faces (rad about CAD Z).
 * Clear of the ramp (x ~460-760, y > 1700), the feeder (x 230, y 581) and the gate. */
const HEN_RUN_SPOTS: Record<string, { x: number; y: number; yaw: number }> = {
  hen1: { x: 900, y: 1300, yaw: 0.6 },
  hen2: { x: 380, y: 1100, yaw: -1.2 },
  hen3: { x: 780, y: 800, yaw: 2.4 },
  hen4: { x: 330, y: 1650, yaw: -0.3 },
};

/** Hen part nodes by hen id (hen1..hen4); each hen is 3 meshes sharing one origin. */
function findHens(root: THREE.Object3D): Map<string, THREE.Object3D[]> {
  const out = new Map<string, THREE.Object3D[]>();
  root.traverse((o) => {
    const m = /^(hen\d)\|/.exec(o.name);
    if (m) out.set(m[1], [...(out.get(m[1]) ?? []), o]);
  });
  return out;
}

/** Move the hens from inside the house out into the run (once per loaded model). */
function placeHensInRun(root: THREE.Object3D, hens: Map<string, THREE.Object3D[]>) {
  if (root.userData.hensPlaced) return;
  root.userData.hensPlaced = true;
  hens.forEach((parts, id) => {
    const spot = HEN_RUN_SPOTS[id];
    if (!spot) return;
    parts.forEach((o) => {
      o.position.set(spot.x, spot.y, 0);
      o.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), spot.yaw);
    });
  });
}

const isLocation = (v: string | null): v is LocationId => !!v && LOCATIONS.some((l) => l.id === v);

type DoorRig = {
  doors: THREE.Object3D[];
  doorBase: THREE.Vector3[];
  pinions: THREE.Object3D[];
  pinionCenter: Vec3;
};

/** Top-level nodes whose name starts with `prefix` (skip children of a matched node). */
function findParts(root: THREE.Object3D, prefix: string): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (o.name.startsWith(prefix) && !(o.parent && o.parent.name.startsWith(prefix))) out.push(o);
  });
  return out;
}

function buildRig(scene: THREE.Object3D): DoorRig | null {
  const doors = findParts(scene, 'pop_door');
  const pinions = findParts(scene, 'door_pinion');
  if (!doors.length) return null;
  scene.updateMatrixWorld(true);
  let pinionCenter: Vec3 = [0, 0, 0];
  if (pinions.length && pinions[0].parent) {
    const box = new THREE.Box3();
    pinions.forEach((p) => box.expandByObject(p));
    const c = box.getCenter(new THREE.Vector3());
    pinions[0].parent.worldToLocal(c); // world (m) -> parent space (mm)
    pinionCenter = [c.x, c.y, c.z];
  }
  return { doors, doorBase: doors.map((d) => d.position.clone()), pinions, pinionCenter };
}

function applyRig(rig: DoorRig, travelMm: number) {
  const t = doorTransforms(travelMm, rig.pinionCenter);
  rig.doors.forEach((d, i) => {
    const b = rig.doorBase[i];
    d.position.set(b.x + t.doorPosition[0], b.y + t.doorPosition[1], b.z + t.doorPosition[2]);
  });
  rig.pinions.forEach((p) => {
    p.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.pinionAngle);
    p.position.set(t.pinionPosition[0], t.pinionPosition[1], t.pinionPosition[2]);
  });
}

export default function CoopDemoPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialTier: CoopTier = isTier(params.get('tier')) ? (params.get('tier') as CoopTier)
    // Phones / data saver start on the ~3.4 MB Starter file instead of the ~6.3 MB Plus file.
    : prefersLightCoop() ? LIGHT_COOP_TIER : FULL_COOP_TIER;
  const initialDoor = clampTravel(Number(params.get('door') ?? 0) || 0);
  const qView = params.get('view');
  const initialView: CameraView = qView === 'door' || qView === 'flock' ? qView : 'overview';
  const qYears = Math.round(Number(params.get('years')));
  const initialYears = qYears >= 1 && qYears <= 5 ? qYears : DEFAULT_CONFIG.years;
  const initialWeek = Math.max(0, Math.min(initialYears * 52 - 1, Math.round(Number(params.get('week')) || 0)));
  const initialLoc: LocationId = isLocation(params.get('loc')) ? (params.get('loc') as LocationId) : 'socal';

  const [tier, setTier] = useState<CoopTier>(initialTier);
  const [target, setTarget] = useState(initialDoor);
  const [travel, setTravel] = useState(initialDoor);
  const [estop, setEstop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedTier, setLoadedTier] = useState<CoopTier | null>(null);
  const [view, setView] = useState<CameraView>(initialView);
  // Coop through the years (estimate).
  const [years, setYears] = useState(initialYears);
  const [loc, setLoc] = useState<LocationId>(initialLoc);
  const [coopLight, setCoopLight] = useState(params.get('light') === '1');
  const [flock, setFlock] = useState<BreedId[]>([...BREED_IDS]);
  const [weekIdx, setWeekIdx] = useState(initialWeek);
  const [playing, setPlaying] = useState(false);
  const latitude = LOCATIONS.find((l) => l.id === loc)?.latitude ?? DEFAULT_CONFIG.latitude;
  const simWeeks = useMemo(
    () => simulateYears({ ...DEFAULT_CONFIG, years, latitude, coopLight, flock, tier }),
    [years, latitude, coopLight, flock, tier],
  );
  const simWeek = simWeeks[Math.min(weekIdx, simWeeks.length - 1)];
  const viewRef = useRef<CameraView>(initialView);
  const framedRef = useRef(false);

  const mountRef = useRef<HTMLDivElement>(null);
  const travelRef = useRef(initialDoor);
  const targetRef = useRef(initialDoor);
  const estopRef = useRef(false);
  const rigRef = useRef<DoorRig | null>(null);
  const hensRef = useRef<Map<string, THREE.Object3D[]>>(new Map());
  const lightsRef = useRef<{ scene: THREE.Scene; hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight; ground: THREE.MeshStandardMaterial } | null>(null);
  const holderRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cacheRef = useRef(new Map<CoopTier, THREE.Group>());
  const loader = useMemo(() => createGltfLoader(), []); // shared Draco/Meshopt-capable loader

  targetRef.current = target;
  estopRef.current = estop;

  // Three.js scene, created once.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth || 800;
    const h = mount.clientHeight || 520;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(C.bg);
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.05, 200);
    camera.position.set(3.5, 2.6, -5.5);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0.6, 1.1, -1.2);
    controlsRef.current = controls;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x2a3a2a, 1.4);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(4, 8, -6);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-5, 3, 5);
    scene.add(fill);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x24402f, roughness: 1 });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(8, 48), groundMat);
    lightsRef.current = { scene, hemi, sun, ground: groundMat };
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.002;
    scene.add(ground);

    const holder = new THREE.Group();
    scene.add(holder);
    holderRef.current = holder;

    let raf = 0;
    let last = performance.now();
    let lastUi = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const next = stepTravel(travelRef.current, targetRef.current, DOOR_SPEED_MM_PER_S, dt, estopRef.current);
      if (next !== travelRef.current) {
        travelRef.current = next;
        if (rigRef.current) applyRig(rigRef.current, next);
      }
      if (now - lastUi > 80) {
        lastUi = now;
        setTravel((prev) => (Math.abs(prev - travelRef.current) > 0.01 ? travelRef.current : prev));
      }
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      const nw = mount.clientWidth || w;
      const nh = mount.clientHeight || h;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      holderRef.current = null;
      lightsRef.current = null;
    };
  }, []);

  // Camera presets. Overview: 3/4 view of the whole coop. Door: the pop door from inside the run.
  const frameCamera = useCallback((v: CameraView) => {
    const holder = holderRef.current;
    const cam = cameraRef.current;
    const ctl = controlsRef.current;
    if (!holder || !cam || !ctl || !holder.children.length) return;
    const box = new THREE.Box3().setFromObject(holder);
    const size = box.getSize(new THREE.Vector3()).length();
    cam.near = size / 400;
    cam.far = size * 20;
    const rig = rigRef.current;
    if (v === 'door' && rig) {
      const db = new THREE.Box3();
      rig.doors.forEach((d) => db.expandByObject(d));
      const c = db.getCenter(new THREE.Vector3());
      // Aim at the middle of the whole stroke (closed centre + 140 mm) so the camera does not
      // follow the door: world X == CAD X, and the root scale is 0.001 (mm -> m).
      c.x += (DOOR_TRAVEL_MAX_MM / 2 - travelRef.current) / 1000;
      ctl.target.copy(c);
      // +Z (glTF) is the run side of the house wall; sit ~1 m out, a little high and to the side.
      cam.position.set(c.x + 0.3, c.y + 0.25, c.z + 1.05);
    } else if (v === 'flock') {
      // The run: CAD x 0-1219, y 0-2438 mm, floor z 0 -> world (x, 0, -y) in metres.
      const c = new THREE.Vector3(0.62, 0.25, -1.25);
      ctl.target.copy(c);
      cam.position.set(c.x + 2.3, c.y + 1.5, c.z + 1.4);
    } else {
      const c = box.getCenter(new THREE.Vector3());
      ctl.target.copy(c);
      cam.position.set(c.x + size * 0.55, c.y + size * 0.3, c.z - size * 0.85);
    }
    cam.updateProjectionMatrix();
    ctl.update();
  }, []);

  const chooseView = useCallback((v: CameraView) => {
    viewRef.current = v;
    setView(v);
    frameCamera(v);
  }, [frameCamera]);

  // Load (or reuse) the selected tier.
  useEffect(() => {
    let cancelled = false;
    const show = (model: THREE.Group) => {
      const holder = holderRef.current;
      if (!holder) return;
      holder.clear();
      holder.add(model);
      rigRef.current = buildRig(model);
      hensRef.current = findHens(model);
      placeHensInRun(model, hensRef.current);
      if (rigRef.current) applyRig(rigRef.current, travelRef.current);
      if (!framedRef.current) {
        framedRef.current = true;
        frameCamera(viewRef.current);
      }
      cacheRef.current.set(tier, model);
      setLoadedTier(tier);
      setLoading(false);
      setError(rigRef.current ? null : 'This model has no pop_door nodes, so the door cannot be animated.');
    };
    const cached = cacheRef.current.get(tier);
    if (cached) {
      show(cached);
      return;
    }
    setLoading(true);
    setProgress(null);
    setError(null);
    // Stream the 3-6 MB file so the bar shows real progress, then parse it in place.
    const url = tierUrl(tier);
    void (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const total = Number(res.headers.get('content-length')) || 0;
        let buffer: ArrayBuffer;
        const reader = res.body?.getReader();
        if (reader) {
          const chunks: Uint8Array[] = [];
          let got = 0;
          for (;;) {
            const { done, value } = await reader.read();
            if (done || cancelled) break;
            chunks.push(value);
            got += value.length;
            if (total) setProgress(Math.round((got / total) * 100));
          }
          const all = new Uint8Array(got);
          let off = 0;
          for (const ch of chunks) { all.set(ch, off); off += ch.length; }
          buffer = all.buffer;
        } else {
          buffer = await res.arrayBuffer();
        }
        if (cancelled) return;
        const gltf = await loader.parseAsync(buffer, url.slice(0, url.lastIndexOf('/') + 1));
        if (!cancelled) show(gltf.scene);
      } catch (e) {
        if (cancelled) return;
        setLoading(false);
        setError(`Could not load the ${TIER_LABEL[tier]} coop model: ${describeModelLoadError(e)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tier, loader, frameCamera]);

  // Years simulator -> 3D: season tint, sun height/strength from day length, which hens show.
  useEffect(() => {
    const l = lightsRef.current;
    if (!l || !simWeek) return;
    const tint = SEASON_TINT[simWeek.season];
    const alt = THREE.MathUtils.degToRad(Math.max(15, simWeek.sunAltitudeDeg));
    l.sun.position.set(Math.cos(alt) * 5.5, Math.sin(alt) * 10, -Math.cos(alt) * 8.3);
    l.sun.color.set(tint.sun);
    l.sun.intensity = 1.1 + Math.max(0, Math.min(1, (simWeek.dayLengthH - 9.5) / 5.5)) * 0.9;
    l.hemi.intensity = 1.15 + Math.max(0, Math.min(1, (simWeek.dayLengthH - 9.5) / 5.5)) * 0.35;
    l.ground.color.set(tint.ground);
    (l.scene.background as THREE.Color).set(tint.sky);
    const shown = new Set(flock.map((id) => BREEDS[id].henNode));
    hensRef.current.forEach((parts, id) => parts.forEach((o) => { o.visible = shown.has(id); }));
  }, [simWeek, flock, loadedTier]);

  // Playback: one week every 150 ms (a year in ~8 s); stops at the end.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setWeekIdx((i) => {
        if (i >= simWeeks.length - 1) { setPlaying(false); return i; }
        return i + 1;
      });
    }, 150);
    return () => window.clearInterval(id);
  }, [playing, simWeeks.length]);

  const status = doorStatus(travel, target, estop);
  const statusColor = status === 'E-STOP' ? C.danger : status === 'Open' ? C.accent : status === 'Closed' ? C.gold : C.warning;

  const openClose = useCallback(() => {
    setTarget(targetRef.current >= DOOR_TRAVEL_MAX_MM - 0.05 ? DOOR_TRAVEL_MIN_MM : DOOR_TRAVEL_MAX_MM);
  }, []);
  const toggleEstop = useCallback(() => {
    const engage = !estopRef.current;
    estopRef.current = engage; // freeze the render loop immediately, before React re-renders
    if (engage) setTarget(travelRef.current); // latch: door stays where it stopped
    setEstop(engage);
  }, []);

  const willOpen = target < DOOR_TRAVEL_MAX_MM - 0.05;

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100%', p: { xs: 1.5, md: 3 }, color: C.white }}>
      <Stack spacing={2} maxWidth={1280} mx="auto">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>Chicken Tender coop · DoorCell V1.4</Typography>
            <Typography sx={{ color: C.goldMuted, fontSize: 14 }}>
              CT_COOP_A in 3D: 3 nest boxes kept open for the gantry arm, the feeder beside the ramp, a mixed flock of 4 hens and the
              rack-and-pinion slide door (m1.25 z18 pinion, 0–280 mm stroke). Drag to orbit, scroll to zoom.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => navigate('/demo')} sx={{ borderColor: C.accent, color: C.accent, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
            Back to demo
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
          <Paper elevation={0} sx={{ flex: 1, bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
            <Box
              ref={mountRef}
              data-testid="coop-demo-canvas"
              data-loaded-tier={loadedTier ?? ''}
              aria-label={`3D view of the ${TIER_LABEL[tier]} Chicken Tender coop`}
              role="img"
              sx={{ width: '100%', height: { xs: 360, md: 560 } }}
            />
            {loading && (
              <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, p: 1.5, bgcolor: `${C.bg}cc` }}>
                <Typography sx={{ color: C.gold, fontSize: 13, mb: 0.5 }}>
                  Loading {TIER_LABEL[tier]} coop{progress !== null ? ` · ${progress}%` : '…'}
                </Typography>
                <LinearProgress variant={progress !== null ? 'determinate' : 'indeterminate'} value={progress ?? 0} />
              </Box>
            )}
          </Paper>

          <Paper elevation={0} sx={{ width: { md: 340 }, bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography sx={{ color: C.gold, fontWeight: 700, mb: 1 }}>Tier</Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={tier}
                  onChange={(_, v: CoopTier | null) => v && setTier(v)}
                  aria-label="Coop tier"
                  sx={{ '& .MuiToggleButton-root': { color: C.goldMuted, borderColor: `${C.accent}88` }, '& .Mui-selected': { color: `${C.white} !important`, bgcolor: `${C.accent} !important` } }}
                >
                  {COOP_TIERS.map((t) => (
                    <ToggleButton key={t} value={t} data-testid={`tier-${t}`}>{TIER_LABEL[t]}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              <Box>
                <Typography sx={{ color: C.gold, fontWeight: 700, mb: 1 }}>View</Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={view}
                  onChange={(_, v: CameraView | null) => v && chooseView(v)}
                  aria-label="Camera view"
                  sx={{ '& .MuiToggleButton-root': { color: C.goldMuted, borderColor: `${C.accent}88` }, '& .Mui-selected': { color: `${C.white} !important`, bgcolor: `${C.accent} !important` } }}
                >
                  <ToggleButton value="overview" data-testid="view-overview">Overview</ToggleButton>
                  <ToggleButton value="door" data-testid="view-door">Door close-up</ToggleButton>
                  <ToggleButton value="flock" data-testid="view-flock">Hens</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography sx={{ color: C.gold, fontWeight: 700 }}>Pop door</Typography>
                  <Chip size="small" label="Simulated" variant="outlined" sx={{ color: C.goldMuted, borderColor: C.goldMuted }} />
                </Stack>
                <Typography
                  data-testid="coop-door-status"
                  data-travel={travel.toFixed(1)}
                  data-status={status}
                  role="status"
                  aria-live="polite"
                  sx={{ color: statusColor, fontWeight: 700, fontSize: 20 }}
                >
                  {status} · {travel.toFixed(0)} mm
                </Typography>
                <Typography sx={{ color: C.goldMuted, fontSize: 12, mb: 1 }}>
                  Pinion {((travel / 11.25) * (180 / Math.PI)).toFixed(0)}° ({(travel / (2 * Math.PI * 11.25)).toFixed(2)} turns)
                </Typography>
                <Slider
                  value={target}
                  min={DOOR_TRAVEL_MIN_MM}
                  max={DOOR_TRAVEL_MAX_MM}
                  step={1}
                  disabled={estop}
                  onChange={(_, v) => setTarget(clampTravel(Array.isArray(v) ? v[0] : v))}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v} mm`}
                  marks={[{ value: 0, label: '0' }, { value: 140, label: '140' }, { value: 280, label: '280 mm' }]}
                  aria-label="Door travel target (mm)"
                  sx={{ color: C.accent, mx: 2, width: 'calc(100% - 32px)', '& .MuiSlider-markLabel': { color: C.goldMuted } }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  disabled={estop}
                  onClick={openClose}
                  data-testid="coop-door-toggle"
                  sx={{ mt: 1, bgcolor: C.accent, '&:hover': { bgcolor: '#5a8c69' } }}
                >
                  {willOpen ? 'Open door' : 'Close door'}
                </Button>
              </Box>

              <Box>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={toggleEstop}
                  data-testid="coop-estop"
                  aria-pressed={estop}
                  sx={{ bgcolor: estop ? '#7a1f1f' : C.danger, fontWeight: 800, letterSpacing: 1, '&:hover': { bgcolor: '#a82828' } }}
                >
                  {estop ? 'Reset E-STOP' : 'E-STOP'}
                </Button>
                <Typography sx={{ color: C.goldMuted, fontSize: 12, mt: 0.75 }}>
                  Simulated E-STOP: freezes door motion in this viewer only. It does not talk to real hardware.
                </Typography>
                {estop && (
                  <Alert severity="error" variant="filled" sx={{ mt: 1 }} data-testid="coop-estop-banner">
                    E-STOP (Simulated) · door frozen at {travel.toFixed(0)} mm
                  </Alert>
                )}
              </Box>

              {error && <Alert severity="warning">{error}</Alert>}
            </Stack>
          </Paper>
        </Stack>

        <CoopYearsPanel
          weeks={simWeeks}
          index={weekIdx}
          onIndex={setWeekIdx}
          playing={playing}
          onPlaying={(v) => {
            if (v && weekIdx >= simWeeks.length - 1) setWeekIdx(0);
            setPlaying(v);
          }}
          years={years}
          onYears={(y) => { setYears(y); setWeekIdx((i) => Math.min(i, y * 52 - 1)); }}
          location={loc}
          onLocation={setLoc}
          coopLight={coopLight}
          onCoopLight={setCoopLight}
          flock={flock}
          onFlock={setFlock}
          tier={tier}
        />
      </Stack>
    </Box>
  );
}
