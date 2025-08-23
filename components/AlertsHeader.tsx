'use client';

import { Bell, Settings } from 'lucide-react';

interface AlertsHeaderProps {
  unreadCount: number;
}

export default function AlertsHeader({ unreadCount }: AlertsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Bell className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
        </div>
        
        {unreadCount > 0 && (
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {unreadCount} unread
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </button>
      </div>
    </div>
  );
}
