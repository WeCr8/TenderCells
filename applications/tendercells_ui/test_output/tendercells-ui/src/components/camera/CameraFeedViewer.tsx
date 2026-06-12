// CameraFeedViewer.tsx - Live camera feed display
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material';
import { CameraAlt as CameraIcon, SignalCellularAlt as SignalIcon } from '@mui/icons-material';
import { CameraFeed, CAMERA_LOCATIONS } from '../../types/camera';

interface CameraFeedViewerProps {
  camera: CameraFeed;
  width?: string | number;
  height?: string | number;
}

export default function CameraFeedViewer({
  camera,
  width = '100%',
  height = 360,
}: CameraFeedViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!camera.streamUrl || !canvasRef.current) return;

    setConnecting(true);
    // Placeholder: in production, use MJPEG, HLS, or WebRTC stream
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#1A3D2B';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#C8B882';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Camera: ${camera.name}`, canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText(camera.connected ? '● LIVE' : '⊘ OFFLINE', canvas.width / 2, canvas.height / 2 + 20);
    }

    setConnecting(false);
  }, [camera]);

  const getSignalColor = (signal?: number) => {
    if (!signal) return 'default';
    if (signal > -50) return 'success';
    if (signal > -70) return 'warning';
    return 'error';
  };

  return (
    <Paper
      elevation={2}
      sx={{
        width,
        height,
        bgcolor: '#0D2B1E',
        position: 'relative',
        overflow: 'hidden',
        border: camera.connected ? '2px solid #4A7C59' : '2px solid #CC3333',
      }}
    >
      <canvas
        ref={canvasRef}
        width={typeof width === 'number' ? width : 640}
        height={typeof height === 'number' ? height : 360}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {connecting && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        >
          <CircularProgress size={40} sx={{ color: '#C8B882' }} />
        </Box>
      )}

      {/* Camera info overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          p: 1.5,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
          zIndex: 5,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <CameraIcon sx={{ color: '#C8B882', fontSize: 18 }} />
          <Typography variant="subtitle2" sx={{ color: '#C8B882', flex: 1 }}>
            {camera.name}
          </Typography>
          <Chip
            label={camera.connected ? 'LIVE' : 'OFFLINE'}
            size="small"
            color={camera.connected ? 'success' : 'error'}
            variant="outlined"
            sx={{
              borderColor: camera.connected ? '#4A7C59' : '#CC3333',
              color: camera.connected ? '#4A7C59' : '#CC3333',
            }}
          />
        </Stack>
      </Box>

      {/* Stats overlay (bottom) */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 1,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
          zIndex: 5,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ color: '#F0EDE4' }}>
            {camera.resolution} @ {camera.fps}fps
          </Typography>
          {camera.signal && (
            <Chip
              icon={<SignalIcon />}
              label={`${camera.signal} dBm`}
              size="small"
              color={getSignalColor(camera.signal)}
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Stack>
      </Box>
    </Paper>
  );
}
