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
    <div className="w-full h-full relative overflow-hidden" style={{
      backgroundColor: '#2d5016', // Dark green background matching image
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
      `,
      backgroundSize: '20px 20px',
    }}>
      {/* 3D Coop Scene Placeholder - Fills entire viewport */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Camera className="h-16 w-16 text-white/50 mx-auto mb-4" />
          <p className="text-white/70 text-lg font-medium">
            3D Coop / Robot Scene
          </p>
          <p className="text-white/60 text-sm mt-2">
            {cameras[selectedCamera].name}
          </p>
        </div>
      </div>
      
      {/* Video Controls - Optional overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity">
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
    </div>
  );
}