'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FaBoxes, FaChartLine, FaExclamationCircle, FaUserPlus, FaSync, FaShoppingCart, FaTruck } from 'react-icons/fa';
import NotificationToggle from '@/components/admin/NotificationToggle';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAdminDashboardService } from '@/services/admin/useAdminDashboardService';
import { DashboardStats, ActivityItem } from '@/types/dashboard';

// --- StatCard component (Logic Adjusted for Pending Orders) ---
const StatCard: React.FC<{
  title: string;
  value: string;
  change?: number | null;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, change, icon, color }) => {
  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  let changeText = 'No Change';

  if (change !== null && typeof change === 'number') {
    const absChange = Math.abs(change);
    changeText = `${absChange.toFixed(1)}%`;

    if (change > 0) {
      trend = 'up';
      changeText = `+${changeText} from last period`;
    } else if (change < 0) {
      trend = 'down';
      changeText = `${changeText} from last period`;
    } else {
      changeText = 'No significant change';
    }
  }

  // CUSTOM LOGIC for PENDING ORDERS
  if (title === "Pending Orders") {
    if (parseFloat(value) > 0) {
      trend = 'down'; // Use down/red to show urgent backlog
      changeText = `${value} orders awaiting confirmation`;
    } else {
      trend = 'up';
      changeText = 'Zero orders pending!';
    }
  }

  // Fallback color mapping for dynamic Tailwind classes
  const bgColor = `bg-${color}-100`;
  const textColor = `text-${color}-600`;
  const accentColor = `bg-${color}-500`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="mt-1 text-2xl font-bold text-gray-900">{value}</h3>
            {changeText && (
              <p className={`mt-1 text-xs font-medium ${trend === 'up' ? 'text-green-600' :
                  trend === 'down' ? 'text-red-600' :
                    'text-gray-500'
                }`}>
                {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}{changeText}
              </p>
            )}
          </div>
          <div className={`flex items-center justify-center h-12 w-12 rounded-lg ${bgColor} ${textColor}`}>
            {icon}
          </div>
        </div>
      </div>
      <div className={`h-1 ${accentColor}`}></div>
    </div>
  );
};

// Recent activity card component - REMAINS THE SAME
const ActivityCard: React.FC<{ activity: ActivityItem[] }> = ({ activity }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
      {/* Split activity into two columns for desktop view */}
      {activity.reduce((acc, item, index) => {
        const column = index % 2 === 0 ? 'col1' : 'col2';
        if (!acc[column]) acc[column] = [];
        acc[column].push(item);
        return acc;
      }, {} as Record<string, ActivityItem[]>).col1?.map((item, index) => {
        const isOrder = item.type === 'order_status_update' || item.type === 'new_order';
        const Icon = isOrder ? FaShoppingCart : item.type === 'new_user' ? FaUserPlus : FaExclamationCircle;
        const link = isOrder ? `/mushrif-admin/orders/detail?id=${item.id}` : '#';

        return (
          <div key={index} className="flex items-start pb-3 border-b border-gray-100 last:border-b-0">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-primary flex-shrink-0"></div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate flex items-center">
                <Icon className='mr-2 w-4 h-4 text-blue-500 flex-shrink-0' />
                <span dangerouslySetInnerHTML={{ __html: item.event }}></span>
              </p>
              <div className="flex text-xs text-gray-500 mt-1">
                <span>{item.time}</span>
                <span className="mx-1">•</span>
                <span>{item.user}</span>
                {isOrder && (
                  <Link href={link} className="ml-2 text-blue-500 hover:text-blue-700 font-semibold underline">
                    View
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {activity.length === 0 && <p className="text-gray-500 text-sm">No recent activity to display.</p>}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
      {activity.reduce((acc, item, index) => {
        const column = index % 2 === 0 ? 'col1' : 'col2';
        if (!acc[column]) acc[column] = [];
        acc[column].push(item);
        return acc;
      }, {} as Record<string, ActivityItem[]>).col2?.map((item, index) => {
        const isOrder = item.type === 'order_status_update' || item.type === 'new_order';
        const Icon = isOrder ? FaShoppingCart : item.type === 'new_user' ? FaUserPlus : FaExclamationCircle;
        const link = isOrder ? `/mushrif-admin/orders/detail?id=${item.id}` : '#';

        return (
          <div key={index + activity.length} className="flex items-start pb-3 border-b border-gray-100 last:border-b-0">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-primary flex-shrink-0"></div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate flex items-center">
                <Icon className='mr-2 w-4 h-4 text-blue-500 flex-shrink-0' />
                <span dangerouslySetInnerHTML={{ __html: item.event }}></span>
              </p>
              <div className="flex text-xs text-gray-500 mt-1">
                <span>{item.time}</span>
                <span className="mx-1">•</span>
                <span>{item.user}</span>
                {isOrder && (
                  <Link href={link} className="ml-2 text-blue-500 hover:text-blue-700 font-semibold underline">
                    View
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);


// Main dashboard component
const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { fetchDashboardStats } = useAdminDashboardService();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const userName =
    (user?.first_name && user?.last_name)
      ? `${user.first_name} ${user.last_name}`
      : (user?.username || 'Admin');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !stats) {
    return <div className="p-8 text-red-600 bg-red-50 border border-red-200 rounded-lg">{error || "No dashboard data available."}</div>;
  }

  // --- Data Mapping (Using new keys) ---
  const shippedOrdersValue = stats.shipped_orders.value.toLocaleString() || '0'; // Use new key
  const revenueNumber = parseFloat(stats.revenue.value as unknown as string);
  const revenueValue = `AED ${(revenueNumber.toFixed(2) || '0.00')}`;
  const pendingOrdersValue = stats.pending_orders.value.toLocaleString() || '0'; // Use new key
  const newUsersValue = stats.new_users.value.toLocaleString() || '0';
  const recentActivity = stats.recent_activity;

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
              Here's what's happening with **al_mushrif_pet_shop** today.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <button
              onClick={loadStats}
              disabled={loading}
              className="px-4 py-2 bg-white text-slate-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
            {/* <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors">
              View Reports
            </button> */}
          </div>
        </div>
      </div>

      {/* Notification Activation/Status Card */}
      <NotificationToggle />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Shipped Orders (30 days)" // UPDATED TITLE
          value={shippedOrdersValue}
          change={stats.shipped_orders.change}
          icon={<FaTruck size={24} />} // Use Truck icon for Shipped
          color="green"
        />
        <StatCard
          title="Revenue (30 days)"
          value={revenueValue}
          change={stats.revenue.change}
          icon={<FaChartLine size={24} />}
          color="blue"
        />
        <StatCard
          title="Pending Orders" // UPDATED TITLE
          value={pendingOrdersValue}
          change={null}
          icon={<FaExclamationCircle size={24} />}
          color="yellow"
        />
        <StatCard
          title="New Users (24 hours)"
          value={newUsersValue}
          change={stats.new_users.change}
          icon={<FaUserPlus size={24} />}
          color="indigo"
        />
      </div>

      {/* Recent Activity (Full Width with Two Columns) */}
      <div className="grid grid-cols-1">
        <ActivityCard activity={recentActivity} />
      </div>
    </div>
  );
};

export default AdminDashboardPage;