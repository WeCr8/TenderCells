// CoopModelSelector.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { CoopModelConfig, COOP_PRESETS } from '@/types/coop';

type CoopModelSelectorProps = {
  currentModel?: CoopModelConfig;
  onSelectModel: (model: CoopModelConfig) => void;
  onUploadCustom: (file: File) => void;
};

export default function CoopModelSelector({
  currentModel,
  onSelectModel,
  onUploadCustom,
}: CoopModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.match(/\.(glb|gltf)$/i)) {
      alert('Please select a GLB or GLTF file');
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }
    
    setUploading(true);
    try {
      await onUploadCustom(file);
      setOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload model');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Change Coop Model
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select Coop Model</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            Preset Models
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {Object.values(COOP_PRESETS).map((preset) => (
              <Grid item xs={12} sm={4} key={preset.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: currentModel?.id === preset.id ? 2 : 0,
                    borderColor: 'primary.main',
                  }}
                  onClick={() => {
                    onSelectModel(preset);
                    setOpen(false);
                  }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 120,
                      bgcolor: 'grey.800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      {preset.dimensions.width}×{preset.dimensions.depth}×
                      {preset.dimensions.height}
                    </Typography>
                  </CardMedia>
                  <CardContent>
                    <Typography variant="body2">{preset.name}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="subtitle2" gutterBottom>
            Custom Model
          </Typography>
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'grey.600',
              borderRadius: 1,
              p: 3,
              textAlign: 'center',
            }}
          >
            <input
              type="file"
              accept=".glb,.gltf"
              style={{ display: 'none' }}
              id="model-upload"
              onChange={handleFileSelect}
            />
            <label htmlFor="model-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadIcon />}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Custom Model'}
              </Button>
            </label>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              GLB or GLTF format, max 50MB
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
