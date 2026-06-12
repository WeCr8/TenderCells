import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material'
import DashboardPage from './pages/DashboardPage'
import AlertsPage from './pages/AlertsPage'
import RecordingsPage from './pages/RecordingsPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'
import TopNavBar from './components/layout/TopNavBar'
import SideMenu from './components/layout/SideMenu'

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0D2B1E',
      paper: '#1A3D2B',
    },
    primary: {
      main: '#4A7C59',
      light: '#5a8c69',
      dark: '#3a6c49',
    },
    secondary: {
      main: '#C8B882',
    },
    error: {
      main: '#CC3333',
    },
    warning: {
      main: '#E8A020',
    },
    success: {
      main: '#4AFF00',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto"',
    h4: { color: '#C8B882', fontWeight: 600 },
    h5: { color: '#C8B882', fontWeight: 600 },
    body1: { color: '#F0EDE4' },
    body2: { color: '#E4E7E5' },
  },
})

function App() {
  const [openMenu, setOpenMenu] = React.useState(false)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0D2B1E' }}>
          <SideMenu open={openMenu} onOpenChange={setOpenMenu} />
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <TopNavBar onMenuClick={() => setOpenMenu(!openMenu)} />
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/recordings" element={<RecordingsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Box>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
