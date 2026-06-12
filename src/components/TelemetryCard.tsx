// TelemetryCard component — displays sensor reading
// Last updated: 2026-06-11

const colors = {
  surface: '#1A3D2B',
  accent: '#4A7C59',
  gold: '#C8B882',
  goldMuted: '#8A7D55',
  danger: '#CC3333',
  warning: '#E8A020',
  white: '#F0EDE4',
};

interface TelemetryCardProps {
  label: string;
  value: string;
  status: 'ok' | 'warning' | 'critical';
}

export function TelemetryCard({ label, value, status }: TelemetryCardProps) {
  const getStatusColor = () => {
    if (status === 'critical') return colors.danger;
    if (status === 'warning') return colors.warning;
    return colors.accent;
  };

  return (
    <div
      style={{
        background: colors.surface,
        border: `2px solid ${getStatusColor()}`,
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <p style={{ color: colors.goldMuted, margin: '0 0 10px 0', fontSize: '14px' }}>
        {label}
      </p>
      <p style={{ color: colors.gold, margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
        {value}
      </p>
    </div>
  );
}
