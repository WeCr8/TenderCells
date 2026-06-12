// SignupPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase/firebaseApp';
import { AuthService } from '../services/authService';
import MainLayout from '../components/layout/MainLayout';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Divider,
  Link,
  Snackbar,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    if (!auth) {
      setIsChecking(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is already logged in, redirect to dashboard
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setIsChecking(false);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [navigate, location]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const user = await AuthService.signUpWithEmail(email, password);
      setSuccess(true);
      // Wait a moment to show success message, then navigate
      setTimeout(() => {
        const from = (location.state as any)?.from?.pathname || '/start';
        navigate(from, { replace: true });
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setLoading(true);

    try {
      const user = await AuthService.signInWithGoogle();
      setSuccess(true);
      // Wait a moment to show success message, then navigate
      setTimeout(() => {
        const from = (location.state as any)?.from?.pathname || '/start';
        navigate(from, { replace: true });
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up with Google');
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <MainLayout title="Sign Up" product="chicken-tender" onProductChange={() => {}}>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Typography>Loading...</Typography>
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (!auth) {
    return (
      <MainLayout title="Sign Up" product="chicken-tender" onProductChange={() => {}}>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Alert severity="info">
              Firebase Auth is not configured. The app is running in demo mode.
              You can navigate to the <Link href="/start">setup wizard</Link> to get started.
            </Alert>
          </Paper>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Sign Up" product="chicken-tender" onProductChange={() => {}}>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Sign up to get started with TenderCells
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleEmailSignup} sx={{ mb: 3 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
              autoComplete="email"
            />

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
              autoComplete="new-password"
              helperText="Must be at least 6 characters"
            />

            <TextField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>or</Divider>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignup}
            disabled={loading}
            sx={{ mb: 3 }}
          >
            Sign up with Google
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/login')}
                sx={{ cursor: 'pointer' }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>

        <Snackbar
          open={success}
          autoHideDuration={3000}
          onClose={() => setSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSuccess(false)} 
            severity="success" 
            sx={{ width: '100%' }}
          >
            Account created successfully! Redirecting to setup...
          </Alert>
        </Snackbar>
      </Container>
    </MainLayout>
  );
}
