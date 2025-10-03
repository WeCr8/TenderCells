import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import type { AnalyticsAlert } from '../../../types/analytics';

interface AnalyticsAlertPanelProps {
  alerts: AnalyticsAlert[];
  onDismiss?: (alertId: string) => void;
  className?: string;
}

export default function AnalyticsAlertPanel({
  alerts,
  onDismiss,
  className = ''
}: AnalyticsAlertPanelProps) {
  const alertIcons = {
    info: { icon: Info, color: 'text-blue-600 bg-blue-100' },
    warning: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-100' },
    critical: { icon: XCircle, color: 'text-red-600 bg-red-100' }
  };

  if (alerts.length === 0) return null;

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <h3 className="font-medium text-amber-800">Analytics Alerts</h3>
      </div>
      <div className="space-y-2">
        {alerts.map((alert) => {
          const { icon: Icon, color } = alertIcons[alert.type];
          
          return (
            <div key={alert.id} className="text-sm text-amber-700">
              <span className="font-medium">{alert.title}:</span> {alert.description}
            </div>
          );
        })}
      </div>
    </div>
  );
}