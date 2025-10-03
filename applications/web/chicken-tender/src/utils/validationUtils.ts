/**
 * Utility functions for data validation
 */

export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate RFID tag format
   */
  static isValidRFIDTag(tag: string): boolean {
    // Assuming RFID tags are alphanumeric and 6-12 characters
    const rfidRegex = /^[A-Z0-9]{6,12}$/;
    return rfidRegex.test(tag);
  }

  /**
   * Validate temperature range
   */
  static isValidTemperature(temp: number, unit: 'celsius' | 'fahrenheit' = 'fahrenheit'): boolean {
    if (unit === 'celsius') {
      return temp >= -40 && temp <= 60; // Reasonable range for chicken coops
    } else {
      return temp >= -40 && temp <= 140; // Fahrenheit equivalent
    }
  }

  /**
   * Validate humidity percentage
   */
  static isValidHumidity(humidity: number): boolean {
    return humidity >= 0 && humidity <= 100;
  }

  /**
   * Validate health score
   */
  static isValidHealthScore(score: number): boolean {
    return score >= 0 && score <= 100;
  }

  /**
   * Validate chicken name
   */
  static isValidChickenName(name: string): boolean {
    // Allow letters, numbers, spaces, and common punctuation
    const nameRegex = /^[a-zA-Z0-9\s\-'\.]{1,50}$/;
    return nameRegex.test(name.trim());
  }

  /**
   * Validate required fields
   */
  static validateRequired(value: any, fieldName: string): string | null {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  }

  /**
   * Validate numeric range
   */
  static validateRange(value: number, min: number, max: number, fieldName: string): string | null {
    if (value < min || value > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
    return null;
  }

  /**
   * Validate string length
   */
  static validateLength(value: string, min: number, max: number, fieldName: string): string | null {
    if (value.length < min || value.length > max) {
      return `${fieldName} must be between ${min} and ${max} characters`;
    }
    return null;
  }
}