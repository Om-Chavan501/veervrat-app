'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect when user has scrolled past a certain distance
 * @param scrollDistance - Distance in pixels to trigger the state change
 * @returns boolean indicating if user has scrolled past the distance
 */
export const useScrollPosition = (scrollDistance = 0) => {
    const [hasCrossedDistance, setHasCrossedDistance] = useState(false);

    useEffect(() => {
        const updatePosition = () => {
            setHasCrossedDistance(window.scrollY > scrollDistance);
        };

        window.addEventListener('scroll', updatePosition, { passive: true });
        updatePosition();

        return () => window.removeEventListener('scroll', updatePosition);
    }, [scrollDistance]);

    return hasCrossedDistance;
};

export default useScrollPosition;
