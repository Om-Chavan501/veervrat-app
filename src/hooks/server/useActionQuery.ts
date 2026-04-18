'use client';

import { useQuery, type QueryKey, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';

import type { IApiResponse, IPaginatedResponse, IFormData } from '@/interfaces/actionHelper';

type ActionQueryFn<TData, TArgs extends unknown[]> = (...args: TArgs) => Promise<IApiResponse<TData>>;
type PaginatedActionQueryFn<TData, TArgs extends unknown[]> = (...args: TArgs) => Promise<IPaginatedResponse<TData>>;

export interface IUseActionQueryOptions<TData, TSelected = TData, TArgs extends unknown[] = []>
    extends Omit<UseQueryOptions<TData, Error, TSelected, QueryKey>, 'queryKey' | 'queryFn'> {
    queryKey: QueryKey;
    action: ActionQueryFn<TData, TArgs> | PaginatedActionQueryFn<TData, TArgs>;
    args?: TArgs;
    /** Set to true if action returns IPaginatedResponse (returns full response instead of just data) */
    paginated?: boolean;
}

/**
 * Hook for server actions returning IApiResponse<T> or IPaginatedResponse<T>
 * 
 * @example Regular response (unwraps data)
 * ```ts
 * const { data: topic } = useActionQuery({
 *     queryKey: ['topic', slug],
 *     action: getTopicBySlug,
 *     args: [slug],
 * });
 * ```
 * 
 * @example Paginated response (returns full response with pagination metadata)
 * ```ts
 * const { data: response } = useActionQuery({
 *     queryKey: ['topics', params],
 *     action: getTopics,
 *     args: [params],
 *     paginated: true,
 * });
 * const topics = response?.data ?? [];
 * const total = response?.pagination.total ?? 0;
 * ```
 */
export const useActionQuery = <TData = IFormData, TSelected = TData, TArgs extends unknown[] = []>(
    options: IUseActionQueryOptions<TData, TSelected, TArgs>,
): UseQueryResult<TSelected, Error> => {
    const { queryKey, action, args, paginated = false, enabled = true, ...queryOptions } = options;

    return useQuery<TData, Error, TSelected>({
        queryKey,
        queryFn: async () => {
            const response = await action(...(args ?? ([] as unknown as TArgs)));
            if (!response.success) {
                throw new Error(response.error);
            }
            // For paginated responses, return the full response (including pagination metadata)
            // For regular responses, unwrap and return just the data
            return (paginated ? response : response.data) as TData;
        },
        enabled,
        ...queryOptions,
    });
};