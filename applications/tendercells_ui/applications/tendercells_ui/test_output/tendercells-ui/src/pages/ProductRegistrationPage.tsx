// ProductRegistrationPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase/firebaseApp';
import { PropertyService } from '../services/propertyService';
import { ProductsFirebaseService } from '../services/productsFirebaseService';
import MainLayout from '../components/layout/MainLayout';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Alert,
} from '@mui/material';

const PRODUCT_NAMES: Record<string, string> = {
  'chicken-tender': 'Chicken Tender™',
  'roaming-roost': 'Roaming Roost™',
  'duck-dock': 'Duck Dock™',
  'goat-guardian': 'Goat Guardian™',
  'bunny-burrow': 'Bunny Burrow™',
  'turkey-tower': 'Turkey Tower™',
  'watchtower-ai': 'WatchTower AI™',
  'rail-system-modules': 'TenderCells Rail System™',
  'tender-cells-cloud': 'TenderCells Cloud™',
  'pigeon-palace': 'Pigeon Palace™',
};

export default function ProductRegistrationPage() {
  const navigate = useNavigate();
  const { id: propertyId, productType } = useParams<{ id: string; productType: string }>();

  const [nickname, setNickname] = useState('');
  const [location, setLocation] = useState('');
  const [animalCount, setAnimalCount] = useState(0);
  const [hardwareMode, setHardwareMode] = useState<'sim' | 'hardware'>('sim');
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

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      setError('Coop nickname is required');
      return;
    }

    if (!location.trim()) {
      setError('Location on property is required');
      return;
    }

    if (!propertyId || !productType || !userId) {
      setError('Missing required information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create product in Firestore
      const product = await ProductsFirebaseService.createProduct(userId, {
        productType: productType,
        productName: PRODUCT_NAMES[productType] || productType,
        model: productType,
        location: location.trim(),
        nickname: nickname.trim(),
        hardwareMode: hardwareMode,
        propertyId: propertyId,
        metadata: {
          animalCount: animalCount,
        },
      });

      // Create placement on property (links product to property location)
      const placement = await PropertyService.createPlacement(propertyId, {
        productId: product.id!,
        productType: productType,
        x: 50, // Default center position
        y: 50,
        width: 3, // Default size
        height: 3,
        rotation: 0,
        nickname: nickname.trim(),
      });

      // Update product with placement ID
      if (product.id) {
        await ProductsFirebaseService.updateProduct(product.id, {
          placementId: placement.id,
        } as any);
      }

      // Navigate to animal registration or dashboard
      if (animalCount > 0) {
        // If animal count was specified, navigate to animal registration
        navigate(`/property/${propertyId}/product/${product.id}/animals/register?count=${animalCount}`);
      } else {
        // Otherwise go to dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      // Provide more specific error messages
      let errorMessage = 'Failed to register product';
      if (err?.message) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Check if it's a permission error
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        errorMessage = 'Permission denied. Please check your Firestore security rules.';
      } else if (errorMessage.includes('database is not available')) {
        errorMessage = 'Firebase is not configured. Please check your Firebase setup.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const productName = PRODUCT_NAMES[productType || ''] || productType || 'Product';

  return (
    <MainLayout title="Register Product" product="chicken-tender" onProductChange={() => {}}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Register {productName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Fill in the details to register your product on this property
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              id="coop-nickname"
              name="coop-nickname"
              label="Coop Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              fullWidth
              placeholder="e.g., Main Coop, Backyard Coop"
              required
            />

            <TextField
              id="location"
              name="location"
              label="Location on Property"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              fullWidth
              placeholder="e.g., Front yard, Side yard, North corner"
              required
            />

            <TextField
              id="animal-count"
              name="animal-count"
              label="Number of Animals"
              type="number"
              value={animalCount}
              onChange={(e) => setAnimalCount(parseInt(e.target.value) || 0)}
              fullWidth
              inputProps={{ min: 0 }}
            />

            <FormControl component="fieldset">
              <FormLabel component="legend" id="hardware-mode-legend">Hardware Mode</FormLabel>
              <RadioGroup
                id="hardware-mode"
                name="hardware-mode"
                aria-labelledby="hardware-mode-legend"
                value={hardwareMode}
                onChange={(e) => setHardwareMode(e.target.value as 'sim' | 'hardware')}
              >
                <FormControlLabel
                  value="sim"
                  control={<Radio id="hardware-mode-sim" name="hardware-mode" />}
                  label="Sim-only (No hardware connection)"
                />
                <FormControlLabel
                  value="hardware"
                  control={<Radio id="hardware-mode-hardware" name="hardware-mode" />}
                  label="Connect hardware now"
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Continue to Dashboard'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
}
