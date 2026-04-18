# Hooks Usage Guide

This document explains how to use the current server-action-first hooks and utilities:

- `useAction`
- `useActionQuery`
- `useDebounce`
- `usePagination`
- `executeServerAction`
- `createServerActionExecutor`
- `useLegacyAPIAction`

Scope note:

- This guide intentionally does not cover `useAdminTable` or Jotai atoms.
- This guide intentionally does not focus on form hooks.

---

## 1) Architecture Direction (Important)

The current direction is server-action-first.

- Reads should use server actions + `useActionQuery`.
- Mutations should use server actions + `useAction`.
- Avoid introducing new HTTP client wrappers for internal app logic.
- Keep response contracts as `IApiResponse<T>` from `@/interfaces/actionHelper`.

---

## 2) Response Contract You Should Return

From `@/interfaces/actionHelper`:

```ts
export type IApiResponse<T> = { success: true; status: 200 | 201; data: T; message?: string } | { success: false; status: 400 | 401 | 403 | 404 | 409 | 429 | 500; error: string };
```

Both `useAction` and `useActionQuery` expect your server actions to return this envelope.

---

## 2.1) What Is Implemented Right Now

Current hook and utility files in this repository:

- `src/hooks/useAction.ts`
- `src/hooks/useActionQuery.ts`
- `src/hooks/useDebounce.ts`
- `src/hooks/usePagination.ts`
- `src/lib/api.ts` (`executeServerAction`, `createServerActionExecutor`)

Current canonical server action helper utilities used by action implementations:

- `src/server/new/utils/helper.ts` (`success`, `created`, `error`, `handleError`, `tryCatch`)

---

## 2.2) Server Action File Wrapper (Implementation Layer)

When you implement a public server action file itself, use the helper wrapper pattern from `src/server/new/utils/helper.ts`.

Use `tryCatch` + `success`/`error` so action behavior is consistent:

```ts
import { success, error, tryCatch } from '@/server/new/utils/helper';
import type { IApiResponse } from '@/interfaces/actionHelper';

type Payload = { slug: string };
type Result = { views: number };

export const getPublicStats = tryCatch(async (payload: Payload): Promise<IApiResponse<Result>> => {
    if (!payload.slug) return error('Slug is required', 400);

    // domain logic
    const views = 42;
    return success({ views });
}, 'Failed to load public stats');
```

Why:

- Keeps response envelopes deterministic.
- Keeps error handling consistent across action modules.
- Matches project-wide server action contract.

---

## 3) `useAction` (Mutations)

File: `src/hooks/useAction.ts`

### What it does

`useAction` is a typed mutation wrapper over TanStack `useMutation` for server actions returning `IApiResponse<T>`.

- Automatically treats `success: false` as an error path.
- Supports cache invalidation (`invalidateKeys`).
- Supports optimistic update and rollback hooks.
- Returns normalized result from `mutateAsync` even if action throws.

### Signature

```ts
useAction<TData = IFormData, TArgs extends unknown[] = [], TContext = unknown>(options)
```

### Options

```ts
{
  action: (...args: TArgs) => Promise<IApiResponse<TData>>;
  invalidateKeys?: QueryKey[];
  onOptimisticUpdate?: (...args: TArgs) => TContext;
  onRollback?: (context: TContext) => void;
  onSuccess?: (data: TData, response: SuccessResponse, args: TArgs) => void;
  onError?: (message: string, response: ErrorResponse | null, args: TArgs, error?: Error) => void;
}
```

### Return value

```ts
{
  mutate: (...args: TArgs) => void;
  mutateAsync: (...args: TArgs) => Promise<IApiResponse<TData>>;
  pending: boolean;
  error: string | undefined;
  reset: () => void;
}
```

### Example: Simple mutation

```tsx
'use client';

import { useAction } from '@/hooks';
import { createTopic } from '@/server/new/admin/topic/createTopic';

export function CreateTopicButton() {
    const { mutate, pending, error } = useAction<string, [title: string]>({
        action: createTopic,
        invalidateKeys: [['admin', 'topics']],
        onSuccess: (topicId) => {
            console.log('Created topic:', topicId);
        },
        onError: (message) => {
            console.error(message);
        },
    });

    return (
        <button disabled={pending} onClick={() => mutate('New Topic')}>
            {pending ? 'Creating...' : 'Create Topic'}
            {error ? ` - ${error}` : ''}
        </button>
    );
}
```

### Example: `mutateAsync` flow

