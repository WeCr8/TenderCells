// Tender Cells Main App
// Last updated: 2026-06-11

import { useState, useEffect } from 'react';
import { Dashboard } from './screens/Dashboard';
import { CoopDetail } from './screens/CoopDetail';
import { Schedules } from './screens/Schedules';
import { WasteCleaning } from './screens/WasteCleaning';
import { EggMap } from './screens/EggMap';
import { mockProperty, mockDevices } from './services/mockData';
import './App.css';

type Screen = 'login' | 'properties' | 'dashboard' | 'detail' | 'schedules' | 'cleaning' | 'eggmap';

const colors = {
  bg: '#0D2B1E',
  surface: '#1A3D2B',
  accent: '#4A7C59',
  gold: '#C8B882',
  goldMuted: '#8A7D55',
  danger: '#CC3333',
  warning: '#E8A020',
  white: '#F0EDE4',
};

function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [user, setUser] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize with mock data (demo mode)
  useEffect(() => {
    setLoading(false);
    // Auto-login for demo
    setUser({ uid: 'demo_user', email: 'demo@tendercells.local' });
    setProperties([mockProperty]);
    setSelectedPropertyId(mockProperty.id);
    setScreen('dashboard');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    try {
      // For demo: create sim device if user logs in
      console.log('Login attempt:', email);
      // Firebase auth would happen here
      setLoading(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          background: colors.bg,
          color: colors.white,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p>Loading Tender Cells...</p>
      </div>
    );
  }

  // Login screen
  if (screen === 'login') {
    return (
      <div
        style={{
          background: colors.bg,
          color: colors.white,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            background: colors.surface,
            padding: '40px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '100%',
          }}
        >
          <h1 style={{ color: colors.gold, textAlign: 'center', marginTop: 0 }}>
            Tender Cells
          </h1>
          <p
            style={{
              color: colors.goldMuted,
              textAlign: 'center',
              marginBottom: '30px',
            }}
          >
            AI-Powered Automated Animal Care
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  color: colors.gold,
                  marginBottom: '8px',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${colors.accent}`,
                  borderRadius: '4px',
                  background: colors.bg,
                  color: colors.white,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label
                style={{
                  display: 'block',
                  color: colors.gold,
                  marginBottom: '8px',
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${colors.accent}`,
                  borderRadius: '4px',
                  background: colors.bg,
                  color: colors.white,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {authError && (
              <div
                style={{
                  background: colors.danger,
                  color: colors.white,
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '20px',
                  fontSize: '14px',
                }}
              >
                {authError}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                background: colors.accent,
                color: colors.gold,
                border: 'none',
                padding: '12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              Sign In
            </button>
          </form>

          <p
            style={{
              textAlign: 'center',
              color: colors.goldMuted,
              marginTop: '20px',
              fontSize: '14px',
            }}
          >
            Demo Mode: Try any email/password
          </p>
        </div>
      </div>
    );
  }

  // Properties screen
  if (screen === 'properties') {
    return (
      <div
        style={{
          background: colors.bg,
          color: colors.white,
          minHeight: '100vh',
          padding: '20px',
        }}
      >
        <h1 style={{ color: colors.gold }}>Select Property</h1>
        <p>No properties found. Create one to get started.</p>
      </div>
    );
  }

  // Dashboard screen
  if (screen === 'dashboard' && selectedPropertyId) {
    return (
      <Dashboard
        propertyId={selectedPropertyId}
        onSelectDevice={(deviceId) => {
          setSelectedDeviceId(deviceId);
          setScreen('detail');
        }}
      />
    );
  }

  // Detail screen
  if (screen === 'detail' && selectedDeviceId) {
    return (
      <CoopDetail
        deviceId={selectedDeviceId}
        onBack={() => setScreen('dashboard')}
        onNavigate={(navScreen) => setScreen(navScreen as Screen)}
      />
    );
  }

  // Schedules screen
  if (screen === 'schedules' && selectedDeviceId) {
    return (
      <Schedules
        deviceId={selectedDeviceId}
        onBack={() => setScreen('detail')}
      />
    );
  }

  // Cleaning screen
  if (screen === 'cleaning' && selectedDeviceId) {
    return (
      <WasteCleaning
        deviceId={selectedDeviceId}
        onBack={() => setScreen('detail')}
      />
    );
  }

  // Egg Map screen
  if (screen === 'eggmap' && selectedDeviceId) {
    return (
      <EggMap
        deviceId={selectedDeviceId}
        onBack={() => setScreen('detail')}
      />
    );
  }

  return (
    <div style={{ background: colors.bg, color: colors.white, minHeight: '100vh', padding: '20px' }}>
      <p>Unknown screen state</p>
    </div>
  );
}

export default App;
