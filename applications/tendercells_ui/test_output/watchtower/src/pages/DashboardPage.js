import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import CameraDomeGrid from '../components/camera/CameraDomeGrid';
import AlertsPanel from '../components/alerts/AlertsPanel';
import SystemStatus from '../components/status/SystemStatus';
export default function DashboardPage() {
    const [device] = useState({
        id: 'wt_001',
        name: 'WatchTower AI - Property Perimeter',
        location: 'Backyard Perimeter',
        installed: '2026-05-15',
        battery: 85,
        solar: 65,
        connected: true,
        lastSeen: Date.now(),
        recordingEnabled: true,
        storageUsed: 145,
        storageTotal: 256,
        cameras: [
            {
                id: 'cam_001',
                deviceId: 'wt_001',
                name: 'North Camera',
                position: 'north',
                resolution: '1080p',
                fps: 30,
                connected: true,
                lastSeen: 'Just now',
                signal: -45,
                motionDetection: true,
                recordingEnabled: true,
            },
            {
                id: 'cam_002',
                deviceId: 'wt_001',
                name: 'East Camera',
                position: 'east',
                resolution: '1080p',
                fps: 30,
                connected: true,
                lastSeen: 'Just now',
                signal: -50,
                motionDetection: true,
                recordingEnabled: true,
            },
            {
                id: 'cam_003',
                deviceId: 'wt_001',
                name: 'West Camera',
                position: 'west',
                resolution: '1080p',
                fps: 30,
                connected: false,
                lastSeen: '3 minutes ago',
                signal: -75,
                motionDetection: true,
                recordingEnabled: false,
            },
        ],
        alerts: [
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
        ],
    });
    const unacknowledgedAlerts = device.alerts.filter((a) => !a.acknowledged);
    return (_jsxs(Box, { children: [_jsxs(Box, { sx: { mb: 4 }, children: [_jsx(Typography, { variant: "h4", sx: { color: '#C8B882', mb: 1 }, children: "WatchTower AI\u2122 Predator Monitor" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Real-time 360\u00B0 coverage \u2022 Motion & predator detection" })] }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, lg: 8, children: _jsxs(Paper, { sx: {
                                bgcolor: '#1A3D2B',
                                p: 2,
                                minHeight: 600,
                                display: 'flex',
                                flexDirection: 'column',
                            }, children: [_jsx(Typography, { variant: "h6", sx: { color: '#C8B882', mb: 2 }, children: "Live Camera Feeds" }), _jsx(CameraDomeGrid, { cameras: device.cameras })] }) }), _jsx(Grid, { item: true, xs: 12, lg: 4, children: _jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', gap: 2 }, children: [_jsx(SystemStatus, { device: device, unacknowledgedAlerts: unacknowledgedAlerts.length }), _jsxs(Paper, { sx: { bgcolor: '#1A3D2B', p: 2 }, children: [_jsxs(Typography, { variant: "h6", sx: { color: '#C8B882', mb: 2 }, children: ["Recent Alerts (", unacknowledgedAlerts.length, " new)"] }), _jsx(AlertsPanel, { alerts: device.alerts, maxHeight: 350 })] })] }) })] })] }));
}
