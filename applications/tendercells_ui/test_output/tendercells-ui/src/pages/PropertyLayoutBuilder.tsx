// PropertyLayoutBuilder.tsx - Yard/property CRUD and simulation layout editor
import { useEffect, useMemo, useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Grass as GrassIcon,
  PlayArrow as PlayArrowIcon,
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
type LayoutMode = 'edit' | 'simulation';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function PropertyLayoutBuilder() {
  const initial = useMemo(loadPropertyLayout, []);
  const [property, setProperty] = useState<PropertyConfig>(initial.property);
  const [items, setItems] = useState<PropertyItem[]>(initial.items);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(initial.items[0]?.id || null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PropertyItem | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('edit');
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const selectedItem = items.find((item) => item.id === selectedItemId) || null;
  const mapWidth = 900;
  const mapHeight = Math.max(420, Math.round((property.depthFt / property.widthFt) * mapWidth));
  const scaleX = mapWidth / property.widthFt;
  const scaleY = mapHeight / property.depthFt;

  useEffect(() => {
    savePropertyLayout({ property, items });
  }, [property, items]);

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
    setEditingItem(item);
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
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }
  };

  const moveItem = (itemId: string, x: number, y: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              x: clamp(Math.round(x), 0, Math.max(0, property.widthFt - item.width)),
              y: clamp(Math.round(y), 0, Math.max(0, property.depthFt - item.depth)),
            }
          : item
      )
    );
  };

  const getPointerPosition = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * property.widthFt,
      y: ((event.clientY - rect.top) / rect.height) * property.depthFt,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingItemId) return;
    const item = items.find((candidate) => candidate.id === draggingItemId);
    if (!item) return;
    const pointer = getPointerPosition(event);
    moveItem(draggingItemId, pointer.x - item.width / 2, pointer.y - item.depth / 2);
  };

  const renderItemShape = (item: PropertyItem) => {
    const x = item.x * scaleX;
    const y = item.y * scaleY;
    const width = item.width * scaleX;
    const height = item.depth * scaleY;
    const color = ITEM_COLORS[item.type] || '#A5B1A9';
    const selected = selectedItemId === item.id;

    if (item.type === 'tree' || item.type === 'rock') {
      return (
        <ellipse
          cx={x + width / 2}
          cy={y + height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={color}
          opacity={0.88}
          stroke={selected ? '#FFD700' : '#0D2B1E'}
          strokeWidth={selected ? 3 : 1}
        />
      );
    }

    if (item.type === 'pond' || item.type === 'garden' || item.type === 'no-go-zone') {
      return (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={14}
          fill={color}
          opacity={item.type === 'no-go-zone' ? 0.38 : 0.82}
          stroke={selected ? '#FFD700' : '#0D2B1E'}
          strokeWidth={selected ? 3 : 1}
          strokeDasharray={item.type === 'no-go-zone' ? '8 5' : undefined}
        />
      );
    }

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={color}
        opacity={0.88}
        stroke={selected ? '#FFD700' : '#0D2B1E'}
        strokeWidth={selected ? 3 : 1}
      />
    );
  };

  const routePoints = items
    .filter((item) => item.kind === 'hardware' && item.type !== 'watchtower')
    .map((item) => `${(item.x + item.width / 2) * scaleX},${(item.y + item.depth / 2) * scaleY}`)
    .join(' ');

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'flex-start' }}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" gutterBottom sx={{ color: '#E4E7E5' }}>
            Property Layout
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Build the yard map used by product placement, Roaming Roost route simulation, and obstacle avoidance.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <ToggleButtonGroup
            size="small"
            exclusive
            value={layoutMode}
            onChange={(_, value) => value && setLayoutMode(value)}
          >
            <ToggleButton value="edit">Edit</ToggleButton>
            <ToggleButton value="simulation">Simulation</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openAddDialog('hardware')}>
            Add Hardware
          </Button>
          <Button variant="outlined" startIcon={<GrassIcon />} onClick={() => openAddDialog('obstacle')}>
            Add Obstacle
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: { xs: 1, sm: 2 }, background: '#1B542B', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <svg
              viewBox={`0 0 ${mapWidth} ${mapHeight}`}
              width="100%"
              height={mapHeight}
              role="img"
              aria-label={`${property.name} property layout`}
              style={{ minWidth: 640, maxHeight: '70dvh', border: '1px solid #1F5C3B', touchAction: 'none', background: '#123D25' }}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setDraggingItemId(null)}
              onPointerLeave={() => setDraggingItemId(null)}
            >
              {Array.from({ length: Math.floor(property.widthFt / property.gridStepFt) + 1 }).map((_, i) => (
                <line
                  key={`v-${i}`}
                  x1={i * property.gridStepFt * scaleX}
                  y1={0}
                  x2={i * property.gridStepFt * scaleX}
                  y2={mapHeight}
                  stroke="#1F5C3B"
                  strokeWidth={1}
                />
              ))}
              {Array.from({ length: Math.floor(property.depthFt / property.gridStepFt) + 1 }).map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1={0}
                  y1={i * property.gridStepFt * scaleY}
                  x2={mapWidth}
                  y2={i * property.gridStepFt * scaleY}
                  stroke="#1F5C3B"
                  strokeWidth={1}
                />
              ))}

              {layoutMode === 'simulation' && routePoints && (
                <polyline points={routePoints} fill="none" stroke="#8DD47A" strokeWidth={5} strokeDasharray="12 8" />
              )}

              {items.map((item) => (
                <g
                  key={item.id}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    setSelectedItemId(item.id);
                    setDraggingItemId(item.id);
                  }}
                  onDoubleClick={() => openEditDialog(item)}
                  style={{ cursor: layoutMode === 'edit' ? 'grab' : 'pointer' }}
                >
                  {renderItemShape(item)}
                  <text
                    x={(item.x + item.width / 2) * scaleX}
                    y={(item.y + item.depth / 2) * scaleY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#F0EDE4"
                    fontSize={13}
                    fontWeight={700}
                    pointerEvents="none"
                  >
                    {item.name}
                  </text>
                </g>
              ))}
            </svg>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Property
              </Typography>
              <TextField
                label="Property Name"
                value={property.name}
                onChange={(event) => updateProperty({ name: event.target.value })}
                fullWidth
                sx={{ mb: 1.5 }}
              />
              <Grid container spacing={1.5}>
                <Grid item xs={4}>
                  <TextField
                    label="Width ft"
                    type="number"
                    value={property.widthFt}
                    onChange={(event) => updateProperty({ widthFt: parseInt(event.target.value, 10) || 20 })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Depth ft"
                    type="number"
                    value={property.depthFt}
                    onChange={(event) => updateProperty({ depthFt: parseInt(event.target.value, 10) || 20 })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Grid ft"
                    type="number"
                    value={property.gridStepFt}
                    onChange={(event) => updateProperty({ gridStepFt: parseInt(event.target.value, 10) || 1 })}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Items
              </Typography>
              <Stack spacing={1}>
                {items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 1.25,
                      borderRadius: 1,
                      bgcolor: selectedItemId === item.id ? '#0D2B1E' : '#002017',
                      border: selectedItemId === item.id ? '1px solid #6BBF59' : '1px solid transparent',
                    }}
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#E4E7E5', fontWeight: 700 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.kind} / {item.type} / ({item.x}, {item.y}) / {item.width}x{item.depth} ft
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit item">
                          <IconButton size="small" onClick={() => openEditDialog(item)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete item">
                          <IconButton size="small" color="error" onClick={() => deleteItem(item.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Paper>

            {selectedItem && (
              <Paper sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h6">Selected</Typography>
                  <Chip label={selectedItem.kind} size="small" />
                </Stack>
                <Typography variant="body2" sx={{ color: '#E4E7E5', mb: 1 }}>
                  {selectedItem.name}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Button size="small" variant="outlined" onClick={() => moveItem(selectedItem.id, selectedItem.x, selectedItem.y - property.gridStepFt)}>
                    Up
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => moveItem(selectedItem.id, selectedItem.x, selectedItem.y + property.gridStepFt)}>
                    Down
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => moveItem(selectedItem.id, selectedItem.x - property.gridStepFt, selectedItem.y)}>
                    Left
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => moveItem(selectedItem.id, selectedItem.x + property.gridStepFt, selectedItem.y)}>
                    Right
                  </Button>
                  {layoutMode === 'simulation' && selectedItem.type === 'roaming-roost' && (
                    <Button size="small" variant="contained" startIcon={<PlayArrowIcon />}>
                      Simulate Route
                    </Button>
                  )}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{items.some((item) => item.id === editingItem?.id) ? 'Edit Item' : 'Add Item'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editingItem && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  value={editingItem.name}
                  onChange={(event) => setEditingItem({ ...editingItem, name: event.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Kind"
                  value={editingItem.kind}
                  onChange={(event) => {
                    const nextKind = event.target.value as PropertyItemKind;
                    setEditingItem({
                      ...editingItem,
                      kind: nextKind,
                      type: nextKind === 'hardware' ? 'roaming-roost' : 'tree',
                    });
                  }}
                  fullWidth
                >
                  <MenuItem value="hardware">Hardware/Product</MenuItem>
                  <MenuItem value="obstacle">Obstacle</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Type"
                  value={editingItem.type}
                  onChange={(event) => setEditingItem({ ...editingItem, type: event.target.value as HardwareType | ObstacleType })}
                  fullWidth
                >
                  {(editingItem.kind === 'hardware' ? HARDWARE_TYPES : OBSTACLE_TYPES).map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {(['x', 'y', 'width', 'depth'] as const).map((field) => (
                <Grid item xs={6} sm={3} key={field}>
                  <TextField
                    label={field === 'x' ? 'X ft' : field === 'y' ? 'Y ft' : `${field} ft`}
                    type="number"
                    value={editingItem[field]}
                    onChange={(event) =>
                      setEditingItem({
                        ...editingItem,
                        [field]: parseInt(event.target.value, 10) || 0,
                      })
                    }
                    fullWidth
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveItem} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
