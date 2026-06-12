// CoopProductGate.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase/firebaseApp';
import { ProductsFirebaseService } from '../../services/productsFirebaseService';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import { Lock, LockOpen } from '@mui/icons-material';

interface CoopProductGateProps {
  productId?: string;
  productType?: string;
  children: React.ReactNode;
}

export default function CoopProductGate({ productId, productType, children }: CoopProductGateProps) {
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      // Firebase not configured - allow access in demo mode
      setLoading(false);
      setIsRegistered(true); // Allow access when Firebase is not configured
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
    const checkRegistration = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // If productId is provided, check that specific product
        if (productId) {
          const product = await ProductsFirebaseService.getProduct(productId);
          setIsRegistered(!!product && product.connectionStatus !== 'setup_required');
        } else if (productType) {
          // Check if user has any product of this type registered
          const products = await ProductsFirebaseService.getUserProducts(userId, { productType: productType });
          setIsRegistered(products.length > 0 && products.some((p) => p.connectionStatus !== 'setup_required'));
        } else {
          // Check if user has any products registered
          const products = await ProductsFirebaseService.getUserProducts(userId);
          setIsRegistered(products.length > 0 && products.some((p) => p.connectionStatus !== 'setup_required'));
        }
      } catch (error) {
        console.error('Error checking product registration:', error);
        setIsRegistered(false);
      } finally {
        setLoading(false);
      }
    };

    checkRegistration();
  }, [userId, productId, productType]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Typography>Checking registration...</Typography>
      </Box>
    );
  }

  if (!isRegistered) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Lock sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Product Not Registered
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          You need to register a product before accessing the dashboard.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/start')}
          startIcon={<LockOpen />}
        >
          Register Product
        </Button>
      </Paper>
    );
  }

  return <>{children}</>;
}
