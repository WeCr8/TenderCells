import type { 
  ProductionRecord, 
  EggProduction, 
  ProductionMetrics,
  ProductionGoal,
  EggGrade,
  EggSize,
  ProductionForecast
} from '../types/flockProduction';

/**
 * Utility functions for flock production management
 */
export class FlockProductionUtils {
  /**
   * Calculate production rate for a given period
   */
  static calculateProductionRate(records: ProductionRecord[], days: number): number {
    if (records.length === 0 || days === 0) return 0;
    
    const totalEggs = records.reduce((sum, record) => sum + record.quantity, 0);
    return (totalEggs / days) * 100; // Percentage of expected daily production
  }

  /**
   * Calculate production efficiency (eggs per feed consumed)
   */
  static calculateProductionEfficiency(eggCount: number, feedConsumed: number): number {
    if (feedConsumed === 0) return 0;
    return eggCount / feedConsumed;
  }

  /**
   * Analyze production trend from historical data
   */
  static analyzeProductionTrend(records: ProductionRecord[]): 'increasing' | 'stable' | 'decreasing' {
    if (records.length < 7) return 'stable';

    const sortedRecords = records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dailyProduction = this.groupProductionByDay(sortedRecords);
    
    const days = Object.keys(dailyProduction).sort();
    if (days.length < 7) return 'stable';

    const recentDays = days.slice(-7);
    const productionValues = recentDays.map(day => dailyProduction[day]);
    
    const trend = this.calculateTrendFromValues(productionValues);
    
    if (trend > 0.5) return 'increasing';
    if (trend < -0.5) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate quality distribution
   */
  static calculateQualityDistribution(records: ProductionRecord[]): Record<EggGrade, number> {
    const distribution: Record<EggGrade, number> = {
      AA: 0, A: 0, B: 0, C: 0, reject: 0
    };

    records.forEach(record => {
      if (record.quality) {
        distribution[record.quality] += record.quantity;
      }
    });

    return distribution;
  }

  /**
   * Calculate size distribution
   */
  static calculateSizeDistribution(records: ProductionRecord[]): Record<EggSize, number> {
    const distribution: Record<EggSize, number> = {
      peewee: 0, small: 0, medium: 0, large: 0, extra_large: 0, jumbo: 0
    };

    records.forEach(record => {
      if (record.size) {
        distribution[record.size] += record.quantity;
      }
    });

    return distribution;
  }

  /**
   * Calculate goal progress
   */
  static calculateGoalProgress(goal: ProductionGoal, records: ProductionRecord[]): {
    progress: number;
    remaining: number;
    daysLeft: number;
    onTrack: boolean;
  } {
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);
    const today = new Date();

    const relevantRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= today && record.type === goal.type;
    });

    const currentProduction = relevantRecords.reduce((sum, record) => sum + record.quantity, 0);
    const progress = (currentProduction / goal.targetQuantity) * 100;
    const remaining = Math.max(0, goal.targetQuantity - currentProduction);

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, totalDays - elapsedDays);

    const expectedProgress = (elapsedDays / totalDays) * 100;
    const onTrack = progress >= expectedProgress * 0.9; // 90% of expected progress

    return { progress, remaining, daysLeft, onTrack };
  }

  /**
   * Generate production forecast
   */
  static generateProductionForecast(
    historicalData: ProductionRecord[],
    days: number = 30
  ): ProductionForecast[] {
    const forecasts: ProductionForecast[] = [];
    const dailyProduction = this.groupProductionByDay(historicalData);
    const productionValues = Object.values(dailyProduction);
    
    if (productionValues.length === 0) return forecasts;

    const averageProduction = productionValues.reduce((sum, val) => sum + val, 0) / productionValues.length;
    const trend = this.calculateTrendFromValues(productionValues.slice(-7)); // Last 7 days trend

    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);

      const trendAdjustment = trend * i * 0.1; // Gradual trend application
      const seasonalFactor = this.getSeasonalFactor(forecastDate);
      const predictedEggs = Math.max(0, Math.round(
        (averageProduction + trendAdjustment) * seasonalFactor
      ));

      forecasts.push({
        chickenId: '', // Will be set by caller
        forecastDate: forecastDate.toISOString(),
        predictedEggs,
        confidence: this.calculateForecastConfidence(productionValues, i),
        factors: {
          age: 0.8, // Will be calculated based on chicken age
          health: 0.9, // Will be calculated based on health score
          season: seasonalFactor,
          nutrition: 0.85, // Will be calculated based on feed quality
          stress: 0.9 // Will be calculated based on environmental factors
        }
      });
    }

    return forecasts;
  }

  /**
   * Identify production anomalies
   */
  static identifyProductionAnomalies(records: ProductionRecord[]): {
    type: 'sudden_drop' | 'sudden_increase' | 'quality_decline' | 'size_anomaly';
    severity: 'low' | 'medium' | 'high';
    description: string;
    affectedRecords: ProductionRecord[];
  }[] {
    const anomalies: any[] = [];
    const dailyProduction = this.groupProductionByDay(records);
    const days = Object.keys(dailyProduction).sort();

    // Check for sudden production drops
    for (let i = 1; i < days.length; i++) {
      const previousDay = dailyProduction[days[i - 1]];
      const currentDay = dailyProduction[days[i]];
      
      if (previousDay > 0 && currentDay < previousDay * 0.5) {
        anomalies.push({
          type: 'sudden_drop',
          severity: currentDay === 0 ? 'high' : 'medium',
          description: `Production dropped from ${previousDay} to ${currentDay} eggs`,
          affectedRecords: records.filter(r => r.date === days[i])
        });
      }
    }

    // Check for quality decline
    const recentRecords = records.slice(-7); // Last 7 records
    const lowQualityCount = recentRecords.filter(r => r.quality === 'C' || r.quality === 'reject').length;
    
    if (lowQualityCount > recentRecords.length * 0.3) {
      anomalies.push({
        type: 'quality_decline',
        severity: lowQualityCount > recentRecords.length * 0.5 ? 'high' : 'medium',
        description: `${lowQualityCount} out of ${recentRecords.length} recent eggs are low quality`,
        affectedRecords: recentRecords.filter(r => r.quality === 'C' || r.quality === 'reject')
      });
    }

    return anomalies;
  }

  /**
   * Calculate peak production period
   */
  static calculatePeakProductionPeriod(records: ProductionRecord[]): {
    startDate: string;
    endDate: string;
    averageDaily: number;
    totalEggs: number;
  } | null {
    const dailyProduction = this.groupProductionByDay(records);
    const days = Object.keys(dailyProduction).sort();
    
    if (days.length < 7) return null;

    let bestPeriod = { start: 0, end: 6, average: 0 };
    
    // Find 7-day period with highest average
    for (let i = 0; i <= days.length - 7; i++) {
      const periodDays = days.slice(i, i + 7);
      const periodTotal = periodDays.reduce((sum, day) => sum + dailyProduction[day], 0);
      const periodAverage = periodTotal / 7;
      
      if (periodAverage > bestPeriod.average) {
        bestPeriod = { start: i, end: i + 6, average: periodAverage };
      }
    }

    const startDate = days[bestPeriod.start];
    const endDate = days[bestPeriod.end];
    const totalEggs = days.slice(bestPeriod.start, bestPeriod.end + 1)
      .reduce((sum, day) => sum + dailyProduction[day], 0);

    return {
      startDate,
      endDate,
      averageDaily: bestPeriod.average,
      totalEggs
    };
  }

  /**
   * Format production record for display
   */
  static formatProductionRecord(record: ProductionRecord): {
    title: string;
    subtitle: string;
    quality: string;
    qualityColor: string;
    icon: string;
  } {
    const qualityColors = {
      AA: 'text-emerald-600',
      A: 'text-green-600',
      B: 'text-yellow-600',
      C: 'text-orange-600',
      reject: 'text-red-600'
    };

    return {
      title: `${record.quantity} ${record.type}${record.quantity !== 1 ? 's' : ''}`,
      subtitle: `${record.chickenName} - ${new Date(record.date).toLocaleDateString()}`,
      quality: record.quality || 'Unknown',
      qualityColor: qualityColors[record.quality as EggGrade] || 'text-gray-600',
      icon: record.type === 'eggs' ? '🥚' : '🐔'
    };
  }

  // Private helper methods
  private static groupProductionByDay(records: ProductionRecord[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    records.forEach(record => {
      const date = record.date.split('T')[0]; // Get date part only
      grouped[date] = (grouped[date] || 0) + record.quantity;
    });
    
    return grouped;
  }

  private static calculateTrendFromValues(values: number[]): number {
    if (values.length < 2) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }

  private static getSeasonalFactor(date: Date): number {
    const month = date.getMonth();
    // Chickens typically lay more in spring/summer, less in winter
    const seasonalFactors = [
      0.8, 0.85, 0.9, 1.0, 1.1, 1.15, // Jan-Jun
      1.2, 1.15, 1.1, 1.0, 0.9, 0.85  // Jul-Dec
    ];
    return seasonalFactors[month];
  }

  private static calculateForecastConfidence(historicalValues: number[], daysAhead: number): number {
    const baseConfidence = 0.9;
    const dataQuality = Math.min(1, historicalValues.length / 30); // More data = higher confidence
    const timeDecay = Math.max(0.3, 1 - (daysAhead * 0.02)); // Confidence decreases over time
    
    return Math.round((baseConfidence * dataQuality * timeDecay) * 100) / 100;
  }
}