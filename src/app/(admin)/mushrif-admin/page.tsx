// src/app/(admin)/mushrif-admin/page.tsx
'use client'; 

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaBoxes, FaChartLine, FaExclamationCircle, FaUserPlus } from 'react-icons/fa';

// Enhanced stat card component
const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  change?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ title, value, change, icon, color, trend }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-5">
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-1 text-2xl font-bold text-gray-900">{value}</h3>
          {change && (
            <p className={`mt-1 text-xs font-medium ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-500'
            }`}>
              {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}{change}
            </p>
          )}
        </div>
        <div className={`flex items-center justify-center h-12 w-12 rounded-lg bg-${color}-100 text-${color}-600`}>
          {icon}
        </div>
      </div>
    </div>
    <div className={`h-1 bg-${color}-500`}></div>
  </div>
);

// Chart card component
const ChartCard: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <select className="text-sm border-gray-300 rounded focus:border-primary focus:ring focus:ring-primary/20">
        <option>This Week</option>
        <option>This Month</option>
        <option>This Year</option>
      </select>
    </div>
    <div className="flex items-center justify-center h-60">
      {children || <p className="text-gray-500">Sales Overview Chart Placeholder</p>}
    </div>
  </div>
);

// Recent activity card component
const ActivityCard: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
    <div className="space-y-4">
      {[
        { time: '2 hours ago', event: 'New order #1432 received', user: 'Customer A' },
        { time: '5 hours ago', event: 'Product "Premium Dog Food" updated', user: 'Admin User' },
        { time: '1 day ago', event: 'New user registered', user: 'User B' },
        { time: '2 days ago', event: 'Inventory alert: Low stock for "Cat Toys"', user: 'System' },
      ].map((item, index) => (
        <div key={index} className="flex items-start pb-3 border-b border-gray-100">
          <div className="w-2 h-2 mt-1.5 rounded-full bg-primary flex-shrink-0"></div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{item.event}</p>
            <div className="flex text-xs text-gray-500 mt-1">
              <span>{item.time}</span>
              <span className="mx-1">•</span>
              <span>{item.user}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Main dashboard component
const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const userName = 
      (user?.first_name && user?.last_name) 
      ? `${user.first_name} ${user.last_name}` 
      : (user?.username || 'Admin');

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Welcome back, {userName}!
            </h1>
            <p className="mt-2 text-gray-600">
              Here's what's happening with al_mushrif_pet_shop today.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors">
              View Reports
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Orders" 
          value="1,245" 
          change="+12% from last month"
          icon={<FaBoxes size={24} />} 
          color="green"
          trend="up" 
        />
        <StatCard 
          title="Revenue (30 days)" 
          value="$54,890" 
          change="+8.3% from previous period"
          icon={<FaChartLine size={24} />} 
          color="blue"
          trend="up" 
        />
        <StatCard 
          title="Pending Products" 
          value="12" 
          change="Requires attention"
          icon={<FaExclamationCircle size={24} />} 
          color="yellow"
          trend="neutral" 
        />
        <StatCard 
          title="New Users (Today)" 
          value="45" 
          change="-5% from yesterday"
          icon={<FaUserPlus size={24} />} 
          color="indigo"
          trend="down" 
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Sales Overview" />
        </div>
        <div className="lg:col-span-1">
          <ActivityCard />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;