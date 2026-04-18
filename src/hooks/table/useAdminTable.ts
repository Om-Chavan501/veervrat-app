'use client';

import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { useDebounce } from '@/hooks/table/useDebounce';
import { useInfiniteScroll } from '@/hooks/table/usePagination';
import {
    createTableFiltersAtom,
    createTablePageSizeAtom,
    createTableSearchAtom,
    createTableSelectedIdsAtom,
    createTableSortAtom,
    createTableViewAtom,
    type ITableSortState,
    type TableViewMode,
} from '@/jotai/atoms';

export interface IUseAdminTableOptions<T> {
    tableKey: string;
    data: T[];
    keyExtractor: (item: T) => string;
    searchFields?: (keyof T)[];
    searchFn?: (item: T, query: string) => boolean;
}

export interface IUseAdminTableReturn<T> {
    items: T[];
    filteredItems: T[];
    displayedItems: T[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filters: Record<string, string>;
    setFilter: (key: string, value: string) => void;
    setFilters: (filters: Record<string, string>) => void;
    clearFilters: () => void;
    activeFiltersCount: number;
    selectedIds: string[];
    setSelectedIds: (ids: string[]) => void;
    toggleSelection: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    isSelected: (id: string) => boolean;
    displayCount: number;
    hasMore: boolean;
    loadMore: () => void;
    pageSize: number;
    setPageSize: (size: number) => void;
    viewMode: TableViewMode;
    setViewMode: (mode: TableViewMode) => void;
    sort: ITableSortState | null;
    setSort: (sort: ITableSortState | null) => void;
    optimisticUpdate: <R>(
        id: string,
        updateFn: (item: T) => T,
        serverAction: () => Promise<R>,
        skipRefresh?: boolean,
    ) => Promise<R>;
    optimisticDelete: <R>(id: string, serverAction: () => Promise<R>, skipRefresh?: boolean) => Promise<R>;
    optimisticBulkUpdate: <R>(
        ids: string[],
        updateFn: (item: T) => T,
        serverAction: () => Promise<R>,
        skipRefresh?: boolean,
    ) => Promise<R>;
    isPending: boolean;
    startTransition: React.TransitionStartFunction;
    refresh: () => void;
}

export function useAdminTable<T>({
    tableKey,
    data,
    keyExtractor,
    searchFields = [],
    searchFn,
}: IUseAdminTableOptions<T>): IUseAdminTableReturn<T> {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const searchAtom = useMemo(() => createTableSearchAtom(tableKey), [tableKey]);
    const filtersAtom = useMemo(() => createTableFiltersAtom(tableKey), [tableKey]);
    const selectedIdsAtom = useMemo(() => createTableSelectedIdsAtom(tableKey), [tableKey]);
    const pageSizeAtom = useMemo(() => createTablePageSizeAtom(tableKey), [tableKey]);
    const viewAtom = useMemo(() => createTableViewAtom(tableKey), [tableKey]);
    const sortAtom = useMemo(() => createTableSortAtom(tableKey), [tableKey]);

    const [searchQuery, setSearchQuery] = useAtom(searchAtom);
    const [filters, setFiltersState] = useAtom(filtersAtom);
    const [selectedIds, setSelectedIdsState] = useAtom(selectedIdsAtom);
    const [pageSize, setPageSizeState] = useAtom(pageSizeAtom);
    const [viewMode, setViewMode] = useAtom(viewAtom);
    const [sort, setSort] = useAtom(sortAtom);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const [items, setItems] = useState<T[]>(data);
    const prevDataRef = useRef(data);

    useEffect(() => {
        if (prevDataRef.current !== data) {
            prevDataRef.current = data;
            setItems(data);
        }
    }, [data]);

    useEffect(() => {
        if (!selectedIds.length) return;
        const itemIds = new Set(items.map((item) => keyExtractor(item)));
        const nextSelected = selectedIds.filter((id) => itemIds.has(id));
        if (nextSelected.length !== selectedIds.length) {
            setSelectedIdsState(nextSelected);
        }
    }, [items, keyExtractor, selectedIds, setSelectedIdsState]);

    const filteredItems = useMemo(() => {
        let result = [...items];

        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase();
            result = result.filter((item) => {
                if (searchFn) return searchFn(item, query);
                return searchFields.some((field) => {
                    const value = item[field];
                    if (typeof value === 'string') return value.toLowerCase().includes(query);
                    if (Array.isArray(value)) return value.some((entry) => String(entry).toLowerCase().includes(query));
                    return false;
                });
            });
        }

        Object.entries(filters).forEach(([key, value]) => {
            if (!value || value === 'all') return;
            result = result.filter((item) => {
                const itemValue = (item as Record<string, unknown>)[key];
                if (typeof itemValue === 'boolean') return String(itemValue) === value;
                return itemValue === value;
            });
        });

        return result;
    }, [items, debouncedSearchQuery, filters, searchFields, searchFn]);

