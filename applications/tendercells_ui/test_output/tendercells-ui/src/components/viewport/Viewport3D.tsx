// Viewport3D.tsx - CAD-style 2D/3D property, product, and simulation viewport
import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createGltfLoader, describeModelLoadError } from '../../lib/three/gltfLoader';
import { resolveModelUrl, saveModelFile } from '../../lib/three/modelStore';
import {
  FARMBOT_POSITION_EVENT,
  latestFarmBotPositions,
  type FarmBotPosition,
  type FarmBotPositionDetail,
} from '../../lib/farmbot/farmbotCloud';
import { buildScenery, sceneHeightFn, TERRAIN_PRESETS, type SceneHeightFn, type TerrainPreset } from './scenery';
import { makeTextSprite } from './labels';
import { animateYardFlags, buildYardFlags, disposeYardFlags } from './yardFlags';
import { buildHydrologyLayer } from './hydrologyLayer';
import { createWeedRobot, placeWeedRobot } from './weedRobotMarker';
import { getSimRobot } from '../../lib/yard/weedSim';
import { mountsFor, viewKey, type CameraMount } from '../../lib/yard/cameraMounts';
import { WEED_BED_TYPES, YARD_LIVE, type WeedRobotState } from '../../lib/yard/yardTypes';
import type { HydrologyResult } from '../property/watershed';
import { useYardEvents } from '../../hooks/useYardEvents';
import YardAttentionPanel from '../yard/YardAttentionPanel';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
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
  savePropertyLayout,
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
  /** Focus the camera on this layout item (default: first item of `product`'s type). */
  focusItemId?: string;
  /** Pop-up station flags + "Needs attention" list (eggs, weeds, roost headcount). Default true. */
  showYardFlags?: boolean;
  /** The in-map "Needs attention" list (off when the page shows its own). Default true. */
  showAttentionPanel?: boolean;
  /** Watershed result to draw: standing water + erosion risk (Watershed & Drainage page). */
  hydrology?: HydrologyResult | null;
  /** Picture-in-picture views from the WatchTower's three cameras (default: on for predator-monitor). */
  towerCameras?: boolean;
};

const CAM_ASPECT = 4 / 3;
/** Vertical FOV for a 4:3 frame from a horizontal lens FOV. */
const vfovFor = (hfovDeg: number) =>
  THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(hfovDeg / 2)) / CAM_ASPECT));

