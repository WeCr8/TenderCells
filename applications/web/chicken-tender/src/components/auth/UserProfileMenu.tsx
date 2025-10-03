import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  Settings, 
  Shield, 
  Bell, 
  Laptop, 
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { useAuthContext } from './AuthContext';

interface UserProfileMenuProps {
  className?: string;
}

export default function UserProfileMenu({ className = '' }: UserProfileMenuProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Failed to sign out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        icon={<User className="w-4 h-4" />}
        onClick={() => navigate('/signin')}
        className={className}
      >
        Sign In
      </Button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMenu}
        className="flex items-center space-x-2"
      >
        <div className="flex items-center space-x-2">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name || 'User'} 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-farm-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-farm-600" />
            </div>
          )}
          <span className="font-medium text-gray-700 hidden md:block">
            {user.name || user.email.split('@')[0]}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
      
      {isOpen && (
        <>
          {/* Overlay to capture clicks outside the menu */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-20 py-1">
            {/* User info */}
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
              <p className="text-sm text-gray-600 truncate">{user.email}</p>
            </div>
            
            {/* Menu items */}
            <div className="py-1">
              <button
                onClick={() => handleNavigate('/account/profile')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-3 text-gray-500" />
                  <span>Profile</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              
              <button
                onClick={() => handleNavigate('/account/security')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-3 text-gray-500" />
                  <span>Security</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              
              <button
                onClick={() => handleNavigate('/account/devices')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Laptop className="w-4 h-4 mr-3 text-gray-500" />
                  <span>Devices</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              
              <button
                onClick={() => handleNavigate('/account/notifications')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Bell className="w-4 h-4 mr-3 text-gray-500" />
                  <span>Notifications</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              
              <button
                onClick={() => handleNavigate('/settings')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Settings className="w-4 h-4 mr-3 text-gray-500" />
                  <span>Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            {/* Sign out */}
            <div className="py-1 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 mr-3 flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-3" />
                    <span>Sign out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}