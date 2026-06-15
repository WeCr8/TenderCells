// EggMap screen — egg location and collection tracking
// Last updated: 2026-06-11

import { useState } from 'react';

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

interface NestBox {
  id: string;
  position: { row: number; col: number };
  hasEgg: boolean;
  eggAge: number; // minutes
  lastCollected: number; // timestamp
}

interface EggMapProps {
  deviceId: string;
  onBack: () => void;
}

const SAMPLE_NEST_BOXES: NestBox[] = [
  { id: 'box_1', position: { row: 1, col: 1 }, hasEgg: true, eggAge: 120, lastCollected: Date.now() - 24 * 60 * 60 * 1000 },
  { id: 'box_2', position: { row: 1, col: 2 }, hasEgg: true, eggAge: 45, lastCollected: Date.now() - 20 * 60 * 60 * 1000 },
  { id: 'box_3', position: { row: 1, col: 3 }, hasEgg: false, eggAge: 0, lastCollected: Date.now() - 6 * 60 * 60 * 1000 },
  { id: 'box_4', position: { row: 2, col: 1 }, hasEgg: true, eggAge: 360, lastCollected: Date.now() - 72 * 60 * 60 * 1000 },
  { id: 'box_5', position: { row: 2, col: 2 }, hasEgg: false, eggAge: 0, lastCollected: Date.now() - 12 * 60 * 60 * 1000 },
  { id: 'box_6', position: { row: 2, col: 3 }, hasEgg: true, eggAge: 90, lastCollected: Date.now() - 24 * 60 * 60 * 1000 },
];

export function EggMap({ onBack }: EggMapProps) {
  const [nestBoxes, setNestBoxes] = useState<NestBox[]>(SAMPLE_NEST_BOXES);
  const totalEggs = nestBoxes.filter((b) => b.hasEgg).length;
  const staleEggs = nestBoxes.filter((b) => b.hasEgg && b.eggAge > 240).length;

  const handleCollectEgg = (boxId: string) => {
    setNestBoxes(
      nestBoxes.map((box) =>
        box.id === boxId
          ? { ...box, hasEgg: false, eggAge: 0, lastCollected: Date.now() }
          : box
      )
    );
  };

  const formatTime = (timestamp: number) => {
    const hours = Math.floor((Date.now() - timestamp) / (60 * 60 * 1000));
    if (hours < 1) return '< 1 hour';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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

      <h1 style={{ color: colors.gold, marginBottom: '10px' }}>🥚 Egg Map</h1>
      <p style={{ color: colors.goldMuted, marginBottom: '20px' }}>
        {totalEggs} egg{totalEggs !== 1 ? 's' : ''} found • {staleEggs} potentially stale
      </p>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '30px',
      }}>
        <StatCard label="Fresh Eggs" value={totalEggs - staleEggs} color={colors.accent} />
        <StatCard label="Stale Eggs (4h+)" value={staleEggs} color={colors.warning} />
        <StatCard label="Empty Boxes" value={nestBoxes.filter((b) => !b.hasEgg).length} color={colors.goldMuted} />
      </div>

      {/* Nest Box Grid */}
      <div style={{
        background: colors.surface,
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
      }}>
        <h3 style={{ color: colors.gold, marginTop: 0 }}>Nest Boxes</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '15px',
        }}>
          {nestBoxes.map((box) => (
            <div
              key={box.id}
              style={{
                background: colors.bg,
                border: `2px solid ${box.hasEgg ? colors.warning : colors.accent}`,
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <p style={{ color: colors.goldMuted, margin: '0 0 10px 0', fontSize: '14px' }}>
                Box {box.position.row}-{box.position.col}
              </p>

              {box.hasEgg ? (
                <>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>🥚</div>
                  <p style={{ color: colors.gold, margin: '0 0 5px 0', fontWeight: 'bold' }}>
                    {box.eggAge}m old
                  </p>
                  <p style={{ color: colors.goldMuted, fontSize: '12px', margin: '0 0 10px 0' }}>
                    {box.eggAge > 240 ? '⚠️ Stale' : '✓ Fresh'}
                  </p>
                  <button
                    onClick={() => handleCollectEgg(box.id)}
                    style={{
                      width: '100%',
                      background: colors.accent,
                      color: colors.gold,
                      border: 'none',
                      padding: '8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '12px',
                    }}
                  >
                    Collect
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.5 }}>🪹</div>
                  <p style={{ color: colors.goldMuted, margin: '0 0 5px 0' }}>Empty</p>
                  <p style={{ color: colors.goldMuted, fontSize: '12px', margin: 0 }}>
                    Last: {formatTime(box.lastCollected)}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Collection History */}
      <div style={{
        background: colors.surface,
        padding: '20px',
        borderRadius: '8px',
      }}>
        <h3 style={{ color: colors.gold, marginTop: 0 }}>Collection Guidelines</h3>
        <ul style={{ color: colors.goldMuted, lineHeight: '1.8' }}>
          <li>Collect eggs daily to prevent brooding behavior</li>
          <li>Fresh eggs stay good for 7-10 days at room temperature</li>
          <li>Refrigerate for longer shelf life (3-4 weeks)</li>
          <li>Clean off dirt gently with a dry cloth (washing removes protective coating)</li>
        </ul>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div
      style={{
        background: colors.bg,
        border: `2px solid ${color}`,
        padding: '15px',
        borderRadius: '8px',
        textAlign: 'center',
      }}
    >
      <p style={{ color: colors.goldMuted, margin: '0 0 10px 0', fontSize: '14px' }}>
        {label}
      </p>
      <p style={{ color, margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
        {value}
      </p>
    </div>
  );
}
