import React from 'react';
import { 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Stethoscope,
  Pill,
  Shield,
  Activity,
  MoreVertical
} from 'lucide-react';
import { FlockHealthUtils } from '../../../utils/flockHealthUtils';
import type { HealthRecord } from '../../../types/flockHealth';

interface HealthRecordCardProps {
  record: HealthRecord;
  viewMode?: 'cards' | 'list';
  onClick?: () => void;
  className?: string;
}

export default function HealthRecordCard({
  record,
  viewMode = 'cards',
  onClick,
  className = ''
}: HealthRecordCardProps) {
  const formatted = FlockHealthUtils.formatHealthRecord(record);
  
  const severityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusColors = {
    active: 'bg-amber-100 text-amber-800',
    resolved: 'bg-emerald-100 text-emerald-800',
    ongoing: 'bg-blue-100 text-blue-800'
  };

  const typeIcons = {
    vaccination: Shield,
    treatment: Pill,
    checkup: Stethoscope,
    illness: AlertTriangle,
    injury: Activity,
    quarantine: Clock
  };

  const TypeIcon = typeIcons[record.recordType] || Stethoscope;

  if (viewMode === 'list') {
    return (
      <div 
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className={`p-2 rounded-lg ${formatted.color} bg-opacity-10`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-semibold text-gray-900">{record.chickenName}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[record.severity]}`}>
                  {record.severity}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[record.status]}`}>
                  {record.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">{record.description}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(record.date).toLocaleDateString()}
                </span>
                {record.veterinarian && (
                  <span className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {record.veterinarian}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {record.followUpRequired && (
              <div className="flex items-center text-amber-600">
                <Clock className="w-4 h-4 mr-1" />
                <span className="text-xs">Follow-up</span>
              </div>
            )}
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
          <div className={`p-2 rounded-lg ${formatted.color} bg-opacity-10`}>
            <TypeIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-farm-700 transition-colors">
              {record.chickenName}
            </h3>
            <p className="text-sm text-gray-500 capitalize">{formatted.title}</p>
          </div>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Status Badges */}
      <div className="flex items-center space-x-2 mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${severityColors[record.severity]}`}>
          {record.severity}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[record.status]}`}>
          {record.status}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {record.description}
      </p>

      {/* Symptoms */}
      {record.symptoms && record.symptoms.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Symptoms</h4>
          <div className="flex flex-wrap gap-1">
            {record.symptoms.slice(0, 3).map((symptom, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {symptom}
              </span>
            ))}
            {record.symptoms.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{record.symptoms.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Treatment Info */}
      {record.treatment && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Pill className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">{record.treatment.name}</span>
          </div>
          <p className="text-xs text-blue-700">{record.treatment.type}</p>
          {record.treatment.duration && (
            <p className="text-xs text-blue-600 mt-1">Duration: {record.treatment.duration}</p>
          )}
        </div>
      )}

      {/* Follow-up Alert */}
      {record.followUpRequired && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">Follow-up Required</span>
          </div>
          {record.followUpDate && (
            <p className="text-xs text-amber-700 mt-1">
              Due: {new Date(record.followUpDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>{new Date(record.date).toLocaleDateString()}</span>
        </div>
        {record.veterinarian && (
          <div className="flex items-center space-x-1">
            <User className="w-3 h-3" />
            <span>{record.veterinarian}</span>
          </div>
        )}
      </div>
    </div>
  );
}