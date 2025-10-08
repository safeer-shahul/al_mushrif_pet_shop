// src/components/admin/AdminHeader.tsx
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

const AdminHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  
  const getPageTitle = () => {
    const segment = pathname.split('/').pop() || 'dashboard';
    if (segment === 'mushrif-admin' || segment === '') return 'Dashboard Overview';
    // Simple way to convert path segment to title (e.g., 'products' -> 'Products')
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };
  
  // Custom function to safely get the user's full name
  const getUserDisplayName = () => {
      if (user?.first_name && user?.last_name) {
          return `${user.first_name} ${user.last_name}`;
      }
      return user?.username || user?.email || 'Admin';
  }

  return (
    // FIX 1: Removed excessive padding from the header (lg:pl-72)
    <header className="flex items-center justify-between h-20 px-4 sm:px-6 bg-white border-b border-gray-200 shadow-sm 
                       lg:pl-6"> 
      <div className="flex items-center">
        {/* Mobile Menu Toggle (Hidden for now, will be visible on small screens) */}
        <button className="text-gray-500 focus:outline-none lg:hidden">
          {/* <svg>...</svg> */}
        </button>
        
        {/* Page Title - Now correctly aligned */}
        <h1 className="text-2xl font-semibold text-gray-800">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600 hidden md:block">
          {/* FIX 2: Use custom display name function */}
          Logged in as: <span className="font-medium text-primary">{getUserDisplayName()}</span>
        </div>
        
        {/* Logout button (Visible on mobile/tablet, hidden on large screens since it's in the sidebar) */}
        <button
          onClick={logout}
          className="p-2 text-sm text-red-600 hover:text-red-800 lg:hidden" 
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;