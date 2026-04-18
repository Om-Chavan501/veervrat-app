'use client';

import UniversalForm, { type IUniversalFormLabels, type IUniversalFormProps } from './UniversalForm';
import type { IFormData } from './form';

export interface IAdminEntityFormProps<TFormBody extends IFormData> extends Omit<IUniversalFormProps<TFormBody>, 'showBackButton' | 'title' | 'labels'> {
    entityName: string;
    isEditing?: boolean | undefined;
    title?: string | undefined;
    labels?: IUniversalFormLabels | undefined;
}

export function AdminEntityForm<TFormBody extends IFormData>({ entityName, isEditing = false, title, labels, ...props }: IAdminEntityFormProps<TFormBody>): React.ReactElement {
    const resolvedTitle = title ?? `${isEditing ? 'Edit' : 'New'} ${entityName}`;

    const resolvedLabels: IUniversalFormLabels = {
        submit: labels?.submit ?? (isEditing ? 'Update' : 'Create'),
        submitting: labels?.submitting ?? 'Saving…',
        ...(labels?.back !== undefined ? { back: labels.back } : {}),
        ...(labels?.discard !== undefined ? { discard: labels.discard } : {}),
        ...(labels?.previous !== undefined ? { previous: labels.previous } : {}),
        ...(labels?.next !== undefined ? { next: labels.next } : {}),
    };

    return <UniversalForm<TFormBody> {...props} showBackButton={false} title={resolvedTitle} labels={resolvedLabels} />;
}

export default AdminEntityForm;
