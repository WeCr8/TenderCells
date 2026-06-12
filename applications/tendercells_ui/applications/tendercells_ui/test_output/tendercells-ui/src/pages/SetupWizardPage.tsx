// SetupWizardPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase/firebaseApp';
import { PropertyService } from '../services/propertyService';
import MainLayout from '../components/layout/MainLayout';
import PropertyList from '../components/properties/PropertyList';
import NewPropertyButton from '../components/properties/NewPropertyButton';
import { Typography, Box, Container } from '@mui/material';
import type { Property } from '../types/property';

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      // Firebase not configured - run in demo mode
      setLoading(false);
      setProperties([]);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userProperties = await PropertyService.getUserProperties(user.uid);
          setProperties(userProperties);
        } catch (error) {
          console.error('Error fetching properties:', error);
        }
      }
      setLoading(false);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handlePropertySelect = (property: Property) => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <MainLayout title="Welcome" product="chicken-tender" onProductChange={() => {}}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography>Loading...</Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Welcome" product="chicken-tender" onProductChange={() => {}}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to Tender Cells
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Get started by selecting an existing property or creating a new one
          </Typography>
        </Box>

        {properties.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Your Properties
            </Typography>
            <PropertyList properties={properties} onPropertySelect={handlePropertySelect} />
          </Box>
        )}

        <NewPropertyButton />
      </Container>
    </MainLayout>
  );
}
