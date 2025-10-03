/**
 * Type definitions for environment-related data
 */

export interface EnvironmentData {
  temperature: {
    current: number;
    target: number;
    unit: 'celsius' | 'fahrenheit';
    trend: 'rising' | 'falling' | 'stable';
  };
  humidity: {
    current: number;
    target: number;
    trend: 'rising' | 'falling' | 'stable';
  };
  airQuality: {
    co2: number;
    ammonia: number;
    dust: number;
    rating: 'excellent' | 'good' | 'fair' | 'poor';
  };
  lighting: {
    intensity: number; // 0-100
    schedule: {
      sunrise: string;
      sunset: string;
    };
  };
  timestamp: string;
}

export interface EnvironmentControls {
  coopDoor: {
    isOpen: boolean;
    autoMode: boolean;
    schedule: {
      openTime: string;
      closeTime: string;
    };
  };
  lighting: {
    enabled: boolean;
    autoMode: boolean;
    intensity: number;
  };
  ventilation: {
    enabled: boolean;
    autoMode: boolean;
    speed: number; // 0-100
  };
  heating: {
    enabled: boolean;
    autoMode: boolean;
    targetTemperature: number;
  };
  cooling: {
    enabled: boolean;
    autoMode: boolean;
    targetTemperature: number;
  };
}

export interface EnvironmentAlert {
  type: 'temperature' | 'humidity' | 'air_quality' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
}