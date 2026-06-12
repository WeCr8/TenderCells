// SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase/firebaseApp';
import { UserSettingsService } from '../services/userSettingsService';
import MainLayout from '../components/layout/MainLayout';

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [deviceName, setDeviceName] = useState('');
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const settings = await UserSettingsService.getUserSettings(user.uid);
          if (settings) {
            setDeviceName(settings.metadata?.deviceName || '');
            setWifiSSID(settings.metadata?.wifiSSID || '');
            setWifiPassword(settings.metadata?.wifiPassword || '');
          }
        } catch (err) {
          console.error('Error loading settings:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleSave = async () => {
    if (!userId) {
      setError('You must be logged in to save settings');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await UserSettingsService.saveUserSettings(userId, {
        metadata: {
          deviceName: deviceName.trim(),
          wifiSSID: wifiSSID.trim(),
          wifiPassword: wifiPassword.trim(),
        },
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Settings" product="chicken-tender" onProductChange={() => {}}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Settings" product="chicken-tender" onProductChange={() => {}}>
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
            Settings saved successfully!
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            id="device-name"
            name="device-name"
            label="Device Name"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            id="wifi-ssid"
            name="wifi-ssid"
            label="WiFi SSID"
            value={wifiSSID}
            onChange={(e) => setWifiSSID(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            id="wifi-password"
            name="wifi-password"
            label="WiFi Password"
            type="password"
            value={wifiPassword}
            onChange={(e) => setWifiPassword(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving}
            sx={{ mt: 2 }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>
    </MainLayout>
  );
}
