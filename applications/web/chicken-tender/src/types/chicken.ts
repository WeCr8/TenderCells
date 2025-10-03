/**
 * Type definitions for chicken-related data
 */

export type ChickenStatus = 'active' | 'resting' | 'missing' | 'sick';

export interface Chicken {
  id: string;
  name: string;
  rfidTag: string;
  breed: string;
  age: number; // in months
  status: ChickenStatus;
  health: {
    score: number; // 0-100
    lastCheckup: string;
    vaccinations: Vaccination[];
    notes: string;
  };
  production: {
    eggsToday: number;
    eggsThisWeek: number;
    eggsThisMonth: number;
    averageEggsPerWeek: number;
  };
  location: {
    zone: string;
    lastSeen: string;
    coordinates?: {
      x: number;
      y: number;
    };
  };
  behavior: {
    activityLevel: 'low' | 'normal' | 'high';
    feedingPattern: 'normal' | 'decreased' | 'increased';
    socialBehavior: 'normal' | 'aggressive' | 'withdrawn';
  };
  createdAt: string;
  updatedAt: string;
}

export interface Vaccination {
  id: string;
  name: string;
  date: string;
  nextDue?: string;
  veterinarian: string;
}

export interface ChickenSummary {
  totalChickens: number;
  activeChickens: number;
  restingChickens: number;
  missingChickens: number;
  sickChickens: number;
  averageHealth: number;
  totalEggsToday: number;
}