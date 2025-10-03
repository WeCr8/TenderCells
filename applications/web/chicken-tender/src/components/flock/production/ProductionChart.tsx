import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { FlockProductionUtils } from '../../../utils/flockProductionUtils';
import type { ProductionRecord } from '../../../types/flockProduction';

interface ProductionChartProps {
  records: ProductionRecord[];
  title: string;
  className?: string;
}

export default function ProductionChart({
  records,
  title,
  className = ''
}: ProductionChartProps) {
  // Analyze trend
  const trend = FlockProductionUtils.analyzeProductionTrend(records);
  
  // Group records by day for the last 14 days
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    return date.toISOString().split('T')[0];
  });

  const dailyProduction = last14Days.map(date => {
    const dayRecords = records.filter(r => r.date.startsWith(date));
    return dayRecords.reduce((sum, record) => sum + record.quantity, 0);
  });

  const maxProduction = Math.max(...dailyProduction, 1);

  const renderChart = () => {
    return (
      <div className="h-32 flex items-end space-x-1">
        {dailyProduction.map((production, index) => {
          const height = (production / maxProduction) * 100;
          const date = last14Days[index];
          return (
            <div
              key={index}
              className="flex-1 bg-farm-200 rounded-t hover:bg-farm-300 transition-colors"
              style={{ height: `${height}%`, minHeight: '4px' }}
              title={`${production} eggs on ${new Date(date).toLocaleDateString()}`}
            />
          );
        })}
      </div>
    );
  };

  const totalProduction = dailyProduction.reduce((sum, prod) => sum + prod, 0);
  const averageDaily = totalProduction / dailyProduction.length;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-1">
          {trend === 'increasing' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
          {trend === 'decreasing' && <TrendingDown className="w-4 h-4 text-red-600" />}
          <span className={`text-sm font-medium ${
            trend === 'increasing' ? 'text-emerald-600' : 
            trend === 'decreasing' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {trend === 'increasing' ? 'Increasing' : trend === 'decreasing' ? 'Decreasing' : 'Stable'}
          </span>
        </div>
      </div>

      {renderChart()}

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <p className="font-medium text-gray-900">{totalProduction}</p>
          <p className="text-gray-500">Total (14d)</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-900">{averageDaily.toFixed(1)}</p>
          <p className="text-gray-500">Daily Avg</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-900">{Math.max(...dailyProduction)}</p>
          <p className="text-gray-500">Peak Day</p>
        </div>
      </div>
    </div>
  );
}