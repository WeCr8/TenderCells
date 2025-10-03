/**
 * Type definitions for flock production management
 */

export type ProductionType = 'eggs' | 'meat' | 'breeding' | 'feathers';
export type EggGrade = 'AA' | 'A' | 'B' | 'C' | 'reject';
export type EggSize = 'peewee' | 'small' | 'medium' | 'large' | 'extra_large' | 'jumbo';

export interface ProductionRecord {
  id: string;
  chickenId: string;
  chickenName: string;
  date: string;
  type: ProductionType;
  quantity: number;
  quality: EggGrade;
  size?: EggSize;
  weight?: number;
  notes?: string;
  collectedBy: string;
  location: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  nestBox?: string;
  createdAt: string;
}

export interface EggProduction {
  id: string;
  chickenId: string;
  date: string;
  eggsLaid: number;
  totalWeight: number;
  averageWeight: number;
  grades: {
    AA: number;
    A: number;
    B: number;
    C: number;
    reject: number;
  };
  sizes: {
    peewee: number;
    small: number;
    medium: number;
    large: number;
    extra_large: number;
    jumbo: number;
  };
  abnormalities?: string[];
  nestBoxUsed?: string;
  layingTime?: string;
}

export interface ProductionMetrics {
  chickenId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  totalEggs: number;
  averageDaily: number;
  peakProduction: number;
  productionRate: number; // percentage
  qualityDistribution: Record<EggGrade, number>;
  sizeDistribution: Record<EggSize, number>;
  trend: 'increasing' | 'stable' | 'decreasing';
  efficiency: number; // eggs per feed consumed
}

export interface ProductionGoal {
  id: string;
  chickenId?: string;
  groupId?: string;
  type: ProductionType;
  targetQuantity: number;
  targetQuality: EggGrade;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  currentProgress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  createdBy: string;
  createdAt: string;
}

export interface ProductionAlert {
  id: string;
  chickenId: string;
  chickenName: string;
  type: 'production_drop' | 'quality_decline' | 'goal_behind' | 'peak_production' | 'no_production';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  suggestions: string[];
  isRead: boolean;
  createdAt: string;
}

export interface ProductionStats {
  totalEggsToday: number;
  totalEggsThisWeek: number;
  totalEggsThisMonth: number;
  averageDailyProduction: number;
  productionRate: number;
  qualityDistribution: Record<EggGrade, number>;
  topProducers: {
    chickenId: string;
    chickenName: string;
    eggsThisWeek: number;
  }[];
  productionTrend: 'increasing' | 'stable' | 'decreasing';
  lastUpdated: string;
}

export interface ProductionFilter {
  chickenIds?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  productionType?: ProductionType[];
  quality?: EggGrade[];
  size?: EggSize[];
  location?: string[];
  search?: string;
}

export interface ProductionSortOptions {
  field: 'date' | 'chickenName' | 'quantity' | 'quality' | 'weight';
  direction: 'asc' | 'desc';
}

export interface ProductionForecast {
  chickenId: string;
  forecastDate: string;
  predictedEggs: number;
  confidence: number;
  factors: {
    age: number;
    health: number;
    season: number;
    nutrition: number;
    stress: number;
  };
}