import React from 'react';
import { Users, MapPin, TrendingUp, MoreVertical } from 'lucide-react';
import type { FlockGroup } from '../../types/flock';

interface FlockGroupCardProps {
  group: FlockGroup;
  onClick?: () => void;
  className?: string;
}

export default function FlockGroupCard({
  group,
  onClick,
  className = ''
}: FlockGroupCardProps) {
  const statusColors = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-farm-300 transition-all duration-200 cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-farm-100 rounded-lg">
            <Users className="w-5 h-5 text-farm-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-farm-700 transition-colors">
              {group.name}
            </h3>
            <p className="text-sm text-gray-500">{group.memberCount} members</p>
          </div>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[group.status]}`}>
          {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {group.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className={`h-4 w-4 ${getHealthColor(group.healthScore)}`} />
          <div>
            <p className={`text-sm font-medium ${getHealthColor(group.healthScore)}`}>
              {group.healthScore}%
            </p>
            <p className="text-xs text-gray-500">Health Score</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">{group.location}</p>
            <p className="text-xs text-gray-500">Location</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <span>Created: {new Date(group.createdAt).toLocaleDateString()}</span>
        <span>{group.memberCount} birds</span>
      </div>
    </div>
  );
}