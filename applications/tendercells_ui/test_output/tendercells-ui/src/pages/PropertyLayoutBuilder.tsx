// PropertyLayoutBuilder.tsx - Yard/property CRUD and simulation layout editor
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  MenuItem,
  Chip,
  Divider,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Badge,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Grass as GrassIcon,
  PlayArrow as PlayArrowIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  ArrowBack as ArrowLeftIcon,
  ArrowForward as ArrowRightIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  Layers as LayersIcon,
  Agriculture as AgricultureIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import {
  HARDWARE_TYPES,
  ITEM_COLORS,
  OBSTACLE_TYPES,
  loadPropertyLayout,
  savePropertyLayout,
  type HardwareType,
  type ObstacleType,
  type PropertyConfig,
  type PropertyItem,
  type PropertyItemKind,
} from '../components/property/propertyLayoutStore';
import Viewport3D from '../components/viewport/Viewport3D';
import './PropertyLayoutBuilder.css';

type LayoutMode = 'edit' | 'simulation';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const snapToStep = (val: number, step: number) => Math.round(val / step) * step;

const TYPE_LABELS: Record<string, string> = {
  'chicken-tender': 'Chicken Tender™',
  'roaming-roost': 'Roaming Roost™',
  'duck-dock': 'Duck Dock™',
  'bunny-burrow': 'Bunny Burrow™',
  'goat-guardian': 'Goat Guardian™',
  'turkey-tower': 'Turkey Tower™',
  'pigeon-palace': 'Pigeon Palace™',
  watchtower: 'WatchTower AI™',
  tree: 'Tree',
  rock: 'Rock',
  pond: 'Pond',
  garden: 'Garden',
  'no-go-zone': 'No-Go Zone',
  fence: 'Fence',
};

// Obstacle types that the Roaming Roost must avoid
const ROAMING_BLOCKED_TYPES = new Set(['tree', 'rock', 'pond', 'fence', 'no-go-zone']);

