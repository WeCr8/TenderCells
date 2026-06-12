// PropertySizePanel.tsx
import {
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
} from '@mui/material';
import type { YardShape, GridScale } from '../../types/property';

interface PropertySizePanelProps {
  name: string;
  onNameChange: (name: string) => void;
  width: number;
  onWidthChange: (width: number) => void;
  depth: number;
  onDepthChange: (depth: number) => void;
  shape: YardShape;
  onShapeChange: (shape: YardShape) => void;
  gridScale: GridScale;
  onGridScaleChange: (scale: GridScale) => void;
  showTitle?: boolean;
}

export default function PropertySizePanel({
  name,
  onNameChange,
  width,
  onWidthChange,
  depth,
  onDepthChange,
  shape,
  onShapeChange,
  gridScale,
  onGridScaleChange,
  showTitle = true,
}: PropertySizePanelProps) {
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {showTitle && (
        <Typography variant="h6" gutterBottom>
          Property Size & Shape
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
        {/* Property Name */}
        <TextField
          id="property-name"
          name="property-name"
          label="Property Name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          fullWidth
          placeholder="e.g., Lakeside Backyard"
          required
          autoComplete="organization"
        />

        {/* Dimensions */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            id="property-width"
            name="property-width"
            label="Width (feet)"
            type="number"
            value={width}
            onChange={(e) => onWidthChange(parseFloat(e.target.value) || 0)}
            fullWidth
            inputProps={{ min: 1, step: 0.5, 'aria-label': 'Property width in feet' }}
            required
          />
          <TextField
            id="property-depth"
            name="property-depth"
            label="Depth (feet)"
            type="number"
            value={depth}
            onChange={(e) => onDepthChange(parseFloat(e.target.value) || 0)}
            fullWidth
            inputProps={{ min: 1, step: 0.5, 'aria-label': 'Property depth in feet' }}
            required
          />
        </Box>

        {/* Yard Shape */}
        <FormControl component="fieldset">
          <FormLabel component="legend" id="yard-shape-legend">Yard Shape</FormLabel>
          <RadioGroup
            id="yard-shape"
            name="yard-shape"
            aria-labelledby="yard-shape-legend"
            value={shape}
            onChange={(e) => onShapeChange(e.target.value as YardShape)}
            row
          >
            <FormControlLabel 
              value="rectangle" 
              control={<Radio id="yard-shape-rectangle" name="yard-shape" />} 
              label="Rectangle" 
            />
            <FormControlLabel 
              value="l-shape" 
              control={<Radio id="yard-shape-l-shape" name="yard-shape" />} 
              label="L-shape" 
            />
            <FormControlLabel 
              value="u-shape" 
              control={<Radio id="yard-shape-u-shape" name="yard-shape" />} 
              label="U-shape" 
            />
            <FormControlLabel 
              value="strip" 
              control={<Radio id="yard-shape-strip" name="yard-shape" />} 
              label="Strip" 
            />
            <FormControlLabel 
              value="custom" 
              control={<Radio id="yard-shape-custom" name="yard-shape" />} 
              label="Custom" 
            />
          </RadioGroup>
        </FormControl>

        {/* Grid Scale */}
        <FormControl fullWidth>
          <InputLabel id="grid-scale-label">Grid Scale</InputLabel>
          <Select
            id="grid-scale"
            name="grid-scale"
            labelId="grid-scale-label"
            value={gridScale}
            onChange={(e) => onGridScaleChange(e.target.value as GridScale)}
            label="Grid Scale"
          >
            <MenuItem value={0.5}>0.5 ft per square</MenuItem>
            <MenuItem value={1}>1 ft per square</MenuItem>
            <MenuItem value={2}>2 ft per square</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
}
