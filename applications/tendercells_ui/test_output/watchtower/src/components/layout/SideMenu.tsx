import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Warning as AlertsIcon,
  VideoLibrary as RecordingsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

interface SideMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SideMenu({ open, onOpenChange }: SideMenuProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Alerts', icon: <AlertsIcon />, path: '/alerts' },
    { label: 'Recordings', icon: <RecordingsIcon />, path: '/recordings' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ]

  const isActive = (path: string) => location.pathname === path

  const handleNavigate = (path: string) => {
    navigate(path)
    if (isMobile) onOpenChange(false)
  }

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: '#4A7C59',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: '#0D2B1E', fontWeight: 'bold', fontSize: '1.1rem' }}>
              WA
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ color: '#C8B882', fontWeight: 'bold' }}>
            WatchTower
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Predator Monitor
        </Typography>
      </Box>

      <Divider sx={{ borderColor: '#4A7C59' }} />

      {/* Menu Items */}
      <List sx={{ flex: 1, p: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            sx={{
              mb: 0.5,
              borderRadius: 1,
              bgcolor: isActive(item.path) ? '#4A7C59' : 'transparent',
              color: isActive(item.path) ? '#0D2B1E' : '#F0EDE4',
              '&:hover': {
                bgcolor: isActive(item.path) ? '#5a8c69' : '#1A3D2B',
              },
              transition: 'all 0.2s',
            }}
          >
            <ListItemIcon
              sx={{
                color: 'inherit',
                minWidth: 40,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: isActive(item.path) ? 600 : 500,
              }}
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ borderColor: '#4A7C59' }} />

      {/* Footer */}
      <Box sx={{ p: 2 }}>
        <ListItem
          button
          sx={{
            borderRadius: 1,
            color: '#F0EDE4',
            '&:hover': { bgcolor: '#1A3D2B' },
          }}
        >
          <ListItemIcon sx={{ color: '#CC3333', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItem>
      </Box>
    </Box>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          width: 240,
          bgcolor: '#0D2B1E',
          borderRight: '1px solid #4A7C59',
          overflowY: 'auto',
        }}
      >
        {drawerContent}
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={open}
        onClose={() => onOpenChange(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
        }}
      >
        <Box
          sx={{
            width: 240,
            bgcolor: '#0D2B1E',
          }}
        >
          {drawerContent}
        </Box>
      </Drawer>
    </>
  )
}
