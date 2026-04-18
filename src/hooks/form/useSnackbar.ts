'use client';

import type { IApiResponse } from '@/interfaces/actionHelper';
import { toast } from 'sonner';

export interface ISnackbarDescription {
    loadingMessage?: string;
    successMessage: string;
    errorMessage?: string;
}

interface IActionResult {
    success: boolean;
    error?: string;
    message?: string;
}

class SnackbarResultError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SnackbarResultError';
    }
}

class SnackbarApiResponseError<TData> extends Error {
    public readonly response: Extract<IApiResponse<TData>, { success: false }>;

    constructor(response: Extract<IApiResponse<TData>, { success: false }>) {
        super(response.error);
        this.name = 'SnackbarApiResponseError';
        this.response = response;
    }
}

const isSnackbarApiResponseError = <TData>(error: unknown): error is SnackbarApiResponseError<TData> => {
    return error instanceof SnackbarApiResponseError;
};

const normalizeErrorMessage = (error: unknown, fallback: string): string => {
    if (isSnackbarApiResponseError(error)) {
        return error.response.error;
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallback;
};

/**
 * Hook for showing toast notifications with promise handling
 * Adapted from refer-2 useSnackbar
 */
export const useSnackbar = () => {
    /**
     * Trigger a snackbar with loading, success, and error states
     */
    const triggerSnackbar = async <T extends IActionResult>(
        promise: Promise<T>,
        options: ISnackbarDescription
    ): Promise<T> => {
        const {
            loadingMessage = 'Processing...',
            successMessage,
            errorMessage = 'Something went wrong',
        } = options;

        const wrappedPromise = promise.then((result) => {
            if (!result.success) {
                throw new SnackbarResultError(result.error ?? errorMessage);
            }

            return result;
        });

        void toast.promise(wrappedPromise, {
            loading: loadingMessage,
            success: (result) => result.message ?? successMessage,
            error: (err) => normalizeErrorMessage(err, errorMessage),
        });

        try {
            return await wrappedPromise;
        } catch (err) {
            return {
                success: false,
                error: normalizeErrorMessage(err, errorMessage),
            } as T;
        }
    };

    /**
     * Trigger a snackbar for server-action style IApiResponse promises
     */
    const triggerActionSnackbar = async <TData>(
        promise: Promise<IApiResponse<TData>>,
        options: ISnackbarDescription
    ): Promise<IApiResponse<TData>> => {
        const {
            loadingMessage = 'Processing...',
            successMessage,
            errorMessage = 'Something went wrong',
        } = options;

        const wrappedPromise = promise.then((response) => {
            if (!response.success) {
                throw new SnackbarApiResponseError(response);
            }

            return response;
        });

        void toast.promise(wrappedPromise, {
            loading: loadingMessage,
            success: (response) => response.message ?? successMessage,
            error: (err) => normalizeErrorMessage(err, errorMessage),
        });

        try {
            return await wrappedPromise;
        } catch (err) {
            if (isSnackbarApiResponseError<TData>(err)) {
                return err.response;
            }

            return {
                success: false,
                status: 500,
                error: normalizeErrorMessage(err, errorMessage),
            };
        }
    };

    /**
     * Show a success toast
     */
    const showSuccess = (message: string, description?: string) => {
        toast.success(message, { description });
    };

    /**
     * Show an error toast
     */
    const showError = (message: string, description?: string) => {
        toast.error(message, { description });
    };

    /**
     * Show an info toast
     */
    const showInfo = (message: string, description?: string) => {
        toast.info(message, { description });
    };

    /**
     * Show a warning toast
     */
    const showWarning = (message: string, description?: string) => {
        toast.warning(message, { description });
    };

    /**
     * Show a loading toast that can be dismissed
     */
    const showLoading = (message: string) => {
        return toast.loading(message);
    };

    /**
     * Dismiss a specific toast or all toasts
     */
    const dismiss = (toastId?: string | number) => {
        toast.dismiss(toastId);
    };

    return {
        triggerSnackbar,
        triggerActionSnackbar,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showLoading,
        dismiss,
    };
};

export default useSnackbar;
