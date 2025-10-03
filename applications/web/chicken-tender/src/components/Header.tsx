import React from 'react';
import { Bird, Settings, Bell, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
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
          
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-900 hover:text-farm-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Dashboard
            </a>
            <a href="#" className="text-gray-500 hover:text-farm-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Flock
            </a>
            <a href="#" className="text-gray-500 hover:text-farm-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Automation
            </a>
            <a href="#" className="text-gray-500 hover:text-farm-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Analytics
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <Bell className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">3</span>
              </div>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}