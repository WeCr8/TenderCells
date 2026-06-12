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
  'roaming-roost': { width: 5, depth: 5 },
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

// ─── Product-specific 3D geometry ────────────────────────────────────────────

const createHardwareMesh = (
  item: EnrichedItem,
  x: number,
  z: number,
  selected: boolean,
  baseMaterial: THREE.MeshStandardMaterial
): THREE.Object3D => {
  const W = item.width;
  const D = item.depth;
  const scale = selected ? 1.15 : 1.0;
  const H = (selected ? 1.8 : 1.3) * scale;

  const mat = baseMaterial.clone();

  switch (item.type) {
    case 'chicken-tender': {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(W * 0.88, H, D * 0.88), mat);
      body.position.set(x, H / 2, z);
      body.castShadow = true;
      g.add(body);
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(W, D) * 0.54, H * 0.36, 4),
        new THREE.MeshStandardMaterial({ color: 0x1a3d2b, roughness: 0.65 })
      );
      roof.position.set(x, H + H * 0.18, z);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      g.add(roof);
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(W * 0.2, H * 0.34, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xf0ede4 })
      );
      door.position.set(x, H * 0.22, z + D * 0.45);
      g.add(door);
      return g;
    }

    case 'roaming-roost': {
      // Architecture: 4 ft inner octagon + 3-4" perimeter wheel channel = ~5 ft OD
      // Wheels ride inside channel ring; igloo dome mounts on top of inner octagon
      const g = new THREE.Group();
      const outerR = Math.min(W, D) / 2;       // 5 ft OD → 2.5 ft radius
      const innerR = outerR * 0.82;             // ~4 ft inner diameter → 2.05 ft radius
      const channelW = outerR - innerR;         // ~0.45 ft channel width
      const channelH = 0.5;                     // channel wall height (ft)
      const segLen = 2 * outerR * Math.sin(Math.PI / 8); // length of each octagon wall segment
      const midR = (outerR + innerR) / 2;       // center of channel ring

      // Flat octagonal ground base (full OD)
      const basePlatform = new THREE.Mesh(
        new THREE.CylinderGeometry(outerR, outerR, 0.08, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.85 })
      );
      basePlatform.position.set(x, 0.04, z);
      g.add(basePlatform);

      // 8-sided perimeter channel ring walls + wheel per segment
      const channelMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85 });
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i + Math.PI / 8;
        // Channel wall segment
        const seg = new THREE.Mesh(new THREE.BoxGeometry(segLen, channelH, channelW), channelMat);
        seg.position.set(x + midR * Math.cos(angle), channelH / 2 + 0.08, z + midR * Math.sin(angle));
        seg.rotation.y = -angle;
        seg.castShadow = true;
        g.add(seg);
        // Drive wheel inside channel
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(channelH * 0.36, channelH * 0.36, channelW * 0.5, 10),
          wheelMat
        );
        wheel.position.set(x + midR * Math.cos(angle), channelH * 0.32, z + midR * Math.sin(angle));
        wheel.rotation.y = -angle;
        wheel.rotation.z = Math.PI / 2;
        g.add(wheel);
      }

      // Igloo dome over inner 4 ft circle
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(innerR * 0.94, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
        new THREE.MeshStandardMaterial({ color: mat.color, roughness: 0.5, transparent: true, opacity: 0.88 })
      );
      dome.position.set(x, channelH + 0.08, z);
      dome.castShadow = true;
      g.add(dome);

      // Door opening on one face
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.7, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x1a3d2b })
      );
      door.position.set(x, channelH + 0.43, z + innerR * 0.88);
      g.add(door);

      return g;
    }

    case 'duck-dock': {
      const g = new THREE.Group();
      const water = new THREE.Mesh(
        new THREE.BoxGeometry(W, 0.07, D),
        new THREE.MeshStandardMaterial({ color: 0x2a6b8a, roughness: 0.12, transparent: true, opacity: 0.7 })
      );
      water.position.set(x, 0.04, z);
      g.add(water);
      const dock = new THREE.Mesh(new THREE.BoxGeometry(W * 0.72, 0.2, D * 0.55), mat);
      dock.position.set(x + W * 0.06, 0.2, z - D * 0.06);
      dock.castShadow = true;
      g.add(dock);
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(W * 0.18, 0.05, D * 0.42), mat);
      ramp.position.set(x - W * 0.27, 0.09, z + D * 0.18);
      ramp.rotation.x = 0.22;
      g.add(ramp);
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.65, 8),
        new THREE.MeshStandardMaterial({ color: 0x8a6030 })
      );
      post.position.set(x + W * 0.28, 0.52, z - D * 0.22);
      g.add(post);
      return g;
    }

    case 'goat-guardian': {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(W * 0.88, H * 0.7, D * 0.82), mat);
      body.position.set(x, H * 0.35, z);
      body.castShadow = true;
      g.add(body);
      const roof = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, Math.max(W, D) * 0.53, H * 0.38, 4),
        new THREE.MeshStandardMaterial({ color: 0x5a3e20, roughness: 0.8 })
      );
      roof.position.set(x, H * 0.79, z);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      g.add(roof);
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(W * 0.18, H * 0.45, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xf0ede4 })
      );
      door.position.set(x, H * 0.22, z + D * 0.42);
      g.add(door);
      return g;
    }

    case 'bunny-burrow': {
      const g = new THREE.Group();
      const hutch = new THREE.Mesh(new THREE.BoxGeometry(W * 0.85, H * 0.52, D * 0.8), mat);
      hutch.position.set(x, H * 0.26, z);
      hutch.castShadow = true;
      g.add(hutch);
      // Wire mesh front panel
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(W * 0.85, H * 0.52, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x888888, wireframe: true })
      );
      mesh.position.set(x, H * 0.26, z + D * 0.41);
      g.add(mesh);
      // Arched tunnel
      const tunnel = new THREE.Mesh(
        new THREE.CylinderGeometry(Math.min(W, D) * 0.13, Math.min(W, D) * 0.13, 0.28, 10),
        new THREE.MeshStandardMaterial({ color: 0x2d6235 })
      );
      tunnel.rotation.x = Math.PI / 2;
      tunnel.position.set(x + W * 0.2, H * 0.17, z + D * 0.48);
      g.add(tunnel);
      return g;
    }

    case 'turkey-tower': {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(W * 0.82, H * 0.38, D * 0.82), mat);
      base.position.set(x, H * 0.19, z);
      base.castShadow = true;
      g.add(base);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(W * 0.38, H * 0.88, D * 0.38), mat);
      tower.position.set(x, H * 0.72, z);
      tower.castShadow = true;
      g.add(tower);
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(W * 0.68, 0.13, D * 0.68),
        new THREE.MeshStandardMaterial({ color: 0x8a6030, roughness: 0.75 })
      );
      platform.position.set(x, H * 1.18, z);
      platform.castShadow = true;
      g.add(platform);
      return g;
    }

    case 'pigeon-palace': {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(W * 0.78, H * 0.42, D * 0.78), mat);
      base.position.set(x, H * 0.21, z);
      base.castShadow = true;
      g.add(base);
      const loft = new THREE.Mesh(
        new THREE.CylinderGeometry(Math.min(W, D) * 0.28, Math.min(W, D) * 0.32, H * 0.68, 8),
        mat.clone()
      );
      loft.position.set(x, H * 0.74, z);
      loft.castShadow = true;
      g.add(loft);
      const cupola = new THREE.Mesh(
        new THREE.ConeGeometry(Math.min(W, D) * 0.26, H * 0.28, 8),
        new THREE.MeshStandardMaterial({ color: 0xc8b882, roughness: 0.5 })
      );
      cupola.position.set(x, H * 1.22, z);
      g.add(cupola);
      // Entry holes
      [0, 90, 180, 270].forEach((deg) => {
        const rad = (deg * Math.PI) / 180;
        const hole = new THREE.Mesh(
          new THREE.CircleGeometry(0.08, 8),
          new THREE.MeshStandardMaterial({ color: 0x0a0a1a })
        );
        hole.position.set(
          x + Math.sin(rad) * Math.min(W, D) * 0.3,
          H * 0.78,
          z + Math.cos(rad) * Math.min(W, D) * 0.3
        );
        hole.lookAt(new THREE.Vector3(x, H * 0.78, z));
        g.add(hole);
      });
      return g;
    }

    case 'watchtower': {
      const g = new THREE.Group();
      const poleH = H * 2.4;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.14, poleH, 8),
        new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.6, roughness: 0.4 })
      );
      pole.position.set(x, poleH / 2, z);
      pole.castShadow = true;
      g.add(pole);
      // Cross-braces
      [0.3, 0.6].forEach((frac) => {
        const brace = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.06, 0.06),
          new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        brace.position.set(x, poleH * frac, z);
        g.add(brace);
      });
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.44, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
        new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.15, metalness: 0.7 })
      );
      dome.position.set(x, poleH + 0.08, z);
      dome.castShadow = true;
      g.add(dome);
      [0, 120, 240].forEach((deg) => {
        const rad = (deg * Math.PI) / 180;
        const lens = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.055, 0.15, 8),
          new THREE.MeshStandardMaterial({ color: 0x080810 })
        );
        lens.rotation.z = Math.PI / 2;
        lens.position.set(
          x + Math.sin(rad) * 0.36,
          poleH + 0.02,
          z + Math.cos(rad) * 0.36
        );
        g.add(lens);
      });
      return g;
    }

    case 'rail-module': {
      const g = new THREE.Group();
      const bed = new THREE.Mesh(
        new THREE.BoxGeometry(W, 0.15, D),
        new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.85 })
      );
      bed.position.set(x, 0.075, z);
      g.add(bed);
      const railMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.75 });
      [-1, 1].forEach((side) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(W, 0.09, 0.07), railMat);
        rail.position.set(x, 0.19, z + side * D * 0.32);
        g.add(rail);
      });
      // Ties
      const tieCount = Math.max(2, Math.round(W));
      for (let i = 0; i < tieCount; i++) {
        const tie = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.08, D * 0.9),
          new THREE.MeshStandardMaterial({ color: 0x6a4b2b })
        );
        tie.position.set(x - W / 2 + (W / (tieCount - 1)) * i, 0.15, z);
        g.add(tie);
      }
      return g;
    }

    default: {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), mat);
      mesh.position.set(x, H / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }
  }
};

