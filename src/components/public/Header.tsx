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

const Header: React.FC = () => {
    const router = useRouter();
    const { fetchAllRootCategories } = useCategoryService();
    const { isAuthenticated, user, logout } = useAuth(); 
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

    useEffect(() => {
        setIsMounted(true);
    }, []);

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
        setActiveRootCategory(null);
        setIsUserDropdownOpen(false);
    };
    
    const handleLoginClick = () => {
        if (!isMounted) return;
        if (isAuthenticated) {
            setIsUserDropdownOpen(prev => !prev);
            return; 
        }
        setIsLoginModalToOpen(true);
    }
    
    const handleLogout = () => {
        logout(); 
        setIsUserDropdownOpen(false);
        setIsMenuOpen(false);
        router.push('/'); 
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

    const renderMegaMenu = (rootCat: RootCategory) => {
        const l1SubCats: SubCategory[] = (rootCat.subCategories || rootCat.sub_categories) || [];
        
        if (l1SubCats.length === 0) {
            return (
                <div className="fixed top-[168px] left-0 right-0 bg-white shadow-2xl border-t-2 border-gray-100 z-50">
                    <div className="container mx-auto px-8 py-6">
                        <Link 
                            href={`/products?category_id=${rootCat.id}`}
                            onClick={handleNavLinkClick}
                            className="text-sm text-gray-700 hover:text-[var(--color-primary,#FF6B35)] font-medium block py-2"
                        >
                            View All {rootCat.cat_name} Products
                        </Link>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="fixed top-[158px] left-0 right-0 bg-white mr-8 ml-8 border-r border-b border-l border-gray-300 z-50">
                <div className="container mx-auto px-8 py-8">
                    <div className="grid grid-cols-5 gap-8">
                        {l1SubCats.map(l1Cat => (
                            <div key={l1Cat.id} className="space-y-4">
                                <Link
                                    href={`/products?category_id=${l1Cat.id}`}
                                    onClick={handleNavLinkClick}
                                    className="text-sm font-bold text-gray-900 hover:text-[var(--color-primary,#FF6B35)] block uppercase tracking-wide"
                                >
                                    {l1Cat.sub_cat_name}
                                </Link>
                                
                                <ul className="space-y-2.5">
                                    {('children' in l1Cat && Array.isArray(l1Cat.children)) ? (
                                        l1Cat.children.map(l2Cat => (
                                            <li key={l2Cat.id}>
                                                <Link 
                                                    href={`/products?category_id=${l2Cat.id}`} 
                                                    onClick={handleNavLinkClick}
                                                    className="text-sm text-gray-600 hover:text-[var(--color-primary,#FF6B35)] transition-colors block"
                                                >
                                                    {l2Cat.sub_cat_name}
                                                </Link>
                                            </li>
                                        ))
                                    ) : null}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderMobileMenu = () => {
        if (!isMenuOpen) return null;
        
        return (
            <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
                <div className="fixed top-0 left-0 h-full w-[85%] max-w-sm bg-white overflow-y-auto">
                    {/* Mobile Menu Header */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                        <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
                            <FaPaw className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                            <span className="text-lg font-bold text-slate-800">Al Mushrif Pet Shop</span>
                        </Link>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-700 hover:bg-gray-100 rounded">
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Mobile Search */}
                    <div className="p-4 border-b border-gray-200">
                        <form onSubmit={handleSearchSubmit} className="flex">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 py-2 px-3 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#FF6B35)] bg-gray-50"
                            />
                            <button type="submit" className="bg-[var(--color-primary,#FF6B35)] text-white px-4 rounded-r-md hover:bg-[var(--color-primary-dark,#E55A2B)]">
                                <FaSearch className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                    
                    {/* Mobile User Section */}
                    <div className="p-4 border-b border-gray-200">
                        {isAuthenticated ? (
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary,#FF6B35)] text-white flex items-center justify-center font-semibold">
                                        {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {user?.first_name || user?.username || 'User'}
                                        </p>
                                        <p className="text-xs text-gray-500">{user?.email}</p>
                                    </div>
                                </div>
                                <Link 
                                    href="/user/profile" 
                                    onClick={handleNavLinkClick} 
                                    className="flex items-center space-x-2 text-sm text-gray-700 hover:text-[var(--color-primary,#FF6B35)] py-2"
                                >
                                    <FaUserCircle className="w-4 h-4" />
                                    <span>My Profile</span>
                                </Link>
                                <Link 
                                    href="/user/wishlist" 
                                    onClick={handleNavLinkClick} 
                                    className="flex items-center justify-between py-2 text-sm text-gray-700 hover:text-[var(--color-primary,#FF6B35)]"
                                >
                                    <div className="flex items-center space-x-2">
                                        <FaHeart className="w-4 h-4" />
                                        <span>My Wishlist</span>
                                    </div>
                                </Link>
                                <button 
                                    onClick={handleLogout} 
                                    className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 w-full py-2"
                                >
                                    <FaSignOutAlt className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={() => { setIsLoginModalToOpen(true); setIsMenuOpen(false); }}
                                    className="w-full py-2.5 px-4 rounded-md border-2 border-[var(--color-primary,#FF6B35)] text-[var(--color-primary,#FF6B35)] font-semibold flex items-center justify-center hover:bg-[var(--color-primary,#FF6B35)] hover:text-white transition-colors mb-3"
                                >
                                    <FaUser className="w-4 h-4 mr-2" />
                                    Login / Register
                                </button>
                                <Link 
                                    href="/user/wishlist" 
                                    onClick={handleNavLinkClick} 
                                    className="flex items-center justify-between py-2 text-sm text-gray-700 hover:text-[var(--color-primary,#FF6B35)]"
                                >
                                    <div className="flex items-center space-x-2">
                                        <FaHeart className="w-4 h-4" />
                                        <span>My Wishlist</span>
                                    </div>
                                </Link>
                            </>
                        )}
                    </div>
                    
                    {/* Mobile Categories */}
                    <div className="py-2">
                        {navLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <FaSpinner className="animate-spin text-[var(--color-primary,#FF6B35)]" />
                            </div>
                        ) : (
                            <>
                                {rootCategories.map(rootCat => (
                                    <div key={rootCat.id} className="border-b border-gray-100">
                                        <Link 
                                            href={`/products?category_id=${rootCat.id}`} 
                                            onClick={handleNavLinkClick}
                                            className="block px-4 py-3 text-sm font-medium text-slate-800 hover:text-[var(--color-primary,#FF6B35)] hover:bg-gray-50"
                                        >
                                            {rootCat.cat_name}
                                        </Link>
                                    </div>
                                ))}
                                
                                {STATIC_MENU_ITEMS.map(item => (
                                    <div key={item.name} className="border-b border-gray-100">
                                        <Link 
                                            href={item.href} 
                                            onClick={handleNavLinkClick}
                                            className="block px-4 py-3 text-sm font-medium text-slate-800 hover:text-[var(--color-primary,#FF6B35)] hover:bg-gray-50"
                                        >
                                            {item.name}
                                        </Link>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            {/* Marquee Bar */}
            <MarqueeBar />

            {/* Main Header Bar - With primary color background */}
            <div className="shadow-sm" style={{ backgroundColor: 'var(--color-primary, #FF6B35)' }}>
                <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
                    
                    {/* Logo & Mobile Menu Toggle */}
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        <button 
                            className="lg:hidden p-2 text-white hover:bg-white/10 rounded transition-colors"
                            onClick={() => setIsMenuOpen(true)}
                        >
                            <FaBars className="w-5 h-5" />
                        </button>
                        <Link href="/" className="flex items-center space-x-2">
                            <FaPaw className="w-7 h-7 text-white" />
                            <span className="text-lg font-bold text-white hidden sm:block">
                                Al Mushrif Pet Shop
                            </span>
                        </Link>
                    </div>

                    {/* Search Bar - Full width on desktop */}
                    <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-2xl">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="What do you think your pet needs?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                className="w-full py-2.5 pl-4 pr-12 text-sm rounded-md border-2 border-transparent focus:border-white bg-white/95 focus:bg-white focus:outline-none transition-all placeholder:text-gray-500"
                            />
                            <button 
                                type="submit" 
                                className="absolute right-0 top-0 h-full w-12 text-gray-600 hover:text-[var(--color-primary,#FF6B35)] transition-colors flex items-center justify-center"
                            >
                                <FaSearch className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    {/* Icons (Wishlist, User, Cart) */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        
                        {/* Wishlist Icon */}
                        {/* 💡 FIX START: Change Link to button and handle navigation/modal click */}
                        <button
                            onClick={() => {
                                handleNavLinkClick(); // Close mobile menu if open
                                if (isAuthenticated) {
                                    router.push("/user/wishlist");
                                } else {
                                    setIsLoginModalToOpen(true);
                                }
                            }}
                            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors relative hidden sm:flex items-center justify-center"
                            title="My Wishlist"
                        >
                            <FaHeart className="w-5 h-5" />
                        </button>
                        {/* 💡 FIX END */}

                        {/* User/Auth Dropdown */}
                        <div className="relative hidden sm:block">
                            {(!isMounted || (typeof window !== 'undefined' && window.localStorage.getItem('authToken') === null && !isAuthenticated)) ? (
                                <button 
                                    onClick={handleLoginClick}
                                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors relative flex items-center justify-center"
                                    title={isAuthenticated ? `Welcome, ${user?.first_name || user?.username}` : 'Login / Register'}
                                >
                                    <FaUser className="w-5 h-5" />
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={handleLoginClick}
                                        className="p-2 text-white hover:bg-white/10 rounded-full transition-colors relative flex items-center justify-center"
                                        title={isAuthenticated ? `Welcome, ${user?.first_name || user?.username}` : 'Login / Register'}
                                    >
                                        <FaUser className="w-5 h-5" />
                                    </button>
                                    
                                    {isAuthenticated && isUserDropdownOpen && (
                                        <div 
                                            onMouseLeave={() => setIsUserDropdownOpen(false)}
                                            className="absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-xl py-2 z-20 border border-gray-100"
                                        >
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {user?.first_name || user?.username}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                            <Link href="/user/profile" passHref>
                                                <div
                                                    onClick={() => setIsUserDropdownOpen(false)}
                                                    className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 cursor-pointer"
                                                >
                                                    <FaUserCircle className="mr-3" /> My Profile
                                                </div>
                                            </Link>
                                            <div className="border-t border-gray-100 my-1" />
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                                            >
                                                <FaSignOutAlt className="mr-3" /> Logout
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        
                        {/* Cart Icon */}
                        <button 
                            onClick={() => setIsCartDrawerOpen(true)}
                            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors relative flex items-center justify-center"
                            title="Shopping Cart"
                        >
                            <FaShoppingCart className="w-5 h-5" />
                            {isMounted && cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-[var(--color-primary,#FF6B35)] bg-white rounded-full">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:block bg-white border border-gray-200">
                <div className="container mx-auto px-8">
                    {navLoading ? (
                        <div className="py-3 flex items-center justify-center">
                            <FaSpinner className="animate-spin text-[var(--color-primary,#FF6B35)]" />
                        </div>
                    ) : (
                        <ul className="flex justify-start space-x-1">
                            {rootCategories.map(rootCat => (
                                <li 
                                    key={rootCat.id} 
                                    className="relative group"
                                    onMouseEnter={() => setActiveRootCategory(rootCat)}
                                    onMouseLeave={() => setActiveRootCategory(null)}
                                >
                                    <Link 
                                        href={`/products?category_id=${rootCat.id}`}
                                        className={`text-sm font-bold uppercase py-4 px-5 block transition-colors ${
                                            activeRootCategory?.id === rootCat.id 
                                                ? 'text-[var(--color-primary,#FF6B35)]' 
                                                : 'text-gray-800 hover:text-[var(--color-primary,#FF6B35)]'
                                        }`}
                                    >
                                        {rootCat.cat_name}
                                    </Link>
                                    
                                    {activeRootCategory?.id === rootCat.id && renderMegaMenu(rootCat)}
                                </li>
                            ))}
                            
                            {STATIC_MENU_ITEMS.map(item => (
                                <li key={item.name} className="relative">
                                    <Link 
                                        href={item.href} 
                                        className="text-sm font-bold uppercase py-4 px-5 block text-gray-800 hover:text-[var(--color-primary,#FF6B35)] transition-colors"
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
