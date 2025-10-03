import { useState, useEffect } from 'react';
import { EnvironmentService } from '../services/environmentService';
import type { EnvironmentData, EnvironmentControls } from '../types/environment';

/**
 * Custom hook for managing environment data and controls
 */
export function useEnvironment() {
  const [environmentData, setEnvironmentData] = useState<EnvironmentData | null>(null);
  const [controls, setControls] = useState<EnvironmentControls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvironmentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [envData, controlsData] = await Promise.all([
        EnvironmentService.getEnvironmentData(),
        EnvironmentService.getControls()
      ]);
      
      setEnvironmentData(envData);
      setControls(controlsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch environment data');
    } finally {
      setLoading(false);
    }
  };

  const updateLighting = async (enabled: boolean) => {
    try {
      await EnvironmentService.updateLighting(enabled);
      setControls(prev => prev ? {
        ...prev,
        lighting: { ...prev.lighting, enabled }
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lighting');
      throw err;
    }
  };

  const updateVentilation = async (enabled: boolean) => {
    try {
      await EnvironmentService.updateVentilation(enabled);
      setControls(prev => prev ? {
        ...prev,
        ventilation: { ...prev.ventilation, enabled }
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ventilation');
      throw err;
    }
  };

  const updateDoor = async (open: boolean) => {
    try {
      await EnvironmentService.updateDoor(open);
      setControls(prev => prev ? {
        ...prev,
        coopDoor: { ...prev.coopDoor, isOpen: open }
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update door');
      throw err;
    }
  };

  const emergencyOverride = async () => {
    try {
      await EnvironmentService.emergencyOverride();
      await fetchEnvironmentData(); // Refresh all data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute emergency override');
      throw err;
    }
  };

  useEffect(() => {
    fetchEnvironmentData();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchEnvironmentData, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return {
    environmentData,
    controls,
    loading,
    error,
    refetch: fetchEnvironmentData,
    updateLighting,
    updateVentilation,
    updateDoor,
    emergencyOverride
  };
}