export default function PropertyLayoutBuilder() {
  const initial = useMemo(loadPropertyLayout, []);
  const [property, setProperty] = useState<PropertyConfig>(initial.property);
  const [items, setItems] = useState<PropertyItem[]>(initial.items);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(initial.items[0]?.id || null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PropertyItem | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('edit');
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [dragSnapPos, setDragSnapPos] = useState<{ x: number; y: number; width: number; depth: number } | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [showRoamingLayer, setShowRoamingLayer] = useState(false);

  const selectedItem = items.find((item) => item.id === selectedItemId) || null;
  const mapWidth = 900;
  const mapHeight = Math.max(420, Math.round((property.depthFt / property.widthFt) * mapWidth));
  const scaleX = mapWidth / property.widthFt;
  const scaleY = mapHeight / property.depthFt;
  const hardwareCount = items.filter((i) => i.kind === 'hardware').length;
  const majorStep = property.gridStepFt >= 10 ? property.gridStepFt : property.gridStepFt * 5;

  useEffect(() => {
    savePropertyLayout({ property, items });
  }, [property, items]);

  // Keyboard arrow nudge for selected item
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selectedItem || dialogOpen) return;
      const step = property.gridStepFt;
      const dirs: Record<string, [number, number]> = {
        ArrowUp: [0, -step], ArrowDown: [0, step],
        ArrowLeft: [-step, 0], ArrowRight: [step, 0],
      };
      if (dirs[e.key]) {
        e.preventDefault();
        const [dx, dy] = dirs[e.key];
        nudgeItem(selectedItem.id, selectedItem.x + dx, selectedItem.y + dy);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem, dialogOpen, property.gridStepFt]);

  const updateProperty = (updates: Partial<PropertyConfig>) => {
    const nextProperty = {
      ...property,
      ...updates,
      widthFt: Math.max(20, updates.widthFt ?? property.widthFt),
      depthFt: Math.max(20, updates.depthFt ?? property.depthFt),
      gridStepFt: Math.max(1, updates.gridStepFt ?? property.gridStepFt),
    };
    setProperty(nextProperty);
    setItems((current) =>
      current.map((item) => ({
        ...item,
        x: clamp(item.x, 0, Math.max(0, nextProperty.widthFt - item.width)),
        y: clamp(item.y, 0, Math.max(0, nextProperty.depthFt - item.depth)),
      }))
    );
  };

  const openAddDialog = (kind: PropertyItemKind) => {
    const type = kind === 'hardware' ? 'roaming-roost' : 'tree';
    setEditingItem({
      id: `item-${Date.now()}`,
      kind,
      name: kind === 'hardware' ? 'New Hardware' : 'New Obstacle',
      type,
      x: 5,
      y: 5,
      width: kind === 'hardware' ? 10 : 8,
      depth: kind === 'hardware' ? 8 : 8,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: PropertyItem) => {
    setEditingItem({ ...item });
    setDialogOpen(true);
  };

  const saveItem = () => {
    if (!editingItem) return;
    const cleanItem = {
      ...editingItem,
      name: editingItem.name.trim() || 'Unnamed',
      x: clamp(editingItem.x, 0, Math.max(0, property.widthFt - editingItem.width)),
      y: clamp(editingItem.y, 0, Math.max(0, property.depthFt - editingItem.depth)),
      width: Math.max(1, editingItem.width),
      depth: Math.max(1, editingItem.depth),
    };
    setItems((current) => {
      const exists = current.some((item) => item.id === cleanItem.id);
      return exists ? current.map((item) => (item.id === cleanItem.id ? cleanItem : item)) : [...current, cleanItem];
    });
    setSelectedItemId(cleanItem.id);
    setEditingItem(null);
    setDialogOpen(false);
  };

  const deleteItem = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
    if (selectedItemId === itemId) setSelectedItemId(null);
  };

  // Core move — always snaps to gridStepFt or step=1 depending on doSnap flag
  const moveItemSnap = useCallback((itemId: string, x: number, y: number, doSnap: boolean) => {
    const step = doSnap ? property.gridStepFt : 1;
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              x: clamp(snapToStep(x, step), 0, Math.max(0, property.widthFt - item.width)),
              y: clamp(snapToStep(y, step), 0, Math.max(0, property.depthFt - item.depth)),
            }
          : item
      )
    );
  }, [property.gridStepFt, property.widthFt, property.depthFt]);

  // Nudge (keyboard / arrow buttons) always snaps to grid
  const nudgeItem = useCallback((itemId: string, x: number, y: number) => {
    moveItemSnap(itemId, x, y, true);
  }, [moveItemSnap]);

  const getPointerPosition = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * property.widthFt,
      y: ((event.clientY - rect.top) / rect.height) * property.depthFt,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const pointer = getPointerPosition(event);
    setHoverPos({ x: Math.round(pointer.x * 10) / 10, y: Math.round(pointer.y * 10) / 10 });

    if (!draggingItemId) return;
    const item = items.find((candidate) => candidate.id === draggingItemId);
    if (!item) return;
    const rawX = pointer.x - item.width / 2;
    const rawY = pointer.y - item.depth / 2;
    const doSnap = snapEnabled && !event.shiftKey;
    const step = doSnap ? property.gridStepFt : 1;
    const snappedX = clamp(snapToStep(rawX, step), 0, Math.max(0, property.widthFt - item.width));
    const snappedY = clamp(snapToStep(rawY, step), 0, Math.max(0, property.depthFt - item.depth));
    setDragSnapPos({ x: snappedX, y: snappedY, width: item.width, depth: item.depth });
    moveItemSnap(draggingItemId, rawX, rawY, doSnap);
  };

  const renderItemShape = (item: PropertyItem) => {
    const x = item.x * scaleX;
    const y = item.y * scaleY;
    const w = item.width * scaleX;
    const h = item.depth * scaleY;
    const color = ITEM_COLORS[item.type] || '#A5B1A9';
    const selected = selectedItemId === item.id;
    const isDragging = draggingItemId === item.id;
    const selStroke = isDragging ? '#FFD700' : selected ? '#6BBF59' : 'rgba(13,43,30,0.7)';
    const selWidth = selected || isDragging ? 3 : 1.5;
    const opacity = isDragging ? 0.6 : 0.92;
    // Use SVG filter attribute (not CSS inline style) to avoid linter warning
    const filterRef = isDragging ? 'url(#plb-glow-drag)' : selected ? 'url(#plb-glow-sel)' : 'url(#plb-shadow)';

    if (item.type === 'tree' || item.type === 'rock') {
      return (
        <g filter={filterRef}>
          <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill={color} opacity={opacity} stroke={selStroke} strokeWidth={selWidth} />
        </g>
      );
    }

    if (item.type === 'pond' || item.type === 'garden' || item.type === 'no-go-zone') {
      return (
        <g filter={filterRef}>
          <rect x={x} y={y} width={w} height={h} rx={14} fill={color} opacity={item.type === 'no-go-zone' ? 0.32 : opacity} stroke={selStroke} strokeWidth={selWidth} strokeDasharray={item.type === 'no-go-zone' ? '8 5' : undefined} />
        </g>
      );
    }

    return (
      <g filter={filterRef}>
        <rect x={x + 2} y={y + 3} width={w} height={h} rx={6} fill="rgba(0,0,0,0.3)" />
        <rect x={x} y={y} width={w} height={h} rx={6} fill={color} opacity={opacity} stroke={selStroke} strokeWidth={selWidth} />
        {selected && <rect x={x + 2} y={y + 2} width={w - 4} height={6} rx={4} fill="rgba(255,255,255,0.12)" />}
      </g>
    );
  };

  const routePoints = items
    .filter((item) => item.kind === 'hardware' && item.type !== 'watchtower')
    .map((item) => `${(item.x + item.width / 2) * scaleX},${(item.y + item.depth / 2) * scaleY}`)
    .join(' ');

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 3 } }}>
      {/* Page Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 3, p: { xs: 2, md: 3 },
          background: 'linear-gradient(135deg, #0D2B1E 0%, #1A3D2B 60%, #163422 100%)',
          border: '1px solid #2A5C3B', borderRadius: 2,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
              <LayersIcon sx={{ color: '#6BBF59', fontSize: 28 }} />
              <Typography variant="h4" sx={{ color: '#E4E7E5', fontWeight: 700, lineHeight: 1 }}>
                Property Layout
              </Typography>
              <Chip label={property.name} size="small" sx={{ bgcolor: '#4A7C59', color: '#E4E7E5', fontWeight: 600, ml: 1 }} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
              {property.widthFt} × {property.depthFt} ft · {(property.widthFt * property.depthFt).toLocaleString()} sq ft ·{' '}
              {hardwareCount} products · {items.length - hardwareCount} obstacles
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
            <ToggleButtonGroup
              size="small" exclusive value={layoutMode}
              onChange={(_, value) => value && setLayoutMode(value)}
              sx={{ bgcolor: 'rgba(0,31,22,0.8)', border: '1px solid #2A5C3B' }}
            >
              <ToggleButton value="edit" sx={{ px: 2 }}>Edit</ToggleButton>
              <ToggleButton value="simulation" sx={{ px: 2 }}>Simulate</ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title={snapEnabled ? `Snap: ${property.gridStepFt}ft grid (hold Shift to bypass)` : 'Snap off — free positioning'}>
              <ToggleButton
                value="snap" selected={snapEnabled}
                onChange={() => setSnapEnabled((s) => !s)}
                size="small"
                sx={{
                  px: 1.5, border: '1px solid',
                  borderColor: snapEnabled ? '#6BBF59' : '#2A5C3B',
                  color: snapEnabled ? '#6BBF59' : 'text.secondary',
                  '&.Mui-selected': { bgcolor: alpha('#6BBF59', 0.12), color: '#6BBF59' },
                }}
              >
                {snapEnabled ? <GridOnIcon fontSize="small" sx={{ mr: 0.5 }} /> : <GridOffIcon fontSize="small" sx={{ mr: 0.5 }} />}
                {snapEnabled ? `Snap ${property.gridStepFt}ft` : 'Free'}
              </ToggleButton>
            </Tooltip>

            <Tooltip title={showRoamingLayer ? 'Hide Roaming Roost coverage map' : 'Show Roaming Roost stay-out zones'}>
              <ToggleButton
                value="roaming" selected={showRoamingLayer}
                onChange={() => setShowRoamingLayer((v) => !v)}
                size="small"
                sx={{
                  px: 1.5, border: '1px solid',
                  borderColor: showRoamingLayer ? '#E8A020' : '#2A5C3B',
                  color: showRoamingLayer ? '#E8A020' : 'text.secondary',
                  '&.Mui-selected': { bgcolor: alpha('#E8A020', 0.12), color: '#E8A020' },
                }}
              >
                {showRoamingLayer ? <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} /> : <VisibilityOffIcon fontSize="small" sx={{ mr: 0.5 }} />}
                Roaming Map
              </ToggleButton>
            </Tooltip>

            <Button
              variant="contained" size="small" startIcon={<AgricultureIcon />}
              onClick={() => openAddDialog('hardware')}
              sx={{ bgcolor: '#4A7C59', '&:hover': { bgcolor: '#5A9069' } }}
            >
              Add Product
            </Button>
            <Button
              variant="outlined" size="small" startIcon={<GrassIcon />}
              onClick={() => openAddDialog('obstacle')}
              sx={{ borderColor: '#2A5C3B', color: '#A5B1A9', '&:hover': { borderColor: '#4A7C59', color: '#E4E7E5' } }}
            >
              Add Obstacle
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Roaming Layer Legend */}
      {showRoamingLayer && (
        <Paper
          elevation={0}
          sx={{
            mb: 2, px: 2, py: 1,
            bgcolor: alpha('#E8A020', 0.08),
            border: `1px solid ${alpha('#E8A020', 0.35)}`,
            borderRadius: 1,
          }}
        >
          <Stack direction="row" spacing={2.5} alignItems="center" flexWrap="wrap">
            <Typography variant="caption" sx={{ color: '#E8A020', fontWeight: 700, letterSpacing: 0.5 }}>
              ROAMING COVERAGE MAP
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'rgba(107,191,89,0.35)', border: '1px solid rgba(107,191,89,0.6)' }} />
              <Typography variant="caption" color="text.secondary">Allowed roaming area</Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'rgba(204,51,51,0.35)', border: '1px solid rgba(204,51,51,0.6)' }} />
              <Typography variant="caption" color="text.secondary">Stay-out zone (obstacle / no-go)</Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'rgba(204,51,51,0.6)', border: '2px solid #CC3333' }} />
              <Typography variant="caption" color="text.secondary">Hard no-go zone</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Add "No-Go Zone" obstacles to block areas. Roaming Roost avoids all obstacles automatically.
            </Typography>
          </Stack>
        </Paper>
      )}

      <Grid container spacing={2}>
        {/* SVG Canvas */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={4} sx={{ p: 0, background: '#0A2118', border: '1px solid #1F5C3B', borderRadius: 2, overflow: 'hidden' }}>
            {/* Canvas toolbar */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.5, py: 0.75, bgcolor: '#0D2B1E', borderBottom: '1px solid #1A3D2B' }}>
              <Typography variant="caption" sx={{ color: '#4A7C59', fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}>
                YARD MAP
              </Typography>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: '#1A3D2B' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {property.widthFt}×{property.depthFt} ft · grid {property.gridStepFt} ft
              </Typography>
              <Box sx={{ flex: 1 }} />
              {hoverPos && (
                <Typography variant="caption" sx={{ color: '#C8B882', fontFamily: 'monospace' }}>
                  {hoverPos.x.toFixed(1)}, {hoverPos.y.toFixed(1)} ft
                </Typography>
              )}
              {draggingItemId && dragSnapPos && (
                <Chip
                  label={`→ ${dragSnapPos.x}, ${dragSnapPos.y} ft`}
                  size="small"
                  sx={{ bgcolor: alpha('#FFD700', 0.15), color: '#FFD700', fontFamily: 'monospace', fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Stack>

            <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <svg
                viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                width="100%"
                height={mapHeight}
                role="img"
                aria-label={`${property.name} property layout`}
                className="plb-canvas"
                onPointerMove={handlePointerMove}
                onPointerLeave={() => { setHoverPos(null); setDraggingItemId(null); setDragSnapPos(null); }}
                onPointerUp={() => { setDraggingItemId(null); setDragSnapPos(null); }}
              >
                <defs>
                  <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stopColor="#123D25" />
                    <stop offset="100%" stopColor="#0A2118" />
                  </radialGradient>
                  {/* Drop shadow for normal items */}
                  <filter id="plb-shadow" x="-10%" y="-10%" width="120%" height="130%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.55)" />
                  </filter>
                  {/* Green glow for selected items */}
                  <filter id="plb-glow-sel" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="4" in="SourceGraphic" result="blur" />
                    <feFlood floodColor="#6BBF59" floodOpacity="0.55" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="shadow" />
                    <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  {/* Gold glow for dragging items */}
                  <filter id="plb-glow-drag" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="4" in="SourceGraphic" result="blur" />
                    <feFlood floodColor="#FFD700" floodOpacity="0.55" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="shadow" />
                    <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  {/* Red hatch pattern for hard no-go zones */}
                  <pattern id="plb-hatch-red" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(204,51,51,0.7)" strokeWidth="3" />
                  </pattern>
                  {/* Yellow hatch pattern for soft obstacles */}
                  <pattern id="plb-hatch-warn" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(232,160,32,0.5)" strokeWidth="2" />
                  </pattern>
                </defs>

                <rect x={0} y={0} width={mapWidth} height={mapHeight} fill="url(#bgGrad)" />

                {/* Minor grid lines */}
                {Array.from({ length: Math.floor(property.widthFt / property.gridStepFt) + 1 }).map((_, i) => (
                  <line key={`v-${i}`} x1={i * property.gridStepFt * scaleX} y1={0} x2={i * property.gridStepFt * scaleX} y2={mapHeight} stroke="#1A3D2B" strokeWidth={1} />
                ))}
                {Array.from({ length: Math.floor(property.depthFt / property.gridStepFt) + 1 }).map((_, i) => (
                  <line key={`h-${i}`} x1={0} y1={i * property.gridStepFt * scaleY} x2={mapWidth} y2={i * property.gridStepFt * scaleY} stroke="#1A3D2B" strokeWidth={1} />
                ))}

                {/* Major grid lines */}
                {Array.from({ length: Math.floor(property.widthFt / majorStep) + 1 }).map((_, i) => (
                  <line key={`vM-${i}`} x1={i * majorStep * scaleX} y1={0} x2={i * majorStep * scaleX} y2={mapHeight} stroke="#1F5C3B" strokeWidth={1.5} />
                ))}
                {Array.from({ length: Math.floor(property.depthFt / majorStep) + 1 }).map((_, i) => (
                  <line key={`hM-${i}`} x1={0} y1={i * majorStep * scaleY} x2={mapWidth} y2={i * majorStep * scaleY} stroke="#1F5C3B" strokeWidth={1.5} />
                ))}

                {/* Grid intersection dots */}
                {Array.from({ length: Math.floor(property.widthFt / property.gridStepFt) + 1 }).map((_, xi) =>
                  Array.from({ length: Math.floor(property.depthFt / property.gridStepFt) + 1 }).map((_, yi) => (
                    <circle key={`d-${xi}-${yi}`} cx={xi * property.gridStepFt * scaleX} cy={yi * property.gridStepFt * scaleY} r={2} fill="#2A5C3B" />
                  ))
                )}

                {/* Dimension labels along edges */}
                {Array.from({ length: Math.floor(property.widthFt / majorStep) + 1 }).map((_, i) =>
                  i > 0 ? (
                    <text key={`lv-${i}`} x={i * majorStep * scaleX} y={mapHeight - 4} textAnchor="middle" fill="#2A5C3B" fontSize={10} fontFamily="monospace">
                      {i * majorStep}
                    </text>
                  ) : null
                )}
                {Array.from({ length: Math.floor(property.depthFt / majorStep) + 1 }).map((_, i) =>
                  i > 0 ? (
                    <text key={`lh-${i}`} x={6} y={i * majorStep * scaleY} dominantBaseline="middle" fill="#2A5C3B" fontSize={10} fontFamily="monospace">
                      {i * majorStep}
                    </text>
                  ) : null
                )}

                {/* Border */}
                <rect x={0} y={0} width={mapWidth} height={mapHeight} fill="none" stroke="#2A5C3B" strokeWidth={2} />

                {/* ── Roaming Coverage Layer ── */}
                {showRoamingLayer && (
                  <g>
                    {/* Allowed zone: entire yard tinted green */}
                    <rect x={0} y={0} width={mapWidth} height={mapHeight} fill="rgba(107,191,89,0.10)" />
                    {/* Stay-out zones: obstacles */}
                    {items
                      .filter((item) => item.kind === 'obstacle' && ROAMING_BLOCKED_TYPES.has(item.type))
                      .map((item) => {
                        const bx = item.x * scaleX;
                        const by = item.y * scaleY;
                        const bw = item.width * scaleX;
                        const bh = item.depth * scaleY;
                        const isHardNoGo = item.type === 'no-go-zone';
                        return (
                          <g key={`roam-${item.id}`}>
                            {/* Solid overlay */}
                            <rect x={bx} y={by} width={bw} height={bh} rx={isHardNoGo ? 8 : 4}
                              fill={isHardNoGo ? 'rgba(204,51,51,0.45)' : 'rgba(204,51,51,0.25)'}
                              stroke={isHardNoGo ? '#CC3333' : 'rgba(204,51,51,0.5)'}
                              strokeWidth={isHardNoGo ? 2.5 : 1.5}
                              strokeDasharray={isHardNoGo ? '6 3' : undefined}
                            />
                            {/* Hatch fill */}
                            <rect x={bx} y={by} width={bw} height={bh} rx={isHardNoGo ? 8 : 4}
                              fill={`url(#${isHardNoGo ? 'plb-hatch-red' : 'plb-hatch-warn'})`}
                              opacity={0.6}
                            />
                            {/* Label */}
                            <text
                              x={bx + bw / 2} y={by + bh / 2}
                              textAnchor="middle" dominantBaseline="middle"
                              fill={isHardNoGo ? '#FF6666' : '#E8A020'}
                              fontSize={10} fontFamily="monospace" fontWeight={700}
                            >
                              {isHardNoGo ? '⛔ NO-GO' : '⚠ AVOID'}
                            </text>
                          </g>
                        );
                      })}
                    {/* Hardware items (coops, watchtower) also block roaming */}
                    {items
                      .filter((item) => item.kind === 'hardware' && item.type !== 'roaming-roost')
                      .map((item) => {
                        const bx = item.x * scaleX;
                        const by = item.y * scaleY;
                        const bw = item.width * scaleX;
                        const bh = item.depth * scaleY;
                        return (
                          <rect key={`roam-hw-${item.id}`}
                            x={bx} y={by} width={bw} height={bh} rx={6}
                            fill="rgba(200,184,130,0.15)"
                            stroke="rgba(200,184,130,0.4)"
                            strokeWidth={1.5} strokeDasharray="4 3"
                          />
                        );
                      })}
                  </g>
                )}

                {/* Simulation route */}
                {layoutMode === 'simulation' && routePoints && (
                  <>
                    <polyline points={routePoints} fill="none" stroke="#1A3D2B" strokeWidth={8} />
                    <polyline points={routePoints} fill="none" stroke="#8DD47A" strokeWidth={3} strokeDasharray="14 8" opacity={0.9} />
                  </>
                )}

                {/* Snap crosshair + preview rect */}
                {dragSnapPos && draggingItemId && (
                  <>
                    <line x1={dragSnapPos.x * scaleX} y1={0} x2={dragSnapPos.x * scaleX} y2={mapHeight} stroke="#FFD700" strokeWidth={1} strokeDasharray="5 5" opacity={0.45} />
                    <line x1={0} y1={dragSnapPos.y * scaleY} x2={mapWidth} y2={dragSnapPos.y * scaleY} stroke="#FFD700" strokeWidth={1} strokeDasharray="5 5" opacity={0.45} />
                    <rect
                      x={dragSnapPos.x * scaleX} y={dragSnapPos.y * scaleY}
                      width={dragSnapPos.width * scaleX} height={dragSnapPos.depth * scaleY}
                      fill="rgba(255,215,0,0.08)" stroke="#FFD700"
                      strokeWidth={2} strokeDasharray="8 4" opacity={0.85} rx={4}
                    />
                    <circle cx={dragSnapPos.x * scaleX} cy={dragSnapPos.y * scaleY} r={5} fill="#FFD700" opacity={0.7} />
                    <text
                      x={dragSnapPos.x * scaleX + 8} y={dragSnapPos.y * scaleY - 6}
                      fill="#FFD700" fontSize={11} fontFamily="monospace" fontWeight={700}
                    >
                      {dragSnapPos.x}, {dragSnapPos.y} ft
                    </text>
                  </>
                )}

                {/* Items */}
                {items.map((item) => (
                  <g
                    key={item.id}
                    className={layoutMode === 'edit' ? (draggingItemId === item.id ? 'plb-item-grabbing' : 'plb-item-grab') : 'plb-item-pointer'}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      setSelectedItemId(item.id);
                      if (layoutMode === 'edit') setDraggingItemId(item.id);
                    }}
                    onDoubleClick={() => openEditDialog(item)}
                  >
                    {renderItemShape(item)}
                    {/* Label pill */}
                    <rect
                      x={(item.x + item.width / 2) * scaleX - (item.name.length * 3.8 + 8)}
                      y={(item.y + item.depth / 2) * scaleY - 9}
                      width={item.name.length * 7.6 + 16} height={17}
                      rx={8} fill="rgba(0,0,0,0.55)" pointerEvents="none"
                    />
                    <text
                      x={(item.x + item.width / 2) * scaleX}
                      y={(item.y + item.depth / 2) * scaleY + 1}
                      textAnchor="middle" dominantBaseline="middle"
                      fill="#F0EDE4" fontSize={12} fontWeight={700}
                      fontFamily="system-ui, sans-serif" pointerEvents="none"
                    >
                      {item.name}
                    </text>
                    {/* Size label */}
                    <text
                      x={(item.x + item.width) * scaleX - 3}
                      y={(item.y + item.depth) * scaleY - 3}
                      textAnchor="end" fill="rgba(255,255,255,0.4)"
                      fontSize={9} fontFamily="monospace" pointerEvents="none"
                    >
                      {item.width}×{item.depth}
                    </text>
                  </g>
                ))}
              </svg>
            </Box>

            {/* Canvas legend */}
            <Stack direction="row" spacing={2} sx={{ px: 1.5, py: 0.75, bgcolor: '#0D2B1E', borderTop: '1px solid #1A3D2B' }} flexWrap="wrap">
              <Typography variant="caption" color="text.secondary">
                Drag to move · Double-click to edit · Arrow keys to nudge
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#FFD700', 0.7) }}>
                Hold Shift to bypass snap
              </Typography>
            </Stack>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            {/* Property Config */}
            <Paper elevation={3} sx={{ p: 2, border: '1px solid #1A3D2B' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ width: 4, height: 20, bgcolor: '#4A7C59', borderRadius: 1, flexShrink: 0 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Property</Typography>
              </Stack>
              <TextField
                label="Property Name"
                value={property.name}
                onChange={(event) => updateProperty({ name: event.target.value })}
                fullWidth size="small" sx={{ mb: 1.5 }}
              />
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <TextField label="Width ft" type="number" value={property.widthFt}
                    onChange={(event) => updateProperty({ widthFt: parseInt(event.target.value, 10) || 20 })}
                    fullWidth size="small" inputProps={{ min: 20 }} />
                </Grid>
                <Grid item xs={4}>
                  <TextField label="Depth ft" type="number" value={property.depthFt}
                    onChange={(event) => updateProperty({ depthFt: parseInt(event.target.value, 10) || 20 })}
                    fullWidth size="small" inputProps={{ min: 20 }} />
                </Grid>
                <Grid item xs={4}>
                  <TextField label="Grid ft" type="number" value={property.gridStepFt}
                    onChange={(event) => updateProperty({ gridStepFt: parseInt(event.target.value, 10) || 1 })}
                    fullWidth size="small" inputProps={{ min: 1 }} />
                </Grid>
              </Grid>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Chip label={`${(property.widthFt * property.depthFt).toLocaleString()} sq ft`} size="small" sx={{ bgcolor: '#1A3D2B', color: '#A5B1A9', fontSize: '0.7rem' }} />
                <Chip label={`${items.length} items`} size="small" sx={{ bgcolor: '#1A3D2B', color: '#A5B1A9', fontSize: '0.7rem' }} />
              </Stack>
            </Paper>

            {/* Selected Item Panel */}
            {selectedItem && (
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  border: `1px solid ${draggingItemId === selectedItem.id ? '#FFD700' : '#6BBF59'}`,
                  background: 'linear-gradient(135deg, #0D2B1E 0%, #091D14 100%)',
                  transition: 'border-color 0.2s',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: ITEM_COLORS[selectedItem.type] || '#A5B1A9', flexShrink: 0, border: '2px solid rgba(255,255,255,0.2)' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedItem.name}
                  </Typography>
                  <Chip
                    label={selectedItem.kind} size="small"
                    sx={{
                      bgcolor: selectedItem.kind === 'hardware' ? alpha('#6BBF59', 0.2) : alpha('#8A7D55', 0.2),
                      color: selectedItem.kind === 'hardware' ? '#6BBF59' : '#C8B882',
                      fontSize: '0.65rem',
                    }}
                  />
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block', mb: 1 }}>
                  {TYPE_LABELS[selectedItem.type] || selectedItem.type}
                </Typography>

                {/* Coordinate readout */}
                <Box sx={{ bgcolor: '#061510', border: '1px solid #1A3D2B', borderRadius: 1, p: 1, mb: 1.5, fontFamily: 'monospace' }}>
                  <Stack direction="row" spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>X (ft)</Typography>
                      <Typography variant="body2" sx={{ color: '#C8B882', fontFamily: 'monospace', fontWeight: 700 }}>{selectedItem.x}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>Y (ft)</Typography>
                      <Typography variant="body2" sx={{ color: '#C8B882', fontFamily: 'monospace', fontWeight: 700 }}>{selectedItem.y}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>Size</Typography>
                      <Typography variant="body2" sx={{ color: '#A5B1A9', fontFamily: 'monospace' }}>{selectedItem.width}×{selectedItem.depth} ft</Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Arrow nudge grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.5, width: 120, mx: 'auto', mb: 1.5 }}>
                  <Box />
                  <Tooltip title={`Up ${property.gridStepFt}ft (↑)`}>
                    <IconButton size="small" onClick={() => nudgeItem(selectedItem.id, selectedItem.x, selectedItem.y - property.gridStepFt)} sx={{ bgcolor: '#1A3D2B', '&:hover': { bgcolor: '#2A5C3B' } }}>
                      <ArrowUpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Box />
                  <Tooltip title={`Left ${property.gridStepFt}ft (←)`}>
                    <IconButton size="small" onClick={() => nudgeItem(selectedItem.id, selectedItem.x - property.gridStepFt, selectedItem.y)} sx={{ bgcolor: '#1A3D2B', '&:hover': { bgcolor: '#2A5C3B' } }}>
                      <ArrowLeftIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Box sx={{ bgcolor: '#1A3D2B', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#4A7C59', fontFamily: 'monospace', fontSize: '0.6rem' }}>{property.gridStepFt}ft</Typography>
                  </Box>
                  <Tooltip title={`Right ${property.gridStepFt}ft (→)`}>
                    <IconButton size="small" onClick={() => nudgeItem(selectedItem.id, selectedItem.x + property.gridStepFt, selectedItem.y)} sx={{ bgcolor: '#1A3D2B', '&:hover': { bgcolor: '#2A5C3B' } }}>
                      <ArrowRightIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Box />
                  <Tooltip title={`Down ${property.gridStepFt}ft (↓)`}>
                    <IconButton size="small" onClick={() => nudgeItem(selectedItem.id, selectedItem.x, selectedItem.y + property.gridStepFt)} sx={{ bgcolor: '#1A3D2B', '&:hover': { bgcolor: '#2A5C3B' } }}>
                      <ArrowDownIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Box />
                </Box>

                <Divider sx={{ borderColor: '#1A3D2B', mb: 1.5 }} />
                <Stack direction="row" spacing={1} justifyContent="space-between">
                  <Button size="small" variant="outlined" startIcon={<EditIcon fontSize="small" />} onClick={() => openEditDialog(selectedItem)} sx={{ flex: 1, borderColor: '#2A5C3B', color: '#A5B1A9' }}>
                    Edit
                  </Button>
                  <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => deleteItem(selectedItem.id)} sx={{ flex: 1 }}>
                    Remove
                  </Button>
                </Stack>

                {layoutMode === 'simulation' && selectedItem.type === 'roaming-roost' && (
                  <Button size="small" variant="contained" fullWidth startIcon={<PlayArrowIcon />} sx={{ mt: 1, bgcolor: '#4A7C59' }}>
                    Simulate Route
                  </Button>
                )}
              </Paper>
            )}

            {/* Items List */}
            <Paper elevation={3} sx={{ p: 2, border: '1px solid #1A3D2B' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Box sx={{ width: 4, height: 20, bgcolor: '#C8B882', borderRadius: 1, flexShrink: 0 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>Items</Typography>
                <Badge badgeContent={items.length} color="primary" sx={{ '& .MuiBadge-badge': { bgcolor: '#4A7C59' } }}>
                  <Box sx={{ width: 16 }} />
                </Badge>
              </Stack>
              <Stack spacing={0.75}>
                {items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 1, borderRadius: 1.5,
                      bgcolor: selectedItemId === item.id ? alpha('#6BBF59', 0.1) : 'rgba(0,31,22,0.6)',
                      border: '1px solid',
                      borderColor: selectedItemId === item.id ? '#4A7C59' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.15s',
                      '&:hover': { bgcolor: alpha('#4A7C59', 0.08), borderColor: '#2A5C3B' },
                    }}
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: ITEM_COLORS[item.type] || '#A5B1A9', flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ color: '#E4E7E5', fontWeight: 600, lineHeight: 1.3 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>
                          ({item.x}, {item.y}) · {item.width}×{item.depth} ft
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.25}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEditDialog(item); }} sx={{ p: 0.25 }}>
                            <EditIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} sx={{ p: 0.25 }}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
                {items.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No items. Add a product or obstacle.
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* 3D Viewport — live preview of property layout, synced via PROPERTY_LAYOUT_EVENT */}
      <Box sx={{ mt: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ width: 4, height: 20, bgcolor: '#4A7C59', borderRadius: 1, flexShrink: 0 }} />
          <Typography variant="subtitle1" sx={{ color: '#C8B882', fontWeight: 700, letterSpacing: 0.5 }}>
            3D Property View
          </Typography>
          <Typography variant="caption" sx={{ color: '#4A7C59' }}>
            Updates live as you edit the yard map above
          </Typography>
        </Stack>
        <Viewport3D
          title={`${items.length} items`}
          initialWorkspaceMode="products"
          height={{ xs: 'min(55dvh, 400px)', sm: 'min(62dvh, 480px)', lg: 520 }}
        />
      </Box>

      {/* Add / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { background: 'linear-gradient(135deg, #0D2B1E 0%, #091D14 100%)', border: '1px solid #2A5C3B' } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {editingItem && (
              <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: ITEM_COLORS[editingItem.type] || '#A5B1A9', flexShrink: 0 }} />
            )}
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {items.some((item) => item.id === editingItem?.id) ? 'Edit Item' : 'Add Item'}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {editingItem && (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  value={editingItem.name}
                  onChange={(event) => setEditingItem({ ...editingItem, name: event.target.value })}
                  fullWidth autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select label="Kind" value={editingItem.kind}
                  onChange={(event) => {
                    const nextKind = event.target.value as PropertyItemKind;
                    setEditingItem({ ...editingItem, kind: nextKind, type: nextKind === 'hardware' ? 'roaming-roost' : 'tree' });
                  }}
                  fullWidth
                >
                  <MenuItem value="hardware">Hardware / Product</MenuItem>
                  <MenuItem value="obstacle">Obstacle / Feature</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select label="Type" value={editingItem.type}
                  onChange={(event) => setEditingItem({ ...editingItem, type: event.target.value as HardwareType | ObstacleType })}
                  fullWidth
                >
                  {(editingItem.kind === 'hardware' ? HARDWARE_TYPES : OBSTACLE_TYPES).map((type) => (
                    <MenuItem key={type} value={type}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: ITEM_COLORS[type] || '#A5B1A9', flexShrink: 0 }} />
                        <span>{TYPE_LABELS[type] || type}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Position & Size (feet)
                </Typography>
                <Grid container spacing={1.5}>
                  {(['x', 'y', 'width', 'depth'] as const).map((field) => (
                    <Grid item xs={6} sm={3} key={field}>
                      <TextField
                        label={field === 'x' ? 'X' : field === 'y' ? 'Y' : field === 'width' ? 'Width' : 'Depth'}
                        type="number" value={editingItem[field]}
                        onChange={(event) => setEditingItem({ ...editingItem, [field]: parseInt(event.target.value, 10) || 0 })}
                        fullWidth size="small"
                        InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary">ft</Typography> }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
              {editingItem.kind === 'obstacle' && editingItem.type === 'no-go-zone' && (
                <Grid item xs={12}>
                  <Box sx={{ bgcolor: alpha('#CC3333', 0.1), border: `1px solid ${alpha('#CC3333', 0.3)}`, borderRadius: 1, p: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#EF5350', fontWeight: 600 }}>
                      ⛔ No-Go Zone — Roaming Roost will not enter this area
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={saveItem} variant="contained" sx={{ bgcolor: '#4A7C59', '&:hover': { bgcolor: '#5A9069' } }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