// ─── Device ID label sprite ───────────────────────────────────────────────────

const createDeviceLabel = (item: EnrichedItem): THREE.Sprite => {
  const label = item.product?.device_id || item.product?.product_name || item.name;
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 72;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 320, 72);
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.beginPath();
  ctx.roundRect(4, 4, 312, 64, 10);
  ctx.fill();
  const hasProduct = Boolean(item.product);
  ctx.fillStyle = hasProduct ? '#C8B882' : '#8A7D55';
  ctx.font = `bold ${hasProduct ? '21' : '17'}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.slice(0, 20), 160, hasProduct ? 25 : 36);
  if (hasProduct && item.product?.id) {
    ctx.fillStyle = '#6BBF59';
    ctx.font = '14px monospace';
    ctx.fillText(item.product.id.slice(0, 26), 160, 52);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.6, 0.9, 1);
  return sprite;
};

// ─── Property-level helpers ───────────────────────────────────────────────────

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
  g_add(group, base);

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

// Helper to avoid shadowing - named workaround
function g_add(group: THREE.Group, obj: THREE.Object3D) { group.add(obj); }

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
): THREE.Group => {
  const group = new THREE.Group();
  const color = new THREE.Color(ITEM_COLORS[item.type] || '#A5B1A9');
  const selected =
    item.type === activeProduct ||
    (activeProduct === 'predator-monitor' && item.type === 'watchtower') ||
    (activeProduct === 'rail-system-modules' && item.type === 'rail-module');
  const { x, z } = propertyToScenePosition(item, layout);

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.68,
    transparent: item.type === 'no-go-zone',
    opacity: item.type === 'no-go-zone' ? 0.45 : 0.9,
    emissive: selected ? color.clone().multiplyScalar(0.32) : new THREE.Color(0x000000),
  });

  if (loadedGlb) {
    const clone = loadedGlb.clone();
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const scale = Math.min(
      item.width / Math.max(size.x, 0.01),
      item.depth / Math.max(size.z, 0.01),
      2.5 / Math.max(size.y, 0.01)
    );
    clone.scale.setScalar(scale);
    const min = new THREE.Box3().setFromObject(clone).min;
    clone.position.set(x, -min.y, z);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true; }
    });
    clone.name = item.product?.device_id || item.product?.id || item.name;
    group.add(clone);
  } else if (item.type === 'tree') {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.6, 4, 12),
      new THREE.MeshStandardMaterial({ color: 0x6a4b2b })
    );
    trunk.position.set(x, 2, z);
    trunk.castShadow = true;
    group.add(trunk);
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(item.width, item.depth) * 0.35, 24, 16),
      material
    );
    canopy.position.set(x, 4.2, z);
    canopy.castShadow = true;
    group.add(canopy);
  } else if (item.type === 'rock') {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(Math.max(item.width, item.depth) * 0.35),
      material
    );
    rock.position.set(x, 0.55, z);
    rock.name = item.name;
    group.add(rock);
  } else if (item.type === 'pond' || item.type === 'garden' || item.type === 'no-go-zone') {
    const flat = new THREE.Mesh(new THREE.BoxGeometry(item.width, 0.08, item.depth), material);
    flat.position.set(x, 0.05, z);
    flat.name = item.name;
    group.add(flat);
  } else if (item.kind === 'hardware') {
    const hw = createHardwareMesh(item, x, z, selected, material);
    hw.name = item.product?.device_id || item.product?.id || item.name;
    hw.traverse((child) => {
      if (child instanceof THREE.Mesh) { child.receiveShadow = true; }
    });
    group.add(hw);
  } else {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(item.width, 0.75, item.depth), material);
    mesh.position.set(x, 0.38, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = item.name;
    group.add(mesh);
  }

  // Floating device label for hardware items
  if (item.kind === 'hardware') {
    const label = createDeviceLabel(item);
    const labelY = item.type === 'watchtower' ? 5.8 : item.type === 'turkey-tower' ? 3.4 : selected ? 2.6 : 2.0;
    label.position.set(x, labelY, z);
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
): THREE.Group => {
  const group = new THREE.Group();
  items.forEach((item) => {
    const glbKey = item.product?.id;
    const loadedGlb = glbKey ? glbCache.get(glbKey) : undefined;
    group.add(createYardItem(item, layout, activeProduct, loadedGlb));
  });
  return group;
};

const createSimulationOverlay = (layout: PropertyLayoutState): THREE.Group => {
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
    case 'top':  return new THREE.Vector3(0, distance, 0.001);
    case 'left': return new THREE.Vector3(-distance, 3, 0);
    case 'right': return new THREE.Vector3(distance, 3, 0);
    case 'iso':
    default:     return new THREE.Vector3(7, 6, 7);
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

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
  const glbCacheRef = useRef<Map<string, THREE.Group>>(new Map());
  const [glbCacheVersion, setGlbCacheVersion] = useState(0);

  // Resolve layout items → matched Firestore products.
  // Match priority: 1) item.productId === product.id (stable 1:1 from layout sync)
  //                 2) first unclaimed product of same item type (legacy/unlinked)
  //                 3) registered products with no layout slot get a virtual item
  const enrichedItems = useMemo<EnrichedItem[]>(() => {
    const productsById = new Map<string, Product>(products.map((p) => [p.id, p]));
    const productsByType = new Map<string, Product[]>();

    products.forEach((p) => {
      const family = p.metadata?.product_family as string | undefined;
      if (!family) return;
      const itemType = FAMILY_TO_ITEM_TYPE[family] || family;
      if (!productsByType.has(itemType)) productsByType.set(itemType, []);
      productsByType.get(itemType)!.push(p);
    });

    const claimedProductIds = new Set<string>();

    // Pass 1: items that have a productId — resolve directly
    const enriched: EnrichedItem[] = layout.items.map((item) => {
      if (item.productId) {
        const matched = productsById.get(item.productId);
        if (matched) {
          claimedProductIds.add(matched.id);
          return { ...item, product: matched };
        }
      }
      return { ...item, product: undefined };
    });

    // Pass 2: items without productId — claim first unclaimed product of same type
    const typeClaimIdx = new Map<string, number>();
    for (let i = 0; i < enriched.length; i++) {
      const item = enriched[i];
      if (item.productId || item.product) continue; // already resolved
      const candidates = (productsByType.get(item.type) || []).filter(p => !claimedProductIds.has(p.id));
      const claimAt = typeClaimIdx.get(item.type) || 0;
      const matched = candidates[claimAt];
      if (matched) {
        claimedProductIds.add(matched.id);
        typeClaimIdx.set(item.type, claimAt + 1);
        enriched[i] = { ...item, product: matched };
      }
    }

    // Pass 3: registered products with no layout slot → virtual items
    products.forEach((p) => {
      if (claimedProductIds.has(p.id)) return;
      const family = p.metadata?.product_family as string | undefined;
      if (!family) return;
      const itemType = FAMILY_TO_ITEM_TYPE[family] || family;
      const size = DEFAULT_SIZE_BY_TYPE[itemType] || { width: 3, depth: 3 };
      const existingVirtual = enriched.filter(e => !layout.items.some(li => li.id === e.id)).length;
      enriched.push({
        id: `virtual-${p.id}`,
        name: p.product_name,
        type: itemType as PropertyItem['type'],
        kind: 'hardware',
        x: Math.min((existingVirtual % 3) * (size.width + 2) + 1, layout.property.widthFt - size.width - 1),
        y: Math.min(Math.floor(existingVirtual / 3) * (size.depth + 2) + 1, layout.property.depthFt - size.depth - 1),
        width: size.width,
        depth: size.depth,
        productId: p.id,
        deviceId: p.device_id ?? p.id,
        product: p,
      } as EnrichedItem);
    });

    return enriched;
  }, [layout, products]);

  // Load custom GLBs from product metadata
  useEffect(() => {
    const loader = new GLTFLoader();
    let cancelled = false;
    const toLoad = products.filter(
      (p) => p.metadata?.custom_device_asset_url && !glbCacheRef.current.has(p.id)
    );
    if (toLoad.length === 0) return;

    let done = 0;
    toLoad.forEach((p) => {
      loader.load(
        p.metadata!.custom_device_asset_url as string,
        (gltf) => {
          if (cancelled) return;
          glbCacheRef.current.set(p.id, gltf.scene);
          if (++done === toLoad.length) setGlbCacheVersion((v) => v + 1);
        },
        undefined,
        () => { if (++done === toLoad.length && !cancelled) setGlbCacheVersion((v) => v + 1); }
      );
    });
    return () => { cancelled = true; };
  }, [products]);

  // Sync layout from storage events
  useEffect(() => {
    const syncLayout = (event: Event) => {
      const e = event as CustomEvent<PropertyLayoutState>;
      setLayout(e.detail || loadPropertyLayout());
    };
    const syncStorage = () => setLayout(loadPropertyLayout());
    window.addEventListener(PROPERTY_LAYOUT_EVENT, syncLayout as EventListener);
    window.addEventListener('storage', syncStorage);
    return () => {
      window.removeEventListener(PROPERTY_LAYOUT_EVENT, syncLayout as EventListener);
      window.removeEventListener('storage', syncStorage);
    };
  }, []);

  // Resolve the active product item for camera focus
  const activeItem = useMemo(() => {
    const itemType =
      product === 'predator-monitor' ? 'watchtower' :
      product === 'rail-system-modules' ? 'rail-module' :
      product;
    return enrichedItems.find((item) => item.type === itemType && item.kind === 'hardware');
  }, [enrichedItems, product]);

  // Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const w = containerRef.current.clientWidth || 800;
    const h = containerRef.current.clientHeight || 500;
    const aspect = w / h;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x123d25);

    const cameraSpan = Math.max(layout.property.widthFt, layout.property.depthFt) * 0.58;
    const camera =
      viewMode === '2d'
        ? new THREE.OrthographicCamera(-cameraSpan * aspect, cameraSpan * aspect, cameraSpan, -cameraSpan, 0.1, 1000)
        : new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);

    // Camera target: focused on active product when in products/simulation mode
    const focusX = activeItem && workspaceMode !== 'property'
      ? activeItem.x + activeItem.width / 2 - layout.property.widthFt / 2
      : 0;
    const focusZ = activeItem && workspaceMode !== 'property'
      ? activeItem.y + activeItem.depth / 2 - layout.property.depthFt / 2
      : 0;

    const camBase = getCameraPosition(cameraPreset, viewMode, cameraSpan);
    camera.position.set(camBase.x + focusX, camBase.y, camBase.z + focusZ);
    camera.lookAt(focusX, 1, focusZ);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
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
    controls.target.set(focusX, 1, focusZ);
    controls.mouseButtons = {
      LEFT: controlMode === 'pan' || viewMode === '2d' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    controls.touches = {
      ONE: controlMode === 'pan' || viewMode === '2d' ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    scene.add(new THREE.AmbientLight(0xffffff, 0.62));
    const sun = new THREE.DirectionalLight(0xffffff, 0.82);
    sun.position.set(8, 10, 8);
    sun.castShadow = true;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(layout.property.widthFt, layout.property.depthFt),
      new THREE.MeshStandardMaterial({ color: 0x2d6235, roughness: 0.85 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    scene.add(createPropertyGrid(layout));

    const glbCache = glbCacheRef.current;

    if (workspaceMode === 'property') {
      // Obstacles only + featured product model centered
      const obstacleItems = enrichedItems.filter((i) => i.kind === 'obstacle') as EnrichedItem[];
      scene.add(createYardItems(obstacleItems, layout, product, glbCache));

      if (product === 'chicken-tender') {
        if (loadedScene) {
          loadedScene.traverse((c) => { if (c instanceof THREE.Mesh) { c.castShadow = true; c.receiveShadow = true; } });
          scene.add(loadedScene);
        } else {
          scene.add(createPlaceholderCoop(model));
        }
      } else {
        // Featured product placeholder centered at origin
        const size = DEFAULT_SIZE_BY_TYPE[product] || { width: 4, depth: 4 };
        const featuredItem: EnrichedItem = {
          id: `featured-${product}`,
          name: product,
          type: (product === 'predator-monitor' ? 'watchtower' : product) as PropertyItem['type'],
          kind: 'hardware',
          x: layout.property.widthFt / 2 - size.width / 2,
          y: layout.property.depthFt / 2 - size.depth / 2,
          width: size.width * 1.4,
          depth: size.depth * 1.4,
          product: activeItem?.product,
        };
        const featuredGlb = activeItem?.product?.id ? glbCache.get(activeItem.product.id) : undefined;
        scene.add(createYardItem(featuredItem, layout, product, featuredGlb));
      }
    } else {
      // Products / simulation: all items with product-specific geometry
      scene.add(createYardItems(enrichedItems, layout, product, glbCache));
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
      const nw = containerRef.current.clientWidth;
      const nh = containerRef.current.clientHeight;
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = nw / nh;
      } else {
        const na = nw / nh;
        camera.left = -cameraSpan * na;
        camera.right = cameraSpan * na;
        camera.top = cameraSpan;
        camera.bottom = -cameraSpan;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      controls.dispose();
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [
    loadedScene, model, viewMode, cameraPreset, controlMode,
    workspaceMode, layout, product, enrichedItems, glbCacheVersion, activeItem,
  ]);

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
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          }}
        >
          <CircularProgress />
          <Typography variant="caption" color="white">Loading model...</Typography>
        </Box>
      )}

      {/* Top controls */}
      <Box
        sx={{
          position: 'absolute', top: 12, left: 12, right: 12,
          display: 'flex', flexWrap: { xs: 'nowrap', sm: 'wrap' },
          gap: 1, alignItems: 'center',
          justifyContent: { xs: 'flex-start', sm: 'space-between' },
          zIndex: 10, overflowX: { xs: 'auto', sm: 'visible' },
          pb: { xs: 0.5, sm: 0 }, WebkitOverflowScrolling: 'touch',
          '& .MuiToggleButton-root': {
            px: { xs: 1, sm: 1.5 }, py: { xs: 0.55, sm: 0.75 },
            fontSize: { xs: '0.72rem', sm: '0.8125rem' },
          },
        }}
      >
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <ToggleButtonGroup size="small" exclusive value={viewMode}
            onChange={(_, v) => v && setViewMode(v)} sx={{ bgcolor: 'rgba(0,31,22,0.9)' }}>
            <ToggleButton value="2d">2D</ToggleButton>
            <ToggleButton value="3d">3D</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup size="small" exclusive value={cameraPreset}
            onChange={(_, v) => v && setCameraPreset(v)} sx={{ bgcolor: 'rgba(0,31,22,0.9)' }}>
            <ToggleButton value="top">Top</ToggleButton>
            <ToggleButton value="left">Left</ToggleButton>
            <ToggleButton value="right">Right</ToggleButton>
            <ToggleButton value="iso">ISO</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup size="small" exclusive value={controlMode}
            onChange={(_, v) => v && setControlMode(v)} sx={{ bgcolor: 'rgba(0,31,22,0.9)' }}>
            <ToggleButton value="pan">Pan</ToggleButton>
            <ToggleButton value="orbit" disabled={viewMode === '2d'}>Rotate</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <ToggleButtonGroup size="small" exclusive value={workspaceMode}
          onChange={(_, v) => v && setWorkspaceMode(v)} sx={{ bgcolor: 'rgba(0,31,22,0.9)' }}>
          <ToggleButton value="property">Property</ToggleButton>
          <ToggleButton value="products">Products</ToggleButton>
          <ToggleButton value="simulation">Simulation</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Bottom bar */}
      <Box
        sx={{
          position: 'absolute', bottom: 12, left: 12, right: 12,
          display: 'flex', flexWrap: 'wrap', gap: 1,
          alignItems: 'center', justifyContent: 'space-between',
          zIndex: 10, '& .MuiButton-root': { minHeight: 36 },
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#E4E7E5', background: 'rgba(0,0,0,0.56)', p: '4px 8px', borderRadius: '4px' }}>
            {title || layout.property.name} ({layout.property.widthFt}x{layout.property.depthFt} ft)
          </Typography>
          <Typography variant="caption" sx={{ color: '#C8B882', background: 'rgba(0,0,0,0.56)', p: '4px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>
            {workspaceMode} / {viewMode.toUpperCase()} / {cameraPreset.toUpperCase()}
          </Typography>
          {deviceCount > 0 && (
            <Typography variant="caption" sx={{
              color: matchedCount === deviceCount ? '#6BBF59' : '#E8A020',
              background: 'rgba(0,0,0,0.56)', p: '4px 8px', borderRadius: '4px',
            }}>
              {matchedCount}/{deviceCount} devices
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {product === 'chicken-tender' && (
            <CoopModelSelector
              currentModel={model}
              onSelectModel={(m) => {
                if (!m.isCustom && getPresetModel(m.size)) { selectPreset(m.size); return; }
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
                if (!userId) { updateModel(localModel); return; }
                try {
                  const uploaded = await modelUploadService.uploadModel(file, userId, 'garage-chicken-tender-001');
                  updateModel(modelUploadService.createModelConfig(uploaded, model.dimensions));
                } catch {
                  updateModel(localModel);
                }
              }}
            />
          )}
          <Button size="small" variant="outlined" onClick={() => { setCameraPreset('iso'); setViewMode('3d'); setControlMode('orbit'); }}>
            Reset View
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
