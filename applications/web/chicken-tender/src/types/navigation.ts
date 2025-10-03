/**
 * Type definitions for navigation system
 */

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavigationItem[];
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  lastLogin: string;
}

export interface NavigationState {
  isNotificationPanelOpen: boolean;
  isAccountMenuOpen: boolean;
  unreadNotifications: number;
  currentUser: UserProfile | null;
}