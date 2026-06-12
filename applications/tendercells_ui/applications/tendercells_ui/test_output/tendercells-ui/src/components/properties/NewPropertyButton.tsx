// NewPropertyButton.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box } from '@mui/material';
import { Add } from '@mui/icons-material';

export default function NewPropertyButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/property/new/setup');
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
      <Button
        variant="contained"
        size="large"
        startIcon={<Add />}
        onClick={handleClick}
        sx={{
          px: 4,
          py: 1.5,
          fontSize: '1.1rem',
        }}
      >
        Create New Property
      </Button>
    </Box>
  );
}
