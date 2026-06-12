// AnimalRegistrationPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase/firebaseApp';
import { AnimalService, AnimalType, AnimalStatus } from '../services/animalService';
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
  Alert,
  Grid,
  Chip,
} from '@mui/material';

const ANIMAL_TYPES: { value: AnimalType; label: string; emoji: string }[] = [
  { value: 'chicken', label: 'Chicken', emoji: '🐔' },
  { value: 'duck', label: 'Duck', emoji: '🦆' },
  { value: 'goat', label: 'Goat', emoji: '🐐' },
  { value: 'rabbit', label: 'Rabbit', emoji: '🐰' },
  { value: 'turkey', label: 'Turkey', emoji: '🦃' },
  { value: 'pigeon', label: 'Pigeon', emoji: '🕊️' },
  { value: 'other', label: 'Other', emoji: '🐾' },
];

const BREEDS: Record<AnimalType, string[]> = {
  chicken: ['Rhode Island Red', 'Leghorn', 'Plymouth Rock', 'Orpington', 'Wyandotte', 'Australorp', 'Sussex', 'Other'],
  duck: ['Pekin', 'Mallard', 'Muscovy', 'Khaki Campbell', 'Rouen', 'Other'],
  goat: ['Nubian', 'Alpine', 'Boer', 'Saanen', 'LaMancha', 'Other'],
  rabbit: ['New Zealand', 'Flemish Giant', 'Rex', 'Angora', 'Lop', 'Other'],
  turkey: ['Broad Breasted White', 'Broad Breasted Bronze', 'Bourbon Red', 'Other'],
  pigeon: ['Racing Homer', 'Fantail', 'King', 'Other'],
  other: ['Other'],
};

export default function AnimalRegistrationPage() {
  const navigate = useNavigate();
  const { propertyId, productId } = useParams<{ propertyId: string; productId?: string }>();

  const [name, setName] = useState('');
  const [type, setType] = useState<AnimalType>('chicken');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState<number>(0);
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('unknown');
  const [rfidTag, setRfidTag] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState('');
  const [productName, setProductName] = useState('');

  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        
        // Load property and product names
        if (propertyId) {
          try {
            const property = await PropertyService.getProperty(propertyId);
            if (property) {
              setPropertyName(property.name);
            }
          } catch (err) {
            console.error('Error loading property:', err);
          }
        }

        if (productId) {
          try {
            const product = await ProductsFirebaseService.getProduct(productId);
            if (product) {
              setProductName(product.nickname || product.productName);
            }
          } catch (err) {
            console.error('Error loading product:', err);
          }
        }
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [propertyId, productId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Animal name is required');
      return;
    }

    if (!propertyId || !userId) {
      setError('Missing required information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await AnimalService.createAnimal(userId, {
        propertyId,
        productId: productId || undefined,
        name: name.trim(),
        type,
        breed: breed.trim() || undefined,
        age: age > 0 ? age : undefined,
        gender,
        rfidTag: rfidTag.trim() || undefined,
        notes: notes.trim() || undefined,
        status: 'active',
        health: {
          score: 100,
          lastCheckup: new Date().toISOString(),
        },
      });

      // Navigate back or to animal list
      if (productId) {
        navigate(`/property/${propertyId}/product/${productId}/animals`);
      } else {
        navigate(`/property/${propertyId}/animals`);
      }
    } catch (err: any) {
      let errorMessage = 'Failed to register animal';
      if (err?.message) {
        errorMessage = err.message;
      }
      
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        errorMessage = 'Permission denied. Please check your Firestore security rules.';
      } else if (errorMessage.includes('database is not available')) {
        errorMessage = 'Firebase is not configured. Please check your Firebase setup.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const availableBreeds = BREEDS[type] || [];

  return (
    <MainLayout title="Register Animal" product="chicken-tender" onProductChange={() => {}}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Register Animal
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add a new animal to {propertyName && `property "${propertyName}"`}
            {productName && ` in ${productName}`}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="animal-name"
                  name="animal-name"
                  label="Animal Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g., Clucky, Daisy"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="animal-type-label">Animal Type</InputLabel>
                  <Select
                    id="animal-type"
                    name="animal-type"
                    labelId="animal-type-label"
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value as AnimalType);
                      setBreed(''); // Reset breed when type changes
                    }}
                    label="Animal Type"
                  >
                    {ANIMAL_TYPES.map((animalType) => (
                      <MenuItem key={animalType.value} value={animalType.value}>
                        {animalType.emoji} {animalType.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="breed-label">Breed</InputLabel>
                  <Select
                    id="breed"
                    name="breed"
                    labelId="breed-label"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    label="Breed"
                  >
                    <MenuItem value="">Not specified</MenuItem>
                    {availableBreeds.map((b) => (
                      <MenuItem key={b} value={b}>
                        {b}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  id="age"
                  name="age"
                  label="Age (months)"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ min: 0, max: 240 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select
                    id="gender"
                    name="gender"
                    labelId="gender-label"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'unknown')}
                    label="Gender"
                  >
                    <MenuItem value="unknown">Unknown</MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  id="rfid-tag"
                  name="rfid-tag"
                  label="RFID Tag (optional)"
                  value={rfidTag}
                  onChange={(e) => setRfidTag(e.target.value)}
                  fullWidth
                  placeholder="Auto-generate if left blank"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  id="notes"
                  name="notes"
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Additional notes about this animal..."
                />
              </Grid>
            </Grid>
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
              disabled={loading || !name.trim()}
            >
              {loading ? 'Registering...' : 'Register Animal'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
}

