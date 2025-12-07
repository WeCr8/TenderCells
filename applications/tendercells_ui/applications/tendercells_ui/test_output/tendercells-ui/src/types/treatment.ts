// treatment.ts

export interface BirdTreatment {
  id: string;
  birdId: string;
  timestamp: string; // ISO datetime
  medication?: string;
  dose?: string;
  route?: string;
  notes?: string;
}
