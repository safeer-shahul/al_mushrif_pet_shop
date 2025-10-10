// src/components/admin/AdminHeader.tsx - Updated for mobile
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { FaBars, FaSearch, FaBell, FaUser } from 'react-icons/fa';

interface AdminHeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  sidebarOpen, 
  toggleSidebar,
  isMobile
}) => {
  const { user } = useAuth();
  const pathname = usePathname();
  
  const getPageTitle = () => {
    // Get the last segment of the path and capitalize it
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments.pop() || 'dashboard';
    
    if (segments.length === 1 && segments[0] === 'mushrif-admin' && !lastSegment) {
      return 'Dashboard';
    }
    
    // Handle hyphenated paths
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const displayName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user?.username || 'Admin';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center">
        {/* Mobile sidebar toggle button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-slate-600 hover:text-blue-600 focus:outline-none"
        >
          <FaBars className="w-5 h-5" />
        </button>
        
        {/* Page title */}
        <h1 className="ml-2 text-xl font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">
          {getPageTitle()}
        </h1>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Search box - hidden on small screens */}
        {/* <div className="hidden md:block relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-64 py-2 pl-10 pr-4 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div> */}
        
        {/* Notification bell - optional on mobile */}
        <button className="relative p-1.5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all hidden sm:block">
          <FaBell className="w-5 h-5" />
          <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white">
            3
          </span>
        </button>
        
        {/* User menu */}
        <div className="flex items-center">
          <div className="hidden sm:block mr-3 text-right">
            <p className="text-sm font-medium text-slate-700 truncate max-w-[100px] md:max-w-none">{displayName}</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md">
            <FaUser className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;