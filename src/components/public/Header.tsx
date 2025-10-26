// src/components/public/Header.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaUser, FaBars, FaPaw, FaSearch, FaTimes, FaSpinner } from 'react-icons/fa';
import { RootCategory, SubCategory } from '@/types/category';
import { useCategoryService } from '@/services/admin/categoryService'; 
import MarqueeBar from './MarqueeBar';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import LoginModal from './LoginModal';
import CartDrawer from './CartDrawer';
import { useRouter } from 'next/navigation';

const STATIC_MENU_ITEMS = [
    { name: 'OUR BRANDS', href: '/brands' },
    { name: 'OFFER ZONE', href: '/products?offer_id=all' },
    { name: 'NEW ARRIVALS', href: '/products?sort=latest' },
    { name: 'SERVICES', href: '/services' },
];

/**
 * Public Header Component: Includes Marquee, Logo, Search Bar, Navigation, and Cart/Auth controls.
 */
const Header: React.FC = () => {
    const router = useRouter();
    const { fetchAllRootCategories } = useCategoryService();
    const { isAuthenticated, user, logout } = useAuth();
    const { cartCount, isCartDrawerOpen, setIsCartDrawerOpen } = useCart();

    const [rootCategories, setRootCategories] = useState<RootCategory[]>([]);
    const [navLoading, setNavLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalToOpen] = useState(false); // Renamed local state to avoid conflict with context
    const [activeRootCategory, setActiveRootCategory] = useState<RootCategory | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // 1. Fetch Categories for Navigation
    const fetchCategories = useCallback(async () => {
        setNavLoading(true);
        try {
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
    
    const handleNavLinkClick = () => {
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
    };
    
    const handleLoginClick = () => {
        if (isAuthenticated) {
            // Placeholder for profile menu/dropdown
            return; 
        }
        setIsLoginModalToOpen(true);
    }
    
    // Handle site-wide product search and redirection
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery(''); 
            handleNavLinkClick(); 
        }
    };


    // 2. Mega Menu Content Renderer (Robust Child/SubCategory Mapping)
    const renderMegaMenu = (rootCat: RootCategory) => {
        const l1SubCats: SubCategory[] = rootCat.subCategories || [];
        
        return (
            <div 
                className="absolute left-0 right-0 top-full bg-white border border-t-0 border-gray-200 shadow-xl py-6 px-8 flex justify-start z-10"
                onMouseEnter={() => setActiveRootCategory(rootCat)}
                onMouseLeave={() => setActiveRootCategory(null)}
            >
                {l1SubCats.length > 0 ? l1SubCats.map(l1Cat => (
                    // L1 SubCategory: Column Title 
                    <div key={l1Cat.id} className="w-1/5 min-w-[150px] mr-8">
                        <h4 className="uppercase font-bold text-sm mb-3 text-slate-800">
                            {l1Cat.sub_cat_name}
                        </h4>
                        
                        {/* L2 SubCategories: Clickable links */}
                        <ul className="space-y-1">
                            {/* 💡 FIX: Ensure we use l1Cat.children which holds the L2 items */}
                            {l1Cat.children?.map(l2Cat => (
                                <li key={l2Cat.id}>
                                    <Link 
                                        href={`/products?category_id=${l2Cat.id}`} 
                                        onClick={handleNavLinkClick}
                                        className="text-sm text-gray-700 hover:text-blue-600 transition-colors block"
                                    >
                                        {l2Cat.sub_cat_name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )) : (
                    // If no L1 subs, offer link to the Root Category itself
                     <div className="w-full">
                         <Link 
                            href={`/products?category_id=${rootCat.id}`}
                            onClick={handleNavLinkClick}
                            className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium"
                         >
                            View All {rootCat.cat_name} Products
                         </Link>
                     </div>
                )}
            </div>
        );
    };


    return (
        <header className="sticky top-0 z-50">
            {/* Marquee Bar */}
            <MarqueeBar />

            {/* --- TOP BAR: Logo, Search, Icons --- */}
            <div className="bg-white shadow-md border-b border-gray-100 h-20 px-4 sm:px-8 flex items-center justify-between">
                
                {/* 1. Logo & Mobile Menu Toggle */}
                <div className="flex items-center space-x-4 flex-shrink-0">
                    <button 
                        className="lg:hidden p-2 text-slate-700 hover:bg-gray-100 rounded"
                        onClick={() => setIsMenuOpen(true)}
                    >
                        <FaBars className="w-6 h-6" />
                    </button>
                    <Link href="/" className="flex items-center space-x-2">
                        <FaPaw className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
                        <span className="text-xl font-bold text-slate-800 hidden sm:block">
                            Al Mushrif Pet Shop
                        </span>
                    </Link>
                </div>

                {/* 2. Search Bar (Full-Width on Desktop, Hidden on Mobile) */}
                <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 mx-8 max-w-xl">
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="What do you think your pet needs?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-3 pl-4 pr-12 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        <button type="submit" className="absolute right-0 top-0 h-full w-12 text-gray-500 hover:text-blue-600">
                            <FaSearch className="w-4 h-4 mx-auto" />
                        </button>
                    </div>
                </form>

                {/* 3. Icons (Cart & Auth) */}
                <div className="flex items-center space-x-4 flex-shrink-0">
                    <button 
                        onClick={handleLoginClick}
                        className="p-2 text-slate-700 hover:bg-gray-100 rounded-full transition-colors relative"
                        title={isAuthenticated ? `Welcome, ${user?.first_name || user?.username}` : 'Login / Register'}
                    >
                        <FaUser className="w-5 h-5" />
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
            
            {/* --- BOTTOM NAVIGATION BAR (Mega Menu Trigger) --- */}
            <nav className="hidden lg:flex w-full justify-center border-b border-gray-100 bg-white">
                <div className="flex space-x-6 h-12 items-stretch">
                    {navLoading && <FaSpinner className="animate-spin text-blue-500 my-auto" />}
                    
                    {rootCategories.map(rootCat => (
                        <div 
                            key={rootCat.id} 
                            className="relative flex items-stretch h-full"
                            onMouseEnter={() => setActiveRootCategory(rootCat)}
                            onMouseLeave={() => setActiveRootCategory(null)}
                        >
                            <Link 
                                href={`/products?category_id=${rootCat.id}`}
                                className={`text-sm font-bold uppercase py-2 transition-colors flex items-center text-slate-700 hover:text-blue-600`}
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
                            className="text-sm font-bold uppercase text-slate-700 hover:text-blue-600 transition-colors flex items-center"
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>
            </nav>
            
            {/* --- Mobile Sidebar and Modals --- */}
            {/* ... Mobile Sidebar Logic (omitted for brevity, assume it still uses isMenuOpen state) ... */}
            <LoginModal 
                // 💡 FIX: Use the correct state variable name
                isOpen={isLoginModalOpen} 
                onClose={() => setIsLoginModalToOpen(false)} 
            />
            <CartDrawer 
                isOpen={isCartDrawerOpen} 
                onClose={() => setIsCartDrawerOpen(false)} 
            />
        </header>
    );
};

export default Header;