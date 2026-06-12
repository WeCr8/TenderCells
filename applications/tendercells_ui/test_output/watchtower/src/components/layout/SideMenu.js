import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Drawer, Box, List, ListItem, ListItemIcon, ListItemText, Divider, Typography, useMediaQuery, useTheme, } from '@mui/material';
import { Dashboard as DashboardIcon, Warning as AlertsIcon, VideoLibrary as RecordingsIcon, Settings as SettingsIcon, Logout as LogoutIcon, } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
export default function SideMenu({ open, onOpenChange }) {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const menuItems = [
        { label: 'Dashboard', icon: _jsx(DashboardIcon, {}), path: '/' },
        { label: 'Alerts', icon: _jsx(AlertsIcon, {}), path: '/alerts' },
        { label: 'Recordings', icon: _jsx(RecordingsIcon, {}), path: '/recordings' },
        { label: 'Settings', icon: _jsx(SettingsIcon, {}), path: '/settings' },
    ];
    const isActive = (path) => location.pathname === path;
    const handleNavigate = (path) => {
        navigate(path);
        if (isMobile)
            onOpenChange(false);
    };
    const drawerContent = (_jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', height: '100%' }, children: [_jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1, mb: 1 }, children: [_jsx(Box, { sx: {
                                    width: 40,
                                    height: 40,
                                    bgcolor: '#4A7C59',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }, children: _jsx(Typography, { sx: { color: '#0D2B1E', fontWeight: 'bold', fontSize: '1.1rem' }, children: "WA" }) }), _jsx(Typography, { variant: "h6", sx: { color: '#C8B882', fontWeight: 'bold' }, children: "WatchTower" })] }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: "Predator Monitor" })] }), _jsx(Divider, { sx: { borderColor: '#4A7C59' } }), _jsx(List, { sx: { flex: 1, p: 1 }, children: menuItems.map((item) => (_jsxs(ListItem, { button: true, onClick: () => handleNavigate(item.path), sx: {
                        mb: 0.5,
                        borderRadius: 1,
                        bgcolor: isActive(item.path) ? '#4A7C59' : 'transparent',
                        color: isActive(item.path) ? '#0D2B1E' : '#F0EDE4',
                        '&:hover': {
                            bgcolor: isActive(item.path) ? '#5a8c69' : '#1A3D2B',
                        },
                        transition: 'all 0.2s',
                    }, children: [_jsx(ListItemIcon, { sx: {
                                color: 'inherit',
                                minWidth: 40,
                            }, children: item.icon }), _jsx(ListItemText, { primary: item.label, primaryTypographyProps: {
                                variant: 'body2',
                                fontWeight: isActive(item.path) ? 600 : 500,
                            } })] }, item.path))) }), _jsx(Divider, { sx: { borderColor: '#4A7C59' } }), _jsx(Box, { sx: { p: 2 }, children: _jsxs(ListItem, { button: true, sx: {
                        borderRadius: 1,
                        color: '#F0EDE4',
                        '&:hover': { bgcolor: '#1A3D2B' },
                    }, children: [_jsx(ListItemIcon, { sx: { color: '#CC3333', minWidth: 40 }, children: _jsx(LogoutIcon, {}) }), _jsx(ListItemText, { primary: "Logout", primaryTypographyProps: { variant: 'body2' } })] }) })] }));
    return (_jsxs(_Fragment, { children: [_jsx(Box, { sx: {
                    display: { xs: 'none', md: 'block' },
                    width: 240,
                    bgcolor: '#0D2B1E',
                    borderRight: '1px solid #4A7C59',
                    overflowY: 'auto',
                }, children: drawerContent }), _jsx(Drawer, { anchor: "left", open: open, onClose: () => onOpenChange(false), sx: {
                    display: { xs: 'block', md: 'none' },
                }, children: _jsx(Box, { sx: {
                        width: 240,
                        bgcolor: '#0D2B1E',
                    }, children: drawerContent }) })] }));
}
