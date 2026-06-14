import { useState, useEffect } from 'react';

interface TelemetryData {
  temperature?: number;
  humidity?: number;
  ammonia?: number;
  feedLevel?: number;
  waterLevel?: number;
  chickenCount?: number;
  doorState?: string;
  systemState?: string;
  [key: string]: any;
}

const API_BASE = import.meta.env.VITE_MQTT_API_BASE_URL as string | undefined;

function buildSimTelemetry(deviceId: string): TelemetryData {
  const seed = [...deviceId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const minute = Math.floor(Date.now() / 60000);
  const wave = Math.sin((minute + seed) / 7);

  return {
    temperature: Math.round((72 + wave * 5) * 10) / 10,
    humidity: Math.round(54 + wave * 8),
    ammonia: Math.max(2, Math.round(7 + wave * 4)),
    feedLevel: Math.max(18, Math.round(68 - ((minute + seed) % 18))),
    waterLevel: Math.max(22, Math.round(74 - ((minute + seed) % 14))),
    chickenCount: 8,
    doorState: 'closed',
    systemState: 'simulated',
  };
}

export const useTelemetry = (deviceId: string, pollIntervalMs = 5000) => {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      if (!API_BASE) {
        setData(buildSimTelemetry(deviceId));
        setError(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/devices/${deviceId}/telemetry`);
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        const result = await response.json();
        setData(result.data || null);
        setError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, pollIntervalMs);
    return () => clearInterval(interval);
  }, [deviceId, pollIntervalMs]);

  return { data, loading, error };
};
