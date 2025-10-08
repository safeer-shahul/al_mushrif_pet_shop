// src/app/(admin)/mushrif-admin/layout.tsx

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export const metadata = {
  title: 'Admin Dashboard | al_mushrif_pet_shop',
  description: 'Management portal for superusers and staff.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Wrap the entire admin section with ProtectedRoute
    <ProtectedRoute requireSuperuser={true} redirectTo="/mushrif-admin-login">
      {/* Main App Container */}
      <div className="flex h-screen bg-gray-50"> 
        
        {/* 1. Fixed Left Sidebar (w-64) */}
        <AdminSidebar />

        {/* 2. Main Content Wrapper */}
        <div className="flex flex-col flex-1 overflow-y-auto lg:pl-64"> 
          
          {/* Header */}
          <AdminHeader />

          {/* Main Content Area */}
          <main className="flex-1">
            <div className="container mx-auto px-4 sm:px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}