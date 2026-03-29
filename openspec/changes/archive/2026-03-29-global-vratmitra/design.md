## Context

Currently, Vratmitra relationships are scoped entirely to individual journeys (`JourneyVratmitra` table: `journey_id, user_id, status`). Inviting a mentor requires knowing and typing their email address manually, with no autocomplete or user discovery. There is no cross-journey mentor concept. A user who has a trusted mentor must re-invite them for every new journey, and the journey Vratmitra tab is the only entry point for this flow.

The backend has a `users` table but no public user-search endpoint. The frontend Vratmitra invite form is a plain email `<input>`.

## Goals / Non-Goals

**Goals:**
- Add `GET /users/search?q=` — typeahead-safe, debounced-friendly, returns `[{id, name, email}]`
- Add a `UserVratmitra` model — one global Vratmitra per user (nullable, bidirectional invite/accept like journey-level)
- Add endpoints: `GET /vratmitra/global`, `POST /vratmitra/global/invite`, `POST /vratmitra/global/accept`, `DELETE /vratmitra/global`
- Replace email input with `UserSearchCombobox` in both the global Vratmitra picker (Vratmitra page) and journey-level Vratmitra invite (JourneyDetail tab)
- Journey Vratmitra tab: show "Use global Vratmitra?" prompt when global relationship is ACTIVE and no journey-level Vratmitra exists

**Non-Goals:**
- Mutual/bidirectional global mentoring (global relationship is one-way: user has one global Vratmitra)
- Full user profile pages or public profiles
- Admin-side user management or search
- Bulk invite or multi-Vratmitra journeys (still max 1 per journey)
- Push notifications for invitations (dashboard banner is sufficient)

## Decisions

### D1: Global Vratmitra as a separate table (`user_vratmitras`) vs. a column on `User`

**Decision**: Separate `UserVratmitra` table with `user_id, vratmitra_user_id, status (PENDING/ACTIVE/REMOVED), invited_at, accepted_at`.

**Rationale**: A column approach (e.g., `User.global_vratmitra_id`) can't represent the PENDING state — the invitee hasn't accepted yet. A table mirrors the existing `JourneyVratmitra` pattern, is consistent, and allows the invitee to receive and act on the invitation via the same `/vratmitra` page.

**Alternative considered**: Auto-accept (no PENDING state, just assign immediately). Rejected — the invitee should consent to a sustained relationship.

---

### D2: User search — full-text vs. prefix ILIKE

**Decision**: `ILIKE '%q%'` on `name` and `email`, limited to 10 results, minimum 2 characters, excludes the requesting user.

**Rationale**: The user base is small (invite-only growth). A simple ILIKE is sufficient and avoids adding a full-text search dependency (PostgreSQL `tsvector`, Elasticsearch, etc.). A GIN index on `lower(name)` and `lower(email)` provides acceptable performance up to tens of thousands of users.

**Alternative considered**: `pg_trgm` trigram index. Better for fuzzy matching but adds an extension dependency. Defer until user count warrants it.

---

### D3: Where does "Use global Vratmitra" prompt appear in the journey flow?

**Decision**: In the existing Vratmitra tab of `JourneyDetail`. When no journey-level Vratmitra exists AND the user has an ACTIVE global Vratmitra, the tab shows a prompt card above the invite form:

> "Continue with **{name}** as Vratmitra for this journey? [Yes, use them] [Choose different]"

Choosing "Yes" calls `POST /vratmitra/journeys/:id/invite` with the global Vratmitra's user ID — the same endpoint, no special path. Choosing "Choose different" dismisses the prompt and shows the `UserSearchCombobox`.

**Rationale**: No new route or modal needed. The prompt is contextual and non-blocking — user can always ignore it and use the search. Reusing the existing invite endpoint means no backend special-casing for "global → journey" promotion.

---

### D4: UserSearchCombobox — client-side vs. server-side search

**Decision**: Server-side search via `GET /users/search?q=`. Debounce 300ms on the frontend. Minimum 2 chars before firing. Results cached with React Query (`staleTime: 30s`).

**Rationale**: Client-side would require downloading all users, which leaks user data and doesn't scale. Server-side with debounce gives snappy UX without hammering the API.

---

### D5: Global Vratmitra status on Vratmitra page vs. new page

**Decision**: Extend the existing `/vratmitra` page. Add a "Global Vratmitra" section at the top, above the existing "Pending Invitations" and "Journeys I Mentor" sections.

**Rationale**: Keeps all mentoring context in one place. The Vratmitra page is already the hub for mentor-related actions.

## Risks / Trade-offs

- **ILIKE at scale** → If user base grows significantly, upgrade to `pg_trgm` GIN index. Mitigation: enforce 2-char minimum + 10-result limit to keep queries fast.
- **Stale global Vratmitra prompt** → If global Vratmitra is removed while journey detail is open, prompt shows stale data. Mitigation: React Query invalidation on removal + prompt re-checks the global Vratmitra query.
- **Global invitation ignored** → No mechanism to re-send or escalate pending global invites. Acceptable for now — inviter can cancel and re-invite.
- **No email notification** → Invitee only discovers the invitation when they open the app. Known limitation; out of scope.

## Migration Plan

1. Add `user_vratmitras` table via Alembic migration (non-breaking, new table only).
2. Add GIN indexes on `lower(users.name)`, `lower(users.email)` (non-blocking in Postgres with `CREATE INDEX CONCURRENTLY`).
3. Deploy backend — no data migration needed, table starts empty.
4. Deploy frontend — new UI progressively replaces email input; existing journey-level Vratmitras unaffected.
5. Rollback: drop `user_vratmitras` table (no FK dependencies from existing tables); remove new endpoints.

## Open Questions

- Should accepting a global Vratmitra invitation automatically create pending journey-level invitations for all current ACTIVE journeys that have no Vratmitra? (Current design: no — user chooses per journey via the prompt. Revisit if users find per-journey confirmation tedious.)
- Should removing a global Vratmitra cascade to detach them from all current journey-level ACTIVE relationships? (Current design: no — journey relationships are independent once created.)
