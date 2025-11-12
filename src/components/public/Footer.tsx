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
    // Account links can be added here if needed
];

// Refactored Contact Info to group by Location 🐾
const LOCATIONS_INFO = [
    {
        name: 'Mushrif Mall Branch',
        details: [
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
                text: '+971 56 672 7748',
                href: 'https://wa.me/971566727748',
                isLink: true,
                isPrimary: true, // For potential styling if needed
            },
        ],
    },
    {
        name: 'Deerfeilds Mall Branch',
        details: [
            {
                icon: FaMapMarkerAlt,
                text: 'Deerfeilds Mall, Level-1 Bahiya, Shaham, Abu Dhabi - UAE',
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
                text: '+971 56 924 4534',
                href: 'https://wa.me/971569244534',
                isLink: true,
                isPrimary: true,
            },
        ],
    },
];

// Separate general contact info for consistency (e.g., Email)
const GENERAL_CONTACT_INFO = [
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

                    {/* Column 2: Quick Links */}
                    <div>
                        <h4 className="text-base font-semibold mb-4" style={{ color: PRIMARY_COLOR }}>Quick Links</h4>
                        <ul className="space-y-2 text-sm">
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

                    {/* Column 3: Contact Info - Updated with Grouping and Separators */}
                    <div>
                        <h4 className="text-base font-semibold mb-4" style={{ color: PRIMARY_COLOR }}>Contact & Locations 📍</h4>
                        <div className="space-y-4">
                            {LOCATIONS_INFO.map((location, index) => (
                                <React.Fragment key={location.name}>
                                    <div className="space-y-0.5">
                                        {location.details.map(item => (
                                            <div key={item.text} className="flex items-start space-x-3 text-sm">
                                                <item.icon className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: PRIMARY_COLOR }} />
                                                <div className='flex flex-col text-gray-600'>
                                                    {item.isLink ? (
                                                        <a
                                                            href={item.href}
                                                            target={item.icon === FaWhatsapp ? "_blank" : "_self"}
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
                                    {/* Divider Separator Line between locations */}
                                    {index < LOCATIONS_INFO.length - 1 && (
                                        <div className="border-t border-dashed border-gray-300 pt-4"></div>
                                    )}
                                </React.Fragment>
                            ))}

                            {/* General Contact (Email) */}
                            {GENERAL_CONTACT_INFO.map(item => (
                                <div key={item.text} className="flex items-start space-x-3 text-sm">
                                    <item.icon className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: PRIMARY_COLOR }} />
                                    <div className='flex flex-col text-gray-600'>
                                        <a
                                            href={item.href}
                                            className="leading-relaxed transition-colors"
                                            onMouseEnter={(e) => e.currentTarget.style.color = PRIMARY_COLOR}
                                            onMouseLeave={(e) => e.currentTarget.style.color = ''}
                                        >
                                            {item.text}
                                        </a>
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