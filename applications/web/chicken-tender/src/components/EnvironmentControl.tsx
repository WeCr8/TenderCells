import React, { useState } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Lightbulb, 
  DoorOpen,
  Settings,
  Power
} from 'lucide-react';

export default function EnvironmentControl() {
  const [coopDoorOpen, setCoopDoorOpen] = useState(true);
  const [lightsOn, setLightsOn] = useState(false);
  const [ventilationOn, setVentilationOn] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Environment Control</h3>
        <Settings className="h-5 w-5 text-gray-400" />
      </div>
      
      {/* Environmental Readings */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Thermometer className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Temperature</span>
          </div>
          <p className="text-lg font-bold text-blue-900">72°F</p>
          <p className="text-xs text-blue-600">Optimal range</p>
        </div>
        
        <div className="bg-emerald-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Droplets className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">Humidity</span>
          </div>
          <p className="text-lg font-bold text-emerald-900">65%</p>
          <p className="text-xs text-emerald-600">Good level</p>
        </div>
      </div>
      
      {/* Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <DoorOpen className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Coop Door</p>
              <p className="text-xs text-gray-500">Auto-close at sunset</p>
            </div>
          </div>
          <button
            onClick={() => setCoopDoorOpen(!coopDoorOpen)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              coopDoorOpen ? 'bg-emerald-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                coopDoorOpen ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Lightbulb className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Coop Lights</p>
              <p className="text-xs text-gray-500">Schedule: 6am - 8pm</p>
            </div>
          </div>
          <button
            onClick={() => setLightsOn(!lightsOn)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              lightsOn ? 'bg-amber-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                lightsOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Wind className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Ventilation</p>
              <p className="text-xs text-gray-500">Auto mode enabled</p>
            </div>
          </div>
          <button
            onClick={() => setVentilationOn(!ventilationOn)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              ventilationOn ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                ventilationOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full bg-farm-500 hover:bg-farm-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
          <Power className="h-4 w-4" />
          <span>Emergency Override</span>
        </button>
      </div>
    </div>
  );
}