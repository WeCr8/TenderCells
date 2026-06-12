// Viewport3D.tsx - CAD-style 2D/3D property, product, and simulation viewport
import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useCoopModel } from '../../hooks/useCoopModel';
import CoopModelSelector from './CoopModelSelector';
import { getPresetModel } from '../../models/presets/coopPresets';
import { auth } from '../../lib/firebase/firebaseApp';
import { modelUploadService } from '../../services/modelUploadService';
import type { CoopModelConfig } from '../../types/coop';
import { useProducts } from '../../hooks/useProducts';
import type { Product } from '../../types/products';
import {
  ITEM_COLORS,
  PROPERTY_LAYOUT_EVENT,
  loadPropertyLayout,
  type PropertyItem,
  type PropertyLayoutState,
} from '../property/propertyLayoutStore';

type ViewMode = '2d' | '3d';
type CameraPreset = 'top' | 'left' | 'right' | 'iso';
type ControlMode = 'pan' | 'orbit';
type WorkspaceMode = 'property' | 'products' | 'simulation';

type Viewport3DProps = {
  product?: string;
  title?: string;
  initialWorkspaceMode?: WorkspaceMode;
  height?: string | number | Record<string, string | number>;
};

// Maps ProductFamily values to PropertyItem type values
const FAMILY_TO_ITEM_TYPE: Record<string, string> = {
  'chicken-tender': 'chicken-tender',
  'roaming-roost': 'roaming-roost',
  'duck-dock': 'duck-dock',
  'goat-guardian': 'goat-guardian',
  'bunny-burrow': 'bunny-burrow',
  'turkey-tower': 'turkey-tower',
  'pigeon-palace': 'pigeon-palace',
  'predator-monitor': 'watchtower',
  'watchtower': 'watchtower',
  'rail-system': 'rail-module',
  'rail-system-modules': 'rail-module',
  'sensor-pod': 'sensor',
};

const DEFAULT_SIZE_BY_TYPE: Record<string, { width: number; depth: number }> = {
  'chicken-tender': { width: 4, depth: 4 },
  'roaming-roost': { width: 3, depth: 3 },
  'duck-dock': { width: 4, depth: 4 },
  'goat-guardian': { width: 6, depth: 6 },
  'bunny-burrow': { width: 3, depth: 3 },
  'turkey-tower': { width: 4, depth: 4 },
  'pigeon-palace': { width: 4, depth: 4 },
  'watchtower': { width: 2, depth: 2 },
  'rail-module': { width: 2, depth: 1 },
  'sensor': { width: 1, depth: 1 },
};

type EnrichedItem = PropertyItem & { product?: Product };