```tsx
const { mutateAsync } = useAction<boolean, [slug: string]>({ action: publishTopic });

const handlePublish = async () => {
    const result = await mutateAsync('my-topic');
    if (!result.success) {
        // normalized failure envelope
        console.error(result.error);
        return;
    }
    console.log('Published:', result.data);
};
```

### Example: Optimistic + rollback

```tsx
const { mutate } = useAction<number, [slug: string], { previousLikes: number }>({
    action: likePost,
    onOptimisticUpdate: (slug) => {
        const previousLikes = 10; // read from local cache/state
        // set optimistic UI state here
        return { previousLikes };
    },
    onRollback: (context) => {
        // revert optimistic UI state using context.previousLikes
        console.log('rollback to', context.previousLikes);
    },
});
```

---

## 4) `useLegacyAPIAction` (Compatibility Alias)

File: `src/hooks/useAction.ts`

`useLegacyAPIAction` currently exists as a compatibility alias for migration:

```ts
export const useLegacyAPIAction = (...) => useAction(...)
```

Use policy:

- New code: use `useAction`.
- Existing old call sites: may temporarily use `useLegacyAPIAction`.
- Remove alias usage gradually as migration completes.

## 5) `useActionQuery` (Reads/Queries)

File: `src/hooks/useActionQuery.ts`

### What it does

`useActionQuery` wraps TanStack `useQuery` for server actions returning `IApiResponse<T>`.

- Calls action with optional tuple args.
- Throws when response is `success: false`.
- Gives standard query states: `data`, `isLoading`, `isError`, `isFetching`.

### Signature

```ts
useActionQuery<TData = IFormData, TSelected = TData, TArgs extends unknown[] = []>(options)
```

### Options

```ts
{
  queryKey: QueryKey;
  action: (...args: TArgs) => Promise<IApiResponse<TData>>;
  args?: TArgs;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  select?: (data: TData) => TSelected;
  placeholderData?: TSelected | ((previousData: TSelected | undefined) => TSelected | undefined);
  // and all common UseQueryOptions except queryFn/queryKey
}
```

### Example: Content list query (similar to your useQuery example)

```tsx
'use client';

import { useActionQuery, useDebounce } from '@/hooks';
import { getPublicContentList } from '@/server/new/public/content/getPublicContentList';

export function ContentList({ contentType }: { contentType: string }) {
    const search = 'react';
    const difficulty = 'all';
    const categoryId = '';
    const sortBy = 'latest';
    const page = 1;
    const limit = 10;

    const debouncedSearch = useDebounce(search, 400);

    const { data, isLoading, isError, isFetching } = useActionQuery({
        queryKey: ['content-list', contentType, { search: debouncedSearch, difficulty, categoryId, sortBy, page, limit }],
        action: getPublicContentList,
        args: [
            {
                search: debouncedSearch,
                type: contentType,
                difficulty,
                categoryId,
                page,
                limit,
                sortBy,
            },
        ],
        staleTime: 60_000,
        placeholderData: (previous) => previous,
    });

    if (isLoading) return <p>Loading...</p>;
    if (isError) return <p>Failed to load content</p>;

    return (
        <div>
            <p>{isFetching ? 'Refreshing...' : 'Fresh'}</p>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}
```

### Example: using `select`

```tsx
const { data: titles = [] } = useActionQuery({
    queryKey: ['article-titles'],
    action: getArticleList,
    select: (rows) => rows.map((item) => item.title),
});
```

---

## 6) `useDebounce`

File: `src/hooks/useDebounce.ts`

### `useDebounce(value, delay)`

Returns a debounced value after `delay` ms.

```tsx
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 400);
```

Use this debounced value inside query args and query keys so fetches happen after typing pauses.

### `useDebouncedCallback(callback, delay)`

Returns a debounced callback function.

```tsx
const saveDraft = useDebouncedCallback((text: string) => {
    void updateDraft(text);
}, 800);

// call on every keystroke
saveDraft(editorText);
```

Use when you want event-driven debouncing instead of value debouncing.

---

## 7) `usePagination`

File: `src/hooks/usePagination.ts`

### `usePagination(data, options)`

Use for classic page-number pagination on in-memory arrays.

```tsx
const { page, totalPages, paginatedData, hasNextPage, nextPage, previousPage, setPage, setPageSize, pageNumbers } = usePagination(items, { initialPage: 1, pageSize: 10 });
```

### `useInfiniteScroll(data, options)`

Use for load-more style rendering on in-memory arrays.

```tsx
const { visibleData, hasMore, loadMore, reset, limit } = useInfiniteScroll(items, {
    initialLimit: 12,
    step: 12,
});
```

---

## 8) Server Utility in `src/lib/api.ts`

