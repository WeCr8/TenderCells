import React, { useState } from 'react';
import { Camera, Play, Pause, Maximize, Volume2, AlertCircle } from 'lucide-react';

export default function LiveFeed() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState(0);

  const cameras = [
    { name: 'Main Coop', location: 'Interior', status: 'online' },
    { name: 'Yard View', location: 'Exterior', status: 'online' },
    { name: 'Nesting Boxes', location: 'Interior', status: 'maintenance' },
    { name: 'Entrance', location: 'Exterior', status: 'online' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">ChickenEye Live Feed</h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">LIVE</span>
          </div>
        </div>
      </div>
      
      {/* Main Video Feed */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg font-medium">
              {cameras[selectedCamera].name}
            </p>
            <p className="text-gray-400 text-sm">
              AI Detection: 4 chickens, 2 in nesting area
            </p>
          </div>
        </div>
        
        {/* Video Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 text-white" />
              ) : (
                <Play className="h-4 w-4 text-white" />
              )}
            </button>
            <Volume2 className="h-4 w-4 text-white" />
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-colors">
              <Maximize className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
        
        {/* AI Insights Overlay */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 rounded-lg p-3 text-white">
          <p className="text-sm font-medium">AI Insights</p>
          <p className="text-xs opacity-80">Normal behavior detected</p>
          <p className="text-xs opacity-80">Egg laying activity: High</p>
        </div>
      </div>
      
      {/* Camera Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cameras.map((camera, index) => (
          <button
            key={index}
            onClick={() => setSelectedCamera(index)}
            className={`p-3 rounded-lg border-2 transition-colors text-left ${
              selectedCamera === index
                ? 'border-farm-500 bg-farm-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-900">{camera.name}</p>
              {camera.status === 'maintenance' ? (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              ) : (
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              )}
            </div>
            <p className="text-xs text-gray-500">{camera.location}</p>
            <p className={`text-xs font-medium ${
              camera.status === 'online' ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {camera.status === 'online' ? 'Online' : 'Maintenance'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}