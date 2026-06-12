// PropertySetupPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase/firebaseApp';
import { PropertyService } from '../services/propertyService';
import MainLayout from '../components/layout/MainLayout';
import PropertySizePanel from '../components/properties/PropertySizePanel';
import { Button, Container, Box, Alert } from '@mui/material';
import type { YardShape, GridScale } from '../types/property';

export default function PropertySetupPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [width, setWidth] = useState(20);
  const [depth, setDepth] = useState(20);
  const [shape, setShape] = useState<YardShape>('rectangle');
  const [gridScale, setGridScale] = useState<GridScale>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      // Firebase not configured - allow demo mode
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (!isNew && id && userId) {
      // Load existing property
      PropertyService.getProperty(id).then((property) => {
        if (property) {
          setName(property.name);
          setWidth(property.dimensions.width);
          setDepth(property.dimensions.depth);
          setShape(property.shape);
          setGridScale(property.gridScale);
        }
      });
    }
  }, [id, isNew, userId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Property name is required');
      return;
    }

    if (width <= 0 || depth <= 0) {
      setError('Width and depth must be greater than 0');
      return;
    }

    if (!userId) {
      setError('You must be logged in to create a property');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isNew) {
        console.log('Creating property with data:', { name, width, depth, shape, gridScale, userId });
        const property = await PropertyService.createProperty(userId, {
          name: name.trim(),
          dimensions: { width, depth },
          shape,
          gridScale,
        });
        
        console.log('Property created successfully:', property);
        
        if (!property || !property.id) {
          throw new Error('Property was created but no ID was returned');
        }
        
        console.log('Navigating to:', `/property/${property.id}/products`);
        navigate(`/property/${property.id}/products`);
      } else if (id) {
        console.log('Updating property:', id);
        await PropertyService.updateProperty(id, {
          name: name.trim(),
          dimensions: { width, depth },
          shape,
          gridScale,
        });
        console.log('Property updated, navigating to:', `/property/${id}/products`);
        navigate(`/property/${id}/products`);
      }
    } catch (err: any) {
      console.error('Error saving property:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to save property';
      if (err?.message) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Check if it's a permission error
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        errorMessage = 'Permission denied. Please check your Firestore security rules to allow property creation.';
      } else if (errorMessage.includes('database is not available')) {
        errorMessage = 'Firebase is not configured. Please check your Firebase setup.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <MainLayout title="Property Setup" product="chicken-tender" onProductChange={() => {}}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <form onSubmit={handleFormSubmit}>
          <Box sx={{ mb: 3 }}>
            <PropertySizePanel
              name={name}
              onNameChange={setName}
              width={width}
              onWidthChange={setWidth}
              depth={depth}
              onDepthChange={setDepth}
              shape={shape}
              onShapeChange={setShape}
              gridScale={gridScale}
              onGridScaleChange={setGridScale}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !name.trim() || width <= 0 || depth <= 0}
            >
              {loading ? 'Saving...' : 'Next: Choose products'}
            </Button>
          </Box>
        </form>
      </Container>
    </MainLayout>
  );
}
