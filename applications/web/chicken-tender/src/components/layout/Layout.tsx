import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import EnhancedNavigation from '../navigation/EnhancedNavigation';
import Breadcrumb from '../navigation/Breadcrumb';

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* TopNavBar matching unified_ui.py */}
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation - Fixed position, responsive widths matching unified_ui.py */}
        {/* Desktop XL (1600px): 260px, Desktop L (1440px): 240px, Desktop M (1280px): 220px */}
        {/* Tablet (1024px): 200px, Mobile: drawer */}
        <EnhancedNavigation />
        
        {/* Main Content Area - Accounts for fixed left nav */}
        {/* The Dashboard component will handle its own 3-column layout (viewport + right panel) */}
        <div className="flex-1 md:ml-[200px] lg:ml-[240px] xl:ml-[260px] overflow-hidden">
          {/* Content Header - Only show breadcrumb on non-dashboard pages */}
          <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 md:px-8 hidden">
            <Breadcrumb />
          </div>
          
          {/* Page Content - Full height for dashboard */}
          <main className="flex-1 h-full overflow-hidden">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </div>
  );
}