import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
export default function TopNavBar({ onMenuClick }) {
    return (_jsx(AppBar, { position: "static", sx: {
            background: 'linear-gradient(90deg, #0D2B1E 0%, #1A3D2B 100%)',
            borderBottom: '1px solid #4A7C59',
            boxShadow: 'none',
        }, children: _jsxs(Toolbar, { children: [_jsx(IconButton, { color: "inherit", "aria-label": "open drawer", onClick: onMenuClick, sx: { mr: 2, display: { md: 'none' } }, children: _jsx(MenuIcon, { sx: { color: '#C8B882' } }) }), _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1, flex: 1 }, children: [_jsx(Box, { sx: {
                                width: 32,
                                height: 32,
                                bgcolor: '#4A7C59',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }, children: _jsx(Typography, { variant: "h6", sx: { color: '#0D2B1E', fontWeight: 'bold' }, children: "WA" }) }), _jsx(Typography, { variant: "h6", sx: {
                                color: '#C8B882',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                            }, children: "WatchTower AI" })] }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Status: ", _jsx("span", { style: { color: '#4AFF00' }, children: "\u25CF Online" })] })] }) }));
}
