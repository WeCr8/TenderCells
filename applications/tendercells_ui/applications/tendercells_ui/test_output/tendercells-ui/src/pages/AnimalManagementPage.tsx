// AnimalManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase/firebaseApp';
import { AnimalService, Animal } from '../services/animalService';
import { PropertyService } from '../services/propertyService';
import { ProductsFirebaseService } from '../services/productsFirebaseService';
import MainLayout from '../components/layout/MainLayout';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add, Edit, Delete, ArrowBack } from '@mui/icons-material';

const ANIMAL_EMOJIS: Record<string, string> = {
  chicken: '🐔',
  duck: '🦆',
  goat: '🐐',
  rabbit: '🐰',
  turkey: '🦃',
  pigeon: '🕊️',
  other: '🐾',
};

export default function AnimalManagementPage() {
  const navigate = useNavigate();
  const { propertyId, productId } = useParams<{ propertyId: string; productId?: string }>();

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState('');
  const [productName, setProductName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [animalToDelete, setAnimalToDelete] = useState<Animal | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
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

        // Load animals
        await loadAnimals(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [propertyId, productId]);

  const loadAnimals = async (uid: string) => {
    try {
      setLoading(true);
      let animalsList: Animal[];
      
      if (productId) {
        animalsList = await AnimalService.getProductAnimals(productId, uid);
      } else if (propertyId) {
        animalsList = await AnimalService.getPropertyAnimals(propertyId, uid);
      } else {
        animalsList = await AnimalService.getUserAnimals(uid);
      }
      
      setAnimals(animalsList);
    } catch (err: any) {
      setError(err?.message || 'Failed to load animals');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!animalToDelete?.id) return;

    try {
      await AnimalService.deleteAnimal(animalToDelete.id);
      if (userId) {
        await loadAnimals(userId);
      }
      setDeleteDialogOpen(false);
      setAnimalToDelete(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete animal');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'sick':
        return 'error';
      case 'quarantine':
        return 'warning';
      case 'deceased':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <MainLayout title="Animal Management" product="chicken-tender" onProductChange={() => {}}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Animal Management" product="chicken-tender" onProductChange={() => {}}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {productName ? `${productName} - Animals` : propertyName ? `${propertyName} - Animals` : 'Animal Management'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {animals.length} {animals.length === 1 ? 'animal' : 'animals'} registered
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                if (productId && propertyId) {
                  navigate(`/property/${propertyId}/product/${productId}/animals/register`);
                } else if (propertyId) {
                  navigate(`/property/${propertyId}/animals/register`);
                }
              }}
            >
              Add Animal
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {animals.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No animals registered yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start by adding your first animal
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                if (productId && propertyId) {
                  navigate(`/property/${propertyId}/product/${productId}/animals/register`);
                } else if (propertyId) {
                  navigate(`/property/${propertyId}/animals/register`);
                }
              }}
            >
              Add Animal
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {animals.map((animal) => (
              <Grid item xs={12} sm={6} md={4} key={animal.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" component="div">
                          {ANIMAL_EMOJIS[animal.type] || '🐾'} {animal.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {animal.type.charAt(0).toUpperCase() + animal.type.slice(1)}
                          {animal.breed && ` • ${animal.breed}`}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            // Navigate to edit page
                            if (animal.id) {
                              navigate(`/animal/${animal.id}/edit`);
                            }
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setAnimalToDelete(animal);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip
                        label={animal.status}
                        color={getStatusColor(animal.status) as any}
                        size="small"
                      />
                      {animal.age && (
                        <Chip label={`${animal.age} months`} size="small" variant="outlined" />
                      )}
                      {animal.gender && animal.gender !== 'unknown' && (
                        <Chip label={animal.gender} size="small" variant="outlined" />
                      )}
                    </Box>

                    {animal.rfidTag && (
                      <Typography variant="caption" color="text.secondary">
                        RFID: {animal.rfidTag}
                      </Typography>
                    )}

                    {animal.notes && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {animal.notes}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Animal?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete {animalToDelete?.name}? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </MainLayout>
  );
}

