import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Paper, Stack, Typography, LinearProgress, Chip } from '@mui/material';
import { BatteryCharging20 as BatteryIcon, SolarPower as SolarIcon, Storage as StorageIcon, SignalCellularAlt as SignalIcon, } from '@mui/icons-material';
export default function SystemStatus({ device, unacknowledgedAlerts }) {
    const getStatusColor = (value) => {
        if (value > 60)
            return '#4AFF00';
        if (value > 30)
            return '#E8A020';
        return '#CC3333';
    };
    const storagePercent = (device.storageUsed / device.storageTotal) * 100;
    return (_jsxs(Paper, { sx: { bgcolor: '#1A3D2B', p: 2 }, children: [_jsx(Typography, { variant: "h6", sx: { color: '#C8B882', mb: 2 }, children: "System Status" }), _jsxs(Stack, { spacing: 2, children: [_jsxs(Box, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(SignalIcon, { sx: { color: '#4A7C59', fontSize: 18 } }), _jsx(Typography, { variant: "body2", sx: { color: '#F0EDE4' }, children: "Connection" }), _jsx(Chip, { label: device.connected ? 'ONLINE' : 'OFFLINE', size: "small", sx: {
                                            ml: 'auto',
                                            bgcolor: device.connected ? '#4AFF00' : '#CC3333',
                                            color: device.connected ? '#0D2B1E' : '#fff',
                                            fontWeight: 'bold',
                                        } })] }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Last seen: ", new Date(device.lastSeen).toLocaleTimeString()] })] }), _jsxs(Box, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 0.5 }, children: [_jsx(BatteryIcon, { sx: { color: '#4A7C59', fontSize: 18 } }), _jsx(Typography, { variant: "body2", sx: { color: '#F0EDE4', flex: 1 }, children: "Battery" }), _jsxs(Typography, { variant: "caption", sx: { color: getStatusColor(device.battery) }, children: [device.battery, "%"] })] }), _jsx(LinearProgress, { variant: "determinate", value: device.battery, sx: {
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: '#0D2B1E',
                                    '& .MuiLinearProgress-bar': {
                                        bgcolor: getStatusColor(device.battery),
                                    },
                                } })] }), _jsxs(Box, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 0.5 }, children: [_jsx(SolarIcon, { sx: { color: '#FFD700', fontSize: 18 } }), _jsx(Typography, { variant: "body2", sx: { color: '#F0EDE4', flex: 1 }, children: "Solar Charge" }), _jsxs(Typography, { variant: "caption", sx: { color: '#FFD700' }, children: [device.solar, "%"] })] }), _jsx(LinearProgress, { variant: "determinate", value: device.solar, sx: {
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: '#0D2B1E',
                                    '& .MuiLinearProgress-bar': {
                                        bgcolor: '#FFD700',
                                    },
                                } })] }), _jsxs(Box, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 0.5 }, children: [_jsx(StorageIcon, { sx: { color: '#4A7C59', fontSize: 18 } }), _jsx(Typography, { variant: "body2", sx: { color: '#F0EDE4', flex: 1 }, children: "Storage" }), _jsxs(Typography, { variant: "caption", sx: { color: '#C8B882' }, children: [device.storageUsed, " / ", device.storageTotal, " GB"] })] }), _jsx(LinearProgress, { variant: "determinate", value: storagePercent, sx: {
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: '#0D2B1E',
                                    '& .MuiLinearProgress-bar': {
                                        bgcolor: getStatusColor(100 - storagePercent),
                                    },
                                } })] }), unacknowledgedAlerts > 0 && (_jsx(Box, { sx: {
                            p: 1.5,
                            bgcolor: '#5a2a2a',
                            border: '1px solid #CC3333',
                            borderRadius: 1,
                            textAlign: 'center',
                        }, children: _jsx(Chip, { label: `${unacknowledgedAlerts} unacknowledged alert${unacknowledgedAlerts !== 1 ? 's' : ''}`, icon: _jsx(Box, { component: "span", sx: {
                                    width: 8,
                                    height: 8,
                                    bgcolor: '#CC3333',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                } }), sx: {
                                bgcolor: '#CC3333',
                                color: '#fff',
                            } }) }))] })] }));
}
