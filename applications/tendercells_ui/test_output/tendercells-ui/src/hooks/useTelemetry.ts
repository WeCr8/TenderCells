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

const API_BASE = 'http://localhost:4000/api/mqtt';

export const useTelemetry = (deviceId: string, pollIntervalMs = 5000) => {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
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
