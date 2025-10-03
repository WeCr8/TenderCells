import React from 'react';
import { Heart, Egg, MapPin, AlertCircle } from 'lucide-react';

interface ChickenProfileProps {
  chicken: {
    id: string;
    name: string;
    status: 'active' | 'resting' | 'missing';
    health: number;
    eggs: number;
    lastSeen: string;
  };
}

export default function ChickenProfile({ chicken }: ChickenProfileProps) {
  const statusColors = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    resting: 'bg-amber-100 text-amber-800 border-amber-200',
    missing: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusIcons = {
    active: '🐔',
    resting: '💤',
    missing: '❓'
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{statusIcons[chicken.status]}</span>
          <div>
            <h4 className="font-medium text-gray-900">{chicken.name}</h4>
            <p className="text-xs text-gray-500">ID: {chicken.id}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[chicken.status]}`}>
          {chicken.status}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <Heart className="h-3 w-3 text-red-500" />
            <span className="text-sm font-medium text-gray-900">{chicken.health}%</span>
          </div>
          <p className="text-xs text-gray-500">Health</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <Egg className="h-3 w-3 text-farm-600" />
            <span className="text-sm font-medium text-gray-900">{chicken.eggs}</span>
          </div>
          <p className="text-xs text-gray-500">Eggs</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <MapPin className="h-3 w-3 text-blue-500" />
            <span className="text-xs font-medium text-gray-900">Zone A</span>
          </div>
          <p className="text-xs text-gray-500">Location</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Last seen: {chicken.lastSeen}</span>
        {chicken.status === 'missing' && (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  );
}