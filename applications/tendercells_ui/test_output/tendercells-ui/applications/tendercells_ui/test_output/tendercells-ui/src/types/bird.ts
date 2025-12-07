// bird.ts

export interface Bird {
  id: string;
  name: string;
  breed?: string;
  sex?: "hen" | "rooster" | "unknown";
  hatchDate?: string; // ISO date
  status: "active" | "watch" | "quarantine" | "rehoming" | "deceased";
  rfidTag?: string;
  photoUrl?: string;
  notes?: string;
  createdAt: string; // ISO datetime
}
