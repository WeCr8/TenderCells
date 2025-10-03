/**
 * Type definitions for flock management
 */

export interface FlockMember {
  id: string;
  name: string;
  breed: string;
  age: number;
  status: 'healthy' | 'sick' | 'missing' | 'quarantine';
  rfidTag: string;
  lastSeen: string;
  location: string;
  healthScore: number;
  eggProduction: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  vaccinations: Vaccination[];
  notes: string;
}

export interface Vaccination {
  id: string;
  name: string;
  date: string;
  nextDue?: string;
  veterinarian: string;
}

export interface FlockStats {
  totalBirds: number;
  healthyBirds: number;
  sickBirds: number;
  missingBirds: number;
  averageAge: number;
  totalEggsToday: number;
  averageHealthScore: number;
  lastUpdated: string;
}

export interface FlockGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  location: string;
  createdAt: string;
  status: 'active' | 'inactive';
  healthScore: number;
}