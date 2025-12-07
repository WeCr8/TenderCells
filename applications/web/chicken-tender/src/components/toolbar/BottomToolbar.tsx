import React, { useState } from 'react';
import { 
  Menu, 
  Volume2, 
  Grid3x3, 
  Music, 
  Search, 
  Plus, 
  Minus, 
  Maximize,
  Home
} from 'lucide-react';

interface BottomToolbarProps {
  className?: string;
}

export default function BottomToolbar({ className = '' }: BottomToolbarProps) {
  const [map3DEnabled, setMap3DEnabled] = useState(true);
  const [sliderValue, setSliderValue] = useState(50);

  const handleMenuClick = () => {
    // Toggle mobile menu or open settings
    console.log('Menu clicked');
  };

  const handleVolumeClick = () => {
    // Toggle audio
    console.log('Volume clicked');
  };

  const handleGridClick = () => {
    // Toggle grid overlay
    console.log('Grid clicked');
  };

  const handleMusicClick = () => {
    // Toggle background music
    console.log('Music clicked');
  };

  const handleSearchClick = () => {
    // Open search
    console.log('Search clicked');
  };

  const handleAddClick = () => {
    // Zoom in or add item
    console.log('Add clicked');
  };

  const handleRemoveClick = () => {
    // Zoom out or remove item
    console.log('Remove clicked');
  };

  const handleWindowClick = () => {
    // Toggle fullscreen or window mode
    console.log('Window clicked');
  };

  return (
    <div 
      className={`flex items-center justify-between px-2 sm:px-4 py-2 border-t border-gray-200 bg-white min-h-[56px] sm:min-h-[60px] ${className}`}
    >
      {/* Left: Icons and controls */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
        <button
          onClick={handleMenuClick}
          className="p-2 hover:bg-gray-100 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Menu"
        >
          <Menu className="w-4 h-4 text-gray-600" />
        </button>
        
        <span className="text-xs text-gray-600 mr-1 hidden sm:inline">ID</span>
        
        <button
          onClick={handleVolumeClick}
          className="p-2 hover:bg-gray-100 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Volume"
        >
          <Volume2 className="w-4 h-4 text-gray-600" />
        </button>
        
        <button
          onClick={handleGridClick}
          className="p-2 hover:bg-gray-100 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Grid"
        >
          <Grid3x3 className="w-4 h-4 text-gray-600" />
        </button>
        
        <button
          onClick={handleMusicClick}
          className="p-2 hover:bg-gray-100 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Music"
        >
          <Music className="w-4 h-4 text-gray-600" />
        </button>
        
        <button
          onClick={handleSearchClick}
          className="p-2 hover:bg-gray-100 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Search"
        >
          <Search className="w-4 h-4 text-gray-600" />
        </button>
        
        {/* Slider */}
        <div className="flex items-center mx-1">
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-[60px] sm:w-[100px] h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${sliderValue}%, #e5e7eb ${sliderValue}%, #e5e7eb 100%)`
            }}
            aria-label="Slider"
          />
        </div>
        
        <button
          onClick={handleAddClick}
          className="p-2 hover:bg-gray-100 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Add"
        >
          <Plus className="w-4 h-4 text-gray-600" />
        </button>
        
        <button
          onClick={handleRemoveClick}
          className="p-2 hover:bg-gray-100 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Remove"
        >
          <Minus className="w-4 h-4 text-gray-600" />
        </button>
        
        <button
          onClick={handleWindowClick}
          className="p-2 hover:bg-gray-100 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Window"
        >
          <Maximize className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Right: 3D MAP BETA Toggle */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
          3D MAP BETA
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={map3DEnabled}
            onChange={(e) => setMap3DEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
        </label>
      </div>
    </div>
  );
}

