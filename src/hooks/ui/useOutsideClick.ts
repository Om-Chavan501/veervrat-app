'use client';

import { useEffect, useCallback, type RefObject } from 'react';

/**
 * Hook to detect clicks outside of a specified element
 * @param ref - React ref of the element to monitor
 * @param callback - Function to call when click outside is detected
 */
export const useOutsideClick = (
    ref: RefObject<HTMLElement | null>,
    callback: () => void
) => {
    const handleClick = useCallback(
        (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            callback();
        },
        [ref, callback]
    );

    useEffect(() => {
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('touchstart', handleClick);

        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('touchstart', handleClick);
        };
    }, [handleClick]);
};

export default useOutsideClick;