interface CamView { key: string; label: string }

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
      // Floating perforated dock: deck sits ON the pond surface. Holes in the
      // deck let droppings fall through to feed pond fish; an egg-capture
      // channel runs along the nesting edge. Deck floats above the water plane.
      const g = new THREE.Group();
      const waterLevel = 0.05;
      const deckLevel = 0.22; // deck floats just above water — overlays, never submerged

      // Pond water surface (the dock floats on top of this)
      const water = new THREE.Mesh(
        new THREE.BoxGeometry(W, 0.06, D),
        new THREE.MeshStandardMaterial({ color: 0x2a6b8a, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.68 })
      );
      water.position.set(x, waterLevel, z);
      g.add(water);

      const deckW = W * 0.74;
      const deckD = D * 0.6;
      const deckX = x + W * 0.05;
      const deckZ = z - D * 0.05;

      // Perforated deck plank
      const deck = new THREE.Mesh(new THREE.BoxGeometry(deckW, 0.12, deckD), mat);
      deck.position.set(deckX, deckLevel, deckZ);
      deck.castShadow = true;
      g.add(deck);

      // Drop-through holes — grid of dark cylinders flush in the deck top.
      // Feces fall through these into the pond to feed fish.
      const holeMat = new THREE.MeshStandardMaterial({ color: 0x0a1a22, roughness: 0.9 });
      const cols = 4, rows = 3;
      const holeR = Math.min(deckW / cols, deckD / rows) * 0.16;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const hx = deckX - deckW / 2 + (deckW / (cols + 1)) * (c + 1);
          const hz = deckZ - deckD / 2 + (deckD / (rows + 1)) * (r + 1);
          const hole = new THREE.Mesh(new THREE.CylinderGeometry(holeR, holeR, 0.14, 10), holeMat);
          hole.position.set(hx, deckLevel + 0.005, hz);
          g.add(hole);
        }
      }

      // Egg-capture channel along the back edge (gold collection trough)
      const eggChannel = new THREE.Mesh(
        new THREE.BoxGeometry(deckW * 0.92, 0.08, deckD * 0.14),
        new THREE.MeshStandardMaterial({ color: 0xc8b882, roughness: 0.5, metalness: 0.3 })
      );
      eggChannel.position.set(deckX, deckLevel + 0.02, deckZ - deckD * 0.5 + deckD * 0.07);
      g.add(eggChannel);

      // Entry ramp from water to deck
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(W * 0.2, 0.05, D * 0.42), mat);
      ramp.position.set(x - W * 0.3, deckLevel * 0.55, z + D * 0.2);
      ramp.rotation.x = 0.24;
      g.add(ramp);

      // Corner support posts (anchor dock to pond bed)
      const postMat = new THREE.MeshStandardMaterial({ color: 0x8a6030 });
      const postPositions: [number, number][] = [
        [deckX + deckW * 0.46, deckZ - deckD * 0.44],
        [deckX - deckW * 0.46, deckZ - deckD * 0.44],
        [deckX + deckW * 0.46, deckZ + deckD * 0.44],
        [deckX - deckW * 0.46, deckZ + deckD * 0.44],
      ];
      for (const [px, pz] of postPositions) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), postMat);
        post.position.set(px, deckLevel - 0.1, pz);
        g.add(post);
      }
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

    // ── Gardens (FarmBot-aligned) ──────────────────────────────────────────
    case 'farmbot-genesis':
    case 'farmbot-genesis-xl': {
      // CNC gantry over a raised bed: wood bed + soil, two side track rails along
      // the long axis (Y/depth), a cross-gantry spanning the width that rides the
      // rails, a Z leadscrew + tool head, and rows of crops in the soil. Mirrors
      // FarmBot Genesis (NEMA17 + GT2 belts + leadscrew Z).
      const g = new THREE.Group();
      const long = Math.max(W, D);          // rail axis
      const wide = Math.min(W, D);          // gantry span
      const alongZ = D >= W;                // true → rails run along Z (depth)
      const bedH = 0.5;
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.85 });
      const soilMat = new THREE.MeshStandardMaterial({ color: 0x3a2616, roughness: 1 });
      const railMat = new THREE.MeshStandardMaterial({ color: 0xb9c2c8, metalness: 0.7, roughness: 0.35 });
      const gantryMat = new THREE.MeshStandardMaterial({ color: 0xe0e3e6, metalness: 0.5, roughness: 0.4 });

      // Raised bed walls (frame) + soil fill
      const bed = new THREE.Mesh(new THREE.BoxGeometry(W, bedH, D), woodMat);
      bed.position.set(x, bedH / 2, z);
      bed.castShadow = true; bed.receiveShadow = true;
      g.add(bed);
      const soil = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, bedH * 0.5, D * 0.94), soilMat);
      soil.position.set(x, bedH * 0.78, z);
      g.add(soil);

      // Side track rails along the long axis
      const railLen = long;
      [-1, 1].forEach((side) => {
        const rx = alongZ ? x + side * (wide / 2) : x;
        const rz = alongZ ? z : z + side * (wide / 2);
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(alongZ ? 0.12 : railLen, 0.12, alongZ ? railLen : 0.12),
          railMat
        );
        rail.position.set(rx, bedH + 0.06, rz);
        rail.castShadow = true;
        g.add(rail);
      });

      // Cross-gantry beam spanning the width, parked ~30% along the rails
      const beamY = bedH + 0.62;
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(alongZ ? wide + 0.3 : 0.16, 0.16, alongZ ? 0.16 : wide + 0.3),
        gantryMat
      );
      const parkAlong = (alongZ ? z : x) - long / 2 + long * 0.32;
      const beamX = alongZ ? x : parkAlong;
      const beamZ = alongZ ? parkAlong : z;
      beam.position.set(beamX, beamY, beamZ);
      beam.castShadow = true;
      g.add(beam);
      // Gantry uprights at each end of the beam
      [-1, 1].forEach((side) => {
        const ux = alongZ ? x + side * (wide / 2) : beamX;
        const uz = alongZ ? beamZ : z + side * (wide / 2);
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.14, beamY, 0.14), gantryMat);
        col.position.set(ux, beamY / 2 + bedH, uz);
        col.castShadow = true;
        g.add(col);
      });
      // Z leadscrew carriage + tool head on the beam
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.22),
        new THREE.MeshStandardMaterial({ color: 0xc8b882, metalness: 0.4, roughness: 0.4 }));
      const headOff = (alongZ ? wide : 0) * 0.15;
      head.position.set(alongZ ? x + headOff : beamX, beamY - 0.18, alongZ ? beamZ : z + headOff);
      head.castShadow = true;
      g.add(head);

      // Crop rows in the soil
      const cropMat = new THREE.MeshStandardMaterial({ color: 0x3fa34d, roughness: 0.8 });
      const rows = Math.max(3, Math.round(long / 1.6));
      const perRow = Math.max(2, Math.round(wide / 1.4));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < perRow; c++) {
          const ta = (r + 0.5) / rows - 0.5;       // along long axis
          const tw = (c + 0.5) / perRow - 0.5;     // across width
          const px = x + (alongZ ? tw * wide * 0.86 : ta * long * 0.92);
          const pz = z + (alongZ ? ta * long * 0.92 : tw * wide * 0.86);
          const plant = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), cropMat);
          plant.position.set(px, bedH + 0.18, pz);
          plant.scale.y = 1.3;
          g.add(plant);
        }
      }
      return g;
    }

    case 'aquaponics': {
      // Fish tank + raised grow bed coupled by a return pipe.
      const g = new THREE.Group();
      const tankR = Math.min(W, D) * 0.34;
      const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(tankR, tankR, H * 0.9, 18),
        new THREE.MeshStandardMaterial({ color: 0x2a5560, roughness: 0.4, metalness: 0.2 })
      );
      tank.position.set(x - W * 0.26, H * 0.45, z);
      tank.castShadow = true;
      g.add(tank);
      const waterTop = new THREE.Mesh(
        new THREE.CylinderGeometry(tankR * 0.92, tankR * 0.92, 0.05, 18),
        new THREE.MeshStandardMaterial({ color: 0x2f7fc0, roughness: 0.1, metalness: 0.4, transparent: true, opacity: 0.85 })
      );
      waterTop.position.set(x - W * 0.26, H * 0.88, z);
      g.add(waterTop);
      const bed = new THREE.Mesh(
        new THREE.BoxGeometry(W * 0.5, H * 0.4, D * 0.78),
        new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.85 })
      );
      bed.position.set(x + W * 0.24, H * 0.5, z);
      bed.castShadow = true;
      g.add(bed);
      const grow = new THREE.Mesh(
        new THREE.BoxGeometry(W * 0.44, 0.12, D * 0.7),
        new THREE.MeshStandardMaterial({ color: 0x3fa34d, roughness: 0.8 })
      );
      grow.position.set(x + W * 0.24, H * 0.72, z);
      g.add(grow);
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, W * 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xcfd3d6, metalness: 0.6 })
      );
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(x, H * 0.78, z);
      g.add(pipe);
      return g;
    }

    case 'hydroponics': {
      // Vertical NFT tower with stacked planting cups.
      const g = new THREE.Group();
      const towerH = H * 2.2;
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.26, towerH, 12),
        new THREE.MeshStandardMaterial({ color: 0xeceff1, roughness: 0.5 })
      );
      tower.position.set(x, towerH / 2, z);
      tower.castShadow = true;
      g.add(tower);
      const cupMat = new THREE.MeshStandardMaterial({ color: 0x3fa34d, roughness: 0.8 });
      const tiers = 6;
      for (let i = 0; i < tiers; i++) {
        const ty = (towerH * 0.18) + (towerH * 0.7) * (i / (tiers - 1));
        const ang = (i % 2) * Math.PI;
        [ang, ang + Math.PI].forEach((a) => {
          const cup = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), cupMat);
          cup.position.set(x + Math.cos(a) * 0.34, ty, z + Math.sin(a) * 0.34);
          g.add(cup);
        });
      }
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.42, 0.2, 12),
        new THREE.MeshStandardMaterial({ color: 0x2a5560, roughness: 0.5 })
      );
      base.position.set(x, 0.1, z);
      g.add(base);
      return g;
    }

    case 'greenhouse': {
      // Glass-walled house with a peaked translucent roof + interior beds.
      const g = new THREE.Group();
      const wallH = H * 1.1;
      const glass = new THREE.MeshStandardMaterial({ color: 0xbfe3d0, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.32 });
      const frame = new THREE.MeshStandardMaterial({ color: 0xd8dbde, metalness: 0.5, roughness: 0.4 });
      const walls = new THREE.Mesh(new THREE.BoxGeometry(W * 0.94, wallH, D * 0.94), glass);
      walls.position.set(x, wallH / 2, z);
      g.add(walls);
      // Frame edges
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(W * 0.94, wallH, D * 0.94)),
        new THREE.LineBasicMaterial({ color: 0xeceff1 })
      );
      edges.position.set(x, wallH / 2, z);
      g.add(edges);
      const roof = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, Math.max(W, D) * 0.5, H * 0.5, 4),
        glass.clone()
      );
      roof.position.set(x, wallH + H * 0.25, z);
      roof.rotation.y = Math.PI / 4;
      g.add(roof);
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(W * 0.96, 0.06, 0.06), frame);
      ridge.position.set(x, wallH + H * 0.46, z);
      g.add(ridge);
      // Two interior beds
      [-1, 1].forEach((side) => {
        const bed = new THREE.Mesh(
          new THREE.BoxGeometry(W * 0.36, 0.3, D * 0.8),
          new THREE.MeshStandardMaterial({ color: 0x3a2616, roughness: 1 })
        );
        bed.position.set(x + side * W * 0.26, 0.15, z);
        g.add(bed);
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

// Gardens a FarmBot can be linked to (see FarmBotBridgePanel).
const FARMBOT_GARDEN_TYPES = new Set(['farmbot-genesis', 'farmbot-genesis-xl', 'aquaponics', 'hydroponics', 'greenhouse']);
const MM_PER_FT = 304.8;

/** Bright tool head + drop line marking a FarmBot's live position. */
const createFarmBotMarker = (): THREE.Group => {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x61b833, emissive: 0x2f6b12, roughness: 0.4 });
  // Sized to read at yard scale (a real tool head is ~4 in; this is exaggerated).
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.14, 0.6, 20), mat);
  head.name = 'farmbot-head';
  g.add(head);
  // Ring on the soil directly below the tool, so the X/Y position reads from above.
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 8, 32), new THREE.MeshBasicMaterial({ color: 0x9ccc65 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.52;
  g.add(ring);
  const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), new THREE.MeshBasicMaterial({ color: 0x61b833, transparent: true, opacity: 0.5 }));
  drop.name = 'farmbot-drop';
  g.add(drop);
  const label = makeTextSprite({ title: 'FarmBot', subtitle: 'live tool position', accent: '#61B833', height: 0.9 });
  label.position.y = 2.3;
  g.add(label);
  g.name = 'farmbot-live-marker';
  return g;
};

