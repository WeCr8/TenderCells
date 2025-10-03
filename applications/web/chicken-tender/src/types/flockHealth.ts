/**
 * Type definitions for flock health management
 */

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
export type VaccinationType = 'preventive' | 'treatment' | 'booster' | 'emergency';
export type TreatmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type HealthEventType = 'vaccination' | 'treatment' | 'checkup' | 'illness' | 'injury' | 'quarantine';

export interface HealthRecord {
  id: string;
  chickenId: string;
  chickenName: string;
  recordType: HealthEventType;
  date: string;
  veterinarian?: string;
  description: string;
  symptoms?: string[];
  diagnosis?: string;
  treatment?: Treatment;
  followUpRequired: boolean;
  followUpDate?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'ongoing';
  attachments?: HealthAttachment[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  id: string;
  name: string;
  type: 'medication' | 'procedure' | 'therapy' | 'surgery';
  dosage?: string;
  frequency?: string;
  duration?: string;
  startDate: string;
  endDate?: string;
  status: TreatmentStatus;
  administeredBy: string;
  cost?: number;
  effectiveness?: 'excellent' | 'good' | 'fair' | 'poor';
  sideEffects?: string[];
}

export interface Vaccination {
  id: string;
  name: string;
  type: VaccinationType;
  manufacturer: string;
  batchNumber: string;
  administrationDate: string;
  nextDueDate?: string;
  veterinarian: string;
  location: string;
  reactions?: string[];
  effectiveness?: HealthStatus;
  cost?: number;
}

export interface HealthAttachment {
  id: string;
  type: 'image' | 'document' | 'video' | 'audio';
  filename: string;
  url: string;
  description?: string;
  uploadedAt: string;
}

export interface HealthMetrics {
  chickenId: string;
  date: string;
  weight: number;
  temperature: number;
  heartRate?: number;
  respiratoryRate?: number;
  bodyConditionScore: number; // 1-5 scale
  behaviorScore: number; // 1-10 scale
  appetiteLevel: 'none' | 'poor' | 'fair' | 'good' | 'excellent';
  activityLevel: 'lethargic' | 'low' | 'normal' | 'high' | 'hyperactive';
  featherCondition: 'poor' | 'fair' | 'good' | 'excellent';
  combColor: 'pale' | 'pink' | 'red' | 'dark_red' | 'purple';
  eyeCondition: 'clear' | 'cloudy' | 'discharge' | 'swollen';
  notes?: string;
}

export interface HealthAlert {
  id: string;
  chickenId: string;
  chickenName: string;
  type: 'vaccination_due' | 'treatment_reminder' | 'checkup_overdue' | 'health_decline' | 'quarantine_required';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionRequired: string;
  dueDate?: string;
  isRead: boolean;
  createdAt: string;
}

export interface HealthStats {
  totalRecords: number;
  activeIssues: number;
  resolvedIssues: number;
  vaccinationsThisMonth: number;
  treatmentsInProgress: number;
  averageHealthScore: number;
  healthTrend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}

export interface HealthFilter {
  chickenIds?: string[];
  recordTypes?: HealthEventType[];
  dateRange?: {
    start: string;
    end: string;
  };
  severity?: string[];
  status?: string[];
  veterinarian?: string;
  search?: string;
}

export interface HealthSortOptions {
  field: 'date' | 'chickenName' | 'severity' | 'status' | 'recordType';
  direction: 'asc' | 'desc';
}