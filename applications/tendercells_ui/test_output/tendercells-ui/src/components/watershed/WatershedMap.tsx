// WatershedMap.tsx - 2D watershed view: shaded ground, standing water, flow paths,
// erosion risk, items and drainage fixes. Clicks report property-feet coordinates so
// the page can place fixes.
import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import type { PropertyItem } from '../property/propertyLayoutStore';
import { TERRAIN_KINDS, zoneAt, type TerrainLayers } from '../property/terrain';
import type { DrainageFix, HydrologyResult } from '../property/watershed';

export interface WatershedLayers { water: boolean; flow: boolean; erosion: boolean }

interface Props {
  result: HydrologyResult;
  widthFt: number;
  depthFt: number;
  terrain: TerrainLayers;
  items: PropertyItem[];
  fixes: DrainageFix[];
  layers: WatershedLayers;
  /** Start point of a linear fix being drawn (swale / berm). */
  pending?: { x: number; y: number } | null;
  highlight?: { x: number; y: number } | null;
  onPick?: (p: { x: number; y: number }) => void;
}

const FIX_COLORS: Record<DrainageFix['kind'], string> = {
  drain: '#2196F3', 'rain-garden': '#6BBF59', swale: '#64B5F6', berm: '#A1887F', fill: '#C8B882',
};

/** Canvas map of the watershed result (feet → px scaled to fit the width). */
export default function WatershedMap({ result, widthFt, depthFt, terrain, items, fixes, layers, pending, highlight, onPick }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const cssW = canvas.clientWidth || 900;
    const scale = cssW / widthFt;
    const cssH = depthFt * scale;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0); // draw in feet

    const { cols, rows, cellFt, ground, water, flow, erosion, down } = result;
    let gMin = Infinity, gMax = -Infinity;
    for (const g of ground) { gMin = Math.min(gMin, g); gMax = Math.max(gMax, g); }
    const span = Math.max(0.5, gMax - gMin);

    // Ground: surface colour, shaded by height and by a simple NW light (hillshade).
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = r * cols + c;
        const x = c * cellFt, y = r * cellFt;
        const kind = zoneAt(terrain, x + cellFt / 2, y + cellFt / 2)?.kind ?? 'lawn';
        const base = TERRAIN_KINDS[kind].color;
        const west = c > 0 ? ground[k - 1] : ground[k], north = r > 0 ? ground[k - cols] : ground[k];
        const shade = Math.max(-0.35, Math.min(0.35, ((ground[k] - west) + (ground[k] - north)) * 2.5));
        const lift = ((ground[k] - gMin) / span - 0.5) * 0.25 + shade;
        ctx.fillStyle = base;
        ctx.fillRect(x, y, cellFt + 0.02, cellFt + 0.02);
        ctx.fillStyle = lift >= 0 ? `rgba(255,255,255,${lift})` : `rgba(0,0,0,${-lift})`;
        ctx.fillRect(x, y, cellFt + 0.02, cellFt + 0.02);
      }
    }

    // Items (outlines) for orientation.
    ctx.lineWidth = 0.25;
    for (const i of items) {
      ctx.strokeStyle = i.type === 'pond' ? '#3F8FD2' : i.kind === 'hardware' ? '#C8B882' : 'rgba(240,237,228,0.55)';
      ctx.fillStyle = i.type === 'pond' ? 'rgba(63,143,210,0.55)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(i.x, i.y, i.width, i.depth);
      ctx.strokeRect(i.x, i.y, i.width, i.depth);
    }

    if (layers.erosion) {
      for (let k = 0; k < erosion.length; k++) {
        if (!erosion[k]) continue;
        ctx.fillStyle = erosion[k] === 2 ? 'rgba(204,51,51,0.65)' : 'rgba(232,160,32,0.45)';
        ctx.fillRect((k % cols) * cellFt, Math.floor(k / cols) * cellFt, cellFt, cellFt);
      }
    }

    if (layers.flow) {
      // Paths where enough water gathers to matter; width grows with flow.
      let fMax = 0;
      for (const f of flow) fMax = Math.max(fMax, f);
      const minFlow = fMax * 0.05;
      ctx.strokeStyle = 'rgba(144,202,249,0.9)';
      ctx.lineCap = 'round';
      for (let k = 0; k < flow.length; k++) {
        const j = down[k];
        if (j < 0 || flow[k] < minFlow) continue;
        ctx.lineWidth = Math.min(1.2, 0.12 + Math.sqrt(flow[k] / fMax) * 1.1) * cellFt;
        ctx.beginPath();
        ctx.moveTo((k % cols + 0.5) * cellFt, (Math.floor(k / cols) + 0.5) * cellFt);
        ctx.lineTo((j % cols + 0.5) * cellFt, (Math.floor(j / cols) + 0.5) * cellFt);
        ctx.stroke();
      }
    }

    if (layers.water) {
      for (let k = 0; k < water.length; k++) {
        const d = water[k];
        if (d <= 0.25 / 12) continue;
        const a = Math.min(0.9, 0.35 + d * 1.2); // deeper = darker
        ctx.fillStyle = `rgba(25,118,210,${a})`;
        ctx.fillRect((k % cols) * cellFt, Math.floor(k / cols) * cellFt, cellFt, cellFt);
      }
    }

    // Fixes.
    for (const f of fixes) {
      ctx.strokeStyle = FIX_COLORS[f.kind];
      ctx.fillStyle = `${FIX_COLORS[f.kind]}55`;
      ctx.lineWidth = 0.35;
      if (f.kind === 'swale' || f.kind === 'berm') {
        ctx.lineWidth = Math.max(0.5, f.sizeFt * (f.kind === 'berm' ? 1 : 1.2));
        ctx.setLineDash(f.kind === 'berm' ? [] : [1.2, 0.6]);
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.x2 ?? f.x, f.y2 ?? f.y);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.sizeFt, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (f.kind === 'drain') { ctx.fillStyle = FIX_COLORS.drain; ctx.fillRect(f.x - 0.4, f.y - 0.4, 0.8, 0.8); }
      }
    }
    if (pending) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath(); ctx.arc(pending.x, pending.y, 0.8, 0, Math.PI * 2); ctx.fill();
    }
    if (highlight) {
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.arc(highlight.x, highlight.y, 3, 0, Math.PI * 2); ctx.stroke();
    }
  }, [result, widthFt, depthFt, terrain, items, fixes, layers, pending, highlight]);

  return (
    <Box
      component="canvas"
      ref={ref}
      role="img"
      aria-label="Watershed map: standing water, flow paths and erosion risk"
      data-testid="watershed-map"
      onClick={(e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onPick) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * widthFt;
        const y = ((e.clientY - rect.top) / rect.height) * depthFt;
        onPick({ x: Math.round(x * 2) / 2, y: Math.round(y * 2) / 2 });
      }}
      sx={{ width: '100%', display: 'block', borderRadius: 1, cursor: onPick ? 'crosshair' : 'default', touchAction: 'manipulation' }}
    />
  );
}
