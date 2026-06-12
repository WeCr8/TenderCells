/**
 * Logger Exporter
 * 
 * Handles exporting and downloading logs in various formats.
 */

import type { LogEntry, LoggerExporter } from './types';

export class JSONLoggerExporter implements LoggerExporter {
  export(logs: LogEntry[]): string {
    return JSON.stringify(logs, null, 2);
  }

  download(logs: LogEntry[], filename?: string): void {
    const json = this.export(logs);
    const defaultFilename = `tendercells-logs-${new Date().toISOString().split('T')[0]}.json`;
    const finalFilename = filename || defaultFilename;
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export class CSVLoggerExporter implements LoggerExporter {
  export(logs: LogEntry[]): string {
    if (logs.length === 0) return '';

    const headers = ['Timestamp', 'Level', 'Message', 'Context', 'Stack', 'Session ID'];
    const rows = logs.map(log => {
      const context = log.context ? JSON.stringify(log.context).replace(/"/g, '""') : '';
      const stack = log.stack ? log.stack.replace(/"/g, '""') : '';
      return [
        log.timestamp,
        log.level,
        log.message.replace(/"/g, '""'),
        context,
        stack,
        log.sessionId || '',
      ].map(field => `"${field}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  download(logs: LogEntry[], filename?: string): void {
    const csv = this.export(logs);
    const defaultFilename = `tendercells-logs-${new Date().toISOString().split('T')[0]}.csv`;
    const finalFilename = filename || defaultFilename;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Create an exporter instance
 */
export function createExporter(format: 'json' | 'csv' = 'json'): LoggerExporter {
  if (format === 'csv') {
    return new CSVLoggerExporter();
  }
  return new JSONLoggerExporter();
}




