'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaUser, FaBars, FaPaw, FaSearch, FaTimes, FaSpinner, FaHeart, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { RootCategory, SubCategory } from '@/types/category';
import { useCategoryService } from '@/services/admin/categoryService'; 
import MarqueeBar from './MarqueeBar';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import LoginModal from './LoginModal';
import CartDrawer from './CartDrawer';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

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
    const { isAuthenticated, user, logout, isLoading: isAuthLoading } = useAuth();
    const { cartCount, isCartDrawerOpen, setIsCartDrawerOpen } = useCart();

    const [rootCategories, setRootCategories] = useState<RootCategory[]>([]);
    const [navLoading, setNavLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoginModalToOpen, setIsLoginModalToOpen] = useState(false); 
    const [activeRootCategory, setActiveRootCategory] = useState<RootCategory | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

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

    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    const handleNavLinkClick = () => {
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
        setActiveRootCategory(null);
        setIsUserDropdownOpen(false); // Close dropdown when navigating
    };
    
    // Handles click on the main User icon
    const handleLoginClick = () => {
        if (!isMounted || isAuthLoading) return;
        
        if (isAuthenticated) {
            setIsUserDropdownOpen(prev => !prev);
            return; 
        }
        setIsLoginModalToOpen(true);
    }
    
    // Handles the logout action
    const handleLogout = () => {
        logout(); // Calls the logout function from AuthContext
        setIsUserDropdownOpen(false);
        router.push('/'); // Redirect to homepage
        toast.success("Successfully logged out.");
    };
    
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery(''); 
            handleNavLinkClick(); 
        }
    };

    // 2. Improved Mega Menu Renderer
    const renderMegaMenu = (rootCat: RootCategory) => {
        const l1SubCats: SubCategory[] = (rootCat.subCategories || rootCat.sub_categories) || [];
        
        if (l1SubCats.length === 0) {
            return (
                <div className="absolute top-full left-0 bg-white shadow-lg rounded-b-md border border-gray-200 py-3 px-4 min-w-[220px] z-50">
                    <Link 
                        href={`/products?category_id=${rootCat.id}`}
                        onClick={handleNavLinkClick}
                        className="text-base text-gray-700 hover:text-blue-600 font-medium block py-1"
                    >
                        View All {rootCat.cat_name} Products
                    </Link>
                </div>
            );
        }
        
        const columnCount = Math.min(l1SubCats.length, 5);
        
        return (
            <div className="absolute top-full left-0 bg-white shadow-lg rounded-b-md border border-gray-200 py-6 z-50 w-[980px] mx-auto">
                <div className="flex flex-wrap px-8">
                    {l1SubCats.map(l1Cat => (
                        <div 
                            key={l1Cat.id} 
                            className={`w-1/${columnCount} min-w-[160px] pr-10 mb-4`}
                        >
                            <h4 className="text-base font-bold mb-3 text-slate-800">
                                {l1Cat.sub_cat_name}
                            </h4>
                            
                            <ul className="space-y-2">
                                {/* Check for l2Cat children */}
                                {('children' in l1Cat && Array.isArray(l1Cat.children)) ? (
                                    l1Cat.children.map(l2Cat => (
                                        <li key={l2Cat.id}>
                                            <Link 
                                                href={`/products?category_id=${l2Cat.id}`} 
                                                onClick={handleNavLinkClick}
                                                className="text-sm text-gray-600 hover:text-blue-600 transition-colors block py-1"
                                            >
                                                {l2Cat.sub_cat_name}
                                            </Link>
                                        </li>
                                    ))
                                ) : null}
                                
                                <li className='mt-2 pt-2 border-t border-gray-100'>
                                    <Link 
                                        href={`/products?category_id=${l1Cat.id}`}
                                        onClick={handleNavLinkClick}
                                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors block py-1"
                                    >
                                        View All {l1Cat.sub_cat_name}
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Mobile menu renderer (COMPLETE)
    const renderMobileMenu = () => {
        if (!isMenuOpen) return null;
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
                <div className="fixed top-0 left-0 h-full w-[85%] max-w-sm bg-white overflow-y-auto">
                    <div className="flex justify-between items-center p-4 border-b">
                        <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
                            <FaPaw className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                            <span className="text-lg font-bold text-slate-800">Al Mushrif Pet Shop</span>
                        </Link>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-700">
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Mobile search */}
                    <div className="p-4 border-b">
                        <form onSubmit={handleSearchSubmit} className="flex">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 py-2 px-3 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button type="submit" className="bg-blue-600 text-white px-3 rounded-r-md">
                                <FaSearch className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                    
                    {/* Mobile account links (updated) */}
                    <div className="p-4 border-b space-y-2">
                        {isAuthenticated ? (
                            <>
                                <Link href="/user/profile" onClick={handleNavLinkClick} className="flex items-center space-x-2 text-sm text-slate-700 hover:text-blue-600">
                                    <FaUserCircle className="w-4 h-4" />
                                    <span>Hi, {user?.first_name || user?.username || 'User'} (Profile)</span>
                                </Link>
                                <button onClick={handleLogout} className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 w-full text-left">
                                    <FaSignOutAlt className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => { handleLoginClick(); setIsMenuOpen(false); }}
                                className="flex items-center space-x-2 w-full text-left text-slate-700 hover:text-blue-600"
                            >
                                <FaUser className="w-4 h-4" />
                                <span className="text-sm">Login / Register</span>
                            </button>
                        )}
                        <Link href={isAuthenticated ? "/user/wishlist" : "/login"} onClick={handleNavLinkClick} className="flex items-center space-x-2 text-sm text-slate-700 hover:text-blue-600">
                            <FaHeart className="w-4 h-4" />
                            <span>My Wishlist</span>
                        </Link>
                    </div>
                    
                    {/* Categories and Static Links */}
                    <div className="py-2">
                        {rootCategories.map(rootCat => (
                            <div key={rootCat.id} className="border-b">
                                <Link 
                                    href={`/products?category_id=${rootCat.id}`} 
                                    onClick={handleNavLinkClick}
                                    className="block px-4 py-3 text-sm font-medium text-slate-800"
                                >
                                    {rootCat.cat_name}
                                </Link>
                            </div>
                        ))}
                        
                        {STATIC_MENU_ITEMS.map(item => (
                            <div key={item.name} className="border-b">
                                <Link 
                                    href={item.href} 
                                    onClick={handleNavLinkClick}
                                    className="block px-4 py-3 text-sm font-medium text-slate-800"
                                >
                                    {item.name}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <header className="sticky top-0 z-50">
            {/* Marquee Bar */}
            <MarqueeBar />

            {/* --- TOP BAR: Logo, Search, Icons --- */}
            <div className="bg-white shadow-sm border-b border-gray-100 h-16 px-4 sm:px-6 flex items-center justify-between">
                
                {/* 1. Logo & Mobile Menu Toggle */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                    <button 
                        className="lg:hidden p-2 text-slate-700 hover:bg-gray-100 rounded"
                        onClick={() => setIsMenuOpen(true)}
                    >
                        <FaBars className="w-5 h-5" />
                    </button>
                    <Link href="/" className="flex items-center space-x-2">
                        <FaPaw className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
                        <span className="text-lg font-bold text-slate-800 hidden sm:block">
                            Al Mushrif Pet Shop
                        </span>
                    </Link>
                </div>

                {/* 2. Search Bar (Reduced height) */}
                <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 mx-6 max-w-xl">
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="What do you think your pet needs?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            className={`w-full py-2 pl-4 pr-10 text-sm rounded-md border ${
                                isSearchFocused ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-300'
                            } bg-gray-50 focus:outline-none transition-all`}
                        />
                        <button 
                            type="submit" 
                            className="absolute right-0 top-0 h-full w-10 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            <FaSearch className="w-4 h-4 mx-auto" />
                        </button>
                    </div>
                </form>

                {/* 3. Icons (Cart, Wishlist, & Auth) - Reduced size */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                    
                    {/* Wishlist Icon */}
                    <Link href={isAuthenticated ? "/user/wishlist" : "/login"} passHref>
                        <button
                            className="p-2 text-slate-700 hover:bg-gray-100 rounded-full transition-colors relative"
                            title="My Wishlist"
                            onClick={() => handleNavLinkClick()}
                        >
                            <FaHeart className="w-4 h-4" />
                        </button>
                    </Link>

                    {/* User/Auth Dropdown */}
                    <div className="relative">
                        {(!isMounted || isAuthLoading) ? (
                            // Render a stable placeholder button during SSR/initial hydration
                            <button 
                                className="p-2 text-slate-700 hover:bg-gray-100 rounded-full transition-colors relative"
                                title="Loading..."
                                disabled
                            >
                                <FaUser className="w-4 h-4" />
                            </button>
                        ) : (
                            <>
                                {/* The dynamic button renders ONLY on the client after mounting */}
                                <button 
                                    onClick={handleLoginClick}
                                    className="p-2 text-slate-700 hover:bg-gray-100 rounded-full transition-colors relative"
                                    title={isAuthenticated ? `Welcome, ${user?.first_name || user?.username}` : 'Login / Register'}
                                >
                                    <FaUser className="w-4 h-4" />
                                </button>
                                
                                {/* Dropdown Content (Desktop) */}
                                {isAuthenticated && isUserDropdownOpen && (
                                    <div 
                                        onMouseLeave={() => setIsUserDropdownOpen(false)}
                                        className="absolute right-0 mt-3 w-48 bg-white rounded-lg shadow-xl py-1 z-20 border border-gray-100"
                                    >
                                        <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 truncate">
                                            {user?.email || user?.username}
                                        </div>
                                        <Link href="/user/profile" passHref>
                                            <div
                                                onClick={() => setIsUserDropdownOpen(false)}
                                                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 cursor-pointer"
                                            >
                                                <FaUserCircle className="mr-2" /> My Profile
                                            </div>
                                        </Link>
                                        <div className="border-t border-gray-100 my-1" />
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 hover:text-red-700 text-left"
                                        >
                                            <FaSignOutAlt className="mr-2" /> Logout
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    {/* Cart Icon */}
                    <button 
                        onClick={() => setIsCartDrawerOpen(true)}
                        className="p-2 text-slate-700 hover:bg-gray-100 rounded-full transition-colors relative"
                        title="Shopping Cart"
                    >
                        <FaShoppingCart className="w-4 h-4" />
                        {isMounted && cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-blue-600 rounded-full">
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
            
            {/* --- IMPROVED NAVIGATION BAR (Desktop) --- */}
            <nav className="hidden lg:block w-full bg-white border-b border-gray-100 shadow-sm">
                <div className="container mx-auto px-4">
                    {navLoading ? (
                        <div className="py-3 flex items-center justify-center w-full">
                            <FaSpinner className="animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <ul className="flex">
                            {rootCategories.map(rootCat => (
                                <li 
                                    key={rootCat.id} 
                                    className="relative group"
                                    onMouseEnter={() => setActiveRootCategory(rootCat)}
                                    onMouseLeave={() => setActiveRootCategory(null)}
                                >
                                    <Link 
                                        href={`/products?category_id=${rootCat.id}`}
                                        className={`text-sm font-bold uppercase py-3 px-4 block transition-colors text-slate-700 hover:text-blue-600 ${
                                            activeRootCategory?.id === rootCat.id ? 'text-blue-600' : ''
                                        }`}
                                    >
                                        {rootCat.cat_name}
                                    </Link>
                                    
                                    {/* Mega Menu */}
                                    {activeRootCategory?.id === rootCat.id && renderMegaMenu(rootCat)}
                                </li>
                            ))}
                            
                            {/* Static Menu Items */}
                            {STATIC_MENU_ITEMS.map(item => (
                                <li key={item.name} className="relative">
                                    <Link 
                                        href={item.href} 
                                        className="text-sm font-bold uppercase py-3 px-4 block text-slate-700 hover:text-blue-600 transition-colors"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </nav>
            
            {/* Mobile Menu Drawer */}
            {renderMobileMenu()}
            
            {/* Modals */}
            <LoginModal 
                isOpen={isLoginModalToOpen} 
                onClose={() => setIsLoginModalToOpen(false)} 
                onLoginSuccess={() => setIsUserDropdownOpen(false)} 
            />
            <CartDrawer 
                isOpen={isCartDrawerOpen} 
                onClose={() => setIsCartDrawerOpen(false)} 
            />
        </header>
    );
};

export default Header;