/**
 * Place a FarmBot marker over its garden bed. FarmBot X runs along the bed's long
 * side and Y across it, both from the bed's origin corner; Z is 0 at the top of
 * travel and negative going down.
 */
const placeFarmBotMarker = (marker: THREE.Group, item: PropertyItem, layout: PropertyLayoutState, pos: FarmBotPosition, h: SceneHeightFn = () => 0) => {
  const { x, z } = propertyToScenePosition(item, layout);
  const alongZ = item.depth >= item.width;
  const long = Math.max(item.width, item.depth);
  const wide = Math.min(item.width, item.depth);
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const xFt = clamp((pos.x ?? 0) / MM_PER_FT, 0, long);
  const yFt = clamp((pos.y ?? 0) / MM_PER_FT, 0, wide);
  const cornerX = x - item.width / 2;
  const cornerZ = z - item.depth / 2;
  const sceneX = alongZ ? cornerX + yFt : cornerX + xFt;
  const sceneZ = alongZ ? cornerZ + xFt : cornerZ + yFt;
  const topY = 1.3; // gantry beam height above the bed
  const headY = clamp(topY + (pos.z ?? 0) / MM_PER_FT, 0.6, topY);
  marker.position.set(sceneX, h(x, z), sceneZ); // bed sits level at its centre height
  const head = marker.getObjectByName('farmbot-head');
  const drop = marker.getObjectByName('farmbot-drop');
  if (head) head.position.y = headY;
  if (drop) { drop.scale.y = Math.max(0.01, topY + 0.3 - headY); drop.position.y = headY + drop.scale.y / 2; }
};

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
  } else if (item.type === 'bush') {
    // Cluster of small canopies — a low shrub.
    const r = Math.max(item.width, item.depth) * 0.3;
    [[0, 0, 1], [0.5, 0.3, 0.7], [-0.5, 0.2, 0.7], [0.2, -0.4, 0.7]].forEach(([dx, dz, s]) => {
      const blob = new THREE.Mesh(new THREE.SphereGeometry(r * s, 12, 8), material);
      blob.position.set(x + dx * r, r * 0.8 * s, z + dz * r);
      blob.castShadow = true;
      group.add(blob);
    });
  } else if (item.type === 'crop-row') {
    // Tilled soil strip with rows of crops — reads as a planted garden patch.
    const soil = new THREE.Mesh(
      new THREE.BoxGeometry(item.width, 0.12, item.depth),
      new THREE.MeshStandardMaterial({ color: 0x3a2616, roughness: 1 })
    );
    soil.position.set(x, 0.06, z);
    soil.receiveShadow = true;
    group.add(soil);
    const cropMat = new THREE.MeshStandardMaterial({ color: 0x6b8e23, roughness: 0.8 });
    const rows = Math.max(2, Math.round(item.depth / 1.2));
    const perRow = Math.max(3, Math.round(item.width / 1.0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < perRow; c++) {
        const px = x - item.width / 2 + (item.width / (perRow + 1)) * (c + 1);
        const pz = z - item.depth / 2 + (item.depth / (rows + 1)) * (r + 1);
        const plant = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 6), cropMat);
        plant.position.set(px, 0.28, pz);
        group.add(plant);
      }
    }
  } else if (item.type === 'rock') {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(Math.max(item.width, item.depth) * 0.35),
      material
    );
    rock.position.set(x, 0.55, z);
    rock.name = item.name;
    group.add(rock);
  } else if (item.type === 'pond') {
    // Basin rim + reflective water surface (reads as real water, not a slab).
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(item.width + 0.6, 0.16, item.depth + 0.6),
      new THREE.MeshStandardMaterial({ color: 0x5a4a32, roughness: 0.95 })
    );
    rim.position.set(x, 0.04, z);
    rim.receiveShadow = true;
    group.add(rim);
    const water = new THREE.Mesh(
      new THREE.BoxGeometry(item.width, 0.12, item.depth),
      new THREE.MeshStandardMaterial({ color: 0x2f7fc0, roughness: 0.08, metalness: 0.35, transparent: true, opacity: 0.85 })
    );
    water.position.set(x, 0.08, z);
    water.name = item.name;
    group.add(water);
  } else if (item.type === 'fence') {
    // Posts every ~6 ft along the long axis + two horizontal rails.
    const horizontal = item.width >= item.depth;
    const length = horizontal ? item.width : item.depth;
    const postMat = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.85 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xa07d54, roughness: 0.8 });
    const postH = 1.5;
    const n = Math.max(2, Math.round(length / 6));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const px = horizontal ? x - item.width / 2 + t * item.width : x;
      const pz = horizontal ? z : z - item.depth / 2 + t * item.depth;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, postH, 0.18), postMat);
      post.position.set(px, postH / 2, pz);
      post.castShadow = true;
      group.add(post);
    }
    [0.55, 1.15].forEach((ry) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(horizontal ? item.width : 0.1, 0.1, horizontal ? 0.1 : item.depth),
        railMat
      );
      rail.position.set(x, ry, z);
      rail.castShadow = true;
      group.add(rail);
    });
  } else if (item.type === 'garden' || item.type === 'no-go-zone') {
    const flat = new THREE.Mesh(new THREE.BoxGeometry(item.width, 0.08, item.depth), material);
    flat.position.set(x, 0.05, z);
    flat.name = item.name;
    group.add(flat);
    if (item.type === 'no-go-zone') {
      // Restricted area robots refuse to enter (sent to them as tc/{id}/cfg/zones): a red
      // translucent curtain on the footprint edge plus corner posts, visible from any angle.
      const curtainH = 2.5;
      const curtain = new THREE.Mesh(
        new THREE.BoxGeometry(item.width, curtainH, item.depth),
        new THREE.MeshBasicMaterial({ color: 0xcc3333, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }),
      );
      curtain.position.set(x, curtainH / 2, z);
      curtain.userData.noGoZone = item.id;
      group.add(curtain);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(item.width, curtainH, item.depth)),
        new THREE.LineBasicMaterial({ color: 0xff5555 }),
      );
      edges.position.copy(curtain.position);
      group.add(edges);
    }
  } else if (item.kind === 'hardware') {
    const hw = createHardwareMesh(item, x, z, selected, material);
    hw.name = item.product?.device_id || item.product?.id || item.name;
    hw.traverse((child) => {
      if (child instanceof THREE.Mesh) { child.receiveShadow = true; }
    });
    group.add(hw);

    // Terrain-tracking robots (Roaming Roost) map/patrol an area — draw the zone
    // they've covered as a scanned-grass disc + a boundary ring on the ground. This
    // is driven by item.scan when a real rover reports its mapped polygon; until
    // then it's derived from the placement (patrol radius from footprint).
    if (item.type === 'roaming-roost') {
      const patrolR = (item.scan?.radiusFt ?? Math.max(item.width, item.depth) * 3.5);
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(patrolR, 56),
        new THREE.MeshStandardMaterial({ color: 0x3a7d4a, roughness: 0.9, transparent: true, opacity: 0.32 })
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(x, 0.06, z);
      disc.name = `${item.id}-scan`;
      group.add(disc);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(patrolR - 0.3, patrolR, 56),
        new THREE.MeshBasicMaterial({ color: 0x8dd47a, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.07, z);
      group.add(ring);
      // Label it - an unlabelled ring was easy to mistake for other markers.
      const areaLabel = makeTextSprite({ title: `${item.name} patrol area`, subtitle: `${Math.round(patrolR)} ft radius`, height: 1.3 });
      areaLabel.position.set(x, 1.2, z + patrolR);
      group.add(areaLabel);
    }
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
  group.userData.sceneCenter = { x, z }; // settleOnTerrain() lifts the item onto the ground
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
    // Prefer a full uploaded scene/model on the item (imported "Genesis" world),
    // then a product's custom asset GLB. Both fit into the item footprint.
    const loadedGlb =
      (item.modelUrl ? glbCache.get(item.modelUrl) : undefined) ||
      (item.product?.id ? glbCache.get(item.product.id) : undefined);
    group.add(createYardItem(item, layout, activeProduct, loadedGlb));
  });
  return group;
};

