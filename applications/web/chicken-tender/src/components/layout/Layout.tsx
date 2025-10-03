import React from 'react';
import { Outlet } from 'react-router-dom';
import EnhancedNavigation from '../navigation/EnhancedNavigation';
import Breadcrumb from '../navigation/Breadcrumb';

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Content Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
          <Breadcrumb />
        </div>
        
        {/* Page Content */}
        <main className="flex-1">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}