# Tasks: invite-friends

## Backend

- [x] `backend/app/models/models.py`
  - Add `invited_by` column to `User`: `Column(String, ForeignKey("users.id"), nullable=True)`
  - Add `UserInvite` model:
    ```
    __tablename__ = "user_invites"
    id          String PK
    user_id     String FK(users.id) unique  ← one invite code per user
    code        String unique index         ← 8-char opaque alphanumeric
    uses_count  Integer default 0
    created_at  DateTime
    relationship: user → User
    ```

- [x] `backend/app/schemas/schemas.py`
  - Add `InviteOut`: `{ code: str, uses_count: int }`
  - Add `InviteValidateOut`: `{ inviter_name: str }`
  - Add `InviteJoinedItem`: `{ name: str, joined_at: datetime }`
  - Update `RegisterRequest`: add optional `invite_code: str | None = None`

- [x] `backend/app/routers/auth.py`
  - In `register()`: after creating the user, if `req.invite_code` is provided:
    - Look up `UserInvite` by code (silently skip if not found)
    - Set `user.invited_by = invite.user_id`
    - Increment `invite.uses_count`
    - Commit

- [x] `backend/app/routers/invites.py` (new file)
  - `GET /invites/mine` (auth required)
    - Query `UserInvite` by `user_id`; if none, create one with `code = generate_code()`
    - `generate_code()`: 8 random uppercase alphanumeric chars, retry on collision
    - Return `InviteOut`
  - `GET /invites/validate/{code}` (no auth)
    - Look up `UserInvite` by code, join `User`
    - Return `InviteValidateOut { inviter_name: user.name }`
    - 404 if not found
  - `GET /invites/joined` (auth required)
    - Query `User` where `invited_by = current_user.id`, order by `created_at` desc, limit 10
    - Return `list[InviteJoinedItem]`

- [x] `backend/app/main.py`
  - Import and register `invites` router: `app.include_router(invites.router, prefix="/api/v1")`

## Frontend

- [x] `frontend/src/api/invites.ts` (new file)
  - `getMine()` → `GET /invites/mine` → `{ code, uses_count }`
  - `validate(code)` → `GET /invites/validate/:code` → `{ inviter_name }`
  - `getJoined()` → `GET /invites/joined` → `[{ name, joined_at }]`

- [x] `frontend/src/pages/JoinRedirect.tsx` (new file)
  - Route: `/join/:code`
  - On mount: `navigate(\`/register?invite=\${code}\`, { replace: true })`
  - Renders nothing (or a brief loader)

- [x] `frontend/src/App.tsx`
  - Add public route: `<Route path="/join/:code" element={<JoinRedirect />} />`

- [x] `frontend/src/pages/auth/Register.tsx`
  - Read `invite` param from `useSearchParams()`
  - If present: call `invitesApi.validate(code)` (useQuery, enabled when code exists)
  - Show acknowledgment banner above the form: "You were invited by {inviter_name}" with a 🌱 icon
  - Pass `invite_code` in the register mutation body

- [x] `frontend/src/components/invite/InviteSheet.tsx` (new file)
  - Props: `open: boolean, onClose: () => void`
  - On open: fetch `invitesApi.getMine()` (useQuery)
  - State: `lang` toggle (mr/en), separate from app language
  - Constructs invite URL: `window.location.origin + '/join/' + code`
  - Share message (based on lang toggle):
    - EN: `"{name} has invited you to Veervrat — an app for inner growth. Start your journey: {url}"`
    - MR: `"{name}ने तुम्हाला वीरव्रतवर आमंत्रित केले आहे — आंतरिक विकासासाठी एक ॲप. तुमचा प्रवास सुरू करा: {url}"`
  - Share button: calls `navigator.share({ text: message, url })` if available, else shows copy button
  - Copy button fallback: `navigator.clipboard.writeText(url)` + toast "Link copied"
  - Shows `uses_count`: "X people have joined via your link"

- [x] `frontend/src/components/layout/MobileNav.tsx`
  - Add "Invite a friend" button in the More sheet (above the divider before user info)
  - Opens `InviteSheet`
  - Import `Share2` icon from lucide-react

- [x] `frontend/src/components/layout/Sidebar.tsx`
  - Add "Invite a friend" button in the bottom section (between toggles and user card)
  - Opens `InviteSheet`

- [x] `frontend/src/pages/Dashboard.tsx`
  - Replace invite stat card with an invite activity section:
    - Fetch `invitesApi.getJoined()` (useQuery)
    - If count > 0: show card with "{N} people joined via your link" + list of names + relative dates
    - If count = 0: show a subtle invite CTA card ("Invite a friend to Veervrat")
    - Clicking either opens `InviteSheet`

- [x] `frontend/src/i18n/translations.ts`
  - Add keys for both languages:
    - `invite.sheetTitle`, `invite.shareButton`, `invite.copyButton`, `invite.copied`
    - `invite.joinedCount`, `invite.noJoins`, `invite.inviteCta`
    - `invite.messageLangToggle`
    - `invite.messageEN`, `invite.messageMR`
    - `invite.acknowledgePrefix` ("You were invited by")
    - `invite.joinedItem` ("{name} joined")
