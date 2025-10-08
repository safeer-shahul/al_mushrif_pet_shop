// src/app/(admin)/mushrif-admin/page.tsx
'use client'; 

import React from 'react';
import { useAuth } from '@/context/AuthContext';

// Simple card component for the dashboard stats placeholder
const StatCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
  // Light theme: White background, primary accent border
  <div className={`p-6 bg-white rounded-xl shadow-lg border-l-4 border-${color}-500`}>
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
  </div>
);


// This is a client component only to access useAuth for the welcome message
const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth(); // Now allowed

  // FIX: Safely retrieve and display the first and last name
  const userName = 
      (user?.first_name && user?.last_name) 
      ? `${user.first_name} ${user.last_name}` 
      : (user?.username || 'Admin');


  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-primary">
        <h1 className="text-3xl font-bold text-primary">
          {/* FIX 2: Use combined name */}
          Welcome back, {userName}!
        </h1>
        <p className="mt-2 text-gray-600">
          Superuser portal access. Ready to manage 'al_mushrif_pet_shop'.
        </p>
      </div>

      {/* Stats Placeholder */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Orders" value="1,245" color="green" />
        <StatCard title="Revenue (30 days)" value="$54,890" color="blue" /> 
        <StatCard title="Pending Products" value="12" color="yellow" />
        <StatCard title="New Users (Today)" value="45" color="indigo" /> 
      </div>

      {/* Quick Links / Charts Placeholder */}
      <div className="bg-white p-6 rounded-xl shadow-md h-64 flex items-center justify-center">
        <p className="text-gray-500">
          Sales Overview Chart Placeholder
        </p>
      </div>
    </div>
  );
};

export default AdminDashboardPage;