import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  User,
  Egg,
  Award,
  MoreVertical
} from 'lucide-react';
import { FlockProductionUtils } from '../../../utils/flockProductionUtils';
import type { ProductionRecord } from '../../../types/flockProduction';

interface ProductionRecordCardProps {
  record: ProductionRecord;
  viewMode?: 'cards' | 'list';
  onClick?: () => void;
  className?: string;
}

export default function ProductionRecordCard({
  record,
  viewMode = 'cards',
  onClick,
  className = ''
}: ProductionRecordCardProps) {
  const formatted = FlockProductionUtils.formatProductionRecord(record);
  
  const qualityColors = {
    AA: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    A: 'bg-green-100 text-green-800 border-green-200',
    B: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    C: 'bg-orange-100 text-orange-800 border-orange-200',
    reject: 'bg-red-100 text-red-800 border-red-200'
  };

  const timeColors = {
    morning: 'bg-blue-100 text-blue-800',
    afternoon: 'bg-amber-100 text-amber-800',
    evening: 'bg-purple-100 text-purple-800'
  };

  if (viewMode === 'list') {
    return (
      <div 
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="p-2 bg-farm-100 rounded-lg">
              <Egg className="w-5 h-5 text-farm-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-semibold text-gray-900">{record.chickenName}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${qualityColors[record.quality]}`}>
                  Grade {record.quality}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${timeColors[record.timeOfDay]}`}>
                  {record.timeOfDay}
                </span>
              </div>
              <p className="text-sm text-gray-600">{formatted.title}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(record.date).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {record.location}
                </span>
                {record.weight && (
                  <span>{record.weight}g</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-1 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-farm-300 transition-all duration-200 cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-farm-100 rounded-lg">
            <Egg className="w-5 h-5 text-farm-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-farm-700 transition-colors">
              {record.chickenName}
            </h3>
            <p className="text-sm text-gray-500">{formatted.title}</p>
          </div>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Quality and Time Badges */}
      <div className="flex items-center space-x-2 mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${qualityColors[record.quality]}`}>
          <Award className="w-3 h-3 inline mr-1" />
          Grade {record.quality}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${timeColors[record.timeOfDay]}`}>
          <Clock className="w-3 h-3 inline mr-1" />
          {record.timeOfDay}
        </span>
      </div>

      {/* Production Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-900">{record.quantity}</p>
          <p className="text-xs text-gray-500">Quantity</p>
        </div>
        {record.weight && (
          <div>
            <p className="text-sm font-medium text-gray-900">{record.weight}g</p>
            <p className="text-xs text-gray-500">Weight</p>
          </div>
        )}
        {record.size && (
          <div>
            <p className="text-sm font-medium text-gray-900 capitalize">{record.size.replace('_', ' ')}</p>
            <p className="text-xs text-gray-500">Size</p>
          </div>
        )}
        {record.nestBox && (
          <div>
            <p className="text-sm font-medium text-gray-900">{record.nestBox}</p>
            <p className="text-xs text-gray-500">Nest Box</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {record.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{record.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>{new Date(record.date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3" />
            <span>{record.location}</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="w-3 h-3" />
            <span>{record.collectedBy}</span>
          </div>
        </div>
      </div>
    </div>
  );
}