// src/app/(admin)/mushrif-admin/layout.tsx
'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';

export default function RootAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requireSuperuser={true} redirectTo="/mushrif-admin-login">
      <AdminLayout>
        {children}
      </AdminLayout>
    </ProtectedRoute>
  );
}