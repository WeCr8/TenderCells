import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  ChevronDown,
  ChevronRight,
  Cpu,
  Plus
} from 'lucide-react';
import { Button } from '../ui/Button/Button';
import NotificationPanel from './NotificationPanel';
import AccountMenu from './AccountMenu';
import AddFunctionButton from '../common/AddFunctionButton';
import UserProfileMenu from '../auth/UserProfileMenu';
import { useAuthContext } from '../auth/AuthContext';
import type { NavigationItem, NotificationItem, UserProfile, NavigationState } from '../../types/navigation';

// Navigation items matching unified_ui.py and image design
// These will be made product-aware in the component
const getNavigationItems = (product: string = 'chicken-tender'): NavigationItem[] => [
  {
    name: 'Dashboard',
    href: '/app',
    icon: Home,
  },
  {
    name: 'Coop Settings',
    href: '/app/settings',
    icon: Settings,
  },
  {
    name: 'Doors & Latches',
    href: '/app/automation/devices',
    icon: Settings,
  },
  {
    name: 'Motors & Rails',
    href: '/app/automation/devices',
    icon: Zap,
  },
  {
    name: 'Robot Arm',
    href: '/app/automation/cnc',
    icon: Cpu,
  },
  {
    name: 'Sensors',
    href: '/app/automation/devices',
    icon: Settings,
  },
  {
    name: 'Feeding & Water',
    href: '/app/automation',
    icon: Users,
  },
  {
    name: 'Waste Cleaning',
    href: '/app/automation',
    icon: Settings,
  },
  {
    name: 'Egg Map',
    href: '/app/analytics',
    icon: BarChart3,
  },
  {
    name: 'Schedules',
    href: '/app/automation/schedules',
    icon: Settings,
  },
  {
    name: 'Custom Settings',
    href: '/app/settings',
    icon: Settings,
  },
  {
    name: 'Account',
    href: '/app/account',
    icon: User,
  },
];

// Mock data - replace with actual API calls
const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Chicken Missing',
    message: 'Goldy (RF004) not detected for 2 hours',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    actionUrl: '/flock',
    actionLabel: 'Locate'
  },
  {
    id: '2',
    type: 'info',
    title: 'Low Water Level',
    message: 'Water dispenser at 15% capacity',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isRead: false,
    actionUrl: '/automation',
    actionLabel: 'Refill'
  },
  {
    id: '3',
    type: 'success',
    title: 'Feeding Complete',
    message: 'Automatic morning feeding finished successfully',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    isRead: true
  }
];

