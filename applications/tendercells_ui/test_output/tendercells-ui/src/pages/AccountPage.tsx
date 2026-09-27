import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  Card,
  CardContent,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import { DeleteSweep, Devices, Google as GoogleIcon, Logout as LogoutIcon, School as SchoolIcon } from '@mui/icons-material';
import { doc, setDoc } from 'firebase/firestore';

// The website's account page (same origin in production: tendercells.com/account; the OS is /app).
const WEBSITE_ACCOUNT_URL = '/account';
import { useAuth } from '../contexts/useAuth';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/products/ProductCard';
import ProductRegistrationModal from '../components/products/ProductRegistrationModal';
import { ProductsService } from '../services/productsService';
import type { RegisterProductData } from '../types/products';
import { db } from '../lib/firebase/firebaseApp';
import { clearTenderCellsWorkspace } from '../services/workspaceReset';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AccountPage() {
  const { user, isAuthenticated, login, loginWithGoogle, register, logout, error, loading, clearError } = useAuth();
  const { products, loading: productsLoading, refetch, registerProduct, seedFirstGarageCoop, resetFirstGarageCoop } = useProducts();
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isResettingWorkspace, setIsResettingWorkspace] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleProductRegister = async (data: RegisterProductData) => {
    await registerProduct(data);
    await refetch();
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAuth(true);
    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      // Error displayed in alert
      console.error('Auth error:', err);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmittingAuth(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google auth error:', err);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleFreshUserReset = async () => {
    if (!user || !window.confirm('Clear this account workspace on this browser and start onboarding again? Your Firebase login will be preserved.')) return;
    setIsResettingWorkspace(true);
    try {
      const resetAt = Date.now();
      await setDoc(doc(db, 'users', user.uid), { userId: user.uid, workspaceResetAt: resetAt }, { merge: true });
      clearTenderCellsWorkspace(user.uid, resetAt);
      window.location.assign(`${import.meta.env.BASE_URL}dashboard`);
    } catch (resetError) {
      console.error('Workspace reset failed:', resetError);
      setIsResettingWorkspace(false);
    }
  };

  if (!isAuthenticated && !loading) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, p: 3 }}>
        <Card sx={{ bgcolor: '#1A3D2B' }}>
          <CardContent>
            <Box
              component="img"
              src="/assets/images/tender-cells-logo.svg"
              alt="Tender Cells"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/assets/images/tender_cells_logo.png';
              }}
              sx={{ display: 'block', width: 72, height: 72, mx: 'auto', mb: 2, borderRadius: 2, objectFit: 'contain' }}
            />
            <Typography variant="h5" gutterBottom sx={{ color: '#C8B882' }}>
              {authMode === 'login' ? 'Login' : 'Register'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#A5B1A9' }}>
              Continue with Google or use email and password.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={loading || isSubmittingAuth}
              sx={{ mb: 2, borderColor: '#C8B882', color: '#C8B882' }}
            >
              Continue with Google
            </Button>

            {/* School / district SSO is prepared on the website account page but not live yet. */}
            <Button
              fullWidth
              variant="outlined"
              disabled
              startIcon={<SchoolIcon />}
              sx={{ mb: 1, justifyContent: 'space-between', '&.Mui-disabled': { borderColor: '#4A7C59', color: '#8A7D55' } }}
              endIcon={<Chip label="Coming soon" size="small" sx={{ height: 20, fontSize: 10, bgcolor: '#0D2B1E', color: '#C8B882' }} />}
            >
              School or district sign-in
            </Button>
            <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#8A7D55' }}>
              Account settings, school rosters and class access live on your{' '}
              <Box component="a" href={WEBSITE_ACCOUNT_URL} sx={{ color: '#C8B882' }}>Tender Cells account page</Box>.
            </Typography>

            <Divider sx={{ my: 2, borderColor: '#4A7C59' }}>
              <Typography variant="caption" sx={{ color: '#8A7D55' }}>
                Email
              </Typography>
            </Divider>

            <form onSubmit={handleAuthSubmit}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, bgcolor: '#4A7C59' }}
                disabled={loading || isSubmittingAuth}
              >
                {authMode === 'login' ? 'Login' : 'Register'}
              </Button>
            </form>

            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: '#8A7D55' }}>
              {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Button
                size="small"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  clearError();
                  setEmail('');
                  setPassword('');
                }}
                sx={{ color: '#C8B882' }}
              >
                {authMode === 'login' ? 'Register' : 'Login'}
              </Button>
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="caption" sx={{ display: 'block', mt: 3, textAlign: 'center', color: '#8A7D55' }}>
          Demo account data stays browser-local unless a backend is configured.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* User Info Header */}
      <Card sx={{ bgcolor: '#1A3D2B', mb: 3, border: '1px solid #4A7C59' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Logged in as
              </Typography>
              <Typography variant="h6" sx={{ color: '#C8B882' }}>
                {user?.email}
              </Typography>
              <Chip
                label="Authenticated"
                color="success"
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
            <Button
              variant="outlined"
              color="error"
              endIcon={<LogoutIcon />}
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              Logout
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Profile" />
          <Tab label="Security" />
          <Tab label="Products" icon={<Devices/>} iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Typography variant="h5" gutterBottom sx={{ color: '#C8B882' }}>
          Account Profile
        </Typography>
        <TextField label="Email" fullWidth margin="normal" value={user?.email || ''} disabled />
        <TextField label="User ID" fullWidth margin="normal" value={user?.uid || ''} disabled size="small" />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Account created: {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
        </Typography>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography variant="h5" gutterBottom sx={{ color: '#C8B882' }}>
          Security Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Password reset and security settings are managed through Firebase. Use "Logout" to sign out.
        </Typography>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>Fresh-user testing</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Clear products, property layout, animals, schedules, and onboarding state while keeping this Firebase account and its SSO login.
        </Typography>
        <Button color="warning" variant="outlined" startIcon={<DeleteSweep />} onClick={() => void handleFreshUserReset()} disabled={isResettingWorkspace}>
          {isResettingWorkspace ? 'Preparing fresh workspace...' : 'Start Fresh User Test'}
        </Button>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: '#C8B882' }}>
              Registered Devices
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your hardware units and automation devices (Chicken Tender, WatchTower AI, etc.)
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              variant="outlined"
              onClick={async () => {
                await seedFirstGarageCoop();
                await refetch();
              }}
            >
              Register Garage Coop
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={async () => {
                await resetFirstGarageCoop();
                await refetch();
              }}
            >
              Reset Garage Coop
            </Button>
            <Button
              variant="contained"
              onClick={() => setIsRegistrationModalOpen(true)}
              sx={{ bgcolor: '#4A7C59' }}
            >
              Register Device
            </Button>
          </Stack>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Demo coop target: {ProductsService.FIRST_COOP_SERIAL} / {ProductsService.FIRST_COOP_DEVICE_ID}.
        </Alert>

        {productsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography>Loading devices...</Typography>
          </Box>
        ) : products.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Devices sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No devices registered
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Get started by registering your first device (e.g., Chicken Tender, WatchTower AI)
            </Typography>
            <Button
              variant="contained"
              onClick={() => setIsRegistrationModalOpen(true)}
              sx={{ bgcolor: '#4A7C59' }}
            >
              Register First Device
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onUpdate={() => refetch()}
              />
            ))}
          </Box>
        )}

        <ProductRegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={() => setIsRegistrationModalOpen(false)}
          onRegister={handleProductRegister}
        />
      </TabPanel>
    </Box>
  );
}
