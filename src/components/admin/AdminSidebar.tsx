// src/components/admin/AdminSidebar.tsx - Updated mobile handling
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  FaTachometerAlt, FaBoxOpen, FaTags, FaFilter,
  FaShoppingBag, FaFileAlt, FaUsers, FaSignOutAlt,
  FaChevronDown, FaChevronRight, FaFolder, FaFolderOpen,
  FaLayerGroup, FaBars, FaTimes, FaAngleRight
} from 'react-icons/fa';

interface AdminSidebarProps {
  isOpen: boolean;
  toggle: () => void;
  isMobile: boolean;
}

interface MenuItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/mushrif-admin', icon: FaTachometerAlt },
  { name: 'Products', href: '/mushrif-admin/products', icon: FaBoxOpen },
  { 
    name: 'Categories', 
    icon: FaFolder,
    children: [
      { name: 'Root Categories', href: '/mushrif-admin/root-categories', icon: FaFolderOpen },
      { name: 'Sub Categories', href: '/mushrif-admin/sub-categories', icon: FaLayerGroup }
    ]
  },
  { name: 'Brands', href: '/mushrif-admin/brands', icon: FaTags },
  { name: 'Filters', href: '/mushrif-admin/filters', icon: FaFilter },
  { name: 'Orders', href: '/mushrif-admin/orders', icon: FaShoppingBag },
  { name: 'Content', href: '/mushrif-admin/content', icon: FaFileAlt },
  { name: 'Users', href: '/mushrif-admin/users', icon: FaUsers },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, toggle, isMobile }) => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  // Initialize expanded state based on current route
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.children && item.children.some(child => pathname.startsWith(child.href || ''))) {
        setExpandedMenu(item.name);
      }
    });
  }, [pathname]);

  const toggleMenu = (menuName: string) => {
    setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Different positioning for mobile vs desktop
  const sidebarPositionClasses = isMobile
    ? `fixed inset-y-0 left-0 z-30 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
    : 'fixed inset-y-0 left-0 z-30';

  const sidebarWidthClass = isOpen ? 'w-64' : (isMobile ? 'w-64' : 'w-20');

  return (
    <aside 
      className={`
        ${sidebarPositionClasses}
        ${sidebarWidthClass}
        flex flex-col transition-all duration-300 ease-in-out
        bg-gradient-to-br from-slate-800 to-slate-900 text-white
        ${!isOpen && !isMobile ? 'items-center' : ''}
      `}
    >
      {/* Header */}
      <div className={`
        flex items-center h-16 px-4 border-b border-slate-700/50
        ${isOpen || isMobile ? 'justify-between' : 'justify-center'}
      `}>
        {(isOpen || isMobile) && (
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Mushrif Admin
          </span>
        )}
        <button 
          onClick={toggle}
          className="p-1.5 rounded-md text-white hover:bg-slate-700 transition-colors"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
        </button>
      </div>
      
      {/* Navigation - Scrollable */}
      <div className={`
        flex-1 overflow-y-auto py-5 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800
        ${isOpen || isMobile ? 'px-3' : 'px-2'}
      `}>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              {!item.children ? (
                <Link 
                  href={item.href || '#'} 
                  className={`
                    flex items-center px-3 py-2.5 rounded-lg transition-all
                    ${isActive(item.href) 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
                    ${!isOpen && !isMobile ? 'justify-center' : ''}
                  `}
                >
                  <item.icon className={isOpen || isMobile ? 'w-5 h-5 mr-3' : 'w-5 h-5'} />
                  {(isOpen || isMobile) && <span className="font-medium">{item.name}</span>}
                </Link>
              ) : (
                <div>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`
                      w-full flex items-center px-3 py-2.5 rounded-lg transition-all
                      ${expandedMenu === item.name 
                        ? 'bg-slate-700 text-white' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
                      ${!isOpen && !isMobile ? 'justify-center' : 'justify-between'}
                    `}
                  >
                    <span className="flex items-center">
                      <item.icon className={isOpen || isMobile ? 'w-5 h-5 mr-3' : 'w-5 h-5'} />
                      {(isOpen || isMobile) && <span className="font-medium">{item.name}</span>}
                    </span>
                    {(isOpen || isMobile) && (
                      expandedMenu === item.name ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />
                    )}
                  </button>
                  
                  {/* Dropdown items */}
                  {(isOpen || isMobile) && expandedMenu === item.name && (
                    <ul className="mt-1.5 ml-2 pl-4 space-y-1 border-l border-slate-700">
                      {item.children.map((child) => (
                        <li key={child.name}>
                          <Link 
                            href={child.href || '#'} 
                            className={`
                              flex items-center px-3 py-2 text-sm rounded-md transition-colors
                              ${isActive(child.href) 
                                ? 'bg-blue-600/30 text-blue-300 font-medium' 
                                : 'text-slate-400 hover:bg-slate-700 hover:text-white'}
                            `}
                          >
                            <child.icon className="w-4 h-4 mr-2" />
                            <span>{child.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Footer with logout button */}
      <div className={`p-4 ${!isOpen && !isMobile ? 'flex justify-center' : ''}`}>
        <button
          onClick={logout}
          className={`
            flex items-center justify-center px-4 py-2.5 rounded-md bg-gradient-to-r from-red-600 to-rose-500 
            text-white hover:from-red-700 hover:to-rose-600 transition-all shadow-lg shadow-red-500/20
            ${isOpen || isMobile ? 'w-full' : 'p-2.5'}
          `}
        >
          <FaSignOutAlt className={isOpen || isMobile ? 'w-4 h-4 mr-2' : 'w-4 h-4'} />
          {(isOpen || isMobile) && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;