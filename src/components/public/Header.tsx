// src/components/public/Header.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaUser, FaBars, FaTimes, FaPaw } from 'react-icons/fa';
import { RootCategory, SubCategory } from '@/types/category';
import { useCategoryService } from '@/services/admin/categoryService'; // Use this for nested category fetch
import MarqueeBar from './MarqueeBar'; // Import the Marquee component
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import LoginModal from './LoginModal';
import CartDrawer from './CartDrawer';

const STATIC_MENU_ITEMS = [
    { name: 'OUR BRANDS', href: '/brands' },
    { name: 'OFFER ZONE', href: '/offers' },
    { name: 'NEW ARRIVALS', href: '/new' },
    { name: 'SERVICES', href: '/services' },
];

/**
 * Public Header Component: Includes Marquee, Logo, Navigation, and Cart/Auth controls.
 */
const Header: React.FC = () => {
    const { fetchAllRootCategories } = useCategoryService();
    const { isAuthenticated, user, logout } = useAuth();
    const { cartCount } = useCart();

    const [rootCategories, setRootCategories] = useState<RootCategory[]>([]);
    const [navLoading, setNavLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile category sidebar state
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
    const [activeRootCategory, setActiveRootCategory] = useState<RootCategory | null>(null); // State for mega menu hover

    // 1. Fetch Categories for Navigation
    const fetchCategories = useCallback(async () => {
        setNavLoading(true);
        try {
            // This fetches the deeply nested structure (Root -> L1 SubCat -> L2 SubCat)
            const categories = await fetchAllRootCategories();
            setRootCategories(categories);
        } catch (error) {
            console.error('Failed to load navigation categories:', error);
            setRootCategories([]);
        } finally {
            setNavLoading(false);
        }
    }, [fetchAllRootCategories]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);
    
    // 2. Helper to check if a SubCategory is active (L1 Column Title)
    const isL1Active = (subCat: SubCategory) => {
        // L1 SubCats are non-clickable headings, they should only trigger the mega menu hover state.
        return false;
    }

    // 3. Helper for Nav Item Click (handles mobile menu closure)
    const handleNavLinkClick = () => {
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
    };
    
    // 4. Handle Logout
    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
    }
    
    // 5. Handle Login Modal toggle
    const handleLoginClick = () => {
        if (isAuthenticated) {
            // If logged in, maybe show a profile/dashboard link or handle logout from a mini-menu
            return; 
        }
        setIsLoginModalOpen(true);
    }


    // Mega Menu Content Renderer (Recursive up to L2)
    const renderMegaMenu = (rootCat: RootCategory) => {
        // Filter L1 categories that are directly under the Root Cat
        const l1SubCats = rootCat.subCategories?.filter(sc => sc.parent_id === rootCat.id) || [];
        
        return (
            <div 
                className="absolute left-0 right-0 top-full bg-white border border-t-0 border-gray-200 shadow-xl py-6 px-8 flex z-10"
                onMouseEnter={() => setActiveRootCategory(rootCat)}
                onMouseLeave={() => setActiveRootCategory(null)}
            >
                {l1SubCats.map(l1Cat => (
                    // L1 SubCategory: Column Title (e.g., FOOD & TREATS)
                    <div key={l1Cat.id} className="w-1/5 min-w-[150px] mr-8">
                        <h4 className="uppercase font-bold text-sm mb-3" style={{ color: 'var(--color-primary)' }}>
                            {l1Cat.sub_cat_name}
                        </h4>
                        
                        {/* L2 SubCategories: Clickable links (e.g., Parrot & Parakeet) */}
                        <ul className="space-y-1">
                            {l1Cat.children?.map(l2Cat => (
                                <li key={l2Cat.id}>
                                    <Link 
                                        href={`/products?category_id=${l2Cat.id}`} // Links to the product listing page with filtering
                                        onClick={handleNavLinkClick}
                                        className="text-sm text-gray-700 hover:text-blue-600 transition-colors block"
                                    >
                                        {l2Cat.sub_cat_name}
                                    </Link>
                                </li>
                            ))}
                            {/* L2 category links that may link to products are generated here */}
                        </ul>
                    </div>
                ))}
            </div>
        );
    };


    return (
        <header className="sticky top-0 z-50">
            {/* Marquee Bar (Phase 4.1) */}
            <MarqueeBar />

            {/* Main Header Bar */}
            <div className="bg-white shadow-md border-b border-gray-100 h-20 px-4 sm:px-8 flex items-center justify-between">
                
                {/* Logo & Mobile Menu Toggle */}
                <div className="flex items-center space-x-4">
                    <button 
                        className="lg:hidden p-2 text-slate-700 hover:bg-gray-100 rounded"
                        onClick={() => setIsMenuOpen(true)}
                    >
                        <FaBars className="w-6 h-6" />
                    </button>
                    <Link href="/" className="flex items-center space-x-2">
                        {/* Placeholder for Logo */}
                        <FaPaw className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
                        <span className="text-xl font-bold text-slate-800 hidden sm:block">
                            Al Mushrif Pet Shop
                        </span>
                    </Link>
                </div>

                {/* Main Navigation (Desktop) */}
                <nav className="hidden lg:flex flex-1 justify-center space-x-6 h-full">
                    {rootCategories.map(rootCat => (
                        <div 
                            key={rootCat.id} 
                            className="relative flex items-center h-full"
                            onMouseEnter={() => setActiveRootCategory(rootCat)}
                            onMouseLeave={() => setActiveRootCategory(null)}
                        >
                            <Link 
                                href={`/products?root_category_id=${rootCat.id}`}
                                className={`text-sm font-bold uppercase py-2 border-b-2 transition-colors ${
                                    activeRootCategory?.id === rootCat.id 
                                        ? 'border-blue-600 text-blue-600' 
                                        : 'border-transparent text-slate-700 hover:text-blue-500'
                                }`}
                                style={{ borderColor: activeRootCategory?.id === rootCat.id ? 'var(--color-primary)' : 'transparent' }}
                            >
                                {rootCat.cat_name}
                            </Link>
                            
                            {/* Render Mega Menu */}
                            {activeRootCategory?.id === rootCat.id && renderMegaMenu(rootCat)}
                        </div>
                    ))}
                    
                    {/* Static Menu Items */}
                    {STATIC_MENU_ITEMS.map(item => (
                        <Link 
                            key={item.name} 
                            href={item.href} 
                            className="text-sm font-bold uppercase text-slate-700 hover:text-blue-500 transition-colors flex items-center h-full border-b-2 border-transparent"
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Icons (Cart & Auth) */}
                <div className="flex items-center space-x-4">
                    {/* Auth/User Icon */}
                    <button 
                        onClick={handleLoginClick}
                        className="p-2 text-slate-700 hover:bg-gray-100 rounded-full transition-colors relative"
                        title={isAuthenticated ? `Welcome, ${user?.first_name || user?.username}` : 'Login / Register'}
                    >
                        <FaUser className="w-5 h-5" />
                        {isAuthenticated && (
                            <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                        )}
                    </button>
                    
                    {/* Cart Icon */}
                    <button 
                        onClick={() => setIsCartDrawerOpen(true)}
                        className="p-2 text-slate-700 hover:bg-gray-100 rounded-full transition-colors relative"
                        title="Shopping Cart"
                    >
                        <FaShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
            
            {/* 6. Mobile Category Sidebar (Overlay) */}
            <div className={`fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-2xl transform transition-transform duration-300 lg:hidden ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Shop Categories</h3>
                    <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-700 hover:bg-gray-100 rounded"><FaTimes /></button>
                </div>
                <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-6rem)]">
                    {/* Render flattened mobile menu hierarchy here */}
                    {rootCategories.map(rootCat => (
                        <details key={rootCat.id} className="group cursor-pointer">
                            <summary className="flex justify-between items-center py-2 text-sm font-bold uppercase text-slate-700 hover:text-blue-600">
                                {rootCat.cat_name}
                            </summary>
                            <ul className="ml-4 space-y-1 py-1 border-l border-gray-200">
                                {rootCat.subCategories?.map(l1Cat => (
                                    <details key={l1Cat.id} className="group">
                                        <summary className="py-1 text-sm font-semibold text-slate-600 hover:text-slate-800">
                                            {l1Cat.sub_cat_name}
                                        </summary>
                                        <ul className="ml-4 space-y-1 py-1 border-l border-gray-100">
                                            {l1Cat.children?.map(l2Cat => (
                                                <li key={l2Cat.id}>
                                                    <Link 
                                                        href={`/products?category_id=${l2Cat.id}`}
                                                        onClick={handleNavLinkClick}
                                                        className="text-sm text-gray-700 hover:text-blue-600 block py-1"
                                                    >
                                                        {l2Cat.sub_cat_name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                ))}
                            </ul>
                        </details>
                    ))}
                    
                    <div className="border-t border-gray-200 my-2"></div>
                    {STATIC_MENU_ITEMS.map(item => (
                        <Link 
                            key={item.name} 
                            href={item.href} 
                            onClick={handleNavLinkClick}
                            className="text-sm font-bold uppercase text-slate-700 hover:text-blue-500 block py-2"
                        >
                            {item.name}
                        </Link>
                    ))}
                    
                    <button 
                        onClick={handleLogout}
                        className="w-full text-left text-sm font-bold uppercase text-red-600 hover:text-red-700 block py-2 mt-4"
                    >
                        Sign Out
                    </button>
                </nav>
            </div>
            
            {/* Mobile Overlay */}
            {isMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
                    onClick={() => setIsMenuOpen(false)}
                />
            )}
            
            {/* Modal/Drawer components (to be implemented next) */}
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
            <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
        </header>
    );
};

export default Header;