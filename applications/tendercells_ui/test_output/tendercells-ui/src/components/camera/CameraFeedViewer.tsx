// CameraFeedViewer.tsx - Live camera feed display
import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Button, Alert } from '@mui/material';
import { CameraAlt as CameraIcon, SignalCellularAlt as SignalIcon } from '@mui/icons-material';
import { CameraFeed } from '../../types/camera';

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

  // Browser webcam preview — opt-in, client-side only (no upload/record/store).
  // A "try it now" path for visitors with no hardware. getUserMedia only fires on
  // an explicit click; denial/no-camera falls back to the stream/canvas below.
  const webcamRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [webcamOn, setWebcamOn] = useState(false);
  const [webcamErr, setWebcamErr] = useState<string | null>(null);
  const webcamSupported =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const startWebcam = async () => {
    setWebcamErr(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = s;
      setWebcamOn(true);
    } catch {
      setWebcamErr('Camera permission denied or no camera — showing the seeded view.');
      setWebcamOn(false);
    }
  };
  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setWebcamOn(false);
  };

  // Attach the stream once the <video> is mounted; stop tracks on unmount.
  useEffect(() => {
    if (webcamOn && webcamRef.current && streamRef.current) {
      webcamRef.current.srcObject = streamRef.current;
      void webcamRef.current.play();
    }
  }, [webcamOn]);
  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

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
      {/* Real live feed: MJPEG streams render natively in <img> (works with any
          off-the-shelf ESP32-CAM/S3-EYE serving /stream). Falls back to the canvas
          status card when no streamUrl is set. */}
      {webcamOn ? (
        <video
          ref={webcamRef}
          autoPlay
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : camera.streamUrl ? (
        <img
          src={camera.streamUrl}
          alt={`Live feed: ${camera.name}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          width={typeof width === 'number' ? width : 640}
          height={typeof height === 'number' ? height : 360}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      )}

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
          {webcamOn && (
            <Chip label="● MY CAMERA (local only)" size="small"
              sx={{ bgcolor: '#CC3333', color: '#fff', fontSize: '0.7rem' }} />
          )}
          <Box sx={{ flex: 1 }} />
          {webcamSupported && (
            <Button size="small" variant="contained"
              onClick={webcamOn ? stopWebcam : startWebcam}
              sx={{ bgcolor: webcamOn ? '#CC3333' : '#4A7C59', fontSize: '0.7rem' }}>
              {webcamOn ? 'Stop' : '📷 Preview with my camera'}
            </Button>
          )}
        </Stack>
        {webcamErr && (
          <Alert severity="warning" sx={{ mt: 1, py: 0, fontSize: '0.72rem' }}>{webcamErr}</Alert>
        )}
      </Box>
    </Paper>
  );
}
