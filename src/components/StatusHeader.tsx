// StatusHeader component — displays device state
// Last updated: 2026-06-11

import { SystemState } from '../types';

const colors = {
  bg: '#0D2B1E',
  surface: '#1A3D2B',
  accent: '#4A7C59',
  gold: '#C8B882',
  danger: '#CC3333',
  warning: '#E8A020',
  white: '#F0EDE4',
};

interface StatusHeaderProps {
  state: SystemState;
  deviceName: string;
}

export function StatusHeader({ state, deviceName }: StatusHeaderProps) {
  const getStateColor = () => {
    switch (state) {
      case 'estop':
        return colors.danger;
      case 'error':
        return colors.warning;
      case 'running':
        return colors.accent;
      default:
        return colors.gold;
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case 'estop':
        return '🛑';
      case 'error':
        return '⚠️';
      case 'running':
        return '🔄';
      default:
        return '💤';
    }
  };

  return (
    <div
      style={{
        background: colors.surface,
        border: `3px solid ${getStateColor()}`,
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ fontSize: '32px' }}>{getStateIcon()}</div>
        <div>
          <h2 style={{ color: colors.gold, margin: 0 }}>{deviceName}</h2>
          <p
            style={{
              color: getStateColor(),
              margin: '5px 0 0 0',
              fontSize: '18px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}
          >
            {state}
          </p>
        </div>
      </div>
    </div>
  );
}
