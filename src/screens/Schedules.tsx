// Schedules screen — manage automated tasks
// Last updated: 2026-06-11

import { useState } from 'react';
import { Schedule } from '../types';

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

interface SchedulesProps {
  deviceId: string;
  onBack: () => void;
}

const SAMPLE_SCHEDULES: Schedule[] = [
  {
    id: 'sched_001',
    deviceId: 'chicken_tender_001',
    action: 'feed',
    cronExpression: '0 7 * * *',
    enabled: true,
    nextRun: Date.now() + 3600000,
  },
  {
    id: 'sched_002',
    deviceId: 'chicken_tender_001',
    action: 'feed',
    cronExpression: '0 18 * * *',
    enabled: true,
    nextRun: Date.now() + 43200000,
  },
  {
    id: 'sched_003',
    deviceId: 'chicken_tender_001',
    action: 'door',
    cronExpression: '0 6 * * *',
    enabled: true,
    nextRun: Date.now() + 1800000,
  },
  {
    id: 'sched_004',
    deviceId: 'chicken_tender_001',
    action: 'clean',
    cronExpression: '0 0 * * 0',
    enabled: false,
    nextRun: Date.now() + 604800000,
  },
];

export function Schedules({ deviceId, onBack }: SchedulesProps) {
  const [schedules, setSchedules] = useState<Schedule[]>(SAMPLE_SCHEDULES);
  const [newAction, setNewAction] = useState<Schedule['action']>('feed');
  const [newCron, setNewCron] = useState('0 7 * * *');

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getActionLabel = (action: Schedule['action']) => {
    const labels: Record<Schedule['action'], string> = {
      feed: '🌾 Feed',
      clean: '🧹 Clean',
      door: '🚪 Door',
      water: '💧 Water',
    };
    return labels[action];
  };

  const handleToggleSchedule = (id: string) => {
    setSchedules(
      schedules.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  const handleAddSchedule = () => {
    const newSchedule: Schedule = {
      id: `sched_${Date.now()}`,
      deviceId,
      action: newAction,
      cronExpression: newCron,
      enabled: true,
      nextRun: Date.now() + 3600000,
    };
    setSchedules([...schedules, newSchedule]);
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

      <h1 style={{ color: colors.gold, marginBottom: '30px' }}>Schedules</h1>

      {/* New Schedule Form */}
      <div
        style={{
          background: colors.surface,
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: `1px solid ${colors.accent}`,
        }}
      >
        <h3 style={{ color: colors.gold, marginTop: 0 }}>Add Schedule</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ color: colors.goldMuted, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              Action
            </label>
            <select
              value={newAction}
              onChange={(e) => setNewAction(e.target.value as Schedule['action'])}
              style={{
                width: '100%',
                padding: '8px',
                background: colors.bg,
                color: colors.white,
                border: `1px solid ${colors.accent}`,
                borderRadius: '4px',
              }}
            >
              <option value="feed">Feed</option>
              <option value="clean">Clean</option>
              <option value="door">Door</option>
              <option value="water">Water</option>
            </select>
          </div>

          <div>
            <label style={{ color: colors.goldMuted, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              Cron Expression
            </label>
            <input
              type="text"
              value={newCron}
              onChange={(e) => setNewCron(e.target.value)}
              placeholder="0 7 * * *"
              style={{
                width: '100%',
                padding: '8px',
                background: colors.bg,
                color: colors.white,
                border: `1px solid ${colors.accent}`,
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={handleAddSchedule}
              style={{
                width: '100%',
                background: colors.accent,
                color: colors.gold,
                border: 'none',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Add
            </button>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: colors.goldMuted, margin: 0 }}>
          Cron format: minute hour day month weekday (0=Sunday)
        </p>
      </div>

      {/* Schedules List */}
      <div>
        <h3 style={{ color: colors.gold }}>Active Schedules ({schedules.filter((s) => s.enabled).length})</h3>

        {schedules.length === 0 ? (
          <p style={{ color: colors.goldMuted }}>No schedules configured yet.</p>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              style={{
                background: colors.surface,
                padding: '15px',
                marginBottom: '15px',
                borderRadius: '8px',
                border: `2px solid ${schedule.enabled ? colors.accent : colors.goldMuted}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ color: colors.gold, margin: '0 0 5px 0', fontWeight: 'bold' }}>
                  {getActionLabel(schedule.action)}
                </p>
                <p style={{ color: colors.goldMuted, margin: '0 0 5px 0', fontSize: '14px' }}>
                  Cron: <code style={{ color: colors.gold }}>{schedule.cronExpression}</code>
                </p>
                {schedule.nextRun && (
                  <p style={{ color: colors.goldMuted, margin: 0, fontSize: '12px' }}>
                    Next run: {formatTime(schedule.nextRun)}
                  </p>
                )}
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={schedule.enabled}
                  onChange={() => handleToggleSchedule(schedule.id)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ color: colors.goldMuted, fontSize: '14px' }}>
                  {schedule.enabled ? 'On' : 'Off'}
                </span>
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
