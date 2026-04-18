'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface UsePaginationOptions {
    initialPage?: number;
    pageSize?: number;
}

interface UsePaginationReturn<T> {
    page: number;
    pageSize: number;
    totalPages: number;
    total: number;
    paginatedData: T[];
    startIndex: number;
    endIndex: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    setPage: (page: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    firstPage: () => void;
    lastPage: () => void;
    setPageSize: (size: number) => void;
    pageNumbers: number[];
}

const normalizePositiveInt = (value: number, fallback: number): number => {
    const normalized = Number.isFinite(value) ? Math.trunc(value) : fallback;
    return normalized > 0 ? normalized : fallback;
};

const clampPage = (value: number, totalPages: number): number => {
    return Math.min(Math.max(value, 1), totalPages);
};

export function usePagination<T>(data: T[], options: UsePaginationOptions = {}): UsePaginationReturn<T> {
    const initialPage = normalizePositiveInt(options.initialPage ?? 1, 1);
    const initialPageSize = normalizePositiveInt(options.pageSize ?? 10, 10);

    const [page, setPageState] = useState(initialPage);
    const [pageSize, setPageSizeState] = useState(initialPageSize);

    const total = data.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    useEffect(() => {
        setPageState((prev) => clampPage(prev, totalPages));
    }, [totalPages]);

    const safePage = clampPage(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);

    const paginatedData = useMemo(() => data.slice(startIndex, endIndex), [data, startIndex, endIndex]);

    const hasNextPage = safePage < totalPages;
    const hasPreviousPage = safePage > 1;

    const setPage = useCallback(
        (nextPage: number) => {
            const normalizedPage = normalizePositiveInt(nextPage, 1);
            setPageState(clampPage(normalizedPage, totalPages));
        },
        [totalPages],
    );

    const nextPage = useCallback(() => {
        setPageState((prev) => clampPage(prev + 1, totalPages));
    }, [totalPages]);

    const previousPage = useCallback(() => {
        setPageState((prev) => clampPage(prev - 1, totalPages));
    }, [totalPages]);

    const firstPage = useCallback(() => {
        setPageState(1);
    }, []);

    const lastPage = useCallback(() => {
        setPageState(totalPages);
    }, [totalPages]);

    const setPageSize = useCallback((size: number) => {
        const nextPageSize = normalizePositiveInt(size, 10);
        setPageSizeState(nextPageSize);
        setPageState(1);
    }, []);

    const pageNumbers = useMemo(() => {
        const maxVisible = 5;
        const pages: number[] = [];

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i += 1) {
                pages.push(i);
            }
            return pages;
        }

        const start = Math.max(1, safePage - 2);
        const end = Math.min(totalPages, start + maxVisible - 1);
        const normalizedStart = Math.max(1, end - maxVisible + 1);

        for (let i = normalizedStart; i <= end; i += 1) {
            pages.push(i);
        }

        return pages;
    }, [safePage, totalPages]);

    return {
        page: safePage,
        pageSize,
        totalPages,
        total,
        paginatedData,
        startIndex,
        endIndex,
        hasNextPage,
        hasPreviousPage,
        setPage,
        nextPage,
        previousPage,
        firstPage,
        lastPage,
        setPageSize,
        pageNumbers,
    };
}

interface UseInfiniteScrollOptions {
    initialLimit?: number;
    step?: number;
}

interface UseInfiniteScrollReturn<T> {
    visibleData: T[];
    hasMore: boolean;
    loadMore: () => void;
    reset: () => void;
    limit: number;
    total: number;
}

export function useInfiniteScroll<T>(data: T[], options: UseInfiniteScrollOptions = {}): UseInfiniteScrollReturn<T> {
    const initialLimit = normalizePositiveInt(options.initialLimit ?? 10, 10);
    const step = normalizePositiveInt(options.step ?? 10, 10);

    const [limit, setLimit] = useState(initialLimit);
    const total = data.length;

    useEffect(() => {
        setLimit((prev) => Math.min(prev, Math.max(total, initialLimit)));
    }, [total, initialLimit]);

    const visibleData = useMemo(() => data.slice(0, limit), [data, limit]);
    const hasMore = limit < total;

    const loadMore = useCallback(() => {
        setLimit((prev) => Math.min(prev + step, total));
    }, [step, total]);

    const reset = useCallback(() => {
        setLimit(initialLimit);
    }, [initialLimit]);

    return {
        visibleData,
        hasMore,
        loadMore,
        reset,
        limit,
        total,
    };
}
