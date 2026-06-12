// ConfirmModal component — required before hardware actions
// Last updated: 2026-06-11

const colors = {
  bg: '#0D2B1E',
  surface: '#1A3D2B',
  accent: '#4A7C59',
  gold: '#C8B882',
  danger: '#CC3333',
  white: '#F0EDE4',
};

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: colors.surface,
          border: `2px solid ${colors.accent}`,
          borderRadius: '8px',
          padding: '30px',
          maxWidth: '400px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: colors.gold, marginTop: 0 }}>{title}</h2>
        <p style={{ color: colors.white, marginBottom: '30px' }}>{message}</p>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
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
            Confirm
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              background: colors.danger,
              color: colors.white,
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
