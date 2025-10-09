// src/components/admin/AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FaTachometerAlt, FaBoxOpen, FaThList, FaTags, FaFilter, FaShoppingBag, FaFileAlt, FaUsers, FaSignOutAlt, FaFolderOpen, FaLayerGroup } from 'react-icons/fa'; // Added new icons

const adminMenuItems = [
    { name: 'Dashboard Overview', href: '/mushrif-admin', icon: FaTachometerAlt },
    { name: 'Products', href: '/mushrif-admin/products', icon: FaBoxOpen },
    // SEPARATED CATEGORY MANAGEMENT
    { name: 'Root Categories', href: '/mushrif-admin/root-categories', icon: FaFolderOpen }, // <-- NEW
    { name: 'Sub Categories', href: '/mushrif-admin/sub-categories', icon: FaLayerGroup }, // <-- NEW
    { name: 'Brands', href: '/mushrif-admin/brands', icon: FaTags },
    { name: 'Filters', href: '/mushrif-admin/filters', icon: FaFilter },
    { name: 'Orders', href: '/mushrif-admin/orders', icon: FaShoppingBag },
    { name: 'Content Management', href: '/mushrif-admin/content', icon: FaFileAlt },
    { name: 'User Management', href: '/mushrif-admin/users', icon: FaUsers },
];

const AdminSidebar: React.FC = () => {
    const pathname = usePathname();
    const { logout } = useAuth(); 

    return (
        <div className="fixed inset-y-0 left-0 z-20 w-64 overflow-y-auto transition duration-300 transform 
                         bg-primary border-r border-primary/70 lg:translate-x-0 hidden lg:block">
            
            <div className="flex items-center justify-center h-20 bg-primary-light border-b border-primary/80">
                <span className="text-2xl font-bold text-white">
                    Mushrif Admin
                </span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {adminMenuItems.map((item) => {
                    // Check if path starts with the item href for active state on sub-pages (e.g., /edit)
                    const isActive = pathname.startsWith(item.href); 
                    const Icon = item.icon; 

                    return (
                        <Link 
                            key={item.name} 
                            href={item.href} 
                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition duration-200 
                                ${
                                    isActive
                                        // Active: Light background, white text
                                        ? 'bg-primary-light text-white shadow-md'
                                        // Inactive: White text on dark primary background
                                        : 'text-white hover:bg-primary-light/50'
                                }
                            `}
                        >
                            <Icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="absolute bottom-0 left-0 w-full p-4">
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 transition"
                >
                    <FaSignOutAlt className="mr-2" /> Sign Out
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;