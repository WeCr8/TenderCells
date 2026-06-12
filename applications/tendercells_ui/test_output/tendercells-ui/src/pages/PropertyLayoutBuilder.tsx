// PropertyLayoutBuilder.tsx - Yard layout grid UI
import React, { useState } from 'react';
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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface GridCell {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'coop' | 'roost' | 'water' | 'empty';
  name: string;
}

const COLORS: Record<string, string> = {
  coop: '#D4A574',
  roost: '#8B6F47',
  water: '#4A90E2',
  empty: '#3d7d3d',
};

export default function PropertyLayoutBuilder() {
  const [cells, setCells] = useState<GridCell[]>([
    { id: '1', x: 0, y: 0, width: 4, height: 4, type: 'coop', name: 'Chicken Tender' },
  ]);
  const [gridSize] = useState(20); // 20x20 grid cells
  const [cellSize] = useState(30); // pixels per cell
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');

  const handleAddCell = () => {
    setSelectedCell({
      id: String(Date.now()),
      x: 0,
      y: 0,
      width: 3,
      height: 3,
      type: 'coop',
      name: 'New Device',
    });
    setEditName('New Device');
    setDialogOpen(true);
  };

  const handleSaveCell = () => {
    if (!selectedCell) return;
    const updated = { ...selectedCell, name: editName };
    if (cells.find(c => c.id === selectedCell.id)) {
      setCells(cells.map(c => (c.id === selectedCell.id ? updated : c)));
    } else {
      setCells([...cells, updated]);
    }
    setDialogOpen(false);
    setSelectedCell(null);
  };

  const handleDeleteCell = (id: string) => {
    setCells(cells.filter(c => c.id !== id));
  };

  const handleCellClick = (cell: GridCell) => {
    setSelectedCell(cell);
    setEditName(cell.name);
    setDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Property Layout
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Design your property layout by placing coops, roosts, and other structures on the grid
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddCell}>
          Add Device
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Grid View */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 2,
              background: '#1B542B',
              position: 'relative',
              width: '100%',
              height: gridSize * cellSize + 40,
            }}
          >
            <svg
              width={gridSize * cellSize}
              height={gridSize * cellSize}
              style={{ border: '1px solid #555' }}
            >
              {/* Grid lines */}
              {Array.from({ length: gridSize + 1 }).map((_, i) => (
                <g key={`lines-${i}`}>
                  <line
                    x1={i * cellSize}
                    y1={0}
                    x2={i * cellSize}
                    y2={gridSize * cellSize}
                    stroke="#333"
                    strokeWidth={1}
                  />
                  <line
                    x1={0}
                    y1={i * cellSize}
                    x2={gridSize * cellSize}
                    y2={i * cellSize}
                    stroke="#333"
                    strokeWidth={1}
                  />
                </g>
              ))}

              {/* Placed cells */}
              {cells.map(cell => (
                <g
                  key={cell.id}
                  onClick={() => handleCellClick(cell)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={cell.x * cellSize}
                    y={cell.y * cellSize}
                    width={cell.width * cellSize}
                    height={cell.height * cellSize}
                    fill={COLORS[cell.type]}
                    stroke={selectedCell?.id === cell.id ? '#FFD700' : '#333'}
                    strokeWidth={selectedCell?.id === cell.id ? 3 : 1}
                    opacity={0.8}
                  />
                  <text
                    x={cell.x * cellSize + (cell.width * cellSize) / 2}
                    y={cell.y * cellSize + (cell.height * cellSize) / 2}
                    textAnchor="middle"
                    dy="0.3em"
                    fill="#fff"
                    fontSize={12}
                  >
                    {cell.name}
                  </text>
                </g>
              ))}
            </svg>
          </Paper>
        </Grid>

        {/* Device List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Placed Devices
            </Typography>
            <Stack spacing={1}>
              {cells.map(cell => (
                <Box
                  key={cell.id}
                  sx={{
                    p: 1,
                    bgcolor: COLORS[cell.type],
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.9 },
                  }}
                  onClick={() => handleCellClick(cell)}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {cell.name}
                    </Typography>
                    <Typography variant="caption">
                      Position: ({cell.x}, {cell.y}) | Size: {cell.width}×{cell.height}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="text"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCell(cell.id);
                    }}
                  >
                    <DeleteIcon />
                  </Button>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedCell?.id ? 'Edit Device' : 'Add Device'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Device Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          {selectedCell && (
            <>
              <TextField
                label="Position X"
                type="number"
                value={selectedCell.x}
                onChange={(e) =>
                  setSelectedCell({ ...selectedCell, x: parseInt(e.target.value) || 0 })
                }
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Position Y"
                type="number"
                value={selectedCell.y}
                onChange={(e) =>
                  setSelectedCell({ ...selectedCell, y: parseInt(e.target.value) || 0 })
                }
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Width (cells)"
                type="number"
                value={selectedCell.width}
                onChange={(e) =>
                  setSelectedCell({ ...selectedCell, width: parseInt(e.target.value) || 1 })
                }
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Height (cells)"
                type="number"
                value={selectedCell.height}
                onChange={(e) =>
                  setSelectedCell({ ...selectedCell, height: parseInt(e.target.value) || 1 })
                }
                fullWidth
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCell} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
