import React from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function AlertsPanel() {
  const alerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Chicken Missing',
      description: 'Goldy (RF004) not detected for 2 hours',
      time: '2 hours ago',
      action: 'Locate'
    },
    {
      id: 2,
      type: 'info',
      title: 'Low Water Level',
      description: 'Water dispenser at 15% capacity',
      time: '30 min ago',
      action: 'Refill'
    },
    {
      id: 3,
      type: 'success',
      title: 'Feeding Complete',
      description: 'Automatic morning feeding finished',
      time: '3 hours ago',
      action: null
    }
  ];

  const alertIcons = {
    warning: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-100' },
    info: { icon: Clock, color: 'text-blue-600 bg-blue-100' },
    success: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100' },
    error: { icon: XCircle, color: 'text-red-600 bg-red-100' }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
        <button className="text-sm text-farm-600 hover:text-farm-700 font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {alerts.map((alert) => {
          const { icon: Icon, color } = alertIcons[alert.type as keyof typeof alertIcons];
          
          return (
            <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
              </div>
              
              {alert.action && (
                <button className="text-sm text-farm-600 hover:text-farm-700 font-medium">
                  {alert.action}
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Alert Settings</span>
          <button className="text-farm-600 hover:text-farm-700 font-medium">
            Configure
          </button>
        </div>
      </div>
    </div>
  );
}