/** Lift each item group (built at y=0) onto the terrain height at its centre. */
const settleOnTerrain = (root: THREE.Object3D, h: SceneHeightFn): THREE.Object3D => {
  const settle = (o: THREE.Object3D) => {
    const c = o.userData.sceneCenter as { x: number; z: number } | undefined;
    if (c) o.position.y = h(c.x, c.z);
  };
  settle(root);
  root.children.forEach(settle);
  return root;
};

const createSimulationOverlay = (layout: PropertyLayoutState, h: SceneHeightFn = () => 0): THREE.Group => {
  const group = new THREE.Group();
  const hardwarePoints = layout.items
    .filter((item) => item.kind === 'hardware' && item.type !== 'watchtower')
    .map((item) => {
      const { x, z } = propertyToScenePosition(item, layout);
      return new THREE.Vector3(x, 0.18 + h(x, z), z);
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
  const distance = mode === '2d' ? sceneSpan : sceneSpan * 1.05;
  const sideHeight = mode === '2d' ? sceneSpan * 0.12 : sceneSpan * 0.42;
  switch (preset) {
    case 'top':  return new THREE.Vector3(0, distance, 0.001);
    case 'left': return new THREE.Vector3(-distance, sideHeight, 0);
    case 'right': return new THREE.Vector3(distance, sideHeight, 0);
    case 'iso':
    default:     return new THREE.Vector3(distance * 0.82, distance * 0.62, distance * 0.82);
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Viewport3D({
  product = 'chicken-tender',
  title,
  initialWorkspaceMode = 'property',
  height,
  focusItemId,
  showYardFlags = true,
  showAttentionPanel = true,
  hydrology = null,
  towerCameras,
}: Viewport3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglOk, setWebglOk] = useState(true);
  const [camsOn, setCamsOn] = useState(towerCameras ?? product === 'predator-monitor');
  // Camera views: every mount on the placed products (inside / outside, robots, towers).
  const [availableCams, setAvailableCams] = useState<CamView[]>([]);
  const [pickedCams, setPickedCams] = useState<string[] | null>(null); // null = default
  const [camMenu, setCamMenu] = useState<HTMLElement | null>(null);
  const shownCams = useMemo(() => {
    const keys = new Set(availableCams.map((c) => c.key));
    const picked = (pickedCams ?? []).filter((k) => keys.has(k));
    if (picked.length) return picked;
    const tower = availableCams.filter((c) => c.key.includes('watchtower') || /North|South/.test(c.label));
    return (tower.length ? tower : availableCams).slice(0, 3).map((c) => c.key);
  }, [availableCams, pickedCams]);
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [controlMode, setControlMode] = useState<ControlMode>('orbit');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(initialWorkspaceMode);
  const [layout, setLayout] = useState<PropertyLayoutState>(() => loadPropertyLayout());
  const { model, loadedScene, loading, selectPreset, updateModel } = useCoopModel();

  const { products } = useProducts();
  const glbCacheRef = useRef<Map<string, THREE.Group>>(new Map());
  const [glbCacheVersion, setGlbCacheVersion] = useState(0);
  // FIX(2026-09-27): model load failures were only console.warn'd, so a broken robot
  // import silently showed the built-in shape. Track them (and skip retrying) and
  // show them in the viewport. Keyed by model URL/ref -> "Name: reason".
  const failedModelsRef = useRef<Map<string, string>>(new Map());
  // Live FarmBot tool positions (mm) per garden item, from FarmBotLivePanel.
  // Kept in a ref and applied in the render loop so updates don't rebuild the scene.
  const farmbotPosRef = useRef<Map<string, FarmBotPosition>>(new Map(latestFarmBotPositions));
  useEffect(() => {
    const onPosition = (event: Event) => {
      const { itemId, position } = (event as CustomEvent<FarmBotPositionDetail>).detail;
      if (position) farmbotPosRef.current.set(itemId, position);
      else farmbotPosRef.current.delete(itemId);
    };
    window.addEventListener(FARMBOT_POSITION_EVENT, onPosition);
    return () => window.removeEventListener(FARMBOT_POSITION_EVENT, onPosition);
  }, []);
  const [modelErrors, setModelErrors] = useState<string[]>([]);
  const recordModelError = (key: string, label: string, err: unknown) => {
    const reason = err instanceof Error && /attach the \.glb again/.test(err.message)
      ? err.message
      : describeModelLoadError(err);
    failedModelsRef.current.set(key, `${label}: ${reason}`);
    setModelErrors(Array.from(failedModelsRef.current.values()));
  };

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
    const loader = createGltfLoader();
    let cancelled = false;
    const toLoad = products.filter(
      (p) => p.metadata?.custom_device_asset_url && !glbCacheRef.current.has(p.id)
        && !failedModelsRef.current.has(p.id)
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
        (err) => {
          if (!cancelled) recordModelError(p.id, p.product_name || 'Device model', err);
          if (++done === toLoad.length && !cancelled) setGlbCacheVersion((v) => v + 1);
        }
      );
    });
    return () => { cancelled = true; };
  }, [products]);

  // Load full-scene GLBs imported onto layout items (item.modelUrl) — e.g. a user
  // imports a complete "Genesis" garden world. Cached by URL so each loads once.
  useEffect(() => {
    const loader = createGltfLoader();
    let cancelled = false;
    const pending = layout.items.filter(
      (i): i is PropertyItem & { modelUrl: string } =>
        !!i.modelUrl && !glbCacheRef.current.has(i.modelUrl) && !failedModelsRef.current.has(i.modelUrl)
    );
    const byUrl = new Map(pending.map((i) => [i.modelUrl, i.name] as const));
    if (byUrl.size === 0) return;

    let done = 0;
    const finish = () => { if (++done === byUrl.size && !cancelled) setGlbCacheVersion((v) => v + 1); };
    byUrl.forEach((name, ref) => {
      // Stored refs (idb-model:) resolve to an object URL; cache stays keyed by the ref.
      resolveModelUrl(ref)
        .then((src) => loader.loadAsync(src))
        .then((gltf) => { if (!cancelled) glbCacheRef.current.set(ref, gltf.scene); })
        .catch((err) => { if (!cancelled) recordModelError(ref, name, err); })
        .finally(finish);
    });
    return () => { cancelled = true; };
  }, [layout]);

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
    if (focusItemId) {
      const focused = enrichedItems.find((item) => item.id === focusItemId);
      if (focused) return focused;
    }
    return enrichedItems.find((item) => item.type === itemType && item.kind === 'hardware');
  }, [enrichedItems, product, focusItemId]);

  // Station flags (eggs ready, weeds to review, roost headcount). Drawn into their own
  // group so a poll update swaps just the flags, not the whole scene.
  const { flags: yardFlags, act: yardAct, robots: liveRobots } = useYardEvents(showYardFlags ? enrichedItems : []);
  const liveRobotsRef = useRef<Record<string, WeedRobotState>>({});
  liveRobotsRef.current = liveRobots;
  const flagsHolderRef = useRef<THREE.Group | null>(null);
  const [sceneVersion, setSceneVersion] = useState(0);
  useEffect(() => {
    const holder = flagsHolderRef.current;
    if (!holder) return;
    holder.children.slice().forEach((c) => { holder.remove(c); disposeYardFlags(c); });
    // Item positions are only drawn in the Products / Simulation views.
    if (workspaceMode === 'property' || !showYardFlags) return;
    holder.add(buildYardFlags(yardFlags, enrichedItems, layout,
      sceneHeightFn(layout.property, layout.property.widthFt, layout.property.depthFt)));
  }, [yardFlags, enrichedItems, layout, workspaceMode, showYardFlags, sceneVersion]);

  // Standing water + erosion from the watershed model, swapped without a scene rebuild.
  useEffect(() => {
    const holder = flagsHolderRef.current?.parent?.getObjectByName('hydrology-holder') as THREE.Group | undefined;
    if (!holder) return;
    holder.children.slice().forEach((c) => { holder.remove(c); disposeYardFlags(c); });
    if (hydrology) holder.add(buildHydrologyLayer(hydrology, layout.property.widthFt, layout.property.depthFt));
  }, [hydrology, layout, sceneVersion]);

  // Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const w = containerRef.current.clientWidth || 800;
    const h = containerRef.current.clientHeight || 500;
    const aspect = w / h;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x123d25);
    // Dev builds only: expose the scene for debugging / browser tests.
    if (import.meta.env.DEV) (window as unknown as { __tcScene?: THREE.Scene }).__tcScene = scene;

    // A page focused on one item (e.g. Weed Patrol's bed) frames that item, not the whole yard.
    const cameraSpan = focusItemId && activeItem && workspaceMode !== 'property'
      ? Math.max(activeItem.width, activeItem.depth) * 1.1 + 4
      : Math.max(layout.property.widthFt, layout.property.depthFt) * 0.58;
    const camera =
      viewMode === '2d'
        ? new THREE.OrthographicCamera(-cameraSpan * aspect, cameraSpan * aspect, cameraSpan, -cameraSpan, 0.1, 1000)
        : new THREE.PerspectiveCamera(55, aspect, 0.1, Math.max(1000, Math.max(layout.property.widthFt, layout.property.depthFt) * 8));

    // Camera target: focused on active product when in products/simulation mode
    const focusX = activeItem && workspaceMode !== 'property'
      ? activeItem.x + activeItem.width / 2 - layout.property.widthFt / 2
      : 0;
    const focusZ = activeItem && workspaceMode !== 'property'
      ? activeItem.y + activeItem.depth / 2 - layout.property.depthFt / 2
      : 0;

    const camBase = getCameraPosition(cameraPreset, viewMode, cameraSpan);
    camera.position.set(camBase.x + focusX, camBase.y, camBase.z + focusZ);
    const focusY = viewMode === '2d' && cameraPreset === 'top' ? 0 : 1;
    camera.up.set(cameraPreset === 'top' ? 0 : 0, cameraPreset === 'top' ? 0 : 1, cameraPreset === 'top' ? -1 : 0);
    camera.lookAt(focusX, focusY, focusZ);

    let renderer: THREE.WebGLRenderer;
    // Try hardware WebGL first, then a relaxed retry. failIfMajorPerformanceCaveat:
    // false lets Chrome's software renderer (SwiftShader) serve a context when the
    // GPU is blocklisted / hardware accel is off — fixes most "WebGL unavailable"
    // cases without real hardware. Only after BOTH fail do we show the fallback.
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false, alpha: true,
          failIfMajorPerformanceCaveat: false,
          powerPreference: 'low-power',
        });
      } catch (e) {
        console.warn('WebGL unavailable — 3D viewport disabled', e);
        setWebglOk(false);
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<div style="display:grid;place-items:center;height:100%;min-height:200px;color:#8A7D55;font:14px system-ui;text-align:center;padding:1.5rem;line-height:1.5">' +
            '<div><strong style="color:#C8B882">3D view needs WebGL</strong><br/>' +
            'Open in a normal Chrome/Edge tab (not an embedded/IDE preview) and turn on ' +
            '<em>graphics acceleration</em> in settings. The rest of the demo works without it.</div></div>';
        }
        return;
      }
    }
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
    controls.target.set(focusX, focusY, focusZ);
    // Gentle idle auto-rotate so the scene reads as live + fluid the moment it
    // loads; stops the instant the user grabs it.
    controls.autoRotate = viewMode === '3d';
    controls.autoRotateSpeed = 0.5;
    controls.addEventListener('start', () => { controls.autoRotate = false; });
    controls.mouseButtons = {
      LEFT: controlMode === 'pan' || viewMode === '2d' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    controls.touches = {
      ONE: controlMode === 'pan' || viewMode === '2d' ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    // Sky, light, terrain preset, surrounding field, tree line (see scenery.ts).
    buildScenery(scene, renderer, {
      widthFt: layout.property.widthFt,
      depthFt: layout.property.depthFt,
      viewMode,
      preset: layout.property.terrain ?? 'lawn',
      cameraFar: camera.far,
      terrain: layout.property,
    });
    const groundH = sceneHeightFn(layout.property, layout.property.widthFt, layout.property.depthFt);
    scene.add(createPropertyGrid(layout));

    const glbCache = glbCacheRef.current;

    if (workspaceMode === 'property') {
      // Obstacles only + featured product model centered
      const obstacleItems = enrichedItems.filter((i) => i.kind === 'obstacle') as EnrichedItem[];
      scene.add(settleOnTerrain(createYardItems(obstacleItems, layout, product, glbCache), groundH));

      if (product === 'chicken-tender') {
        if (loadedScene) {
          loadedScene.traverse((c) => { if (c instanceof THREE.Mesh) { c.castShadow = true; c.receiveShadow = true; } });
          loadedScene.position.y = groundH(0, 0);
          scene.add(loadedScene);
        } else {
          const coop = createPlaceholderCoop(model);
          coop.position.y = groundH(0, 0);
          scene.add(coop);
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
        scene.add(settleOnTerrain(createYardItem(featuredItem, layout, product, featuredGlb), groundH));
      }
    } else {
      // Products / simulation: all items with product-specific geometry
      scene.add(settleOnTerrain(createYardItems(enrichedItems, layout, product, glbCache), groundH));
    }

    if (workspaceMode === 'simulation') {
      scene.add(createSimulationOverlay(layout, groundH));
    }

    // Live FarmBot tool-head markers over garden beds (hidden until a position arrives).
    const farmbotMarkers = workspaceMode === 'property' ? [] : layout.items
      .filter((i) => i.kind === 'hardware' && FARMBOT_GARDEN_TYPES.has(i.type))
      .map((item) => {
        const marker = createFarmBotMarker();
        marker.visible = false;
        scene.add(marker);
        return { item, marker };
      });

    const flagsHolder = new THREE.Group();
    scene.add(flagsHolder);
    const hydroHolder = new THREE.Group();
    hydroHolder.name = 'hydrology-holder';
    scene.add(hydroHolder);
    flagsHolderRef.current = flagsHolder;
    setSceneVersion((v) => v + 1); // (re)build flags into the new scene
    const clock = new THREE.Clock();

    // Device camera views (WatchTower, inside / outside of coops, docks and roosts, robot
    // tool cameras, custom mounts): a PerspectiveCamera per mount, rendered as insets.
    const camItems: Array<{ id: string; name: string; type: string; cameras?: CameraMount[]; x: number; z: number; w: number; d: number }> =
      workspaceMode === 'property'
        ? (activeItem ? [{ ...activeItem, type: product === 'predator-monitor' ? 'watchtower' : activeItem.type, x: 0, z: 0, w: activeItem.width, d: activeItem.depth }] : [])
        : enrichedItems.filter((i) => i.kind === 'hardware').map((i) => ({ ...i, ...propertyToScenePosition(i, layout), w: i.width, d: i.depth }));
    const camRigs = new Map<string, THREE.PerspectiveCamera>();
    const views: CamView[] = [];
    for (const it of camItems) {
      for (const mnt of mountsFor(it)) {
        const key = viewKey(it.id, mnt.id);
        views.push({ key, label: `${it.name} · ${mnt.label}` });
        const cx = it.x + mnt.fx * it.w, cz = it.z + mnt.fz * it.d;
        const cy = groundH(it.x, it.z) + mnt.heightFt;
        const yaw = THREE.MathUtils.degToRad(mnt.yawDeg), pitch = THREE.MathUtils.degToRad(mnt.pitchDeg);
        const cam = new THREE.PerspectiveCamera(vfovFor(mnt.hfovDeg), CAM_ASPECT, 0.2, camera.far);
        cam.position.set(cx, cy, cz);
        cam.lookAt(cx + Math.sin(yaw) * Math.cos(pitch) * 10, cy + Math.sin(pitch) * 10, cz - Math.cos(yaw) * Math.cos(pitch) * 10);
        camRigs.set(key, cam);
      }
    }
    setAvailableCams(views);
    const towerCams: THREE.PerspectiveCamera[] = camsOn && viewMode === '3d'
      ? shownCams.map((k) => camRigs.get(k)).filter((c): c is THREE.PerspectiveCamera => !!c)
      : [];
    const renderTowerCams = () => {
      if (!towerCams.length) return;
      const cw = renderer.domElement.clientWidth, ch = renderer.domElement.clientHeight;
      const w = Math.round(cw * 0.2), h = Math.round(w / CAM_ASPECT);
      if (w < 60 || h + 60 > ch) return;
      renderer.setScissorTest(true);
      towerCams.forEach((cam, i) => {
        const x = 8 + i * (w + 6);
        renderer.setViewport(x, 56, w, h);
        renderer.setScissor(x, 56, w, h);
        renderer.render(scene, cam);
      });
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, cw, ch);
    };

    // Weed robots on their garden beds (demo: simulated robot; live: state/weed).
    const weedRobots = workspaceMode === 'property' || !showYardFlags ? [] : enrichedItems
      .filter((i) => i.kind === 'hardware' && WEED_BED_TYPES.has(i.type))
      .map((item) => ({ item, marker: null as THREE.Group | null }));

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      animateYardFlags(flagsHolder, t);
      weedRobots.forEach((r) => {
        const st = YARD_LIVE ? liveRobotsRef.current[r.item.id] : getSimRobot(r.item.id);
        const type = st?.robotType ?? 'genesis-laser';
        if (!st || !st.tool) { if (r.marker) r.marker.visible = false; return; }
        if (!r.marker || r.marker.userData.type !== type) {
          if (r.marker) { scene.remove(r.marker); disposeYardFlags(r.marker); }
          r.marker = createWeedRobot(type, r.item);
          scene.add(r.marker);
        }
        r.marker.visible = true;
        placeWeedRobot(r.marker, r.item, layout, st, groundH, t);
      });
      farmbotMarkers.forEach(({ item, marker }) => {
        const pos = farmbotPosRef.current.get(item.id);
        marker.visible = !!pos;
        if (pos) placeFarmBotMarker(marker, item, layout, pos, groundH);
      });
      controls.update();
      renderer.render(scene, camera);
      renderTowerCams();
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const nw = containerRef.current.clientWidth;
      const nh = containerRef.current.clientHeight;
      if (!nw || !nh) return; // hidden/collapsed panel - avoid an Infinity aspect
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
    // FIX(2026-09-27): follow the container, not just the window, so the canvas
    // resizes when side panels / tabs change its size.
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      flagsHolder.children.slice().forEach((c) => disposeYardFlags(c));
      if (flagsHolderRef.current === flagsHolder) flagsHolderRef.current = null;
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [
    loadedScene, model, viewMode, cameraPreset, controlMode,
    workspaceMode, layout, product, enrichedItems, glbCacheVersion, activeItem, camsOn, showYardFlags, focusItemId,
    shownCams,
  ]);

  const deviceCount = products.length;
  const matchedCount = enrichedItems.filter((i) => i.kind === 'hardware' && i.product).length;

  const handleViewModeChange = (_: unknown, nextMode: ViewMode | null) => {
    if (!nextMode) return;
    setViewMode(nextMode);
    if (nextMode === '2d') {
      setCameraPreset((current) => (current === 'iso' ? 'top' : current));
      setControlMode('pan');
    }
  };

  const handleCameraPresetChange = (_: unknown, nextPreset: CameraPreset | null) => {
    if (!nextPreset) return;
    setCameraPreset(nextPreset);
    if (nextPreset === 'iso') {
      setViewMode('3d');
      setControlMode('orbit');
    }
  };

  const handleControlModeChange = (_: unknown, nextControlMode: ControlMode | null) => {
    if (!nextControlMode) return;
    setControlMode(viewMode === '2d' ? 'pan' : nextControlMode);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        height: height || { xs: 'min(72dvh, 540px)', sm: 'min(68dvh, 520px)', lg: 560 },
        minHeight: { xs: 380, sm: 400 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box ref={containerRef} sx={{ width: '100%', height: '100%', touchAction: 'none' }} />

      {modelErrors.length > 0 && (
        <Box role="alert" sx={{
          position: 'absolute', top: 8, left: 8, right: 8, zIndex: 7, p: 1, borderRadius: 1,
          bgcolor: 'rgba(204, 51, 51, 0.92)', color: '#F0EDE4', fontSize: 12, lineHeight: 1.4,
        }}>
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <Box sx={{ flex: 1 }}>
              <strong>Some 3D models could not be shown</strong> (the built-in shape is used instead):
              {modelErrors.map((m) => <Box key={m}>• {m}</Box>)}
            </Box>
            <Button size="small" onClick={() => setModelErrors([])} sx={{ color: '#F0EDE4', minWidth: 0 }}>
              Dismiss
            </Button>
          </Stack>
        </Box>
      )}

      {/* Proof it's a live WebGL scene, not a static image — addresses "is the 3D real". */}
      {webglOk && (
        <Box sx={{
          position: 'absolute', bottom: 8, right: 8, zIndex: 6, display: 'flex', alignItems: 'center', gap: 0.6,
          px: 1, py: 0.3, borderRadius: 999, bgcolor: 'rgba(0,0,0,0.55)',
          border: '1px solid #4A7C59', pointerEvents: 'none',
        }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#4CAF50',
            boxShadow: '0 0 6px #4CAF50' }} />
          <Box component="span" sx={{ color: '#C8B882', fontSize: 11, fontWeight: 700, letterSpacing: 0.4 }}>
            LIVE 3D · WebGL
          </Box>
        </Box>
      )}

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

      {/* Labels for the camera insets drawn in the WebGL canvas (same layout math). */}
      {camsOn && viewMode === '3d' && webglOk && shownCams.map((k, i) => (
        <Box key={k} data-testid="tower-cam-label" sx={{
          position: 'absolute', bottom: 56, left: `calc(8px + ${i} * (20% + 6px))`, width: '20%', aspectRatio: '4 / 3',
          border: '1px solid rgba(204,51,51,0.8)', borderRadius: '2px', pointerEvents: 'none', zIndex: 5,
        }}>
          <Box component="span" sx={{ position: 'absolute', top: 2, left: 4, fontSize: 10, fontWeight: 700, color: '#F0EDE4',
            bgcolor: 'rgba(0,0,0,0.55)', px: 0.5, borderRadius: '2px', fontFamily: 'monospace' }}>
            {availableCams.find((c) => c.key === k)?.label ?? k} · SIM
          </Box>
        </Box>
      ))}

      {showYardFlags && showAttentionPanel && (
        <Box sx={{ position: 'absolute', top: { xs: 60, sm: 64 }, right: 12, zIndex: 9, width: 'min(360px, calc(100% - 24px))',
          display: 'flex', justifyContent: 'flex-end' }}>
          <YardAttentionPanel
            flags={yardFlags}
            act={yardAct}
            maxRows={3}
            onFocus={() => { if (workspaceMode === 'property') setWorkspaceMode('products'); }}
          />
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
        <Stack direction="row" spacing={1} useFlexGap flexWrap={{ xs: 'nowrap', sm: 'wrap' }}>
          <ToggleButtonGroup size="small" exclusive value={viewMode}
            onChange={handleViewModeChange} sx={{ bgcolor: 'rgba(0,31,22,0.9)' }}>
            <ToggleButton value="2d">2D</ToggleButton>
            <ToggleButton value="3d">3D</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup size="small" exclusive value={cameraPreset}
            onChange={handleCameraPresetChange} sx={{ bgcolor: 'rgba(0,31,22,0.9)' }}>
            <ToggleButton value="top">Top</ToggleButton>
            <ToggleButton value="left">Left</ToggleButton>
            <ToggleButton value="right">Right</ToggleButton>
            <ToggleButton value="iso">ISO</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup size="small" exclusive value={controlMode}
            onChange={handleControlModeChange} sx={{ bgcolor: 'rgba(0,31,22,0.9)' }}>
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
        <TextField select size="small" value={layout.property.terrain ?? 'lawn'} aria-label="Terrain"
          onChange={(e) => {
            const next = { ...layout, property: { ...layout.property, terrain: e.target.value as TerrainPreset } };
            savePropertyLayout(next); // syncs the 2D editor + other views via PROPERTY_LAYOUT_EVENT
            setLayout(next);
          }}
          sx={{ minWidth: 110, bgcolor: 'rgba(0,31,22,0.9)', '& .MuiSelect-select': { py: '5px', fontSize: 13 } }}>
          {(Object.keys(TERRAIN_PRESETS) as TerrainPreset[]).map((k) => (
            <MenuItem key={k} value={k}>{TERRAIN_PRESETS[k].label}</MenuItem>
          ))}
        </TextField>
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
                // Saved to IndexedDB so the model survives a reload when not signed in.
                const localUrl = await saveModelFile(file).catch(() => URL.createObjectURL(file));
                const localModel: CoopModelConfig = {
                  id: `custom-${Date.now()}`,
                  name: file.name.replace(/\.(glb|gltf)$/i, ''),
                  size: 'custom',
                  dimensions: model.dimensions,
                  modelUrl: localUrl,
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
          {availableCams.length > 0 && viewMode === '3d' && (
            <>
              <Button size="small" variant={camsOn ? 'contained' : 'outlined'} data-testid="cameras-button"
                onClick={(e) => setCamMenu(e.currentTarget)}
                sx={camsOn ? { bgcolor: '#CC3333', '&:hover': { bgcolor: '#A82828' } } : undefined}>
                Cameras{camsOn ? ` (${shownCams.length})` : ''}
              </Button>
              <Menu anchorEl={camMenu} open={!!camMenu} onClose={() => setCamMenu(null)}>
                <MenuItem onClick={() => { setCamsOn((v) => !v); setCamMenu(null); }}>
                  {camsOn ? 'Hide camera views' : 'Show camera views'}
                </MenuItem>
                {availableCams.map((c) => (
                  <MenuItem key={c.key} dense onClick={() => {
                    setCamsOn(true);
                    // Up to three views; picking a fourth drops the oldest.
                    setPickedCams(shownCams.includes(c.key) ? shownCams.filter((k) => k !== c.key) : [...shownCams, c.key].slice(-3));
                  }}>
                    {shownCams.includes(c.key) && camsOn ? '✓ ' : '\u2003'}{c.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
          <Button size="small" variant="outlined" onClick={() => { setCameraPreset('iso'); setViewMode('3d'); setControlMode('orbit'); }}>
            Reset View
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
