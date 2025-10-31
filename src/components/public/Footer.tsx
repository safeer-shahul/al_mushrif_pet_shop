'use client';

import React from 'react';
import Link from 'next/link';
import { FaPaw, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';

// Define the primary color variable
const PRIMARY_COLOR = 'var(--color-primary, #FF6B35)';

// Menu items from Header (simplified structure for the footer)
const NAV_MENU = [
    { name: 'My Account', href: '/user/profile' },
    { name: 'My Orders', href: '/user/orders' },
    { name: 'My Wishlist', href: '/user/wishlist' },
    { name: 'Our Brands', href: '/brands' },
    { name: 'Offer Zone', href: '/products?offer_id=all' },
    { name: 'New Arrivals', href: '/products?sort=latest' },
    // { name: 'SERVICES', href: '/services' },
];

const CONTACT_INFO = [
    { icon: FaMapMarkerAlt, text: 'Shop-UP06, Basement, Mushrif Mall, Abu Dhabi - UAE' },
    { icon: FaPhone, text: '+971 52 259 0502 (General)', numbers: ['+971522590502', '+971553239689', '+971544226623', '+971503374481'] },
    { icon: FaWhatsapp, text: '+971 52 804 4165 (WhatsApp Order)', numbers: ['+971528044165'] },
    { icon: FaEnvelope, text: 'nassaraquarium@gmail.com' },
];

const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-white text-gray-800 pt-12 pb-6 mt-12 border-t border-gray-200">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-gray-200">
                    
                    {/* Column 1: Logo & Mission */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2 text-xl font-bold" style={{ color: PRIMARY_COLOR }}>
                            <FaPaw className="w-5 h-5" />
                            <span>Al Mushrif Pet Shop</span>
                        </Link>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            <strong>AQUARIUM FISH & BIRDS, ANIMALS</strong><br/>
                            Your trusted source for pets, fish, and all necessary supplies in Abu Dhabi.
                        </p>
                        <div className="flex space-x-4 pt-2">
                            <a href="#" className="transition-opacity hover:opacity-70" style={{ color: PRIMARY_COLOR }} aria-label="Facebook">
                                <FaFacebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="transition-opacity hover:opacity-70" style={{ color: PRIMARY_COLOR }} aria-label="Instagram">
                                <FaInstagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h4 className="text-base font-semibold mb-4" style={{ color: PRIMARY_COLOR }}>Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            {NAV_MENU.slice(3).map(item => (
                                <li key={item.name}>
                                    <Link href={item.href} className="text-gray-600 transition-colors" style={{ ['--hover-color' as any]: PRIMARY_COLOR }} onMouseEnter={(e) => e.currentTarget.style.color = PRIMARY_COLOR} onMouseLeave={(e) => e.currentTarget.style.color = ''}>
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Contact Info */}
                    <div>
                        <h4 className="text-base font-semibold mb-4" style={{ color: PRIMARY_COLOR }}>Contact & Location</h4>
                        <div className="space-y-3">
                            {CONTACT_INFO.map(item => (
                                <div key={item.text} className="flex items-start space-x-3 text-sm">
                                    <item.icon className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: PRIMARY_COLOR }} />
                                    <div className='flex flex-col text-gray-600'>
                                        <span className="leading-relaxed">{item.text}</span>
                                        {item.numbers && item.numbers.map((num) => (
                                            <a key={num} href={`tel:${num}`} className='transition-colors text-xs mt-1' onMouseEnter={(e) => e.currentTarget.style.color = PRIMARY_COLOR} onMouseLeave={(e) => e.currentTarget.style.color = ''}>
                                                {num}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Copyright Bar */}
                <div className="pt-6 text-center text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} Al Mushrif Aquarium Fish Trading L.L.C. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;