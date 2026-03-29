# Tasks: global-vratmitra

## 1. Backend — Data Model

- [x] 1.1 `backend/app/models/models.py`
  - Add `UserVratmitra` model:
    ```
    __tablename__ = "user_vratmitras"
    id              String PK
    user_id         String FK(users.id)       ← the inviter (owner of the relationship)
    vratmitra_id    String FK(users.id)       ← the invitee
    status          VratmitraStatus enum (PENDING | ACTIVE | DETACHED)
    invited_at      DateTime
    accepted_at     DateTime nullable
    detached_at     DateTime nullable
    UniqueConstraint(user_id)               ← one non-REMOVED global VM per user
    relationships: user → User, vratmitra → User
    ```
  - Reuse existing `VratmitraStatus` enum (PENDING/ACTIVE/DETACHED)

- [x] 1.2 Alembic migration
  - `alembic revision --autogenerate -m "add_user_vratmitras"`
  - Edit generated file: keep only `create_table('user_vratmitras', ...)`, remove any unrelated detected changes
  - Add GIN indexes: `CREATE INDEX CONCURRENTLY ix_users_name_lower ON users (lower(name))` and `ix_users_email_lower ON users (lower(email))`
  - `alembic upgrade head`

## 2. Backend — Schemas

- [x] 2.1 `backend/app/schemas/schemas.py`
  - Add `UserSearchItem`: `{ id: str, name: str, email: str }`
  - Add `GlobalVratmitraInviteRequest`: `{ invitee_id: str }`
  - Add `GlobalVratmitraOut`: `{ id, user_id, vratmitra_id, status, invited_at, accepted_at, detached_at, vratmitra: UserSearchItem }`
  - Update `InviteVratmitraRequest`: add optional `invitee_id: str | None = None` alongside existing `invitee_email`

## 3. Backend — User Search Endpoint

- [x] 3.1 `backend/app/routers/users.py`
  - Add `GET /search` (auth required):
    - Query param `q: str`
    - If `len(q) < 2` return `[]`
    - Query: `SELECT id, name, email FROM users WHERE (lower(name) LIKE lower('%q%') OR lower(email) LIKE lower('%q%')) AND id != current_user.id LIMIT 10`
    - Return `list[UserSearchItem]`

## 4. Backend — Global Vratmitra Router

- [x] 4.1 `backend/app/routers/vratmitra.py` — add global Vratmitra endpoints:
  - `POST /global` (auth required)
    - Validate: `invitee_id != current_user.id` (400 "Cannot invite yourself")
    - Validate: no existing PENDING or ACTIVE `UserVratmitra` for `user_id=current_user.id` (400)
    - Look up invitee user by `invitee_id` (404 if not found)
    - Create `UserVratmitra(user_id=current_user.id, vratmitra_id=invitee_id, status=PENDING, invited_at=now)`
    - Return `GlobalVratmitraOut`
  - `GET /global` (auth required)
    - Return the current `UserVratmitra` where `user_id=current_user.id` and `status in (PENDING, ACTIVE)`, or `null`
  - `GET /global/pending` (auth required)
    - Return list of `UserVratmitra` where `vratmitra_id=current_user.id` and `status=PENDING`
  - `POST /global/accept` (auth required)
    - Find `UserVratmitra` where `vratmitra_id=current_user.id` and `status=PENDING` (404 if not found)
    - Set `status=ACTIVE`, `accepted_at=now`, commit
    - Return `GlobalVratmitraOut`
  - `DELETE /global` (auth required)
    - Find record where `user_id=current_user.id OR vratmitra_id=current_user.id` and `status != DETACHED`
    - Hard delete the record (404 if not found)
    - Return `204`

- [x] 4.2 Update `POST /journeys/{journey_id}/invite` in `vratmitra.py`
  - Accept `invitee_id: str | None` in request body in addition to `invitee_email`
  - If `invitee_id` provided: look up user by ID (404 if not found); use that user
  - Else: existing email lookup logic (unchanged)

## 5. Backend — Main App

- [x] 5.1 No router changes needed — global endpoints added to existing `vratmitra` router

## 6. Frontend — API Layer

- [x] 6.1 `frontend/src/api/users.ts` (new file)
  - `search(q: string)` → `GET /users/search?q={q}` → `UserSearchItem[]`

