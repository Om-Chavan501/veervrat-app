# Form System Usage

This form layer is config-driven and built for server-action-first flows.

## 1) UniversalForm (recommended)

Use `UniversalForm` for all admin forms - it supports both multi-step wizard forms and regular single-page forms. The action bar is at the TOP (not sticky footer), which avoids scroll issues with nested scroll containers.

### Multi-step Wizard Form

```tsx
'use client';

import { UniversalForm, type IStepConfig, type IFieldConfig } from '@/components/form';
import type { IFormData, IHandleChange } from '@/components/form/form';
import { useFormOperations, useSnackbar } from '@/hooks/form';
import { useState } from 'react';

interface IArticleForm extends IFormData {
    title: string;
    slug: string;
    body: string;
    publishStatus: 'draft' | 'published';
}

// Step configurations
const steps: Array<IStepConfig<IArticleForm>> = [
    {
        id: 'details',
        label: 'Details',
        description: 'Title & slug',
        fields: [
            { fieldtype: 'input', name: 'title', label: 'Title', required: true, colsize: 'full' },
            { fieldtype: 'input', name: 'slug', label: 'Slug', required: true, colsize: 'full' },
        ],
        validate: (data) => Boolean(data.title.trim() && data.slug.trim()),
        errorMessage: 'Please fill in title and slug.',
    },
    {
        id: 'content',
        label: 'Content',
        description: 'Body & status',
        fields: (formData: IArticleForm, _handleChange: IHandleChange) => [
            { fieldtype: 'authorly', name: 'body', label: 'Body', colsize: 'full' },
            {
                fieldtype: 'select',
                name: 'publishStatus',
                label: 'Status',
                options: [
                    { label: 'Draft', value: 'draft' },
                    { label: 'Published', value: 'published' },
                ],
                colsize: 3,
            },
        ],
        validate: (data) => Boolean(data.body.trim()),
    },
];

export default function ArticleCreateForm() {
    const { showSuccess, showError } = useSnackbar();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const initialData: IArticleForm = {
        title: '',
        slug: '',
        body: '',
        publishStatus: 'draft',
    };
    
    const { formData, handleChange, setFormData, isModified, resetForm, submitBtnRef } = useFormOperations(initialData);

    const handleSubmit = async (data: IArticleForm) => {
        setIsSubmitting(true);
        try {
            // Call your server action here
            showSuccess('Article created!');
        } catch {
            showError('Failed to create article');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <UniversalForm<IArticleForm>
            steps={steps}
            formData={formData}
            handleChange={handleChange}
            setFormData={setFormData}
            isModified={isModified}
            onSubmit={handleSubmit}
            onReset={resetForm}
            onValidationError={(step) => showError('Validation Error', step.errorMessage)}
            isSubmitting={isSubmitting}
            submitBtnRef={submitBtnRef}
            title="New Article"
            labels={{
                submit: 'Create Article',
                submitting: 'Creating...',
            }}
        />
    );
}
```

### Regular Form (no steps)

When you omit the `steps` prop and provide `fields` instead, UniversalForm works as a regular single-page form:

```tsx
<UniversalForm<ITopicForm>
    fields={[
        { fieldtype: 'input', name: 'title', label: 'Title', required: true, colsize: 'full' },
        { fieldtype: 'input', name: 'slug', label: 'Slug', required: true, colsize: 'full' },
        { fieldtype: 'textArea', name: 'description', label: 'Description', colsize: 'full' },
    ]}
    formData={formData}
    handleChange={handleChange}
    setFormData={setFormData}
    isModified={isModified}
    onSubmit={handleSubmit}
    onReset={resetForm}
    isSubmitting={isSubmitting}
    title="New Topic"
    labels={{ submit: 'Create Topic' }}
/>
```

### UniversalForm Props

| Prop | Type | Description |
|------|------|-------------|
| `steps` | `IStepConfig[]` | Step configurations for wizard mode (optional) |
| `fields` | `IFieldConfig[]` or function | Fields for regular form mode (used when `steps` is not provided) |
| `formData` | `TFormBody` | Current form state |
| `handleChange` | `IHandleChange` | Change handler from useFormOperations |
| `setFormData` | `SetStateAction` | State setter from useFormOperations |
| `isModified` | `boolean` | Whether form has unsaved changes |
| `onSubmit` | `(data) => void \| Promise<void>` | Submit handler - receives form data |
| `onReset` | `() => void` | Reset handler |
| `onValidationError` | `(step, data) => void` | Called when step validation fails |
| `isSubmitting` | `boolean` | Loading state |
| `disabled` | `boolean` | Disable form |
| `hideActions` | `boolean` | Hide the top action bar |
| `showBackButton` | `boolean` | Show back navigation button (default: true) |
| `title` | `string` | Title shown in the action bar |
| `labels` | `IUniversalFormLabels` | Custom labels for buttons |
| `headerContent` | `ReactNode` | Custom content between action bar and form fields |
| `footerContent` | `ReactNode` | Custom content below form fields |
| `submitBtnRef` | `RefObject` | Ref for external submit triggering |
| `initialStep` | `number` | Initial step index for stepper mode |