This file is now server-action execution utility, not HTTP API client.

### `executeServerAction`

```ts
executeServerAction(action, args, actionName?)
```

What it does:

- Executes any server action with tuple args.
- Measures duration.
- Logs success/failure in dev mode (`env.IS_DEV`).
- Normalizes thrown errors into `IApiResponse` error envelope.

Example:

```ts
import { executeServerAction } from '@/lib/api';
import { getTopicBySlug } from '@/server/new/public/topic/getTopicBySlug';

export async function getTopicWithMetrics(slug: string) {
    return executeServerAction(getTopicBySlug, [slug], 'getTopicBySlug');
}
```

### `createServerActionExecutor`

```ts
createServerActionExecutor(action, actionName?)
```

What it does:

- Returns a pre-bound function that already wraps execution + logging + error normalization.
- Useful when reusing the same wrapped action from multiple call sites.

Example:

```ts
import { createServerActionExecutor } from '@/lib/api';
import { updateTopic } from '@/server/new/admin/topic/updateTopic';

const runUpdateTopic = createServerActionExecutor(updateTopic, 'updateTopic');

export async function safeUpdateTopic(topicId: string, payload: { title: string }) {
    return runUpdateTopic(topicId, payload);
}
```

### Why these utilities matter

- Consistent behavior for execution, error envelopes, and instrumentation.
- Cleaner server-side orchestration without repeating try/catch.
- Better observability in development.

### Why they are not used internally by `useAction` / `useActionQuery`

`useAction` and `useActionQuery` are client hooks for UI lifecycle management (cache, loading states, invalidation, optimistic behavior).

`executeServerAction` and `createServerActionExecutor` are server orchestration utilities.

They are intentionally separate so concerns stay clean:

- Client hooks manage React Query behavior.
- Server wrappers manage server execution instrumentation and normalization.

This avoids coupling client hooks to server orchestration internals.

---

## 9) Practical Patterns

### Pattern 0: Where to use what exactly

Use this placement matrix for public features:

- Server page (`src/app/**/page.tsx`, Server Component):
    - Call public server action directly with `await`.
    - Optionally wrap with `executeServerAction` for timing/logging.
- Client interactive island (`'use client'` component):
    - Read data with `useActionQuery`.
    - Mutate data with `useAction`.
- Server action implementation file (`src/server/new/public/**`):
    - Use `tryCatch` + `success` / `error`.

Example server page (direct):

```tsx
import { notFound } from 'next/navigation';
import { getPublicContentList } from '@/server/new/public/content/getPublicContentList';

export default async function Page() {
    const result = await getPublicContentList({ limit: 20 });
    if (!result.success) notFound();

    return <pre>{JSON.stringify(result.data, null, 2)}</pre>;
}
```

Example server page (with orchestration wrapper):

```tsx
import { notFound } from 'next/navigation';
import { executeServerAction } from '@/lib/api';
import { getPublicContentList } from '@/server/new/public/content/getPublicContentList';

export default async function Page() {
    const result = await executeServerAction(getPublicContentList, [{ limit: 20 }], 'getPublicContentList');
    if (!result.success) notFound();

    return <pre>{JSON.stringify(result.data, null, 2)}</pre>;
}
```

### Pattern A: Query + Mutation together

```tsx
const listQuery = useActionQuery({
    queryKey: ['topics'],
    action: getTopics,
});

const publishAction = useAction<boolean, [string]>({
    action: publishTopic,
    invalidateKeys: [['topics']],
});
```

### Pattern B: keep UI stable while refetching

```tsx
const { data, isFetching } = useActionQuery({
    queryKey: ['content', params],
    action: getPublicContentList,
    args: [params],
    placeholderData: (previous) => previous,
});
```

### Pattern C: always use typed tuple args

```ts
useAction<MyData, [slug: string, payload: UpdatePayload]>({ action: updateSomething });
```

This keeps action invocations strict and self-documenting.

---

## 10) Migration Notes

- New code should import `useAction` and `useActionQuery`.
- Existing code using `useLegacyAPIAction` can continue temporarily.
- Migrate legacy naming gradually, then remove compatibility alias when no longer needed.
- Keep server action return shape aligned with `IApiResponse<T>`.

---

## 11) Quick Checklist

Before shipping a hook usage flow:

- Action returns `IApiResponse<T>`.
- Query keys are stable and include all filter/sort/page inputs.
- Mutations invalidate affected query keys.
- Debounce is applied to search input before query args.
- Pagination mode matches UX requirement:
    - `usePagination` for page-number UIs.
    - `useInfiniteScroll` for load-more UIs.
