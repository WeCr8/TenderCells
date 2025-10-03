import React from 'react';
import { Shield, Key, Smartphone, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button/Button';
import DeviceManagement from '../components/auth/DeviceManagement';
import AuthGuard from '../components/auth/AuthGuard';

export default function AccountSecurityPage() {
  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
            <p className="text-gray-600">Manage your account security and connected devices</p>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Password</h3>
                <p className="text-sm text-gray-600">Manage your account password</p>
              </div>
            </div>
            <Button variant="outline">Change Password</Button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Password last changed</p>
                <p className="text-sm text-gray-600">3 months ago</p>
              </div>
              <div className="flex items-center space-x-1 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Consider updating your password</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full mr-3">
                Not Enabled
              </span>
              <Button variant="primary">Enable</Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Smartphone className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Authenticator App</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Use an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy to get verification codes.
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Set up
                </Button>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Lock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Recovery Codes</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Recovery codes can be used to access your account if you lose your device.
                </p>
                <Button variant="outline" size="sm" className="mt-2" disabled>
                  View codes
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Device Management */}
        <DeviceManagement />

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Successful login</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Today at 10:32 AM • Chrome on Windows
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  IP: 192.168.1.1 • Location: New York, USA
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Successful login</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Yesterday at 8:15 PM • Safari on macOS
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  IP: 192.168.1.2 • Location: New York, USA
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm">
              View all activity
            </Button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}