import React from 'react';
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Edit
} from 'lucide-react';
import { Button } from '../ui/Button/Button';
import type { UserProfile } from '../../types/navigation';

interface AccountMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  className?: string;
}

export default function AccountMenu({
  isOpen,
  onClose,
  user,
  onNavigate,
  onLogout,
  className = ''
}: AccountMenuProps) {
  const menuItems = [
    {
      icon: User,
      label: 'Profile Settings',
      description: 'Manage your personal information',
      path: '/account/profile'
    },
    {
      icon: Shield,
      label: 'Security',
      description: 'Password and security settings',
      path: '/account/security'
    },
    {
      icon: Bell,
      label: 'Notification Preferences',
      description: 'Configure alerts and notifications',
      path: '/account/notifications'
    },
    {
      icon: Settings,
      label: 'General Settings',
      description: 'App preferences and configuration',
      path: '/settings'
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'Get help and contact support',
      path: '/help'
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className={`absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 ${className}`}>
        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-farm-100 rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-farm-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-600 truncate">{user.email}</p>
                <p className="text-xs text-gray-500">
                  Last login: {new Date(user.lastLogin).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit className="w-4 h-4" />}
                onClick={() => onNavigate('/account/profile')}
              />
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="py-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                onNavigate(item.path);
                onClose();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <item.icon className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-600 line-clamp-1">{item.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="border-t border-gray-200 p-2">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 transition-colors group rounded-lg"
          >
            <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
              <LogOut className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">Sign Out</p>
              <p className="text-xs text-red-600">Sign out of your account</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}