import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Card, CardContent, Stack, Switch, TextField, Button, Divider, Select, MenuItem, } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
export default function SettingsPage() {
    const [settings, setSettings] = useState({
        deviceName: 'WatchTower AI - Property Perimeter',
        location: 'Backyard Perimeter',
        recordingEnabled: true,
        motionDetection: true,
        predatorDetection: true,
        alertFrequency: 'immediate',
        resolution: '1080p',
        fps: 30,
        autoRetention: 30,
    });
    const handleChange = (field, value) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
    };
    const handleSave = () => {
        console.log('Settings saved:', settings);
    };
    return (_jsxs(Box, { children: [_jsxs(Box, { sx: { mb: 4 }, children: [_jsx(Typography, { variant: "h4", sx: { color: '#C8B882', mb: 1 }, children: "Settings" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Configure device and monitoring preferences" })] }), _jsxs(Stack, { spacing: 2, children: [_jsx(Card, { sx: { bgcolor: '#1A3D2B' }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { color: '#C8B882', mb: 2 }, children: "Device Settings" }), _jsxs(Stack, { spacing: 2, children: [_jsx(TextField, { label: "Device Name", fullWidth: true, value: settings.deviceName, onChange: (e) => handleChange('deviceName', e.target.value), sx: {
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#F0EDE4',
                                                },
                                            } }), _jsx(TextField, { label: "Location", fullWidth: true, value: settings.location, onChange: (e) => handleChange('location', e.target.value), sx: {
                                                '& .MuiOutlinedInput-root': {
                                                    color: '#F0EDE4',
                                                },
                                            } })] })] }) }), _jsx(Card, { sx: { bgcolor: '#1A3D2B' }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { color: '#C8B882', mb: 2 }, children: "Recording Settings" }), _jsxs(Stack, { spacing: 2, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "body2", children: "Enable Recording" }), _jsx(Switch, { checked: settings.recordingEnabled, onChange: (e) => handleChange('recordingEnabled', e.target.checked), sx: {
                                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                                            color: '#4A7C59',
                                                        },
                                                    } })] }), _jsx(Divider, { sx: { borderColor: '#0D2B1E' } }), _jsxs(Select, { value: settings.resolution, onChange: (e) => handleChange('resolution', e.target.value), fullWidth: true, children: [_jsx(MenuItem, { value: "480p", children: "480p (Low - Fast)" }), _jsx(MenuItem, { value: "720p", children: "720p (HD - Balanced)" }), _jsx(MenuItem, { value: "1080p", children: "1080p (Full HD - Quality)" })] }), _jsx(TextField, { label: "Frame Rate (fps)", type: "number", inputProps: { min: 5, max: 60 }, value: settings.fps, onChange: (e) => handleChange('fps', parseInt(e.target.value)) }), _jsx(TextField, { label: "Auto-delete after (days)", type: "number", inputProps: { min: 7, max: 365 }, value: settings.autoRetention, onChange: (e) => handleChange('autoRetention', parseInt(e.target.value)), helperText: "Recordings older than this will be automatically deleted" })] })] }) }), _jsx(Card, { sx: { bgcolor: '#1A3D2B' }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { color: '#C8B882', mb: 2 }, children: "Detection Settings" }), _jsxs(Stack, { spacing: 2, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "body2", children: "Motion Detection" }), _jsx(Switch, { checked: settings.motionDetection, onChange: (e) => handleChange('motionDetection', e.target.checked), sx: {
                                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                                            color: '#4A7C59',
                                                        },
                                                    } })] }), _jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "body2", children: "Predator Detection (AI)" }), _jsx(Switch, { checked: settings.predatorDetection, onChange: (e) => handleChange('predatorDetection', e.target.checked), sx: {
                                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                                            color: '#4A7C59',
                                                        },
                                                    } })] }), _jsx(Divider, { sx: { borderColor: '#0D2B1E' } }), _jsxs(Select, { value: settings.alertFrequency, onChange: (e) => handleChange('alertFrequency', e.target.value), fullWidth: true, children: [_jsx(MenuItem, { value: "immediate", children: "Immediate" }), _jsx(MenuItem, { value: "batched", children: "Batched (5 min)" }), _jsx(MenuItem, { value: "hourly", children: "Hourly Digest" })] })] })] }) }), _jsx(Button, { variant: "contained", startIcon: _jsx(SaveIcon, {}), onClick: handleSave, sx: {
                            bgcolor: '#4A7C59',
                            '&:hover': { bgcolor: '#5a8c69' },
                            py: 1.5,
                        }, children: "Save Settings" })] })] }));
}
