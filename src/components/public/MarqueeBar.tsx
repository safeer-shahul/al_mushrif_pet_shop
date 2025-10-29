// src/components/public/MarqueeBar.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useMarqueeService } from '@/services/admin/marqueeService';
import { Marquee } from '@/types/content';
import { FaBullhorn } from 'react-icons/fa';

/**
 * MarqueeBar Component: Fetches and displays the active scrolling text message
 * using React state for animation instead of CSS.
 */
const MarqueeBar: React.FC = () => {
    const { fetchActiveMarquee } = useMarqueeService();
    const [marquees, setMarquees] = useState<Marquee[] | null>(null);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const [position, setPosition] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [textWidth, setTextWidth] = useState(0);
    const animationFrameRef = useRef<number>(0);
    
    // Scroll speed: 0.5 pixels per frame
    const SCROLL_SPEED = 0.5;

    // Load marquee data
    useEffect(() => {
        const loadMarquee = async () => {
            setLoading(true);
            try {
                const activeMarquees = await fetchActiveMarquee();
                
                if (activeMarquees && !Array.isArray(activeMarquees)) {
                    setMarquees([activeMarquees]);
                } else {
                    setMarquees(activeMarquees);
                }
            } catch (error) {
                console.error("Marquee fetch failed, disabling display.", error);
                setMarquees(null);
            } finally {
                setLoading(false);
            }
        };

        loadMarquee();
    }, [fetchActiveMarquee]);

    // Get combined marquee content
    const getFullMarqueeContent = () => {
        if (!marquees || marquees.length === 0) return '';
        return marquees.map(m => m.content).join('   •   ');
    };

    // Measure container and text widths
    useEffect(() => {
        if (!containerRef.current || !textRef.current) return;
        
        // Get the width of the container and text
        const updateWidths = () => {
            if (containerRef.current && textRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
                setTextWidth(textRef.current.offsetWidth);
            }
        };
        
        updateWidths();
        
        // Reset position when text content changes
        setPosition(containerWidth);
        
        // Update measurements on window resize
        window.addEventListener('resize', updateWidths);
        return () => window.removeEventListener('resize', updateWidths);
    }, [marquees, containerRef.current, textRef.current]);

    // Animation loop
    useEffect(() => {
        if (loading || !marquees || marquees.length === 0) return;
        
        const animate = () => {
            setPosition(prevPosition => {
                // When text moves completely out of view, reset to start position
                if (prevPosition < -textWidth) {
                    return containerWidth;
                }
                // Move text to the left by speed amount
                return prevPosition - SCROLL_SPEED;
            });
            
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        
        // Start the animation
        animationFrameRef.current = requestAnimationFrame(animate);
        
        // Cleanup animation on unmount
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [loading, marquees, containerWidth, textWidth]);

    // Don't render if no content
    if (loading || !marquees || marquees.length === 0) {
        return null;
    }

    return (
        <div 
            className="w-full py-2 text-xs sm:text-sm font-medium"
            style={{ backgroundColor: '#000000', color: 'white' }}
        >
            <div className="flex items-center">
                <FaBullhorn className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mx-4" />
                
                {/* Marquee Container */}
                <div 
                    ref={containerRef} 
                    className="relative overflow-hidden flex-1"
                    style={{ height: '24px' }}
                >
                    <p 
                        ref={textRef}
                        className="absolute whitespace-nowrap flex items-center"
                        style={{ 
                            left: `${position}px`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                        }}
                    >
                        {getFullMarqueeContent()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MarqueeBar;