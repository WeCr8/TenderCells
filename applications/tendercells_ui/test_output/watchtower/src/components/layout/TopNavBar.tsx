import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'

interface TopNavBarProps {
  onMenuClick: () => void
}

export default function TopNavBar({ onMenuClick }: TopNavBarProps) {
  return (
    <AppBar
      position="static"
      sx={{
        background: 'linear-gradient(90deg, #0D2B1E 0%, #1A3D2B 100%)',
        borderBottom: '1px solid #4A7C59',
        boxShadow: 'none',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon sx={{ color: '#C8B882' }} />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#4A7C59',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: '#0D2B1E', fontWeight: 'bold' }}>
              WA
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: '#C8B882',
              fontWeight: 600,
              fontSize: '1.1rem',
            }}
          >
            WatchTower AI
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary">
          Status: <span style={{ color: '#4AFF00' }}>● Online</span>
        </Typography>
      </Toolbar>
    </AppBar>
  )
}
