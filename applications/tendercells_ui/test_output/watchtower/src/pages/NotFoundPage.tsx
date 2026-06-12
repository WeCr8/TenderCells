import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
      }}
    >
      <Typography variant="h1" sx={{ color: '#C8B882', mb: 2 }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ color: '#F0EDE4', mb: 2 }}>
        Page Not Found
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        The page you're looking for doesn't exist
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/')}
        sx={{ bgcolor: '#4A7C59', '&:hover': { bgcolor: '#5a8c69' } }}
      >
        Go to Dashboard
      </Button>
    </Box>
  )
}
