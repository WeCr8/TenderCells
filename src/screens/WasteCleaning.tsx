// WasteCleaning screen — control cleaning cycle
// Last updated: 2026-06-11

import { useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';

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

interface WastecleaningProps {
  deviceId: string;
  onBack: () => void;
}

export function WasteCleaning({ onBack }: WastecleaningProps) {
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleaningProgress, setCleaningProgress] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastCleanTime, setLastCleanTime] = useState(Date.now() - 48 * 60 * 60 * 1000);

  const handleStartCleaning = () => {
    setShowConfirm(true);
  };

  const confirmCleaning = () => {
    setShowConfirm(false);
    setIsCleaning(true);
    setCleaningProgress(0);

    // Simulate cleaning progress
    const interval = setInterval(() => {
      setCleaningProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsCleaning(false);
          setLastCleanTime(Date.now());
          return 100;
        }
        return p + 5;
      });
    }, 1000);
  };

  const handleStopCleaning = () => {
    setIsCleaning(false);
    setCleaningProgress(0);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Recently';
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

      <h1 style={{ color: colors.gold, marginBottom: '30px' }}>🧹 Waste Cleaning</h1>

      {/* Status Card */}
      <div
        style={{
          background: colors.surface,
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: `2px solid ${colors.accent}`,
          textAlign: 'center',
        }}
      >
        <h2 style={{ color: colors.gold, marginTop: 0 }}>
          {isCleaning ? 'Cleaning in Progress' : 'Ready to Clean'}
        </h2>

        {isCleaning ? (
          <>
            <div
              style={{
                width: '100%',
                height: '20px',
                background: colors.bg,
                borderRadius: '10px',
                overflow: 'hidden',
                marginBottom: '20px',
                border: `1px solid ${colors.accent}`,
              }}
            >
              <div
                style={{
                  width: `${cleaningProgress}%`,
                  height: '100%',
                  background: colors.accent,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <p style={{ color: colors.goldMuted, fontSize: '24px', margin: '10px 0' }}>
              {cleaningProgress}%
            </p>
            <button
              onClick={handleStopCleaning}
              style={{
                background: colors.danger,
                color: colors.white,
                border: 'none',
                padding: '15px 30px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              Stop Cleaning
            </button>
          </>
        ) : (
          <>
            <p style={{ color: colors.goldMuted, fontSize: '16px', marginBottom: '20px' }}>
              Last cleaned: <span style={{ color: colors.gold }}>{formatTime(lastCleanTime)}</span>
            </p>
            <button
              onClick={handleStartCleaning}
              style={{
                background: colors.accent,
                color: colors.gold,
                border: 'none',
                padding: '15px 30px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              Start Cleaning Cycle
            </button>
          </>
        )}
      </div>

      {/* Info Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px',
        marginBottom: '30px',
      }}>
        <InfoCard title="Duration" value="5-10 min" icon="⏱️" />
        <InfoCard title="Water Used" value="~2 gal" icon="💧" />
        <InfoCard title="Power Draw" value="~500W" icon="⚡" />
        <InfoCard title="Coverage" value="100% floor" icon="📐" />
      </div>

      {/* How It Works */}
      <div style={{
        background: colors.surface,
        padding: '20px',
        borderRadius: '8px',
        border: `1px solid ${colors.goldMuted}`,
      }}>
        <h3 style={{ color: colors.gold, marginTop: 0 }}>How It Works</h3>
        <ol style={{ color: colors.goldMuted, lineHeight: '1.8' }}>
          <li>Scraper arm extends and retracts across floor to loosen waste</li>
          <li>Waste pushed toward collection area at rear of coop</li>
          <li>Optional water spray rinses floor during final pass</li>
          <li>Waste collected in external bin (manual or conveyor)</li>
        </ol>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <ConfirmModal
          title="Start Cleaning Cycle"
          message="This will activate the scraper arm and water system. Chickens should be outside or away from the cleaning area. Continue?"
          onConfirm={confirmCleaning}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

interface InfoCardProps {
  title: string;
  value: string;
  icon: string;
}

function InfoCard({ title, value, icon }: InfoCardProps) {
  return (
    <div
      style={{
        background: colors.bg,
        padding: '20px',
        borderRadius: '8px',
        border: `1px solid ${colors.accent}`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>{icon}</div>
      <p style={{ color: colors.goldMuted, margin: '0 0 10px 0', fontSize: '14px' }}>
        {title}
      </p>
      <p style={{ color: colors.gold, margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
        {value}
      </p>
    </div>
  );
}