export default function EnhancedNavigation() {
  const { user } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNotificationPanelOpen: false,
    isAccountMenuOpen: false,
    unreadNotifications: mockNotifications.filter(n => !n.isRead).length,
    currentUser: user ? {
      id: user.id,
      name: user.name || '',
      email: user.email,
      role: user.role,
      lastLogin: new Date().toISOString()
    } : null
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  const location = useLocation();
  const navigate = useNavigate();
  
  // Get current product from URL or default to chicken-tender
  // Products: chicken-tender, roaming-roost, duck-dock, goat-guardian, bunny-burrow, etc.
  const getCurrentProduct = () => {
    const path = location.pathname;
    // Check if we're on a product-specific route
    if (path.includes('/products/')) {
      const match = path.match(/\/products\/([^/]+)/);
      return match ? match[1] : 'chicken-tender';
    }
    // Default to chicken-tender for /app routes
    return 'chicken-tender';
  };
  
  const currentProduct = getCurrentProduct();

  // Update current user when auth user changes
  useEffect(() => {
    if (user) {
      setNavigationState(prev => ({
        ...prev,
        currentUser: {
          id: user.id,
          name: user.name || '',
          email: user.email,
          role: user.role,
          lastLogin: new Date().toISOString()
        }
      }));
    } else {
      setNavigationState(prev => ({
        ...prev,
        currentUser: null
      }));
    }
  }, [user]);

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

  const toggleNotificationPanel = () => {
    setNavigationState(prev => ({
      ...prev,
      isNotificationPanelOpen: !prev.isNotificationPanelOpen,
      isAccountMenuOpen: false
    }));
  };

  const toggleAccountMenu = () => {
    setNavigationState(prev => ({
      ...prev,
      isAccountMenuOpen: !prev.isAccountMenuOpen,
      isNotificationPanelOpen: false
    }));
  };

  const closeAllMenus = () => {
    setNavigationState(prev => ({
      ...prev,
      isNotificationPanelOpen: false,
      isAccountMenuOpen: false
    }));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
    setNavigationState(prev => ({
      ...prev,
      unreadNotifications: prev.unreadNotifications - 1
    }));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setNavigationState(prev => ({
      ...prev,
      unreadNotifications: 0
    }));
  };

  const handleClearAll = () => {
    setNotifications([]);
    setNavigationState(prev => ({
      ...prev,
      unreadNotifications: 0
    }));
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    closeAllMenus();
  };

  const isActiveRoute = (href: string) => {
    if (href === '/app' || href === '/app/') {
      return location.pathname === '/app' || location.pathname === '/app/';
    }
    if (href === '/') {
      return location.pathname === '/';
    }
    // For routes that share the same base path, check for exact match or query params
    // This ensures "Sensors", "Doors & Latches", etc. work correctly
    const currentPath = location.pathname;
    const currentSearch = location.search;
    
    // Exact match
    if (currentPath === href) {
      return true;
    }
    
    // Check if it's a parent route (e.g., /app/automation matches /app/automation/schedules)
    if (currentPath.startsWith(href + '/')) {
      return true;
    }
    
    return false;
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

    // Matching unified_ui.py SideMenuItem with arrow indicator
    // Ensure NavLink works correctly for all routes
    return (
      <NavLink
        key={item.href}
        to={item.href}
        onClick={() => {
          // Close mobile menu if needed
          if (isMobile) {
            setIsMobileMenuOpen(false);
          }
          closeAllMenus();
          // NavLink will handle navigation automatically
        }}
        end={item.href === '/app'} // Use exact match for dashboard
        className={({ isActive: navIsActive }) => {
          // Use NavLink's isActive for styling
          const active = navIsActive || isActive;
          return `flex items-center justify-between px-3 py-2 rounded-md text-sm min-h-[44px] transition-colors cursor-pointer ${
            active
              ? 'bg-primary-100 text-primary-900 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`;
        }}
      >
        <div className="flex items-center space-x-3">
          <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
          <span>{item.name}</span>
        </div>
        <ChevronRight className="w-4 h-4 opacity-50" />
      </NavLink>
    );
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.notification-panel') && !target.closest('.account-menu') && 
          !target.closest('.notification-button') && !target.closest('.account-button')) {
        closeAllMenus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Desktop Navigation - Responsive widths matching unified_ui.py */}
      {/* md (900px): 200px, lg (1200px): 240px, xl (1600px): 260px */}
      <nav className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:border-r md:border-gray-200 md:bg-white md:pt-5 md:pb-4 md:w-[200px] lg:w-[240px] xl:w-[260px] md:z-10">
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

        {/* Navigation Items - Matching unified_ui.py SideMenu */}
        <div className="flex-1 flex flex-col overflow-y-auto px-2">
          <nav className="space-y-1">
            {getNavigationItems(currentProduct).map((item) => renderNavigationItem(item))}
          </nav>
        </div>

        {/* Quick Add Button */}
        <div className="px-6 py-4">
          <AddFunctionButton className="w-full" />
        </div>

        {/* Bottom Actions */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <div className="relative notification-button">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Bell className="w-4 h-4" />}
                  onClick={toggleNotificationPanel}
                  className={`relative ${navigationState.isNotificationPanelOpen ? 'bg-gray-100' : ''}`}
                >
                  {navigationState.unreadNotifications > 0 && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {navigationState.unreadNotifications > 9 ? '9+' : navigationState.unreadNotifications}
                      </span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Settings */}
              <Button
                variant="ghost"
                size="sm"
                icon={<Settings className="w-4 h-4" />}
                onClick={() => navigate('/settings')}
              />
            </div>

            {/* User Profile Menu */}
            <UserProfileMenu />
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
              {/* Mobile Add Button */}
              <AddFunctionButton />
              
              {/* Mobile Notifications */}
              <div className="relative notification-button">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Bell className="w-5 h-5" />}
                  onClick={toggleNotificationPanel}
                  className="relative"
                >
                  {navigationState.unreadNotifications > 0 && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {navigationState.unreadNotifications > 9 ? '9+' : navigationState.unreadNotifications}
                      </span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Mobile Menu Toggle */}
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
                    {getNavigationItems(currentProduct).map((item) => renderNavigationItem(item, true))}
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
                      onClick={() => {
                        navigate('/settings');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Settings
                    </Button>
                    <UserProfileMenu className="w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Panel */}
      <div className="notification-panel">
        <NotificationPanel
          isOpen={navigationState.isNotificationPanelOpen}
          onClose={closeAllMenus}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClearAll={handleClearAll}
        />
      </div>
    </>
  );
}