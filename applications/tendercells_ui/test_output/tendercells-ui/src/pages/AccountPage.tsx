import React, { useEffect, useState } from 'react';
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
  Grid,
} from '@mui/material';
import { CreditCard, DeleteSweep, Devices, Google as GoogleIcon, Logout as LogoutIcon, School as SchoolIcon, VerifiedUser } from '@mui/icons-material';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { sendEmailVerification, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// The website's account page (same origin in production: tendercells.com/account; the OS is /app).
const WEBSITE_ACCOUNT_URL = '/account';
import { useAuth } from '../contexts/useAuth';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/products/ProductCard';
import ProductRegistrationModal from '../components/products/ProductRegistrationModal';
import type { RegisterProductData } from '../types/products';
import firebaseApp, { auth, db } from '../lib/firebase/firebaseApp';
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
  const { products, loading: productsLoading, refetch, registerProduct } = useProducts();
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isResettingWorkspace, setIsResettingWorkspace] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [accountMessage, setAccountMessage] = useState<{ severity: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [schoolAccess, setSchoolAccess] = useState<{ organizationId: string; role: string } | null>(null);
  const [isPlatformOwner, setIsPlatformOwner] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<Array<Record<string, unknown>>>([]);
  const [invoices, setInvoices] = useState<Array<Record<string, unknown>>>([]);
  const [poAmount, setPoAmount] = useState('');
  const [poDescription, setPoDescription] = useState('');
  const [billingAction, setBillingAction] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void user.getIdTokenResult().then((token) => {
      const organizationId = String(token.claims.organizationId || '');
      const role = String(token.claims.schoolRole || '');
      setSchoolAccess(organizationId ? { organizationId, role } : null);
      setIsPlatformOwner(token.claims.platformOwner === true || token.claims.platformAdmin === true);
    });
  }, [user]);

  const loadOrganizationBilling = async (organizationId: string) => {
    const [poSnap, invoiceSnap] = await Promise.all([
      getDocs(collection(db, `organizations/${organizationId}/purchaseOrders`)),
      getDocs(collection(db, `organizations/${organizationId}/invoices`)),
    ]);
    setPurchaseOrders(poSnap.docs.map((item) => ({ id: item.id, ...item.data() })));
    setInvoices(invoiceSnap.docs.map((item) => ({ id: item.id, ...item.data() })));
  };

  useEffect(() => {
    if (schoolAccess && ['district-admin', 'school-admin'].includes(schoolAccess.role)) {
      void loadOrganizationBilling(schoolAccess.organizationId).catch(() => {
        setAccountMessage({ severity: 'error', text: 'Organization billing records could not be loaded.' });
      });
    }
  }, [schoolAccess]);

  const submitPurchaseOrder = async () => {
    if (!firebaseApp || !schoolAccess) return;
    const amountCents = Math.round(Number(poAmount) * 100);
    if (!Number.isSafeInteger(amountCents) || amountCents < 100) {
      setAccountMessage({ severity: 'error', text: 'Enter a valid purchase-order amount.' });
      return;
    }
    await httpsCallable(getFunctions(firebaseApp), 'createPurchaseOrder')({
      organizationId: schoolAccess.organizationId,
      amountCents,
      currency: 'USD',
      description: poDescription,
    });
    setPoAmount('');
    setPoDescription('');
    await loadOrganizationBilling(schoolAccess.organizationId);
    setAccountMessage({ severity: 'success', text: 'Purchase-order request submitted.' });
  };

  const openBilling = async (action: 'starter_monthly' | 'school_annual' | 'portal') => {
    if (!firebaseApp) return;
    setBillingAction(action);
    setAccountMessage(null);
    try {
      const callable = httpsCallable(getFunctions(firebaseApp), action === 'portal' ? 'createBillingPortal' : 'createBillingCheckout');
      const result = await callable(action === 'portal' ? {} : { plan: action, organizationId: schoolAccess?.organizationId });
      const url = String((result.data as { url?: string }).url || '');
      if (!url) throw new Error('Stripe did not return a billing page.');
      window.location.assign(url);
    } catch (billingError) {
      setAccountMessage({ severity: 'error', text: billingError instanceof Error ? billingError.message : 'Billing could not be opened.' });
      setBillingAction(null);
    }
  };

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

  const saveProfile = async () => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: displayName.trim() || null });
      setAccountMessage({ severity: 'success', text: 'Profile updated.' });
    } catch (profileError) {
      setAccountMessage({ severity: 'error', text: profileError instanceof Error ? profileError.message : 'Profile update failed.' });
    }
  };

  const sendVerification = async () => {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      setAccountMessage({ severity: 'success', text: 'Verification email sent.' });
    } catch (verificationError) {
      setAccountMessage({ severity: 'error', text: verificationError instanceof Error ? verificationError.message : 'Could not send verification email.' });
    }
  };

  const sendPasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setAccountMessage({ severity: 'success', text: 'Password reset email sent.' });
    } catch (passwordError) {
      setAccountMessage({ severity: 'error', text: passwordError instanceof Error ? passwordError.message : 'Could not send password reset email.' });
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

            {/* School sign-in (Google Workspace today, Microsoft 365 when enabled) lives on the website
                account page; the session is shared with the OS on the same origin. */}
            <Button
              fullWidth
              variant="outlined"
              href={WEBSITE_ACCOUNT_URL}
              startIcon={<SchoolIcon />}
              sx={{ mb: 1, justifyContent: 'space-between', borderColor: '#4A7C59', color: '#C8B882' }}
              endIcon={<Chip label="Google · Microsoft" size="small" sx={{ height: 20, fontSize: 10, bgcolor: '#0D2B1E', color: '#C8B882' }} />}
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
        {/* FIX: without variant="scrollable", MUI clips (not wraps) tabs that
            don't fit the container width - on a narrow/mobile viewport, with
            4 tabs and 2 carrying icons, "Billing"/"Products" could be
            clipped off-screen with no way to reach or scroll to them at all. */}
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          <Tab label="Profile" />
          <Tab label="Security" />
          <Tab label="Billing" icon={<CreditCard />} iconPosition="start" />
          <Tab label="Products" icon={<Devices/>} iconPosition="start" />
        </Tabs>
      </Box>

      {accountMessage && <Alert severity={accountMessage.severity} onClose={() => setAccountMessage(null)} sx={{ mt: 2 }}>{accountMessage.text}</Alert>}

      <TabPanel value={activeTab} index={0}>
        <Typography variant="h5" gutterBottom sx={{ color: '#C8B882' }}>
          Account Profile
        </Typography>
        <Grid container spacing={2} sx={{ maxWidth: 760 }}>
          <Grid item xs={12} sm={6}><TextField label="Display name" fullWidth value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Email" fullWidth value={user?.email || ''} disabled /></Grid>
          <Grid item xs={12}><Button variant="contained" onClick={() => void saveProfile()}>Save Profile</Button></Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Stack spacing={1}>
          <Typography variant="body2"><strong>Firebase user ID:</strong> {user?.uid}</Typography>
          <Typography variant="body2"><strong>Created:</strong> {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : 'Unknown'}</Typography>
          <Typography variant="body2"><strong>Last sign-in:</strong> {user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Unknown'}</Typography>
        </Stack>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography variant="h5" gutterBottom sx={{ color: '#C8B882' }}>
          Security Settings
        </Typography>
        <Stack spacing={2} sx={{ maxWidth: 760 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <VerifiedUser color={user?.emailVerified ? 'success' : 'disabled'} />
            <Typography>Email</Typography>
            <Chip size="small" label={user?.emailVerified ? 'Verified' : 'Not verified'} color={user?.emailVerified ? 'success' : 'warning'} />
          </Stack>
          <Box>
            <Typography variant="subtitle2" gutterBottom>Sign-in providers</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {user?.providerData.map((provider) => <Chip key={provider.providerId} label={provider.providerId === 'password' ? 'Email and password' : provider.providerId === 'google.com' ? 'Google' : provider.providerId} variant="outlined" />)}
            </Stack>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {!user?.emailVerified && <Button variant="outlined" onClick={() => void sendVerification()}>Send Verification Email</Button>}
            {user?.providerData.some((provider) => provider.providerId === 'password') && <Button variant="outlined" onClick={() => void sendPasswordReset()}>Reset Password</Button>}
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={() => void handleLogout()}>Sign Out</Button>
          </Stack>
          <Box sx={{ opacity: 0.55, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <SchoolIcon />
              <Box>
                <Typography variant="subtitle2">School or district SSO</Typography>
                <Typography variant="body2" color="text.secondary">Not connected. Google Workspace Education, Microsoft Education, Clever, and ClassLink require district setup.</Typography>
              </Box>
            </Stack>
            <Button component="a" href={`${WEBSITE_ACCOUNT_URL}#school-sign-in`} variant="outlined" sx={{ mt: 1.5 }}>Connect School Account</Button>
          </Box>
        </Stack>
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
        <Typography variant="h5" gutterBottom sx={{ color: '#C8B882' }}>Billing</Typography>
        <Stack spacing={2} sx={{ maxWidth: 760 }}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{isPlatformOwner ? 'Platform Owner' : 'Local / open-source plan'}</Typography>
                <Typography variant="body2" color="text.secondary">{isPlatformOwner ? 'Full TenderCells cloud and administration access is included for this account.' : 'No active subscription or payment method is attached to this Firebase account.'}</Typography>
              </Box>
              <Chip label={isPlatformOwner ? 'Cloud included' : 'Current'} color="success" size="small" />
            </Stack>
          </Box>
          {!isPlatformOwner && <>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>TenderCells Starter</Typography>
              <Typography variant="h6">$5/month</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>30-day free trial for hosted history, remote features, alerts, and support. Local operation remains free.</Typography>
              <Button variant="contained" onClick={() => void openBilling('starter_monthly')} disabled={Boolean(billingAction)}>
                Start 30-day trial
              </Button>
            </Box>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>TenderCells School Pilot</Typography>
              <Typography variant="h6">$499/year</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>60-day managed pilot. School administrators can use card billing or continue through purchase order and invoice review.</Typography>
              <Button variant="contained" onClick={() => void openBilling('school_annual')} disabled={!schoolAccess || !['district-admin', 'school-admin'].includes(schoolAccess.role) || Boolean(billingAction)}>
                Start 60-day school pilot
              </Button>
            </Box>
            <Button variant="outlined" startIcon={<CreditCard />} onClick={() => void openBilling('portal')} disabled={Boolean(billingAction)}>Manage billing</Button>
          </>}
          {schoolAccess && ['district-admin', 'school-admin'].includes(schoolAccess.role) ? (
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Organization billing</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Submit a purchase-order request and review invoices for this school organization.</Typography>
              <Stack spacing={1.5}>
                <TextField label="PO amount (USD)" type="number" value={poAmount} onChange={(event) => setPoAmount(event.target.value)} inputProps={{ min: 1, step: '0.01' }} />
                <TextField label="Purpose or quote reference" value={poDescription} onChange={(event) => setPoDescription(event.target.value)} />
                <Button variant="contained" startIcon={<CreditCard />} onClick={() => void submitPurchaseOrder()}>Submit Purchase Order</Button>
                <Typography variant="body2"><strong>Purchase orders:</strong> {purchaseOrders.length}</Typography>
                <Typography variant="body2"><strong>Invoices:</strong> {invoices.length}</Typography>
              </Stack>
            </Box>
          ) : (
            <Alert severity="info">Organization purchase orders and invoices appear after a district or school administrator account is connected.</Alert>
          )}
        </Stack>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
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
              variant="contained"
              onClick={() => setIsRegistrationModalOpen(true)}
              sx={{ bgcolor: '#4A7C59' }}
            >
              Register Device
            </Button>
          </Stack>
        </Box>

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