### IStepConfig Interface

```ts
interface IStepConfig<TFormBody> {
    id: string;                    // Unique step identifier
    label: string;                 // Display label
    description?: string;          // Optional description shown below label
    fields: IFieldConfig[] | ((formData, handleChange) => IFieldConfig[]);
    validate?: (formData) => boolean;  // Return true if valid
    errorMessage?: string;         // Message shown when validation fails
}
```

### IUniversalFormLabels Interface

```ts
interface IUniversalFormLabels {
    back?: string;       // Back navigation button (default: 'Back')
    discard?: string;    // Discard/reset button (default: 'Discard')
    previous?: string;   // Previous step button (default: 'Previous')
    next?: string;       // Next step button (default: 'Next')
    submit?: string;     // Submit button (default: 'Save')
    submitting?: string; // Loading state label (default: 'Saving…')
}
```

---

## 2) ActionForm (simpler alternative)

Use `ActionForm` when you want built-in `useFormOperations` state tracking plus `useAction` submission.

```tsx
'use client';

import { ActionForm, type IFieldConfig } from '@/components/form';
import type { IFormData } from '@/components/form/form';
import { createArticle } from '@/server/new/admin/content/createArticle';

interface IArticleForm extends IFormData {
    title: string;
    summary: string;
    category: string;
    published: boolean;
    body: string;
}

const fields: Array<IFieldConfig<IArticleForm>> = [
    {
        fieldtype: 'input',
        name: 'title',
        label: 'Title',
        placeholder: 'Post title',
        required: true,
        colsize: 3,
    },
    {
        fieldtype: 'select',
        name: 'category',
        label: 'Category',
        placeholder: 'Pick category',
        colsize: 3,
        options: [
            { label: 'Engineering', value: 'engineering' },
            { label: 'Writing', value: 'writing' },
        ],
    },
    {
        fieldtype: 'textArea',
        name: 'summary',
        label: 'Summary',
        rows: 4,
        colsize: 'full',
    },
    {
        fieldtype: 'authorly',
        name: 'body',
        label: 'Content',
        minHeight: '560px',
        colsize: 'full',
    },
    {
        fieldtype: 'toggle',
        name: 'published',
        label: 'Publish immediately',
        colsize: 2,
    },
];

export default function ArticleCreateForm() {
    return (
        <ActionForm<IArticleForm, { id: string }>
            action={createArticle}
            initialData={{
                title: '',
                summary: '',
                category: '',
                published: false,
                body: '',
            }}
            fields={fields}
            submitLabel='Create Article'
            cancelLabel='Reset'
            onSuccess={() => {
                // toast / route push
            }}
            onError={({ message }) => {
                // toast error
                console.error(message);
            }}
        />
    );
}
```

---

## 3) Dynamic Field Config

Pass a function to `fields` when form config depends on current values.

```tsx
fields={(formData) => [
    {
        fieldtype: 'input',
        name: 'title',
        label: 'Title',
        colsize: 3,
    },
    {
        fieldtype: 'input',
        name: 'canonicalUrl',
        label: 'Canonical URL',
        hidden: !formData?.isCanonical,
        colsize: 3,
    },
]}
```

---

## 4) Supported fieldtype values

- `input` - Text, number, email, url inputs
- `textArea` - Multi-line text
- `select` - Dropdown with options
- `checkbox` - Boolean checkbox
- `toggle` - Boolean toggle switch
- `authorly` - Rich text editor (Tiptap-based)
- `tagInput` - Tag/chip input with add/remove
- `divider` - Visual separator
- `group` - Groups fields with a title and description

---

## 5) Manual mode (FormWrapper)

If you need complete submission control with a sticky footer, use `FormWrapper` directly with your own submit handler and `useFormOperations`.

> **Note:** `StepperForm` is deprecated in favor of `UniversalForm`. It had scroll issues due to the sticky footer conflicting with nested scroll containers. Use `UniversalForm` instead.
