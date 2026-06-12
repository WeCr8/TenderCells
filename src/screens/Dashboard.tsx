// Dashboard screen — overview of all devices
// Last updated: 2026-06-11

import { useEffect, useState } from 'react';
import { Device } from '../types';
import { useDeviceStore } from '../store/deviceStore';
import { getMockDeviceForProperty } from '../services/mockData';

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

interface DashboardProps {
  propertyId: string;
  onSelectDevice: (deviceId: string) => void;
}

export function Dashboard({ propertyId, onSelectDevice }: DashboardProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filter, setFilter] = useState<'all' | 'online' | 'error'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load mock data for demo
    setLoading(true);
    try {
      const mockDevices = getMockDeviceForProperty(propertyId);
      setDevices(mockDevices);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
      setLoading(false);
    }
  }, [propertyId]);

  const filteredDevices = devices.filter((device) => {
    if (filter === 'online') return device.hardwareConnected;
    if (filter === 'error') return !device.hardwareConnected;
    return true;
  });

  const getStatusColor = (device: Device) => {
    if (!device.hardwareConnected) return colors.danger;
    return colors.accent;
  };

  const getStatusText = (device: Device) => {
    if (!device.hardwareConnected) return 'Offline';
    return 'Online';
  };

  return (
    <div style={{
      background: colors.bg,
      color: colors.white,
      minHeight: '100vh',
      padding: '20px',
    }}>
      <h1 style={{ color: colors.gold, marginBottom: '30px' }}>
        Tender Cells Dashboard
      </h1>

      {/* Filter tabs */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        {(['all', 'online', 'error'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? colors.accent : colors.surface,
              color: colors.gold,
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          background: colors.danger,
          color: colors.white,
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading devices...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredDevices.length === 0 && (
        <div style={{
          background: colors.surface,
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <p>No devices found. {filter !== 'all' && 'Try changing filters.'}</p>
        </div>
      )}

      {/* Device grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
      }}>
        {filteredDevices.map((device) => (
          <div
            key={device.id}
            onClick={() => onSelectDevice(device.id)}
            style={{
              background: colors.surface,
              border: `2px solid ${getStatusColor(device)}`,
              borderRadius: '8px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            }}
          >
            <h3 style={{ color: colors.gold, marginTop: 0 }}>
              {device.nickname}
            </h3>

            <div style={{ fontSize: '14px', marginBottom: '15px' }}>
              <p style={{ color: colors.goldMuted, margin: '5px 0' }}>
                Type: <span style={{ color: colors.gold }}>{device.productType}</span>
              </p>
              <p style={{ color: colors.goldMuted, margin: '5px 0' }}>
                Animals: <span style={{ color: colors.gold }}>{device.animalCount}</span>
              </p>
              <p style={{
                color: colors.goldMuted,
                margin: '5px 0',
              }}>
                Status:{' '}
                <span style={{ color: getStatusColor(device) }}>
                  {getStatusText(device)}
                </span>
              </p>
            </div>

            {device.simOnly && (
              <div style={{
                background: colors.warning,
                color: '#000',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                marginTop: '10px',
              }}>
                📡 Simulation Mode
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
