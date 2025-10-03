import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  status?: 'good' | 'warning' | 'danger';
  className?: string;
}

export default function StatusCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  status = 'good',
  className = ''
}: StatusCardProps) {
  const statusColors = {
    good: 'text-emerald-600 bg-emerald-50',
    warning: 'text-amber-600 bg-amber-50',
    danger: 'text-red-600 bg-red-50'
  };

  const trendColors = {
    good: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600'
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-sm ${trendColors[status]} mt-1`}>
              {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${statusColors[status]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}