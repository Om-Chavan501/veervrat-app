'use client';

import { useMemo, type FormEvent } from 'react';

import type { QueryKey } from '@tanstack/react-query';

import type { IFormData, IHandleChange } from '@/components/form/form';
import FormWrapper, { type IFieldConfig } from '@/components/form/FormWrapper';
import { useFormOperations } from '@/hooks/form/useFormOperations';
import { useSnackbar, type ISnackbarDescription } from '@/hooks/form/useSnackbar';
import { useAction, type ActionFn } from '@/hooks/server/useAction';
import type { IApiResponse } from '@/interfaces/actionHelper';

interface IActionFormSuccessPayload<TFormBody extends IFormData, TResult> {
    result: TResult;
    response: Extract<IApiResponse<TResult>, { success: true }>;
    formData: TFormBody;
}

interface IActionFormErrorPayload {
    message: string;
    response: Extract<IApiResponse<never>, { success: false }> | null;
}

export interface IActionFormProps<TFormBody extends IFormData, TResult> {
    action: ActionFn<TResult, [TFormBody]>;
    initialData?: Partial<TFormBody> | undefined;
    fields: Array<IFieldConfig<TFormBody>> | ((formData: TFormBody, handleChange: IHandleChange) => Array<IFieldConfig<TFormBody>>);
    transformPayload?: ((formData: TFormBody) => TFormBody) | undefined;
    invalidateKeys?: QueryKey[] | undefined;
    submitLabel?: string | undefined;
    cancelLabel?: string | undefined;
    className?: string | undefined;
    disabled?: boolean | undefined;
    hideActionable?: boolean | undefined;
    navigateBackRequired?: boolean | undefined;
    requireModification?: boolean | undefined;
    snackbar?: ISnackbarDescription | ((formData: TFormBody) => ISnackbarDescription) | undefined;
    onSecondaryClick?: (() => void) | undefined;
    onSuccess?: ((payload: IActionFormSuccessPayload<TFormBody, TResult>) => void) | undefined;
    onError?: ((payload: IActionFormErrorPayload) => void) | undefined;
}

export function ActionForm<TFormBody extends IFormData, TResult>({
    action,
    initialData,
    fields,
    transformPayload,
    invalidateKeys,
    submitLabel,
    cancelLabel,
    className,
    disabled,
    hideActionable,
    navigateBackRequired,
    requireModification = true,
    snackbar,
    onSecondaryClick,
    onSuccess,
    onError,
}: IActionFormProps<TFormBody, TResult>) {
    const { triggerActionSnackbar } = useSnackbar();
    const { formData, setFormData, handleChange, isModified, resetForm, submitBtnRef } = useFormOperations<TFormBody>(initialData ?? {});

    const actionOptions = {
        action,
        ...(invalidateKeys !== undefined ? { invalidateKeys } : {}),
    };

    const { mutateAsync, pending } = useAction<TResult, [TFormBody]>(actionOptions);

    const resolvedFields = useMemo(() => {
        return typeof fields === 'function' ? fields(formData, handleChange) : fields;
    }, [fields, formData, handleChange]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const payload = transformPayload ? transformPayload(formData) : formData;
        const response = snackbar ? await triggerActionSnackbar(mutateAsync(payload), typeof snackbar === 'function' ? snackbar(formData) : snackbar) : await mutateAsync(payload);

        if (response.success) {
            onSuccess?.({
                result: response.data,
                response,
                formData,
            });
            return;
        }

        onError?.({
            message: response.error,
            response,
        });
    };

    const handleSecondary = () => {
        resetForm();
        onSecondaryClick?.();
    };

    return (
        <FormWrapper
            formConfig={resolvedFields}
            handleSubmit={handleSubmit}
            handleSecondaryClick={handleSecondary}
            className={className}
            submitLabel={submitLabel}
            cancelLabel={cancelLabel}
            handleChange={handleChange}
            setFormData={setFormData}
            formData={formData}
            isModified={requireModification ? isModified : true}
            isSubmitting={pending}
            hideActionable={hideActionable}
            navigateBackRequired={navigateBackRequired}
            submitBtnRef={submitBtnRef}
            disabled={disabled}
        />
    );
}

export default ActionForm;
