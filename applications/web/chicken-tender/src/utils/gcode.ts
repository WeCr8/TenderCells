import type { Position, GCodeFile } from '../types/cnc';

/**
 * Utility functions for G-code parsing and manipulation
 */
export class GCodeUtils {
  /**
   * Parse G-code file and extract metadata
   */
  static parseGCodeFile(content: string, filename: string): Omit<GCodeFile, 'id' | 'createdAt' | 'lastModified'> {
    const lines = content.split('\n').filter(line => line.trim());
    const boundingBox = this.calculateBoundingBox(content);
    const toolsRequired = this.extractToolNumbers(content);
    const estimatedTime = this.estimateExecutionTime(content);

    return {
      name: filename,
      content,
      size: content.length,
      lineCount: lines.length,
      estimatedTime,
      material: this.extractMaterial(content) || 'Unknown',
      toolsRequired,
      boundingBox
    };
  }

  /**
   * Calculate bounding box from G-code
   */
  static calculateBoundingBox(gcode: string): { min: Position; max: Position } {
    const lines = gcode.split('\n');
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    let currentX = 0, currentY = 0, currentZ = 0;

    for (const line of lines) {
      const trimmed = line.trim().toUpperCase();
      if (trimmed.startsWith('G0') || trimmed.startsWith('G1') || trimmed.startsWith('G2') || trimmed.startsWith('G3')) {
        const xMatch = trimmed.match(/X([-+]?\d*\.?\d+)/);
        const yMatch = trimmed.match(/Y([-+]?\d*\.?\d+)/);
        const zMatch = trimmed.match(/Z([-+]?\d*\.?\d+)/);

        if (xMatch) currentX = parseFloat(xMatch[1]);
        if (yMatch) currentY = parseFloat(yMatch[1]);
        if (zMatch) currentZ = parseFloat(zMatch[1]);

        minX = Math.min(minX, currentX);
        minY = Math.min(minY, currentY);
        minZ = Math.min(minZ, currentZ);
        maxX = Math.max(maxX, currentX);
        maxY = Math.max(maxY, currentY);
        maxZ = Math.max(maxZ, currentZ);
      }
    }

    return {
      min: { 
        x: isFinite(minX) ? minX : 0, 
        y: isFinite(minY) ? minY : 0, 
        z: isFinite(minZ) ? minZ : 0 
      },
      max: { 
        x: isFinite(maxX) ? maxX : 0, 
        y: isFinite(maxY) ? maxY : 0, 
        z: isFinite(maxZ) ? maxZ : 0 
      }
    };
  }

  /**
   * Extract tool numbers from G-code
   */
  static extractToolNumbers(gcode: string): number[] {
    const tools = new Set<number>();
    const lines = gcode.split('\n');

    for (const line of lines) {
      const trimmed = line.trim().toUpperCase();
      const toolMatch = trimmed.match(/T(\d+)/);
      if (toolMatch) {
        tools.add(parseInt(toolMatch[1], 10));
      }
    }

    return Array.from(tools).sort((a, b) => a - b);
  }

  /**
   * Extract material information from comments
   */
  static extractMaterial(gcode: string): string | null {
    const lines = gcode.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith(';') || (trimmed.startsWith('(') && trimmed.endsWith(')'))) {
        const comment = trimmed.replace(/^[;(]/, '').replace(/[)]$/, '').toLowerCase();
        if (comment.includes('material')) {
          return comment.split('material')[1].trim();
        }
      }
    }
    
    return null;
  }

  /**
   * Estimate execution time (simplified calculation)
   */
  static estimateExecutionTime(gcode: string): number {
    const lines = gcode.split('\n');
    let totalTime = 0;
    let currentFeedRate = 100; // Default feed rate

    for (const line of lines) {
      const trimmed = line.trim().toUpperCase();
      
      // Extract feed rate
      const feedMatch = trimmed.match(/F(\d+\.?\d*)/);
      if (feedMatch) {
        currentFeedRate = parseFloat(feedMatch[1]);
      }

      // Calculate time for movement commands
      if (trimmed.startsWith('G1')) {
        const distance = this.calculateLineDistance(trimmed);
        totalTime += (distance / currentFeedRate) * 60; // Convert to seconds
      } else if (trimmed.startsWith('G0')) {
        const distance = this.calculateLineDistance(trimmed);
        totalTime += (distance / 1000) * 60; // Rapid moves at ~1000 units/min
      }
    }

    return Math.round(totalTime);
  }

  /**
   * Calculate distance for a G-code line
   */
  private static calculateLineDistance(line: string): number {
    const xMatch = line.match(/X([-+]?\d*\.?\d+)/);
    const yMatch = line.match(/Y([-+]?\d*\.?\d+)/);
    const zMatch = line.match(/Z([-+]?\d*\.?\d+)/);

    const dx = xMatch ? parseFloat(xMatch[1]) : 0;
    const dy = yMatch ? parseFloat(yMatch[1]) : 0;
    const dz = zMatch ? parseFloat(zMatch[1]) : 0;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Validate G-code syntax
   */
  static validateGCode(gcode: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lines = gcode.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith(';') || (line.startsWith('(') && line.endsWith(')'))) {
        continue; // Skip empty lines and comments
      }

      // Basic syntax validation
      if (!/^[GM]\d+/.test(line.toUpperCase())) {
        errors.push(`Line ${i + 1}: Invalid G-code command format`);
      }

      // Check for required parameters
      if (line.toUpperCase().startsWith('G1') && !/[XYZ]/.test(line.toUpperCase())) {
        errors.push(`Line ${i + 1}: G1 command missing coordinate parameters`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert units (mm to inch or vice versa)
   */
  static convertUnits(gcode: string, fromUnit: 'mm' | 'inch', toUnit: 'mm' | 'inch'): string {
    if (fromUnit === toUnit) return gcode;

    const conversionFactor = fromUnit === 'mm' ? 0.0393701 : 25.4;
    const lines = gcode.split('\n');

    return lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('G') || trimmed.startsWith('M')) {
        return trimmed.replace(/(X|Y|Z|I|J|K|F)([-+]?\d*\.?\d+)/g, (match, axis, value) => {
          if (axis === 'F') return match; // Don't convert feed rates
          const numValue = parseFloat(value);
          const converted = (numValue * conversionFactor).toFixed(4);
          return `${axis}${converted}`;
        });
      }
      return line;
    }).join('\n');
  }
}