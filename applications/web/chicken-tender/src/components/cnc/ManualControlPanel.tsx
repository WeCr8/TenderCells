import React, { useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  RotateCcw,
  Home,
  Target,
  Zap,
  Settings
} from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { GRBLService } from '../../services/grblService';
import type { MachineStatus, CoordinateSystem } from '../../types/cnc';

interface ManualControlPanelProps {
  machineStatus: MachineStatus | null;
  isConnected: boolean;
  grblService: GRBLService;
  className?: string;
}

export default function ManualControlPanel({
  machineStatus,
  isConnected,
  grblService,
  className = ''
}: ManualControlPanelProps) {
  const [jogDistance, setJogDistance] = useState(1);
  const [jogFeedRate, setJogFeedRate] = useState(1000);
  const [spindleSpeed, setSpindleSpeed] = useState(1000);
  const [feedOverride, setFeedOverride] = useState(100);
  const [spindleOverride, setSpindleOverride] = useState(100);
  const [coordinateSystem, setCoordinateSystem] = useState<CoordinateSystem>('G54');

  const jogDistances = [0.1, 1, 10, 100];
  const feedRates = [100, 500, 1000, 2000, 5000];

  const handleJog = async (axis: 'X' | 'Y' | 'Z', direction: 1 | -1) => {
    if (!isConnected) return;
    
    try {
      const distance = jogDistance * direction;
      await grblService.jog(axis, distance, jogFeedRate);
    } catch (error) {
      console.error('Jog failed:', error);
    }
  };

  const handleHomeAxis = async (axis: 'X' | 'Y' | 'Z') => {
    if (!isConnected) return;
    
    try {
      await grblService.homeAxis(axis);
    } catch (error) {
      console.error('Home axis failed:', error);
    }
  };

  const handleSetWorkZero = async (axes?: ('X' | 'Y' | 'Z')[]) => {
    if (!isConnected) return;
    
    try {
      await grblService.setWorkZero(axes);
    } catch (error) {
      console.error('Set work zero failed:', error);
    }
  };

  const handleSpindleControl = async (action: 'start' | 'stop') => {
    if (!isConnected) return;
    
    try {
      if (action === 'start') {
        await grblService.startSpindle(spindleSpeed);
      } else {
        await grblService.stopSpindle();
      }
    } catch (error) {
      console.error('Spindle control failed:', error);
    }
  };

  const handleOverrideChange = async (type: 'feed' | 'spindle', value: number) => {
    if (!isConnected) return;
    
    try {
      if (type === 'feed') {
        setFeedOverride(value);
        await grblService.setFeedOverride(value);
      } else {
        setSpindleOverride(value);
        await grblService.setSpindleOverride(value);
      }
    } catch (error) {
      console.error('Override change failed:', error);
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 ${className}`}>
      {/* Jog Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Jog Controls</h3>
        
        {/* Distance and Feed Rate Settings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jog Distance
            </label>
            <div className="grid grid-cols-2 gap-1">
              {jogDistances.map((distance) => (
                <button
                  key={distance}
                  onClick={() => setJogDistance(distance)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    jogDistance === distance
                      ? 'bg-farm-100 border-farm-300 text-farm-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {distance}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feed Rate
            </label>
            <select
              value={jogFeedRate}
              onChange={(e) => setJogFeedRate(parseInt(e.target.value))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 text-sm"
            >
              {feedRates.map((rate) => (
                <option key={rate} value={rate}>
                  {rate} mm/min
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* XY Jog Pad */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">XY Movement</label>
          <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
            <div></div>
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowUp className="w-4 h-4" />}
              onClick={() => handleJog('Y', 1)}
              disabled={!isConnected}
              className="aspect-square"
            />
            <div></div>
            
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => handleJog('X', -1)}
              disabled={!isConnected}
              className="aspect-square"
            />
            <Button
              variant="outline"
              size="sm"
              icon={<Target className="w-4 h-4" />}
              onClick={() => handleSetWorkZero(['X', 'Y'])}
              disabled={!isConnected}
              className="aspect-square"
              title="Set XY Zero"
            />
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => handleJog('X', 1)}
              disabled={!isConnected}
              className="aspect-square"
            />
            
            <div></div>
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowDown className="w-4 h-4" />}
              onClick={() => handleJog('Y', -1)}
              disabled={!isConnected}
              className="aspect-square"
            />
            <div></div>
          </div>
        </div>

        {/* Z Axis Controls */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Z Movement</label>
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleJog('Z', 1)}
              disabled={!isConnected}
            >
              Z+
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Target className="w-4 h-4" />}
              onClick={() => handleSetWorkZero(['Z'])}
              disabled={!isConnected}
              title="Set Z Zero"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleJog('Z', -1)}
              disabled={!isConnected}
            >
              Z-
            </Button>
          </div>
        </div>
      </div>

      {/* Coordinate Systems & Homing */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Coordinates & Homing</h3>
        
        {/* Current Position Display */}
        {machineStatus && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Current Position</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Work:</span>
                <div className="font-mono">
                  <div>X: {machineStatus.position.work.x.toFixed(3)}</div>
                  <div>Y: {machineStatus.position.work.y.toFixed(3)}</div>
                  <div>Z: {machineStatus.position.work.z.toFixed(3)}</div>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Machine:</span>
                <div className="font-mono">
                  <div>X: {machineStatus.position.machine.x.toFixed(3)}</div>
                  <div>Y: {machineStatus.position.machine.y.toFixed(3)}</div>
                  <div>Z: {machineStatus.position.machine.z.toFixed(3)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coordinate System Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Work Coordinate System
          </label>
          <select
            value={coordinateSystem}
            onChange={(e) => {
              const system = e.target.value as CoordinateSystem;
              setCoordinateSystem(system);
              grblService.setCoordinateSystem(system);
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 text-sm"
            disabled={!isConnected}
          >
            <option value="G54">G54</option>
            <option value="G55">G55</option>
            <option value="G56">G56</option>
            <option value="G57">G57</option>
            <option value="G58">G58</option>
            <option value="G59">G59</option>
          </select>
        </div>

        {/* Homing Controls */}
        <div className="space-y-3">
          <Button
            variant="outline"
            icon={<Home className="w-4 h-4" />}
            fullWidth
            onClick={() => grblService.homeAll()}
            disabled={!isConnected}
          >
            Home All Axes
          </Button>
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleHomeAxis('X')}
              disabled={!isConnected}
            >
              Home X
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleHomeAxis('Y')}
              disabled={!isConnected}
            >
              Home Y
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleHomeAxis('Z')}
              disabled={!isConnected}
            >
              Home Z
            </Button>
          </div>
          
          <Button
            variant="outline"
            icon={<Target className="w-4 h-4" />}
            fullWidth
            onClick={() => handleSetWorkZero()}
            disabled={!isConnected}
          >
            Set Work Zero (All)
          </Button>
        </div>
      </div>

      {/* Spindle & Override Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spindle & Overrides</h3>
        
        {/* Spindle Controls */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Spindle Speed (RPM)
          </label>
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="number"
              value={spindleSpeed}
              onChange={(e) => setSpindleSpeed(parseInt(e.target.value) || 0)}
              min="0"
              max="24000"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 text-sm"
              disabled={!isConnected}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="primary"
              icon={<Zap className="w-4 h-4" />}
              size="sm"
              onClick={() => handleSpindleControl('start')}
              disabled={!isConnected}
            >
              Start
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSpindleControl('stop')}
              disabled={!isConnected}
            >
              Stop
            </Button>
          </div>
        </div>

        {/* Feed Rate Override */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feed Rate Override: {feedOverride}%
          </label>
          <input
            type="range"
            min="10"
            max="200"
            value={feedOverride}
            onChange={(e) => handleOverrideChange('feed', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={!isConnected}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10%</span>
            <span>100%</span>
            <span>200%</span>
          </div>
        </div>

        {/* Spindle Speed Override */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Spindle Override: {spindleOverride}%
          </label>
          <input
            type="range"
            min="10"
            max="200"
            value={spindleOverride}
            onChange={(e) => handleOverrideChange('spindle', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={!isConnected}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10%</span>
            <span>100%</span>
            <span>200%</span>
          </div>
        </div>
      </div>
    </div>
  );
}