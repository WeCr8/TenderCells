// Viewport3D.tsx - CAD-style 2D/3D property, product, and simulation viewport
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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

type ViewMode = '2d' | '3d';
type CameraPreset = 'top' | 'left' | 'right' | 'iso';
type ControlMode = 'pan' | 'orbit';
type WorkspaceMode = 'property' | 'products' | 'simulation';

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

const createPropertyGrid = () => {
  const group = new THREE.Group();
  const grid = new THREE.GridHelper(24, 24, 0x6bbf59, 0x1f5c3b);
  grid.position.y = 0.01;
  group.add(grid);

  const boundary = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(12, 0.03, 12)),
    new THREE.LineBasicMaterial({ color: 0xc8b882 })
  );
  boundary.position.y = 0.03;
  group.add(boundary);

  return group;
};

const createProductMarkers = () => {
  const group = new THREE.Group();
  const markerMaterial = new THREE.MeshStandardMaterial({ color: 0xd0a34e, roughness: 0.5 });

  [
    { x: -4.5, z: -3.5, name: 'Feed' },
    { x: 4.2, z: -2.8, name: 'Water' },
    { x: 3.8, z: 4.5, name: 'Sensor' },
  ].forEach((marker) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 24), markerMaterial);
    mesh.position.set(marker.x, 0.08, marker.z);
    mesh.name = marker.name;
    mesh.castShadow = true;
    group.add(mesh);
  });

  return group;
};

const createSimulationOverlay = () => {
  const group = new THREE.Group();
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-5, 0.08, 3),
    new THREE.Vector3(-2, 0.08, 1.2),
    new THREE.Vector3(1.5, 0.08, 2.4),
    new THREE.Vector3(4.5, 0.08, -2),
  ]);
  const geometry = new THREE.TubeGeometry(path, 32, 0.045, 8, false);
  const material = new THREE.MeshStandardMaterial({ color: 0x8dd47a, emissive: 0x1f5c3b });
  group.add(new THREE.Mesh(geometry, material));
  return group;
};

const getCameraPosition = (preset: CameraPreset, mode: ViewMode) => {
  const distance = mode === '2d' ? 13 : 9;
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

export default function Viewport3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [controlMode, setControlMode] = useState<ControlMode>('orbit');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('property');
  const { model, loadedScene, loading, selectPreset, updateModel } = useCoopModel();

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;
    const aspect = width / height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x123d25);

    const camera = viewMode === '2d'
      ? new THREE.OrthographicCamera(-8 * aspect, 8 * aspect, 8, -8, 0.1, 1000)
      : new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);
    camera.position.copy(getCameraPosition(cameraPreset, viewMode));
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
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshStandardMaterial({ color: 0x2d6235, roughness: 0.85 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    scene.add(createPropertyGrid());

    if (loadedScene) {
      loadedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(loadedScene);
    } else {
      scene.add(createPlaceholderCoop(model));
    }

    if (workspaceMode === 'products') {
      scene.add(createProductMarkers());
    }

    if (workspaceMode === 'simulation') {
      scene.add(createProductMarkers());
      scene.add(createSimulationOverlay());
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
        camera.left = -8 * nextAspect;
        camera.right = 8 * nextAspect;
        camera.top = 8;
        camera.bottom = -8;
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
  }, [loadedScene, model, viewMode, cameraPreset, controlMode, workspaceMode]);

  return (
    <Paper
      elevation={3}
      sx={{
        height: { xs: 'min(64dvh, 460px)', sm: 'min(68dvh, 520px)', lg: 560 },
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
            {model.name} ({model.dimensions.width}x{model.dimensions.depth}x{model.dimensions.height}ft)
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
