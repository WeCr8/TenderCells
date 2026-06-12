// BirdEditPage.tsx — Standalone edit page for a single bird record (route: /birds/:birdId)
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const C = { bg: '#0D2B1E', gold: '#C8B882', goldMuted: '#8A7D55', accent: '#4A7C59', white: '#F0EDE4' };

// Full bird edit lives inside BirdManagementPage dialog.
// This route is a deep-link entry point that redirects back to the roster.
export default function BirdEditPage() {
  const { birdId } = useParams<{ birdId: string }>();
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack spacing={2} alignItems="center">
        <Typography sx={{ color: C.gold, fontSize: 18 }}>Bird record: {birdId ?? 'unknown'}</Typography>
        <Typography sx={{ color: C.goldMuted }}>Manage individual bird records from the Flock Roster.</Typography>
        <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => navigate('/birds')}
          sx={{ borderColor: C.accent, color: C.accent }}>
          Go to Flock Roster
        </Button>
      </Stack>
    </Box>
  );
}