- [x] 6.2 `frontend/src/api/vratmitra.ts` (update or create)
  - `getGlobal()` → `GET /vratmitra/global` → `GlobalVratmitraOut | null`
  - `getGlobalPending()` → `GET /vratmitra/global/pending` → `GlobalVratmitraOut[]`
  - `inviteGlobal(inviteeId: string)` → `POST /vratmitra/global` → `GlobalVratmitraOut`
  - `acceptGlobal()` → `POST /vratmitra/global/accept` → `GlobalVratmitraOut`
  - `removeGlobal()` → `DELETE /vratmitra/global`
  - Update `inviteJourneyVratmitra(journeyId, payload: { invitee_email?: string; invitee_id?: string })` to support `invitee_id`

## 7. Frontend — UserSearchCombobox Component

- [x] 7.1 `frontend/src/components/UserSearchCombobox.tsx` (new file)
  - Props: `onSelect: (user: UserSearchItem) => void, placeholder?: string`
  - State: `query` (string), `open` (boolean)
  - `useQuery(['user-search', query], () => usersApi.search(query), { enabled: query.length >= 2, staleTime: 30_000 })`
  - Debounce input 300ms (use `setTimeout`/`clearTimeout` in `useEffect`)
  - Renders: text input + dropdown list below (absolute positioned, `z-50`)
  - Each dropdown item shows: `name` (bold) + `email` (muted small text)
  - On item click: calls `onSelect(user)`, clears query, closes dropdown
  - Loading state: spinner inside input trailing
  - Empty state: "No users found" message when results are empty and query ≥ 2 chars
  - Close dropdown on outside click (`useEffect` + `mousedown` listener)

## 8. Frontend — Vratmitra Page (Global Section)

- [x] 8.1 `frontend/src/pages/Vratmitra.tsx`
  - Add "Global Vratmitra" section at the top of the page
  - `useQuery(['global-vratmitra'], invitesApi.getGlobal)`
  - `useQuery(['global-vratmitra-pending'], invitesApi.getGlobalPending)`
  - **No global VM**: show `UserSearchCombobox` + "Invite as Global Vratmitra" button
    - On submit: `useMutation(invitesApi.inviteGlobal)` → invalidate `['global-vratmitra']` → toast "Invitation sent"
  - **PENDING (sent by me)**: show "{name} — invitation pending" + "Cancel" button
    - Cancel: `useMutation(invitesApi.removeGlobal)` → invalidate
  - **ACTIVE**: show "{name} — Active Global Vratmitra" + "Remove" button
    - Remove: confirm → `useMutation(invitesApi.removeGlobal)` → invalidate → toast "Removed"
  - **Pending invitations received (global)**: show above the existing pending journeys section
    - Each: "{inviter name} invited you as their Global Vratmitra" + [Accept] [Decline] buttons
    - Accept: `useMutation(invitesApi.acceptGlobal)` → invalidate → toast "Accepted"
    - Decline: `useMutation(invitesApi.removeGlobal)` → invalidate

## 9. Frontend — JourneyDetail Vratmitra Tab

- [x] 9.1 `frontend/src/pages/JourneyDetail.tsx` (Vratmitra tab section)
  - `useQuery(['global-vratmitra'], invitesApi.getGlobal)`
  - When no current journey Vratmitra AND global VM is ACTIVE: render prompt card:
    > "Continue with **{name}** as Vratmitra for this journey?"
    - [Yes, use them] button: calls `inviteJourneyVratmitra(journeyId, { invitee_id: globalVm.vratmitra_id })` → invalidate → toast "Invitation sent to {name}"
    - [Choose different] button: sets local `dismissedGlobalPrompt=true` state → hides prompt, shows search form
  - Replace existing email `<input>` with `<UserSearchCombobox>` for the manual invite flow
    - On select: store `selectedUser` in state
    - "Invite" button: calls `inviteJourneyVratmitra(journeyId, { invitee_id: selectedUser.id })`

## 10. Frontend — i18n

- [x] 10.1 `frontend/src/i18n/translations.ts`
  - Add keys for both `en` and `mr`:
    - `vratmitra.globalSection` ("Global Vratmitra")
    - `vratmitra.inviteGlobal` ("Invite as Global Vratmitra")
    - `vratmitra.globalPending` ("Invitation pending")
    - `vratmitra.globalActive` ("Active Global Vratmitra")
    - `vratmitra.removeGlobal` ("Remove")
    - `vratmitra.globalInviteReceived` ("invited you as their Global Vratmitra")
    - `vratmitra.useGlobalPrompt` ("Continue with {name} as Vratmitra for this journey?")
    - `vratmitra.useGlobalYes` ("Yes, use them")
    - `vratmitra.useGlobalDifferent` ("Choose different")
    - `userSearch.placeholder` ("Search by name or email...")
    - `userSearch.noResults` ("No users found")
