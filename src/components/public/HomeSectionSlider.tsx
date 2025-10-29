// src/components/public/HomeSectionSlider.tsx
'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight, FaTag, FaChevronRight as FaAngleRight } from 'react-icons/fa';
import { HomeSection } from '@/types/content';
import { Product } from '@/types/product';
import ProductCard from '@/components/public/products/ProductCard'; 

interface HomeSectionSliderProps {
    section: HomeSection;
    products: Product[];
}

const HomeSectionSlider: React.FC<HomeSectionSliderProps> = ({ section, products }) => {
    const sliderRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (sliderRef.current) {
            const width = sliderRef.current.clientWidth;
            const scrollAmount = direction === 'left' ? -width * 0.8 : width * 0.8;
            sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (products.length === 0) {
        return null;
    }
    
    const targetHref = section.offer_id ? `/products?offer_id=${section.offer_id}` : '/products';

    return (
        <section className="space-y-4 mb-10">
            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            
            <header className="flex justify-between items-center pb-2 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    {section.offer_id && <FaTag className="mr-2 text-red-600" />}
                    {section.title}
                </h2>
                <Link 
                    href={targetHref}
                    className="text-sm font-medium hover:text-blue-600 flex items-center text-blue-600"
                >
                    View All <FaAngleRight className="ml-1 w-3 h-3" />
                </Link>
            </header>
            
            <div className="relative overflow-x-hidden"> 
                <button 
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-lg z-10 hover:bg-gray-100 hidden lg:block"
                >
                    <FaChevronLeft className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-lg z-10 hover:bg-gray-100 hidden lg:block"
                >
                    <FaChevronRight className="w-4 h-4" />
                </button>
                
                <div 
                    ref={sliderRef}
                    className="flex overflow-x-auto space-x-4 p-2 hide-scrollbar" 
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {products.map(product => (
                        <div 
                            key={product.id} 
                            className="flex-shrink-0 w-64 sm:w-72 md:w-60 lg:w-[220px] xl:w-1/5" 
                            style={{ scrollSnapAlign: 'start' }}
                        >
                            <ProductCard product={product} /> 
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HomeSectionSlider;