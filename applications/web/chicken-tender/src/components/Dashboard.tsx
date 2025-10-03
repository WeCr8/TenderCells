import React from 'react';
import { 
  Bird, 
  Thermometer, 
  Droplets, 
  Zap, 
  Camera, 
  Heart,
  Egg,
  AlertTriangle,
  Clock,
  Activity,
  Plus
} from 'lucide-react';
import StatusCard from './StatusCard';
import ChickenProfile from './ChickenProfile';
import EnvironmentControl from './EnvironmentControl';
import LiveFeed from './LiveFeed';
import AlertsPanel from './AlertsPanel';
import QuickAddPanel from './common/QuickAddPanel';
import AddFunctionButton from './common/AddFunctionButton';

export default function Dashboard() {
  const chickenData = [
    { id: 'RF001', name: 'Henrietta', status: 'active', health: 95, eggs: 12, lastSeen: '2 min ago' },
    { id: 'RF002', name: 'Clucky', status: 'resting', health: 88, eggs: 8, lastSeen: '5 min ago' },
    { id: 'RF003', name: 'Feathers', status: 'active', health: 92, eggs: 10, lastSeen: '1 min ago' },
    { id: 'RF004', name: 'Goldy', status: 'missing', health: 0, eggs: 15, lastSeen: '2 hours ago' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <AddFunctionButton />
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatusCard
          title="Total Chickens"
          value="24"
          icon={Bird}
          trend={{ value: 4, label: "this month" }}
          status="good"
        />
        <StatusCard
          title="Eggs Today"
          value="18"
          icon={Egg}
          trend={{ value: 12, label: "vs yesterday" }}
          status="good"
        />
        <StatusCard
          title="Coop Temperature"
          value="72°F"
          icon={Thermometer}
          status="good"
        />
        <StatusCard
          title="System Status"
          value="Online"
          icon={Zap}
          status="good"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Live Feed */}
          <LiveFeed />
          
          {/* Flock Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Flock Overview</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Active</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Resting</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Missing</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chickenData.map((chicken) => (
                <ChickenProfile key={chicken.id} chicken={chicken} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Quick Add Panel */}
          <QuickAddPanel />
          
          {/* Alerts */}
          <AlertsPanel />
          
          {/* Environment Controls */}
          <EnvironmentControl />
          
          {/* Today's Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Clock className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Automatic feeding</p>
                  <p className="text-xs text-gray-500">6:00 AM - Completed</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Droplets className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Water refill</p>
                  <p className="text-xs text-gray-500">8:30 AM - Completed</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Activity className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Coop cleaning</p>
                  <p className="text-xs text-gray-500">2:00 PM - Scheduled</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}