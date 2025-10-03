import { useState, useEffect } from 'react';
import { ChickenService } from '../services/chickenService';
import type { Chicken, ChickenSummary } from '../types/chicken';

/**
 * Custom hook for managing chicken data
 */
export function useChickens() {
  const [chickens, setChickens] = useState<Chicken[]>([]);
  const [summary, setSummary] = useState<ChickenSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChickens = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ChickenService.getAllChickens();
      
      // Ensure data is an array before setting state
      const chickenArray = Array.isArray(data) ? data : [];
      setChickens(chickenArray);
      
      // Calculate summary
      const summaryData: ChickenSummary = {
        totalChickens: chickenArray.length,
        activeChickens: chickenArray.filter(c => c.status === 'active').length,
        restingChickens: chickenArray.filter(c => c.status === 'resting').length,
        missingChickens: chickenArray.filter(c => c.status === 'missing').length,
        sickChickens: chickenArray.filter(c => c.status === 'sick').length,
        averageHealth: chickenArray.length > 0 ? chickenArray.reduce((sum, c) => sum + c.health.score, 0) / chickenArray.length : 0,
        totalEggsToday: chickenArray.reduce((sum, c) => sum + c.production.eggsToday, 0)
      };
      
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chickens');
      // Set empty array on error to prevent map errors
      setChickens([]);
    } finally {
      setLoading(false);
    }
  };

  const updateChicken = async (id: string, updates: Partial<Chicken>) => {
    try {
      // Optimistic update
      setChickens(prev => 
        prev.map(chicken => 
          chicken.id === id ? { ...chicken, ...updates } : chicken
        )
      );
      
      // API call would go here
      // await ChickenService.updateChicken(id, updates);
    } catch (err) {
      // Revert on error
      await fetchChickens();
      throw err;
    }
  };

  const addChicken = async (chickenData: Omit<Chicken, 'id'>) => {
    try {
      const newChicken = await ChickenService.addChicken(chickenData);
      setChickens(prev => [...prev, newChicken]);
      return newChicken;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add chicken');
      throw err;
    }
  };

  const removeChicken = async (id: string) => {
    try {
      await ChickenService.removeChicken(id);
      setChickens(prev => prev.filter(chicken => chicken.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove chicken');
      throw err;
    }
  };

  useEffect(() => {
    fetchChickens();
  }, []);

  return {
    chickens,
    summary,
    loading,
    error,
    refetch: fetchChickens,
    updateChicken,
    addChicken,
    removeChicken
  };
}