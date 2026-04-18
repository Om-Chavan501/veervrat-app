'use client';

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';

import type { IApiResponse, IFormData } from '@/interfaces/actionHelper';

type ISuccessResponse<TData> = Extract<IApiResponse<TData>, { success: true }>;
type IErrorResponse = Extract<IApiResponse<never>, { success: false }>;

export type ActionFn<TData, TArgs extends unknown[]> = (...args: TArgs) => Promise<IApiResponse<TData>>;

export interface IUseActionOptions<TData, TArgs extends unknown[], TContext = unknown> {
    action: ActionFn<TData, TArgs>;
    invalidateKeys?: QueryKey[];
    onOptimisticUpdate?: (...args: TArgs) => TContext;
    onRollback?: (context: TContext) => void;
    onSuccess?: (data: TData, response: ISuccessResponse<TData>, args: TArgs) => void;
    onError?: (message: string, response: IErrorResponse | null, args: TArgs, error?: Error) => void;
}

export interface IUseActionReturn<TData, TArgs extends unknown[]> {
    mutate: (...args: TArgs) => void;
    mutateAsync: (...args: TArgs) => Promise<IApiResponse<TData>>;
    pending: boolean;
    error: string | undefined;
    reset: () => void;
}

class ActionResponseError<TData> extends Error {
    public readonly response: Extract<IApiResponse<TData>, { success: false }>;

    constructor(response: Extract<IApiResponse<TData>, { success: false }>) {
        super(response.error);
        this.name = 'ActionResponseError';
        this.response = response;
    }
}

const isActionResponseError = <TData>(error: unknown): error is ActionResponseError<TData> => {
    return error instanceof ActionResponseError;
};

const normalizeThrownError = (error: unknown): IErrorResponse => {
    if (isActionResponseError(error)) {
        return {
            success: false,
            status: error.response.status,
            error: error.response.error,
        };
    }

    return {
        success: false,
        status: 500,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
};

export const useAction = <TData = IFormData, TArgs extends unknown[] = [], TContext = unknown>(
    options: IUseActionOptions<TData, TArgs, TContext>,
): IUseActionReturn<TData, TArgs> => {
    const queryClient = useQueryClient();

    const mutation = useMutation<IApiResponse<TData>, Error, TArgs, TContext | undefined>({
        mutationFn: async (args) => {
            const response = await options.action(...args);
            if (!response.success) {
                throw new ActionResponseError(response as Extract<IApiResponse<TData>, { success: false }>);
            }
            return response;
        },
        onMutate: async (args) => options.onOptimisticUpdate?.(...args),
        onSuccess: (response, args) => {
            options.invalidateKeys?.forEach((queryKey) => {
                void queryClient.invalidateQueries({ queryKey });
            });

            if (response.success) {
                options.onSuccess?.(response.data, response, args);
            }
        },
        onError: (error, args, context) => {
            if (context !== undefined) {
                options.onRollback?.(context);
            }

            if (isActionResponseError<TData>(error)) {
                options.onError?.(error.response.error, error.response as IErrorResponse, args, error);
                return;
            }

            options.onError?.(error.message, null, args, error);
        },
    });

    const mutate = (...args: TArgs): void => {
        mutation.mutate(args);
    };

    const mutateAsync = async (...args: TArgs): Promise<IApiResponse<TData>> => {
        try {
            return await mutation.mutateAsync(args);
        } catch (error) {
            return normalizeThrownError(error);
        }
    };

    return {
        mutate,
        mutateAsync,
        pending: mutation.isPending,
        error: mutation.error?.message,
        reset: mutation.reset,
    };
};
