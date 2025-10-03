import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Bird, 
  Home, 
  Users, 
  Zap, 
  BarChart3, 
  Settings, 
  Bell, 
  User,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { Button } from '../ui/Button/Button';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    name: 'Flock',
    href: '/flock',
    icon: Users,
    children: [
      { name: 'Overview', href: '/flock', icon: Users },
      { name: 'Health Records', href: '/flock/health', icon: Users },
      { name: 'Production', href: '/flock/production', icon: Users },
    ]
  },
  {
    name: 'Automation',
    href: '/automation',
    icon: Zap,
    children: [
      { name: 'Rules', href: '/automation', icon: Zap },
      { name: 'Schedules', href: '/automation/schedules', icon: Zap },
      { name: 'Devices', href: '/automation/devices', icon: Zap },
    ]
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    children: [
      { name: 'Overview', href: '/analytics', icon: BarChart3 },
      { name: 'Reports', href: '/analytics/reports', icon: BarChart3 },
      { name: 'Insights', href: '/analytics/insights', icon: BarChart3 },
    ]
  },
];

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const isChildActive = (children: NavigationItem[]) => {
    return children.some(child => isActiveRoute(child.href));
  };

  const renderNavigationItem = (item: NavigationItem, isMobile = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const isActive = isActiveRoute(item.href);
    const hasActiveChild = hasChildren && isChildActive(item.children!);

    if (hasChildren) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => toggleExpanded(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive || hasActiveChild
                ? 'bg-farm-100 text-farm-900 border border-farm-200'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <item.icon className={`h-5 w-5 ${isActive || hasActiveChild ? 'text-farm-600' : 'text-gray-500'}`} />
              <span>{item.name}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <ChevronDown 
              className={`h-4 w-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {isExpanded && (
            <div className="ml-6 space-y-1">
              {item.children!.map((child) => (
                <NavLink
                  key={child.href}
                  to={child.href}
                  onClick={() => isMobile && setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-farm-50 text-farm-900 border-l-2 border-farm-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <span className="w-2 h-2 rounded-full bg-current opacity-50"></span>
                  <span>{child.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.href}
        to={item.href}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive
              ? 'bg-farm-100 text-farm-900 border border-farm-200'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`
        }
      >
        <item.icon className={`h-5 w-5 ${isActive ? 'text-farm-600' : 'text-gray-500'}`} />
        <span>{item.name}</span>
        {item.badge && (
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:pt-5 lg:pb-4">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-6 mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-farm-500 p-2 rounded-lg">
              <Bird className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Chicken Tender</h1>
              <p className="text-xs text-gray-500">Smart Farm Assistant</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 flex flex-col overflow-y-auto px-6">
          <nav className="space-y-2">
            {navigationItems.map((item) => renderNavigationItem(item))}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              icon={<Settings className="w-4 h-4" />}
              className="flex-1"
            >
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<User className="w-4 h-4" />}
            />
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-farm-500 p-2 rounded-lg">
                <Bird className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Chicken Tender</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<Bell className="w-5 h-5" />}
                className="relative"
              >
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">3</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                onClick={toggleMobileMenu}
              />
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={toggleMobileMenu} />
            <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-xl">
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-5 h-5" />}
                    onClick={toggleMobileMenu}
                  />
                </div>

                {/* Mobile Navigation Items */}
                <div className="flex-1 overflow-y-auto p-4">
                  <nav className="space-y-2">
                    {navigationItems.map((item) => renderNavigationItem(item, true))}
                  </nav>
                </div>

                {/* Mobile Menu Footer */}
                <div className="border-t border-gray-200 p-4">
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Settings className="w-4 h-4" />}
                      fullWidth
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<User className="w-4 h-4" />}
                      fullWidth
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}