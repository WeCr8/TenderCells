import React from 'react';
import { Heart, Egg, MapPin, MoreVertical, AlertTriangle } from 'lucide-react';
import type { FlockMember } from '../../types/flock';

interface FlockMemberCardProps {
  member: FlockMember;
  onClick?: () => void;
  className?: string;
}

export default function FlockMemberCard({
  member,
  onClick,
  className = ''
}: FlockMemberCardProps) {
  const statusColors = {
    healthy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    sick: 'bg-red-100 text-red-800 border-red-200',
    missing: 'bg-amber-100 text-amber-800 border-amber-200',
    quarantine: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  const statusIcons = {
    healthy: '🐔',
    sick: '🤒',
    missing: '❓',
    quarantine: '🏥'
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
          <span className="text-2xl">{statusIcons[member.status]}</span>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-farm-700 transition-colors">
              {member.name}
            </h3>
            <p className="text-sm text-gray-500">{member.breed}</p>
          </div>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[member.status]}`}>
          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Heart className={`h-3 w-3 ${getHealthColor(member.healthScore)}`} />
            <span className={`text-sm font-medium ${getHealthColor(member.healthScore)}`}>
              {member.healthScore}%
            </span>
          </div>
          <p className="text-xs text-gray-500">Health</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Egg className="h-3 w-3 text-farm-600" />
            <span className="text-sm font-medium text-gray-900">
              {member.eggProduction.daily}
            </span>
          </div>
          <p className="text-xs text-gray-500">Today</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <MapPin className="h-3 w-3 text-blue-500" />
            <span className="text-xs font-medium text-gray-900">
              {member.location}
            </span>
          </div>
          <p className="text-xs text-gray-500">Location</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <span>ID: {member.rfidTag}</span>
        <span>Age: {member.age}mo</span>
        {member.status === 'missing' && (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        )}
      </div>

      {/* Last Seen */}
      <div className="mt-2 text-xs text-gray-500">
        Last seen: {member.lastSeen}
      </div>
    </div>
  );
}