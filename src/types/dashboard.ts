// src/types/dashboard.ts

export interface StatMetric {
    // The value might be a number or a string (like "2268.00") due to database serialization, 
    // so we make it robust on the frontend by allowing both.
    value: number | string;
    // The change field is calculated as a percentage float.
    change: number | null;
}

export interface ActivityItem {
    time: string;
    event: string;
    user: string;
    type: 'order_status_update' | 'new_order' | 'product_update' | 'new_user' | 'system_alert';
    id: string;
}

export interface DashboardStats {
    // UPDATED: Used for Shipped Orders count and comparison
    shipped_orders: StatMetric;

    // REMAINS: Revenue calculation
    revenue: StatMetric;

    // UPDATED: Used for Pending Confirmation Orders count
    pending_orders: StatMetric;

    // REMAINS: New Users count and comparison
    new_users: StatMetric;

    // REMAINS: Recent activity feed
    recent_activity: ActivityItem[];
}