// Device ID / product name label as a Sprite above item
const createDeviceLabel = (item: EnrichedItem): THREE.Sprite => {
  const label = item.product?.device_id || item.product?.product_name || item.name;
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 72;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 320, 72);
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  const r = 10;
  ctx.beginPath();
  ctx.moveTo(r + 4, 4);
  ctx.lineTo(316 - r, 4);
  ctx.quadraticCurveTo(316, 4, 316, 4 + r);
  ctx.lineTo(316, 68 - r);
  ctx.quadraticCurveTo(316, 68, 316 - r, 68);
  ctx.lineTo(r + 4, 68);
  ctx.quadraticCurveTo(4, 68, 4, 68 - r);
  ctx.lineTo(4, 4 + r);
  ctx.quadraticCurveTo(4, 4, r + 4, 4);
  ctx.closePath();
  ctx.fill();
  // device id in gold monospace
  const hasProduct = Boolean(item.product);
  ctx.fillStyle = hasProduct ? '#C8B882' : '#8A7D55';
  ctx.font = `bold ${hasProduct ? '22' : '18'}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.slice(0, 20), 160, hasProduct ? 26 : 36);
  if (hasProduct && item.product?.id) {
    ctx.fillStyle = '#6BBF59';
    ctx.font = '15px monospace';
    ctx.fillText(item.product.id.slice(0, 24), 160, 52);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.6, 0.9, 1);
  return sprite;
};

const createPlaceholderCoop = (model: CoopModelConfig) => {
  const group = new THREE.Group();
  const { width, depth, height } = model.dimensions;
  const color = new THREE.Color(model.placeholderColor || '#6BBF59');

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width, Math.max(height * 0.45, 1), depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.75, transparent: true, opacity: 0.82 })
  );
  base.position.y = height * 0.225;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(width, depth) * 0.72, Math.max(height * 0.28, 0.75), 4),
    new THREE.MeshStandardMaterial({ color: 0x1a3d2b, roughness: 0.65 })
  );
  roof.position.y = height * 0.58;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.22, height * 0.32, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xf0ede4, roughness: 0.7 })
  );
  door.position.set(0, height * 0.2, depth / 2 + 0.025);
  group.add(door);

  const railMaterial = new THREE.MeshStandardMaterial({ color: 0xc8b882, roughness: 0.55 });
  [-width / 2, width / 2].forEach((x) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, height * 0.18, depth * 1.12), railMaterial);
    rail.position.set(x, height * 0.12, 0);
    rail.castShadow = true;
    group.add(rail);
  });

  group.name = `${model.name} placeholder`;
  return group;
};

const createPropertyGrid = (layout: PropertyLayoutState) => {
  const group = new THREE.Group();
  const gridSize = Math.max(layout.property.widthFt, layout.property.depthFt);
  const divisions = Math.max(4, Math.round(gridSize / layout.property.gridStepFt));
  const grid = new THREE.GridHelper(gridSize, divisions, 0x6bbf59, 0x1f5c3b);
  grid.position.y = 0.01;
  group.add(grid);

  const boundary = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(layout.property.widthFt, 0.03, layout.property.depthFt)),
    new THREE.LineBasicMaterial({ color: 0xc8b882 })
  );
  boundary.position.y = 0.03;
  group.add(boundary);

  return group;
};

const propertyToScenePosition = (item: PropertyItem, layout: PropertyLayoutState) => ({
  x: item.x + item.width / 2 - layout.property.widthFt / 2,
  z: item.y + item.depth / 2 - layout.property.depthFt / 2,
});

const createYardItem = (
  item: EnrichedItem,
  layout: PropertyLayoutState,
  activeProduct: string | undefined,
  loadedGlb: THREE.Group | undefined
) => {
  const group = new THREE.Group();
  const color = new THREE.Color(ITEM_COLORS[item.type] || '#A5B1A9');
  const selected = item.type === activeProduct || (activeProduct === 'predator-monitor' && item.type === 'watchtower');
  const { x, z } = propertyToScenePosition(item, layout);

  // Use loaded GLB if available
  if (loadedGlb) {
    const clone = loadedGlb.clone();
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const scale = Math.min(item.width / Math.max(size.x, 0.01), item.depth / Math.max(size.z, 0.01), 2.5 / Math.max(size.y, 0.01));
    clone.scale.setScalar(scale);
    box.setFromObject(clone);
    const min = box.min;
    clone.position.set(x - (box.max.x + min.x) / 2, -min.y * scale * 0.5, z - (box.max.z + min.z) / 2);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    group.add(clone);
  } else {
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.68,
      transparent: item.type === 'no-go-zone',
      opacity: item.type === 'no-go-zone' ? 0.45 : 0.9,
      emissive: selected ? color.clone().multiplyScalar(0.28) : new THREE.Color(0x000000),
    });

    let mesh: THREE.Mesh;
    if (item.type === 'tree') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 4, 12), new THREE.MeshStandardMaterial({ color: 0x6a4b2b }));
      trunk.position.set(x, 2, z);
      trunk.castShadow = true;
      group.add(trunk);
      mesh = new THREE.Mesh(new THREE.SphereGeometry(Math.max(item.width, item.depth) * 0.35, 24, 16), material);
      mesh.position.set(x, 4.2, z);
    } else if (item.type === 'rock') {
      mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(Math.max(item.width, item.depth) * 0.35), material);
      mesh.position.set(x, 0.55, z);
    } else if (item.type === 'pond' || item.type === 'garden' || item.type === 'no-go-zone') {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(item.width, 0.08, item.depth), material);
      mesh.position.set(x, 0.05, z);
    } else if (item.kind === 'hardware') {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(item.width, selected ? 1.65 : 1.2, item.depth), material);
      mesh.position.set(x, selected ? 0.82 : 0.6, z);
    } else {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(item.width, 0.75, item.depth), material);
      mesh.position.set(x, 0.38, z);
    }

    mesh.name = item.product?.device_id || item.product?.id || item.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Floating device label for hardware items
  if (item.kind === 'hardware') {
    const label = createDeviceLabel(item);
    const labelHeight = loadedGlb ? 2.8 : (selected ? 2.4 : 1.9);
    label.position.set(x, labelHeight, z);
    group.add(label);
  }

  group.name = item.product?.device_id || item.product?.id || item.id;
  return group;
};

const createYardItems = (
  items: EnrichedItem[],
  layout: PropertyLayoutState,
  activeProduct: string | undefined,
  glbCache: Map<string, THREE.Group>
) => {
  const group = new THREE.Group();
  items.forEach((item) => {
    const glbKey = item.product?.id;
    const loadedGlb = glbKey ? glbCache.get(glbKey) : undefined;
    group.add(createYardItem(item, layout, activeProduct, loadedGlb));
  });
  return group;
};

const createSimulationOverlay = (layout: PropertyLayoutState) => {
  const group = new THREE.Group();
  const hardwarePoints = layout.items
    .filter((item) => item.kind === 'hardware' && item.type !== 'watchtower')
    .map((item) => {
      const { x, z } = propertyToScenePosition(item, layout);
      return new THREE.Vector3(x, 0.18, z);
    });

  const fallbackPoints = [
    new THREE.Vector3(-layout.property.widthFt * 0.3, 0.18, layout.property.depthFt * 0.25),
    new THREE.Vector3(0, 0.18, 0),
    new THREE.Vector3(layout.property.widthFt * 0.25, 0.18, -layout.property.depthFt * 0.2),
  ];
  const path = new THREE.CatmullRomCurve3(hardwarePoints.length > 1 ? hardwarePoints : fallbackPoints);
  const geometry = new THREE.TubeGeometry(path, 32, 0.045, 8, false);
  const material = new THREE.MeshStandardMaterial({ color: 0x8dd47a, emissive: 0x1f5c3b });
  group.add(new THREE.Mesh(geometry, material));
  return group;
};

const getCameraPosition = (preset: CameraPreset, mode: ViewMode, sceneSpan: number) => {
  const distance = mode === '2d' ? sceneSpan : sceneSpan * 0.9;
  switch (preset) {
    case 'top':
      return new THREE.Vector3(0, distance, 0.001);
    case 'left':
      return new THREE.Vector3(-distance, 3, 0);
    case 'right':
      return new THREE.Vector3(distance, 3, 0);
    case 'iso':
    default:
      return new THREE.Vector3(7, 6, 7);
  }
};

export default function Viewport3D({
  product = 'chicken-tender',
  title,
  initialWorkspaceMode = 'property',
  height,
}: Viewport3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [controlMode, setControlMode] = useState<ControlMode>('orbit');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(initialWorkspaceMode);
  const [layout, setLayout] = useState<PropertyLayoutState>(() => loadPropertyLayout());
  const { model, loadedScene, loading, selectPreset, updateModel } = useCoopModel();

  const { products } = useProducts();

  // GLB cache: product.id → loaded THREE.Group
  const glbCacheRef = useRef<Map<string, THREE.Group>>(new Map());
  const [glbCacheVersion, setGlbCacheVersion] = useState(0);

  // Match products to layout items; add unpositioned products
  const enrichedItems = useMemo<EnrichedItem[]>(() => {
    const familyUsedCount = new Map<string, number>();
    const productsByFamily = new Map<string, Product[]>();

    products.forEach((p) => {
      const family = p.metadata?.product_family as string | undefined;
      if (!family) return;
      if (!productsByFamily.has(family)) productsByFamily.set(family, []);
      productsByFamily.get(family)!.push(p);
    });

    const enriched: EnrichedItem[] = layout.items.map((item) => {
      const familyKey = Object.keys(FAMILY_TO_ITEM_TYPE).find(
        (k) => FAMILY_TO_ITEM_TYPE[k] === item.type
      ) || item.type;
      const prods = productsByFamily.get(familyKey) || productsByFamily.get(item.type) || [];
      const idx = familyUsedCount.get(familyKey) || 0;
      familyUsedCount.set(familyKey, idx + 1);
      return { ...item, product: prods[idx] };
    });

    // Add Firestore products that have no matching layout item
    products.forEach((p) => {
      const family = p.metadata?.product_family as string | undefined;
      if (!family) return;
      const itemType = FAMILY_TO_ITEM_TYPE[family] || family;
      const familyKey = family;
      const prods = productsByFamily.get(familyKey) || [];
      const usedCount = familyUsedCount.get(familyKey) || 0;
      const prodIdx = prods.indexOf(p);
      if (prodIdx < usedCount) return; // already matched

      const size = DEFAULT_SIZE_BY_TYPE[itemType] || { width: 3, depth: 3 };
      // Spiral offset for multiple unpositioned items
      const unpositionedIdx = prodIdx - usedCount;
      const offsetX = (unpositionedIdx % 3) * (size.width + 1);
      const offsetY = Math.floor(unpositionedIdx / 3) * (size.depth + 1);

      enriched.push({
        id: p.id,
        name: p.product_name,
        type: itemType,
        kind: 'hardware',
        x: Math.min(offsetX + 1, layout.property.widthFt - size.width - 1),
        y: Math.min(offsetY + 1, layout.property.depthFt - size.depth - 1),
        width: size.width,
        depth: size.depth,
        product: p,
      } as EnrichedItem);
    });

    return enriched;
  }, [layout, products]);

  // Load custom GLBs for products with custom_device_asset_url
  useEffect(() => {
    const loader = new GLTFLoader();
    let cancelled = false;

    const toLoad = products.filter(
      (p) => p.metadata?.custom_device_asset_url && !glbCacheRef.current.has(p.id)
    );

    if (toLoad.length === 0) return;

    let loadedCount = 0;
    toLoad.forEach((p) => {
      const url = p.metadata!.custom_device_asset_url as string;
      loader.load(
        url,
        (gltf) => {
          if (cancelled) return;
          glbCacheRef.current.set(p.id, gltf.scene);
          loadedCount++;
          if (loadedCount === toLoad.length) {
            setGlbCacheVersion((v) => v + 1);
          }
        },
        undefined,
        (err) => {
          console.warn(`Viewport3D: failed to load GLB for product ${p.id}:`, err);
          loadedCount++;
          if (loadedCount === toLoad.length) {
            setGlbCacheVersion((v) => v + 1);
          }
        }
      );
    });

    return () => { cancelled = true; };
  }, [products]);

  useEffect(() => {
    const syncLayout = (event: Event) => {
      const customEvent = event as CustomEvent<PropertyLayoutState>;
      setLayout(customEvent.detail || loadPropertyLayout());
    };

    const syncStorage = (event: StorageEvent) => {
      if (event.key) {
        setLayout(loadPropertyLayout());
      }
    };

    window.addEventListener(PROPERTY_LAYOUT_EVENT, syncLayout as EventListener);
    window.addEventListener('storage', syncStorage);
    return () => {
      window.removeEventListener(PROPERTY_LAYOUT_EVENT, syncLayout as EventListener);
      window.removeEventListener('storage', syncStorage);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;
    const aspect = width / height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x123d25);

    const cameraSpan = Math.max(layout.property.widthFt, layout.property.depthFt) * 0.58;
    const camera = viewMode === '2d'
      ? new THREE.OrthographicCamera(-cameraSpan * aspect, cameraSpan * aspect, cameraSpan, -cameraSpan, 0.1, 1000)
      : new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);
    camera.position.copy(getCameraPosition(cameraPreset, viewMode, cameraSpan));
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    const container = containerRef.current;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.enableRotate = viewMode === '3d' && controlMode === 'orbit';
    controls.enableZoom = true;
    controls.screenSpacePanning = true;
    controls.target.set(0, 1, 0);
    controls.mouseButtons = {
      LEFT: controlMode === 'pan' || viewMode === '2d' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    controls.touches = {
      ONE: controlMode === 'pan' || viewMode === '2d' ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.62);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.82);
    directionalLight.position.set(8, 10, 8);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(layout.property.widthFt, layout.property.depthFt),
      new THREE.MeshStandardMaterial({ color: 0x2d6235, roughness: 0.85 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    scene.add(createPropertyGrid(layout));

    const glbCache = glbCacheRef.current;

    if (workspaceMode === 'products' || workspaceMode === 'simulation') {
      scene.add(createYardItems(enrichedItems, layout, product, glbCache));
    } else {
      const obstacleItems = enrichedItems.filter((item) => item.kind === 'obstacle') as EnrichedItem[];
      scene.add(createYardItems(obstacleItems, layout, product, glbCache));
    }

    if (product === 'chicken-tender' && loadedScene) {
      loadedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(loadedScene);
    } else if (product === 'chicken-tender') {
      scene.add(createPlaceholderCoop(model));
    }

    if (workspaceMode === 'simulation') {
      scene.add(createSimulationOverlay(layout));
    }

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const nextWidth = containerRef.current.clientWidth;
      const nextHeight = containerRef.current.clientHeight;

      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = nextWidth / nextHeight;
      } else {
        const nextAspect = nextWidth / nextHeight;
        camera.left = -cameraSpan * nextAspect;
        camera.right = cameraSpan * nextAspect;
        camera.top = cameraSpan;
        camera.bottom = -cameraSpan;
      }

      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      controls.dispose();
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [loadedScene, model, viewMode, cameraPreset, controlMode, workspaceMode, layout, product, enrichedItems, glbCacheVersion]);

  const deviceCount = products.length;
  const matchedCount = enrichedItems.filter((i) => i.kind === 'hardware' && i.product).length;

  return (
    <Paper
      elevation={3}
      sx={{
        height: height || { xs: 'min(64dvh, 460px)', sm: 'min(68dvh, 520px)', lg: 560 },
        minHeight: { xs: 340, sm: 400 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box ref={containerRef} sx={{ width: '100%', height: '100%', touchAction: 'none' }} />

      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <CircularProgress />
          <Typography variant="caption" color="white">
            Loading model...
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          display: 'flex',
          flexWrap: { xs: 'nowrap', sm: 'wrap' },
          gap: 1,
          alignItems: 'center',
          justifyContent: { xs: 'flex-start', sm: 'space-between' },
          zIndex: 10,
          overflowX: { xs: 'auto', sm: 'visible' },
          pb: { xs: 0.5, sm: 0 },
          WebkitOverflowScrolling: 'touch',
          '& .MuiToggleButton-root': {
            px: { xs: 1, sm: 1.5 },
            py: { xs: 0.55, sm: 0.75 },
            fontSize: { xs: '0.72rem', sm: '0.8125rem' },
          },
        }}
      >
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <ToggleButtonGroup
            size="small"
            exclusive
            value={viewMode}
            onChange={(_, value) => value && setViewMode(value)}
            sx={{ bgcolor: 'rgba(0,31,22,0.9)' }}
          >
            <ToggleButton value="2d">2D</ToggleButton>
            <ToggleButton value="3d">3D</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={cameraPreset}
            onChange={(_, value) => value && setCameraPreset(value)}
            sx={{ bgcolor: 'rgba(0,31,22,0.9)' }}
          >
            <ToggleButton value="top">Top</ToggleButton>
            <ToggleButton value="left">Left</ToggleButton>
            <ToggleButton value="right">Right</ToggleButton>
            <ToggleButton value="iso">ISO</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={controlMode}
            onChange={(_, value) => value && setControlMode(value)}
            sx={{ bgcolor: 'rgba(0,31,22,0.9)' }}
          >
            <ToggleButton value="pan">Pan</ToggleButton>
            <ToggleButton value="orbit" disabled={viewMode === '2d'}>
              Rotate
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={workspaceMode}
          onChange={(_, value) => value && setWorkspaceMode(value)}
          sx={{ bgcolor: 'rgba(0,31,22,0.9)' }}
        >
          <ToggleButton value="property">Property</ToggleButton>
          <ToggleButton value="products">Products</ToggleButton>
          <ToggleButton value="simulation">Simulation</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          right: 12,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          '& .MuiButton-root': {
            minHeight: 36,
          },
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography
            variant="caption"
            sx={{
              color: '#E4E7E5',
              background: 'rgba(0,0,0,0.56)',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            {title || layout.property.name} ({layout.property.widthFt}x{layout.property.depthFt} ft)
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#C8B882',
              background: 'rgba(0,0,0,0.56)',
              padding: '4px 8px',
              borderRadius: '4px',
              textTransform: 'capitalize',
            }}
          >
            {workspaceMode} / {viewMode.toUpperCase()} / {cameraPreset.toUpperCase()}
          </Typography>
          {deviceCount > 0 && (
            <Typography
              variant="caption"
              sx={{
                color: matchedCount === deviceCount ? '#6BBF59' : '#E8A020',
                background: 'rgba(0,0,0,0.56)',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              {matchedCount}/{deviceCount} devices
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <CoopModelSelector
            currentModel={model}
            onSelectModel={(m) => {
              if (!m.isCustom && getPresetModel(m.size)) {
                selectPreset(m.size);
                return;
              }

              updateModel(m);
            }}
            onUploadCustom={async (file) => {
              const localModel: CoopModelConfig = {
                id: `custom-${Date.now()}`,
                name: file.name.replace(/\.(glb|gltf)$/i, ''),
                size: 'custom',
                dimensions: model.dimensions,
                modelUrl: URL.createObjectURL(file),
                isCustom: true,
              };

              const userId = auth.currentUser?.uid;
              if (!userId) {
                updateModel(localModel);
                return;
              }

              try {
                const uploaded = await modelUploadService.uploadModel(file, userId, 'garage-chicken-tender-001');
                updateModel(modelUploadService.createModelConfig(uploaded, model.dimensions));
              } catch (error) {
                console.warn('Firebase model upload failed, using local model for this session.', error);
                updateModel(localModel);
              }
            }}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setCameraPreset('iso');
              setViewMode('3d');
              setControlMode('orbit');
            }}
          >
            Reset View
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
