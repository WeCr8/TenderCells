// ProductSelectionPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ProductSelectionOverlay from '../components/products/ProductSelectionOverlay';
import { Container, Typography, Box, Alert } from '@mui/material';

export default function ProductSelectionPage() {
  const { id: propertyId } = useParams<{ id: string }>();

  if (!propertyId) {
    return (
      <MainLayout title="Select Product" product="chicken-tender" onProductChange={() => {}}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">Invalid property ID</Alert>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Select Product" product="chicken-tender" onProductChange={() => {}}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Choose Your Product
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select a TenderCells product to register for this property
          </Typography>
        </Box>

        <ProductSelectionOverlay propertyId={propertyId} />
      </Container>
    </MainLayout>
  );
}
