// CoopDetail screen — detailed device view with telemetry and controls
// Last updated: 2026-06-11

import { useEffect, useState } from 'react';
import { TelemetryCard } from '../components/TelemetryCard';
import { StatusHeader } from '../components/StatusHeader';
import { ConfirmModal } from '../components/ConfirmModal';
import { mockDevices, getMockTelemetryForDevice } from '../services/mockData';
import type { Device, TelemetryReading, Alert } from '../types';

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

interface CoopDetailProps {
  deviceId: string;
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export function CoopDetail({ deviceId, onBack, onNavigate }: CoopDetailProps) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [telemetryReadings, setTelemetryReadings] = useState<TelemetryReading[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    // Load mock device data
    const device = mockDevices.find((d) => d.id === deviceId);
    if (device) {
      setSelectedDevice(device);
      const telemetry = getMockTelemetryForDevice(deviceId);
      setTelemetryReadings(telemetry);
    }
  }, [deviceId]);

  if (!selectedDevice) {
    return (
      <div style={{ background: colors.bg, color: colors.white, minHeight: '100vh', padding: '20px' }}>
        <button onClick={onBack} style={{
          background: colors.accent,
          color: colors.gold,
          border: 'none',
          padding: '10px 15px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}>
          ← Back
        </button>
        <p>Loading device...</p>
      </div>
    );
  }

  const latestTelemetry = telemetryReadings[0];
  const criticalAlerts: Alert[] = [];

  const handleAction = (action: string) => {
    setPendingAction(action);
    setShowConfirmModal(true);
  };

  const confirmAction = () => {
    if (pendingAction) {
      console.log(`Executing action: ${pendingAction}`);
      // TODO: Implement MQTT command sending
    }
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  return (
    <div style={{ background: colors.bg, color: colors.white, minHeight: '100vh', padding: '20px' }}>
      <button
        onClick={onBack}
        style={{
          background: colors.accent,
          color: colors.gold,
          border: 'none',
          padding: '10px 15px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        ← Back
      </button>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '10px',
      }}>
        <NavTab label="Overview" onClick={() => {}} active />
        {onNavigate && (
          <>
            <NavTab label="🥚 Eggs" onClick={() => onNavigate('eggmap')} />
            <NavTab label="🧹 Cleaning" onClick={() => onNavigate('cleaning')} />
            <NavTab label="⏰ Schedules" onClick={() => onNavigate('schedules')} />
          </>
        )}
      </div>

      {/* Status Header */}
      <StatusHeader
        state={latestTelemetry?.systemState || 'idle'}
        deviceName={selectedDevice.nickname}
      />

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div style={{
          background: colors.danger,
          color: colors.white,
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px',
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>
            🚨 {criticalAlerts.length} critical alert(s)
          </p>
          {criticalAlerts.slice(0, 2).map((alert) => (
            <p key={alert.id} style={{ margin: '5px 0', fontSize: '14px' }}>
              {alert.message}
            </p>
          ))}
        </div>
      )}

      {/* Telemetry Grid */}
      {latestTelemetry && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px',
          marginBottom: '30px',
        }}>
          <TelemetryCard
            label="Temperature"
            value={`${latestTelemetry.temperature.toFixed(1)}°F`}
            status={
              latestTelemetry.temperature < 35 || latestTelemetry.temperature > 85
                ? 'warning'
                : 'ok'
            }
          />
          <TelemetryCard
            label="Humidity"
            value={`${latestTelemetry.humidity.toFixed(0)}%`}
            status="ok"
          />
          <TelemetryCard
            label="Ammonia"
            value={`${latestTelemetry.ammonia.toFixed(1)} ppm`}
            status={
              latestTelemetry.ammonia > 10 ? 'warning' : 'ok'
            }
          />
          <TelemetryCard
            label="Feed Level"
            value={`${latestTelemetry.feedLevel.toFixed(0)}%`}
            status={
              latestTelemetry.feedLevel < 20 ? 'warning' : 'ok'
            }
          />
          <TelemetryCard
            label="Water Level"
            value={`${latestTelemetry.waterLevel.toFixed(0)}%`}
            status={
              latestTelemetry.waterLevel < 15 ? 'warning' : 'ok'
            }
          />
          <TelemetryCard
            label="Chickens Detected"
            value={`${latestTelemetry.chickenCount}`}
            status="ok"
          />
        </div>
      )}

      {/* Control Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
      }}>
        <ActionButton
          label="Open Door"
          icon="🚪"
          onClick={() => handleAction('door-open')}
        />
        <ActionButton
          label="Close Door"
          icon="🚪"
          onClick={() => handleAction('door-close')}
        />
        <ActionButton
          label="Start Cleaning"
          icon="🧹"
          onClick={() => handleAction('cleaning-start')}
          danger
        />
        <ActionButton
          label="Dispense Feed"
          icon="🌾"
          onClick={() => handleAction('feed-dispense')}
        />
        <ActionButton
          label="E-STOP"
          icon="🛑"
          onClick={() => handleAction('estop')}
          danger
        />
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <ConfirmModal
          title="Confirm Action"
          message={`Execute action: ${pendingAction}?`}
          onConfirm={confirmAction}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
}

interface NavTabProps {
  label: string;
  onClick: () => void;
  active?: boolean;
}

function NavTab({ label, onClick, active }: NavTabProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? colors.accent : colors.surface,
        color: colors.gold,
        border: `1px solid ${colors.accent}`,
        padding: '10px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontWeight: active ? 'bold' : 'normal',
      }}
    >
      {label}
    </button>
  );
}

interface ActionButtonProps {
  label: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
}

function ActionButton({ label, icon, onClick, danger }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: danger ? colors.danger : colors.accent,
        color: colors.gold,
        border: 'none',
        padding: '15px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        transition: 'opacity 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = '0.8';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = '1';
      }}
    >
      {icon} {label}
    </button>
  );
}
