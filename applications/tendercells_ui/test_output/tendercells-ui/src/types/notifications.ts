// notifications.ts

export type NotificationLevel = "info" | "warning" | "critical";

export interface CoopNotification {
  id: string;
  coopId: string;
  type: string; // e.g. 'bird-risk', 'hardware', 'system'
  birdId?: string;
  level: NotificationLevel;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}
