# Dialog Usage

This module supports three dialog types through one hook + host flow:

- `confirmation`
- `form`
- `view`

Use these together:

- `useDialog` from `@/hooks/useDialog`
- Global `DialogProvider` in `src/providers/index.tsx` (already wired)

## 1) Base Setup (required)

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/hooks/useDialog';

export function DialogDemo(): React.ReactElement {
    const dialog = useDialog();

    return (
        <Button type='button' onClick={() => dialog.openView({ title: 'Demo', content: <p>Hello</p> })}>
            Open Dialog
        </Button>
    );
}
```

Why no `DialogHost` here:

- `DialogHost` is now mounted once globally inside `DialogProvider`.
- Every component only calls `useDialog()` and opens dialogs through that shared context.
- This keeps feature components cleaner and avoids repeated host rendering.

## 2) Confirmation Dialog Example

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/hooks/useDialog';

export function DeleteArticleButton({ slug }: { slug: string }): React.ReactElement {
    const dialog = useDialog();

    const onAskDelete = () => {
        dialog.openConfirmation({
            title: 'Delete Article',
            description: 'This action cannot be undone.',
            message: `Do you want to delete ${slug}?`,
            tone: 'destructive',
            confirmLabel: 'Delete',
            cancelLabel: 'Keep',
            onConfirm: async () => {
                // Call your server action here
                // await deleteArticle(slug)
            },
        });
    };

    return (
        <Button type='button' variant='destructive' onClick={onAskDelete}>
            Delete
        </Button>
    );
}
```

## 3) Form Dialog Example

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/hooks/useDialog';

type TopicFormData = {
    title: string;
    description: string;
};

export function CreateTopicDialog(): React.ReactElement {
    const dialog = useDialog();

    const onOpenCreate = () => {
        dialog.openForm<TopicFormData>({
            title: 'Create Topic',
            description: 'Add a new topic to your content map.',
            width: 'lg',
            submitLabel: 'Create',
            cancelLabel: 'Cancel',
            defaultValues: {
                title: '',
                description: '',
            },
            fields: [
                {
                    fieldtype: 'input',
                    name: 'title',
                    label: 'Title',
                    placeholder: 'Type topic title',
                    colsize: '3',
                },
                {
                    fieldtype: 'textArea',
                    name: 'description',
                    label: 'Description',
                    placeholder: 'Type short description',
                    colsize: '3',
                },
            ],
            onSubmit: async (formData) => {
                // Call your server action here
                // await createTopic(formData)
            },
        });
    };

    return (
        <Button type='button' onClick={onOpenCreate}>
            New Topic
        </Button>
    );
}
```

## 4) View Dialog Example

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/hooks/useDialog';

export function ViewDetailsDialog(): React.ReactElement {
    const dialog = useDialog();

    const onOpenDetails = () => {
        dialog.openView({
            title: 'Project Details',
            description: 'Read-only summary',
            subText: 'Updated 2 hours ago',
            closeLabel: 'Done',
            width: 'xl',
            content: (
                <div className='space-y-2'>
                    <p>Project: Personal Website</p>
                    <p>Status: Active</p>
                    <p>Stack: Next.js, TypeScript, MongoDB</p>
                </div>
            ),
        });
    };

    return (
        <Button type='button' variant='outline' onClick={onOpenDetails}>
            View Details
        </Button>
    );
}
```

## 5) Manual Open (advanced)

If needed, you can still call the generic opener:

```tsx
dialog.openDialog({
    type: 'confirmation',
    title: 'Confirm Action',
    onConfirm: async () => {
        // ...
    },
});
```

## 6) Notes

- Do not render `DialogHost` inside feature components. It is already mounted globally by `DialogProvider`.
- Prefer `openConfirmation`, `openForm`, and `openView` over `openDialog` for stronger typing.
- Keep action calls inside `onConfirm` and `onSubmit`.
