import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Stack, Typography, Chip } from '@mui/material';
import { WarningAmber as WarningIcon } from '@mui/icons-material';
export default function AlertsPanel({ alerts, maxHeight = 'auto' }) {
    const unacknowledged = alerts.filter((a) => !a.acknowledged);
    const formatTime = (timestamp) => {
        const now = Date.now();
        const diffSecs = Math.floor((now - timestamp) / 1000);
        if (diffSecs < 60)
            return 'Just now';
        if (diffSecs < 3600)
            return `${Math.floor(diffSecs / 60)}m ago`;
        return `${Math.floor(diffSecs / 3600)}h ago`;
    };
    const getAlertColor = (type, confidence) => {
        if (type === 'predator') {
            return confidence > 0.8 ? '#CC3333' : '#E8A020';
        }
        return '#4A7C59';
    };
    return (_jsx(Box, { sx: { maxHeight, overflow: 'auto' }, children: unacknowledged.length === 0 && alerts.length === 0 ? (_jsx(Box, { sx: {
                textAlign: 'center',
                py: 3,
                color: 'text.secondary',
            }, children: _jsx(Typography, { variant: "body2", children: "No alerts" }) })) : unacknowledged.length === 0 ? (_jsx(Box, { sx: {
                textAlign: 'center',
                py: 3,
                color: 'text.secondary',
            }, children: _jsx(Typography, { variant: "body2", children: "All clear \u2713" }) })) : (_jsx(Stack, { spacing: 1.5, children: unacknowledged.map((alert) => (_jsxs(Box, { sx: {
                    p: 1.5,
                    bgcolor: '#0D2B1E',
                    border: `1px solid ${getAlertColor(alert.type, alert.confidence)}`,
                    borderRadius: 1,
                    display: 'flex',
                    gap: 1,
                }, children: [_jsx(WarningIcon, { sx: {
                            color: getAlertColor(alert.type, alert.confidence),
                            fontSize: 18,
                            flexShrink: 0,
                            mt: 0.25,
                        } }), _jsxs(Stack, { spacing: 0.5, sx: { flex: 1, minWidth: 0 }, children: [_jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [_jsx(Typography, { variant: "subtitle2", sx: {
                                            color: '#C8B882',
                                            fontSize: '0.85rem',
                                            flex: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }, children: alert.type === 'predator' ? '🚨 Predator' : '📹 Motion' }), _jsx(Chip, { label: `${(alert.confidence * 100).toFixed(0)}%`, size: "small", sx: {
                                            height: 20,
                                            fontSize: '0.65rem',
                                            bgcolor: getAlertColor(alert.type, alert.confidence),
                                            color: '#fff',
                                        } })] }), _jsx(Typography, { variant: "caption", sx: {
                                    color: '#F0EDE4',
                                    fontSize: '0.75rem',
                                    lineHeight: 1.3,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                }, children: alert.description }), _jsxs(Stack, { direction: "row", spacing: 1, sx: { mt: 0.5 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", sx: { fontSize: '0.7rem' }, children: alert.cameraPosition.toUpperCase() }), _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { fontSize: '0.7rem' }, children: formatTime(alert.timestamp) })] })] })] }, alert.id))) })) }));
}
