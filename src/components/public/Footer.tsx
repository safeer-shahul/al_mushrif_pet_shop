'use client';

import React from 'react';
import Link from 'next/link';
import { FaPaw, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';

// Define the primary color variable
const PRIMARY_COLOR = 'var(--color-primary, #FF6B35)';

// Menu items from Header (STATIC_MENU_ITEMS, simplified structure for the footer)
const NAV_MENU_QUICK_LINKS = [
    { name: 'OUR BRANDS', href: '/brands' },
    { name: 'OFFER ZONE', href: '/products?offer_id=all' },
    { name: 'NEW ARRIVALS', href: '/products?sort=latest' },
    // You can add account links here if you want them in the footer, 
    // but typically only static links are included in the 'Quick Links' section.
    // { name: 'My Account', href: '/user/profile' },
    // { name: 'My Orders', href: '/user/orders' },
    // { name: 'My Wishlist', href: '/user/wishlist' },
];

// Updated Contact Info with telephone and WhatsApp links
const CONTACT_INFO = [
    {
        icon: FaMapMarkerAlt,
        text: 'Mushrif Mall, Basement, Shop-UP06, Abu Dhabi - UAE',
        isLink: false,
    },
    {
        icon: FaPhone,
        text: '+971 56 672 7748',
        href: 'tel:+971566727748',
        isLink: true,
    },
    {
        icon: FaWhatsapp,
        text: '+971 56 672 7748 (WhatsApp Order)',
        href: 'https://wa.me/971566727748',
        isLink: true,
    },
    {
        icon: FaMapMarkerAlt,
        text: 'Deerfeields Mall, Level-1 Bahiya, Shaham, Abu Dhabi - UAE',
        isLink: false,
    },
    {
        icon: FaPhone,
        text: '+971 56 924 4534',
        href: 'tel:+971569244534',
        isLink: true,
    },
    {
        icon: FaWhatsapp,
        text: '+971 56 924 4534 (WhatsApp Order)',
        href: 'https://wa.me/971569244534',
        isLink: true,
    },
    {
        icon: FaEnvelope,
        text: 'nassaraquarium@gmail.com',
        href: 'mailto:nassaraquarium@gmail.com',
        isLink: true,
    },
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
                            <strong>AQUARIUM FISH & BIRDS, ANIMALS</strong><br />
                            Your trusted source for pets, fish, and all necessary supplies in Abu Dhabi.
                        </p>
                        <div className="flex space-x-4 pt-2">
                            <a href="https://www.facebook.com/almushrifaquarium/" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70" style={{ color: PRIMARY_COLOR }} aria-label="Facebook">
                                <FaFacebook className="w-5 h-5" />
                            </a>
                            <a href="https://www.instagram.com/almushrifaquarium/" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70" style={{ color: PRIMARY_COLOR }} aria-label="Instagram">
                                <FaInstagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Quick Links - Updated to match Header structure */}
                    <div>
                        <h4 className="text-base font-semibold mb-4" style={{ color: PRIMARY_COLOR }}>Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            {/* Rendering the updated list of quick links */}
                            {NAV_MENU_QUICK_LINKS.map(item => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className="text-gray-600 transition-colors uppercase"
                                        onMouseEnter={(e) => e.currentTarget.style.color = PRIMARY_COLOR}
                                        onMouseLeave={(e) => e.currentTarget.style.color = ''}
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Contact Info - Updated with correct link logic */}
                    <div>
                        <h4 className="text-base font-semibold mb-4" style={{ color: PRIMARY_COLOR }}>Contact & Location</h4>
                        <div className="space-y-3">
                            {CONTACT_INFO.map(item => (
                                <div key={item.text} className="flex items-start space-x-3 text-sm">
                                    <item.icon className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: PRIMARY_COLOR }} />
                                    <div className='flex flex-col text-gray-600'>
                                        {/* Use an anchor tag for links, otherwise use a span */}
                                        {item.isLink ? (
                                            <a
                                                href={item.href}
                                                target={item.icon === FaWhatsapp ? "_blank" : "_self"} // Open WhatsApp links in new tab
                                                rel={item.icon === FaWhatsapp ? "noopener noreferrer" : undefined}
                                                className="leading-relaxed transition-colors"
                                                onMouseEnter={(e) => e.currentTarget.style.color = PRIMARY_COLOR}
                                                onMouseLeave={(e) => e.currentTarget.style.color = ''}
                                            >
                                                {item.text}
                                            </a>
                                        ) : (
                                            <span className="leading-relaxed">{item.text}</span>
                                        )}
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