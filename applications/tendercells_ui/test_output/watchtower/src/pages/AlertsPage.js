import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Stack, Button, Grid } from '@mui/material';
import { WarningAmber as WarningIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
export default function AlertsPage() {
    const [alerts, setAlerts] = useState([
        {
            id: 'alert_001',
            type: 'predator',
            confidence: 0.87,
            timestamp: Date.now() - 120000,
            cameraId: 'cam_001',
            cameraPosition: 'north',
            description: 'Possible raccoon detected near northwest corner',
            acknowledged: false,
            notified: true,
        },
        {
            id: 'alert_002',
            type: 'motion',
            confidence: 0.65,
            timestamp: Date.now() - 300000,
            cameraId: 'cam_002',
            cameraPosition: 'east',
            description: 'Motion detected at east boundary fence',
            acknowledged: true,
            notified: true,
        },
        {
            id: 'alert_003',
            type: 'predator',
            confidence: 0.92,
            timestamp: Date.now() - 3600000,
            cameraId: 'cam_001',
            cameraPosition: 'north',
            description: 'Coyote spotted at property boundary',
            acknowledged: true,
            notified: true,
        },
    ]);
    const handleAcknowledge = (alertId) => {
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
    };
    const formatTime = (timestamp) => {
        const now = Date.now();
        const diffSecs = Math.floor((now - timestamp) / 1000);
        if (diffSecs < 60)
            return 'Just now';
        if (diffSecs < 3600)
            return `${Math.floor(diffSecs / 60)}m ago`;
        if (diffSecs < 86400)
            return `${Math.floor(diffSecs / 3600)}h ago`;
        return `${Math.floor(diffSecs / 86400)}d ago`;
    };
    return (_jsxs(Box, { children: [_jsxs(Box, { sx: { mb: 4 }, children: [_jsx(Typography, { variant: "h4", sx: { color: '#C8B882', mb: 1 }, children: "Alert History" }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [alerts.filter((a) => !a.acknowledged).length, " unacknowledged alerts"] })] }), _jsx(Grid, { container: true, spacing: 2, children: alerts.map((alert) => (_jsx(Grid, { item: true, xs: 12, children: _jsx(Card, { sx: {
                            bgcolor: '#1A3D2B',
                            borderLeft: `4px solid ${alert.type === 'predator'
                                ? alert.confidence > 0.8
                                    ? '#CC3333'
                                    : '#E8A020'
                                : '#4A7C59'}`,
                        }, children: _jsx(CardContent, { children: _jsx(Stack, { spacing: 2, children: _jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "flex-start", children: [_jsxs(Stack, { spacing: 1, flex: 1, children: [_jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [alert.type === 'predator' ? (_jsx(WarningIcon, { sx: { color: '#CC3333' } })) : (_jsx(CheckIcon, { sx: { color: '#4A7C59' } })), _jsx(Typography, { variant: "h6", sx: { color: '#C8B882' }, children: alert.type === 'predator' ? 'Predator Alert' : 'Motion Detected' }), _jsx(Chip, { label: `${(alert.confidence * 100).toFixed(0)}% confidence`, size: "small", variant: "outlined", sx: {
                                                                borderColor: '#C8B882',
                                                                color: '#C8B882',
                                                            } }), !alert.acknowledged && (_jsx(Chip, { label: "NEW", size: "small", sx: {
                                                                bgcolor: '#CC3333',
                                                                color: '#fff',
                                                            } }))] }), _jsx(Typography, { variant: "body2", sx: { color: '#F0EDE4' }, children: alert.description }), _jsxs(Stack, { direction: "row", spacing: 2, sx: { typography: 'caption', color: 'text.secondary' }, children: [_jsxs("span", { children: ["\uD83D\uDCF7 ", alert.cameraPosition.toUpperCase(), " camera"] }), _jsxs("span", { children: ["\uD83D\uDD50 ", formatTime(alert.timestamp)] })] })] }), !alert.acknowledged && (_jsx(Button, { variant: "outlined", size: "small", onClick: () => handleAcknowledge(alert.id), sx: {
                                                borderColor: '#4A7C59',
                                                color: '#4A7C59',
                                                '&:hover': { bgcolor: '#4A7C59', color: '#0D2B1E' },
                                            }, children: "Acknowledge" }))] }) }) }) }) }, alert.id))) })] }));
}
