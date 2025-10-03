import React from 'react';
import { AlertTriangle, Clock, CheckCircle, X } from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import type { HealthAlert } from '../../../types/flockHealth';

interface HealthAlertPanelProps {
  alerts: HealthAlert[];
  onAlertClick?: (alert: HealthAlert) => void;
  onDismissAlert?: (alertId: string) => void;
  className?: string;
}

export default function HealthAlertPanel({
  alerts,
  onAlertClick,
  onDismissAlert,
  className = ''
}: HealthAlertPanelProps) {
  const severityColors = {
    low: 'bg-blue-50 border-blue-200',
    medium: 'bg-amber-50 border-amber-200',
    high: 'bg-orange-50 border-orange-200',
    critical: 'bg-red-50 border-red-200'
  };

  const severityIcons = {
    low: Clock,
    medium: AlertTriangle,
    high: AlertTriangle,
    critical: AlertTriangle
  };

  const severityIconColors = {
    low: 'text-blue-600',
    medium: 'text-amber-600',
    high: 'text-orange-600',
    critical: 'text-red-600'
  };

  if (alerts.length === 0) return null;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
          Health Alerts ({alerts.filter(a => !a.isRead).length} unread)
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => alerts.forEach(alert => !alert.isRead && onDismissAlert?.(alert.id))}
        >
          Mark All Read
        </Button>
      </div>

      <div className="space-y-3">
        {alerts.slice(0, 5).map((alert) => {
          const SeverityIcon = severityIcons[alert.severity];
          const severityColor = severityIconColors[alert.severity];
          const bgColor = severityColors[alert.severity];

          return (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${bgColor} ${
                !alert.isRead ? 'border-l-4' : ''
              }`}
              onClick={() => onAlertClick?.(alert)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <SeverityIcon className={`w-5 h-5 mt-0.5 ${severityColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{alert.title}</h4>
                      {!alert.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        Action: {alert.actionRequired}
                      </p>
                      {alert.dueDate && (
                        <p className="text-xs text-gray-600">
                          Due: {new Date(alert.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <span className="text-xs text-gray-500">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                  {onDismissAlert && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismissAlert(alert.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {alerts.length > 5 && (
        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm">
            View All {alerts.length} Alerts
          </Button>
        </div>
      )}
    </div>
  );
}