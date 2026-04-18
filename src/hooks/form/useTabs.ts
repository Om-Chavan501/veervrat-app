'use client';

import { useState, useCallback } from 'react';

interface ITabsOptions {
    initialTab?: string;
    tabs: string[];
}

/**
 * Hook for managing tab state
 * Adapted from refer-2 useTabs
 */
export const useTabs = ({ initialTab, tabs }: ITabsOptions) => {
    const [activeTab, setActiveTab] = useState(initialTab ?? tabs[0]);

    const goToTab = useCallback((tab: string) => {
        if (tabs.includes(tab)) {
            setActiveTab(tab);
        }
    }, [tabs]);

    const nextTab = useCallback(() => {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1]);
        }
    }, [activeTab, tabs]);

    const prevTab = useCallback(() => {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1]);
        }
    }, [activeTab, tabs]);

    const isFirst = activeTab === tabs[0];
    const isLast = activeTab === tabs[tabs.length - 1];
    const currentIndex = tabs.indexOf(activeTab);

    return {
        activeTab,
        setActiveTab: goToTab,
        nextTab,
        prevTab,
        isFirst,
        isLast,
        currentIndex,
        tabs,
    };
};

export default useTabs;
