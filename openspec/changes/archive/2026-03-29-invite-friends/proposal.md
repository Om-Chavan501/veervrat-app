# Change Proposal: Invite Friends

## Problem
There is no way for users to bring new people into Veervrat. Growth is entirely
organic / word-of-mouth with no in-app mechanism to share the app.

## Goal
Any existing user can invite anyone to Veervrat via any platform (WhatsApp, iMessage,
email, Telegram, etc.) using a single share action. The invite is tracked — the inviter
can see who joined via their link on the Dashboard.

## Decisions

### Invite link
Each user gets a unique opaque 8-character invite code (auto-created on first use).
The invite link is: `<origin>/join/:code`
Navigating to it redirects to `/register?invite=:code`.

### Share mechanism
Web Share API (`navigator.share()`) on mobile opens the native system share sheet —
zero per-platform integration needed. Fallback to "Copy link" on desktop.

### Invite message
Personal format, language-toggleable at share time:
- EN: "Om has invited you to Veervrat — an app for inner growth. Start your journey: [link]"
- MR: "ओमने तुम्हाला वीरव्रतवर आमंत्रित केले आहे — आंतरिक विकासासाठी एक ॲप. तुमचा प्रवास सुरू करा: [link]"

### Invite entry point
"Invite a friend" button in the More bottom sheet (MobileNav) and as an action on Desktop Sidebar.

### Registration acknowledgment
If `/register?invite=:code` — fetch the inviter's name and show a warm banner:
"You were invited by Om Chavan" above the registration form.

### Attribution tracking
- `UserInvite` table: `id`, `user_id`, `code` (unique), `uses_count`, `created_at`
- `User.invited_by` (nullable FK to `users.id`) — set at registration if valid invite code provided
- `UserInvite.uses_count` incremented on each successful registration

### Dashboard activity feed
Existing invite stat card updated to show:
- Count: "N people joined via your link"
- Activity list: name + relative date for each joiner (newest first, up to 10)

### Invite code properties
- Opaque 8-character alphanumeric (e.g. `A3KX9P2M`)
- No expiry, no use limit
- Auto-created on first time user accesses their invite code

## API

### GET `/api/v1/invites/mine`
Returns the current user's invite code, creating one if it doesn't exist.
**Response** `{ code: string, uses_count: number }`

### GET `/api/v1/invites/validate/:code`
Public (no auth). Returns inviter display name for the registration acknowledgment.
**Response** `{ inviter_name: string }`
**Errors** `404` if code not found

### GET `/api/v1/invites/joined`
Returns users who registered via the current user's invite code, newest first, max 10.
**Response** `[{ name: string, joined_at: string }]`

### POST `/api/v1/auth/register` (modified)
Accept optional `invite_code` field. On success:
- Look up the UserInvite by code
- Set `new_user.invited_by = invite.user_id`
- Increment `invite.uses_count`
- Silently ignore invalid/missing codes (never block registration)

## Files affected

### Backend
- `backend/app/models/models.py` — add `UserInvite` model, add `invited_by` to `User`
- `backend/app/schemas/schemas.py` — add invite schemas, update `RegisterRequest`
- `backend/app/routers/auth.py` — handle `invite_code` in register
- `backend/app/routers/` — new `invites.py` router
- `backend/app/main.py` — register invites router

### Frontend
- `frontend/src/api/invites.ts` — new API file
- `frontend/src/App.tsx` — add `/join/:code` route
- `frontend/src/pages/JoinRedirect.tsx` — new page: reads code, redirects to register
- `frontend/src/pages/auth/Register.tsx` — read `?invite` param, show acknowledgment banner
- `frontend/src/components/layout/MobileNav.tsx` — add "Invite a friend" to More sheet
- `frontend/src/components/layout/Sidebar.tsx` — add "Invite a friend" button
- `frontend/src/components/invite/InviteSheet.tsx` — new: share UI with message + language toggle + Web Share / copy
- `frontend/src/pages/Dashboard.tsx` — update invite stat to show activity feed
- `frontend/src/i18n/translations.ts` — add invite-related strings
