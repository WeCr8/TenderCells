import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Button, Stack, Select, MenuItem, LinearProgress, Chip, } from '@mui/material';
import { Download as DownloadIcon, Delete as DeleteIcon, PlayArrow as PlayIcon, } from '@mui/icons-material';
export default function RecordingsPage() {
    const [recordings] = useState([
        {
            id: 'rec_001',
            cameraId: 'cam_001',
            cameraName: 'North Camera',
            startTime: Date.now() - 7200000,
            duration: 3600,
            size: 850,
            quality: '1080p',
            hasAlert: true,
        },
        {
            id: 'rec_002',
            cameraId: 'cam_002',
            cameraName: 'East Camera',
            startTime: Date.now() - 3600000,
            duration: 3600,
            size: 750,
            quality: '1080p',
            hasAlert: false,
        },
        {
            id: 'rec_003',
            cameraId: 'cam_001',
            cameraName: 'North Camera',
            startTime: Date.now() - 86400000,
            duration: 3600,
            size: 820,
            quality: '1080p',
            hasAlert: true,
        },
    ]);
    const [filter, setFilter] = useState('all');
    const [dateRange, setDateRange] = useState('7days');
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };
    const formatSize = (bytes) => {
        return `${(bytes / 1024).toFixed(1)} MB`;
    };
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    };
    const filteredRecordings = filter === 'alerts'
        ? recordings.filter((r) => r.hasAlert)
        : filter === 'recent'
            ? recordings.slice(0, 3)
            : recordings;
    const totalStorage = recordings.reduce((sum, r) => sum + r.size, 0);
    return (_jsxs(Box, { children: [_jsxs(Box, { sx: { mb: 4 }, children: [_jsx(Typography, { variant: "h4", sx: { color: '#C8B882', mb: 1 }, children: "Recordings" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Manage and download camera footage" })] }), _jsx(Card, { sx: { bgcolor: '#1A3D2B', mb: 3 }, children: _jsx(CardContent, { children: _jsx(Stack, { spacing: 2, children: _jsxs(Box, { children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", sx: { mb: 1 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Storage Used" }), _jsxs(Typography, { variant: "body2", sx: { color: '#C8B882' }, children: [formatSize(totalStorage), " / 256 GB"] })] }), _jsx(LinearProgress, { variant: "determinate", value: (totalStorage / 256000) * 100, sx: {
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: '#0D2B1E',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: '#4A7C59',
                                        },
                                    } })] }) }) }) }), _jsxs(Stack, { direction: "row", spacing: 2, sx: { mb: 3 }, children: [_jsxs(Select, { value: filter, onChange: (e) => setFilter(e.target.value), sx: { minWidth: 150, bgcolor: '#1A3D2B' }, children: [_jsx(MenuItem, { value: "all", children: "All Recordings" }), _jsx(MenuItem, { value: "alerts", children: "With Alerts" }), _jsx(MenuItem, { value: "recent", children: "Recent" })] }), _jsxs(Select, { value: dateRange, onChange: (e) => setDateRange(e.target.value), sx: { minWidth: 150, bgcolor: '#1A3D2B' }, children: [_jsx(MenuItem, { value: "1day", children: "Last 24 hours" }), _jsx(MenuItem, { value: "7days", children: "Last 7 days" }), _jsx(MenuItem, { value: "30days", children: "Last 30 days" })] })] }), _jsx(Grid, { container: true, spacing: 2, children: filteredRecordings.map((recording) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Card, { sx: {
                            bgcolor: '#1A3D2B',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                        }, children: [_jsxs(CardMedia, { sx: {
                                    height: 180,
                                    background: 'linear-gradient(135deg, #2a5a3d 0%, #0D2B1E 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                }, children: [_jsx(PlayIcon, { sx: { color: '#C8B882', fontSize: 48 } }), recording.hasAlert && (_jsx(Chip, { label: "Alert Recorded", sx: {
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            bgcolor: '#CC3333',
                                            color: '#fff',
                                        } }))] }), _jsxs(CardContent, { sx: { flex: 1 }, children: [_jsx(Typography, { variant: "subtitle2", sx: { color: '#C8B882', mb: 1 }, children: recording.cameraName }), _jsxs(Stack, { spacing: 1, sx: { mb: 2 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: formatTime(recording.startTime) }), _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Chip, { label: `${formatDuration(recording.duration)}`, size: "small", variant: "outlined", sx: { borderColor: '#4A7C59', color: '#4A7C59' } }), _jsx(Chip, { label: `${formatSize(recording.size)}`, size: "small", variant: "outlined", sx: { borderColor: '#C8B882', color: '#C8B882' } })] })] }), _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Button, { size: "small", startIcon: _jsx(PlayIcon, {}), fullWidth: true, variant: "outlined", sx: {
                                                    borderColor: '#4A7C59',
                                                    color: '#4A7C59',
                                                    '&:hover': { bgcolor: '#4A7C59', color: '#0D2B1E' },
                                                }, children: "Play" }), _jsx(Button, { size: "small", startIcon: _jsx(DownloadIcon, {}), sx: { color: '#C8B882' } }), _jsx(Button, { size: "small", startIcon: _jsx(DeleteIcon, {}), sx: { color: '#CC3333' } })] })] })] }) }, recording.id))) })] }));
}
