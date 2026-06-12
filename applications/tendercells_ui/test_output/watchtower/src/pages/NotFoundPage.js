import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
export default function NotFoundPage() {
    const navigate = useNavigate();
    return (_jsxs(Box, { sx: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
        }, children: [_jsx(Typography, { variant: "h1", sx: { color: '#C8B882', mb: 2 }, children: "404" }), _jsx(Typography, { variant: "h5", sx: { color: '#F0EDE4', mb: 2 }, children: "Page Not Found" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 4 }, children: "The page you're looking for doesn't exist" }), _jsx(Button, { variant: "contained", onClick: () => navigate('/'), sx: { bgcolor: '#4A7C59', '&:hover': { bgcolor: '#5a8c69' } }, children: "Go to Dashboard" })] }));
}