    const { visibleData: displayedItems, hasMore, loadMore, reset, limit } = useInfiniteScroll(filteredItems, {
        initialLimit: pageSize,
        step: pageSize,
    });

    useEffect(() => {
        reset();
    }, [debouncedSearchQuery, filters, pageSize, reset]);

    const setSelectedIds = useCallback(
        (ids: string[]) => {
            setSelectedIdsState(ids);
        },
        [setSelectedIdsState],
    );

    const setFilter = useCallback(
        (key: string, value: string) => {
            setFiltersState({ ...filters, [key]: value });
        },
        [filters, setFiltersState],
    );

    const setFilters = useCallback(
        (nextFilters: Record<string, string>) => {
            setFiltersState(nextFilters);
        },
        [setFiltersState],
    );

    const clearFilters = useCallback(() => {
        setFiltersState({});
        setSearchQuery('');
    }, [setFiltersState, setSearchQuery]);

    const activeFiltersCount = useMemo(
        () => Object.values(filters).filter((value) => value && value !== 'all').length,
        [filters],
    );

    const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

    const toggleSelection = useCallback(
        (id: string) => {
            const nextSelected = selectedIds.includes(id) ? selectedIds.filter((entry) => entry !== id) : [...selectedIds, id];
            setSelectedIdsState(nextSelected);
        },
        [selectedIds, setSelectedIdsState],
    );

    const selectAll = useCallback(() => {
        setSelectedIdsState(filteredItems.map(keyExtractor));
    }, [filteredItems, keyExtractor, setSelectedIdsState]);

    const clearSelection = useCallback(() => {
        setSelectedIdsState([]);
    }, [setSelectedIdsState]);

    const setPageSize = useCallback(
        (size: number) => {
            if (!Number.isFinite(size) || size <= 0) return;
            setPageSizeState(Math.trunc(size));
        },
        [setPageSizeState],
    );

    const optimisticUpdate = useCallback(
        async <R,>(id: string, updateFn: (item: T) => T, serverAction: () => Promise<R>, skipRefresh = false): Promise<R> => {
            setItems((prev) => prev.map((item) => (keyExtractor(item) === id ? updateFn(item) : item)));

            try {
                const result = await serverAction();
                if (!skipRefresh) {
                    startTransition(() => {
                        router.refresh();
                    });
                }
                return result;
            } catch (error) {
                setItems(data);
                throw error;
            }
        },
        [data, keyExtractor, router],
    );

    const optimisticDelete = useCallback(
        async <R,>(id: string, serverAction: () => Promise<R>, skipRefresh = false): Promise<R> => {
            const previousItems = items;
            setItems((prev) => prev.filter((item) => keyExtractor(item) !== id));
            setSelectedIdsState(selectedIds.filter((entry) => entry !== id));

            try {
                const result = await serverAction();
                if (!skipRefresh) {
                    startTransition(() => {
                        router.refresh();
                    });
                }
                return result;
            } catch (error) {
                setItems(previousItems);
                throw error;
            }
        },
        [items, keyExtractor, router, selectedIds, setSelectedIdsState],
    );

    const optimisticBulkUpdate = useCallback(
        async <R,>(
            ids: string[],
            updateFn: (item: T) => T,
            serverAction: () => Promise<R>,
            skipRefresh = false,
        ): Promise<R> => {
            const idSet = new Set(ids);
            setItems((prev) => prev.map((item) => (idSet.has(keyExtractor(item)) ? updateFn(item) : item)));

            try {
                const result = await serverAction();
                if (!skipRefresh) {
                    startTransition(() => {
                        router.refresh();
                    });
                }
                clearSelection();
                return result;
            } catch (error) {
                setItems(data);
                throw error;
            }
        },
        [clearSelection, data, keyExtractor, router],
    );

    const refresh = useCallback(() => {
        startTransition(() => {
            router.refresh();
        });
    }, [router]);

    return {
        items,
        filteredItems,
        displayedItems,
        searchQuery,
        setSearchQuery,
        filters,
        setFilter,
        setFilters,
        clearFilters,
        activeFiltersCount,
        selectedIds,
        setSelectedIds,
        toggleSelection,
        selectAll,
        clearSelection,
        isSelected,
        displayCount: limit,
        hasMore,
        loadMore,
        pageSize,
        setPageSize,
        viewMode,
        setViewMode,
        sort,
        setSort,
        optimisticUpdate,
        optimisticDelete,
        optimisticBulkUpdate,
        isPending,
        startTransition,
        refresh,
    };
}
