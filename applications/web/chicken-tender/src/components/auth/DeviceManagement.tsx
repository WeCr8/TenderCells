import React, { useState } from 'react';
import { Laptop, Smartphone, Tablet, Clock, X, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { useAuth } from '../../hooks/useAuth';
import type { AuthDevice } from '../../types/auth';

interface DeviceManagementProps {
  className?: string;
}

export default function DeviceManagement({ className = '' }: DeviceManagementProps) {
  const { devices, revokeDevice } = useAuth();
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);

  const getDeviceIcon = (device: AuthDevice) => {
    switch (device.type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-gray-500" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-gray-500" />;
      default:
        return <Laptop className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleRevoke = async (deviceId: string) => {
    setIsRevoking(deviceId);
    
    try {
      await revokeDevice(deviceId);
      setShowConfirmation(null);
    } catch (error) {
      console.error('Failed to revoke device:', error);
    } finally {
      setIsRevoking(null);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Your Devices</h3>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>
      
      {devices.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Laptop className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No devices found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {devices.map((device) => (
            <div 
              key={device.id} 
              className={`p-4 rounded-lg border ${device.isCurrent ? 'bg-farm-50 border-farm-200' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getDeviceIcon(device)}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium text-gray-900">{device.name}</h4>
                      {device.isCurrent && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-farm-100 text-farm-800 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {device.browser} on {device.os}
                    </p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Last active: {formatLastActive(device.lastActive)}</span>
                    </div>
                  </div>
                </div>
                
                {!device.isCurrent && (
                  <div>
                    {showConfirmation === device.id ? (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="danger"
                          size="xs"
                          loading={isRevoking === device.id}
                          onClick={() => handleRevoke(device.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setShowConfirmation(null)}
                          disabled={isRevoking === device.id}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<X className="w-4 h-4" />}
                        onClick={() => setShowConfirmation(device.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Revoking a device will sign you out on that device and require re-authentication.
        </p>
      </div>
    </div>
  );
}