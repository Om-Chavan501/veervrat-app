'use client';

import { useState, useEffect } from 'react';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints: Record<Breakpoint, number> = {
    xs: 480,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};

/**
 * Hook to detect current screen size and breakpoint
 */
export const useMediaQuery = () => {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        handleResize();
        window.addEventListener('resize', handleResize, { passive: true });
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isAbove = (breakpoint: Breakpoint) => windowSize.width >= breakpoints[breakpoint];
    const isBelow = (breakpoint: Breakpoint) => windowSize.width < breakpoints[breakpoint];

    return {
        width: windowSize.width,
        height: windowSize.height,
        isMobile: windowSize.width < breakpoints.md,
        isTablet: windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg,
        isDesktop: windowSize.width >= breakpoints.lg,
        isAbove,
        isBelow,
    };
};

export default useMediaQuery;
