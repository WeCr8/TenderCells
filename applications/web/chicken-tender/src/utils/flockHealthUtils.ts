import type { 
  HealthRecord, 
  HealthMetrics, 
  HealthStatus, 
  HealthEventType,
  Treatment,
  Vaccination
} from '../types/flockHealth';

/**
 * Utility functions for flock health management
 */
export class FlockHealthUtils {
  /**
   * Calculate overall health score from metrics
   */
  static calculateHealthScore(metrics: HealthMetrics): number {
    const weights = {
      bodyConditionScore: 0.25,
      behaviorScore: 0.2,
      appetiteLevel: 0.15,
      activityLevel: 0.15,
      featherCondition: 0.1,
      combColor: 0.1,
      eyeCondition: 0.05
    };

    const scores = {
      bodyConditionScore: (metrics.bodyConditionScore / 5) * 100,
      behaviorScore: (metrics.behaviorScore / 10) * 100,
      appetiteLevel: this.getAppetiteScore(metrics.appetiteLevel),
      activityLevel: this.getActivityScore(metrics.activityLevel),
      featherCondition: this.getFeatherScore(metrics.featherCondition),
      combColor: this.getCombScore(metrics.combColor),
      eyeCondition: this.getEyeScore(metrics.eyeCondition)
    };

    const weightedScore = Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key as keyof typeof scores] * weight);
    }, 0);

    return Math.round(weightedScore);
  }

  /**
   * Get health status from score
   */
  static getHealthStatus(score: number): HealthStatus {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  /**
   * Calculate health trend from historical data
   */
  static calculateHealthTrend(metrics: HealthMetrics[]): 'improving' | 'stable' | 'declining' {
    if (metrics.length < 2) return 'stable';

    const sortedMetrics = metrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recentMetrics = sortedMetrics.slice(-5); // Last 5 records
    
    const scores = recentMetrics.map(m => this.calculateHealthScore(m));
    const trend = this.calculateTrendFromScores(scores);

    if (trend > 2) return 'improving';
    if (trend < -2) return 'declining';
    return 'stable';
  }

  /**
   * Generate health recommendations based on metrics
   */
  static generateHealthRecommendations(metrics: HealthMetrics, records: HealthRecord[]): string[] {
    const recommendations: string[] = [];
    const healthScore = this.calculateHealthScore(metrics);

    // Weight-based recommendations
    if (metrics.bodyConditionScore < 2) {
      recommendations.push('Increase feed quality and quantity - bird appears underweight');
    } else if (metrics.bodyConditionScore > 4) {
      recommendations.push('Monitor feed intake - bird may be overweight');
    }

    // Behavior-based recommendations
    if (metrics.behaviorScore < 5) {
      recommendations.push('Monitor for signs of illness or stress - behavior appears abnormal');
    }

    // Appetite recommendations
    if (metrics.appetiteLevel === 'none' || metrics.appetiteLevel === 'poor') {
      recommendations.push('Immediate veterinary attention required - poor appetite may indicate illness');
    }

    // Activity recommendations
    if (metrics.activityLevel === 'lethargic') {
      recommendations.push('Check for signs of illness - lethargy may indicate health issues');
    }

    // Physical condition recommendations
    if (metrics.featherCondition === 'poor') {
      recommendations.push('Improve nutrition and check for parasites - poor feather condition');
    }

    if (metrics.combColor === 'pale' || metrics.combColor === 'purple') {
      recommendations.push('Urgent veterinary attention - abnormal comb color may indicate serious illness');
    }

    if (metrics.eyeCondition !== 'clear') {
      recommendations.push('Monitor eye condition - may require treatment if worsening');
    }

    // Overall health recommendations
    if (healthScore < 60) {
      recommendations.push('Schedule veterinary checkup - overall health score is concerning');
    }

    // Vaccination recommendations
    const lastVaccination = this.getLastVaccination(records);
    if (!lastVaccination || this.isVaccinationOverdue(lastVaccination)) {
      recommendations.push('Update vaccinations - ensure protection against common diseases');
    }

    return recommendations;
  }

  /**
   * Check if vaccination is due
   */
  static isVaccinationDue(vaccination: Vaccination): boolean {
    if (!vaccination.nextDueDate) return false;
    const dueDate = new Date(vaccination.nextDueDate);
    const today = new Date();
    return dueDate <= today;
  }

  /**
   * Check if treatment is overdue
   */
  static isTreatmentOverdue(treatment: Treatment): boolean {
    if (treatment.status === 'completed' || treatment.status === 'cancelled') return false;
    if (!treatment.endDate) return false;
    
    const endDate = new Date(treatment.endDate);
    const today = new Date();
    return today > endDate;
  }

  /**
   * Format health record for display
   */
  static formatHealthRecord(record: HealthRecord): {
    title: string;
    description: string;
    severity: string;
    icon: string;
    color: string;
  } {
    const typeConfig = {
      vaccination: { icon: '💉', color: 'text-blue-600' },
      treatment: { icon: '💊', color: 'text-green-600' },
      checkup: { icon: '🩺', color: 'text-purple-600' },
      illness: { icon: '🤒', color: 'text-red-600' },
      injury: { icon: '🩹', color: 'text-orange-600' },
      quarantine: { icon: '🏥', color: 'text-amber-600' }
    };

    const config = typeConfig[record.recordType] || { icon: '📋', color: 'text-gray-600' };

    return {
      title: record.recordType.charAt(0).toUpperCase() + record.recordType.slice(1),
      description: record.description,
      severity: record.severity,
      icon: config.icon,
      color: config.color
    };
  }

  /**
   * Calculate days since last checkup
   */
  static daysSinceLastCheckup(records: HealthRecord[]): number {
    const checkups = records.filter(r => r.recordType === 'checkup');
    if (checkups.length === 0) return Infinity;

    const lastCheckup = checkups.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    const today = new Date();
    const checkupDate = new Date(lastCheckup.date);
    const diffTime = today.getTime() - checkupDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get upcoming health events
   */
  static getUpcomingHealthEvents(records: HealthRecord[]): {
    vaccinations: Vaccination[];
    treatments: Treatment[];
    checkups: HealthRecord[];
  } {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingVaccinations: Vaccination[] = [];
    const upcomingTreatments: Treatment[] = [];
    const upcomingCheckups: HealthRecord[] = [];

    records.forEach(record => {
      if (record.followUpRequired && record.followUpDate) {
        const followUpDate = new Date(record.followUpDate);
        if (followUpDate >= today && followUpDate <= nextWeek) {
          upcomingCheckups.push(record);
        }
      }

      if (record.treatment) {
        const treatment = record.treatment;
        if (treatment.status === 'scheduled' || treatment.status === 'in_progress') {
          const endDate = new Date(treatment.endDate || treatment.startDate);
          if (endDate >= today && endDate <= nextWeek) {
            upcomingTreatments.push(treatment);
          }
        }
      }
    });

    return {
      vaccinations: upcomingVaccinations,
      treatments: upcomingTreatments,
      checkups: upcomingCheckups
    };
  }

  // Private helper methods
  private static getAppetiteScore(appetite: string): number {
    const scores = { none: 0, poor: 25, fair: 50, good: 75, excellent: 100 };
    return scores[appetite as keyof typeof scores] || 50;
  }

  private static getActivityScore(activity: string): number {
    const scores = { lethargic: 0, low: 25, normal: 100, high: 75, hyperactive: 50 };
    return scores[activity as keyof typeof scores] || 50;
  }

  private static getFeatherScore(condition: string): number {
    const scores = { poor: 0, fair: 33, good: 66, excellent: 100 };
    return scores[condition as keyof typeof scores] || 50;
  }

  private static getCombScore(color: string): number {
    const scores = { pale: 20, pink: 60, red: 100, dark_red: 80, purple: 0 };
    return scores[color as keyof typeof scores] || 50;
  }

  private static getEyeScore(condition: string): number {
    const scores = { clear: 100, cloudy: 50, discharge: 25, swollen: 0 };
    return scores[condition as keyof typeof scores] || 50;
  }

  private static calculateTrendFromScores(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }

  private static getLastVaccination(records: HealthRecord[]): Vaccination | null {
    const vaccinations = records
      .filter(r => r.recordType === 'vaccination')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return vaccinations.length > 0 ? vaccinations[0] as any : null;
  }

  private static isVaccinationOverdue(vaccination: any): boolean {
    if (!vaccination.nextDueDate) return false;
    const dueDate = new Date(vaccination.nextDueDate);
    const today = new Date();
    return today > dueDate;
  }
}