# Global Vratmitra — Specification

## What it does
A user can designate one other registered user as their **Global Vratmitra** — a
persistent, cross-journey mentoring relationship. Unlike journey-level Vratmitra
(scoped to a single journey), the global Vratmitra persists across all journeys.

When a user opens a journey's Vratmitra tab and has an ACTIVE global Vratmitra,
they are prompted to use that person as the journey's Vratmitra without needing
to search again.

---

## Domain Model

```
UserVratmitra  (user_id UNIQUE — one active global VM per user)
  - id           : string (PK)
  - user_id      : string FK(users.id)       ← inviter
  - vratmitra_id : string FK(users.id)       ← invitee
  - status       : VratmitraStatus (PENDING | ACTIVE | DETACHED)
  - invited_at   : datetime
  - accepted_at  : datetime|null
  - detached_at  : datetime|null
```

Constraint: `UNIQUE(user_id)` — a user cannot have two non-REMOVED global VMs simultaneously.

---

## API Contract

### POST `/api/v1/vratmitra/global`
Invite another user as the caller's global Vratmitra.

**Access** — authenticated

**Request**
```json
{ "invitee_id": "string" }
```

**Response** `200 GlobalVratmitraOut`

**Errors**
- `400` — invitee_id is the caller's own ID
- `400` — caller already has a PENDING or ACTIVE global Vratmitra
- `404` — no user found with invitee_id

---

### GET `/api/v1/vratmitra/global`
Returns the caller's current global Vratmitra (PENDING or ACTIVE), or `null`.

**Response** `200 GlobalVratmitraOut | null`

---

### GET `/api/v1/vratmitra/global/pending`
Returns global Vratmitra invitations received by the caller (where they are the invitee, status=PENDING).

**Response** `200 List[GlobalVratmitraOut]`

---

### POST `/api/v1/vratmitra/global/accept`
Accepts a pending global Vratmitra invitation.

**Access** — the invitee (vratmitra_id = current user)

**Response** `200 GlobalVratmitraOut` (status: ACTIVE, accepted_at set)

**Errors**
- `404` — no pending invitation found for the current user

---

### DELETE `/api/v1/vratmitra/global`
Removes the global Vratmitra relationship. Either the inviter OR the invitee can call this.

**Response** `204`

**Errors**
- `404` — no active/pending record found for the current user

---

## Acceptance Criteria

### Requirement: User can designate a global Vratmitra
The system SHALL allow a user to invite one other registered user as their global Vratmitra
— a persistent, cross-journey mentoring relationship. The global relationship SHALL follow
the same PENDING → ACTIVE → REMOVED status flow as journey-level Vratmitra. A user MUST
NOT invite themselves. A user SHALL have at most one non-REMOVED global Vratmitra at a time
(either PENDING or ACTIVE). The invitee MUST accept before the relationship becomes ACTIVE.

#### Scenario: Invite a global Vratmitra
- **WHEN** `POST /api/v1/vratmitra/global` is called with `{ "invitee_id": "<user_id>" }`
- **THEN** a `UserVratmitra` record is created with `status: PENDING` and the relationship is returned

#### Scenario: Cannot invite self as global Vratmitra
- **WHEN** `POST /api/v1/vratmitra/global` is called with the caller's own user ID
- **THEN** a `400` error is returned

#### Scenario: Cannot invite when a PENDING or ACTIVE global relationship exists
- **WHEN** the caller already has a non-REMOVED global Vratmitra
- **THEN** `POST /api/v1/vratmitra/global` returns a `400` error

---

### Requirement: Invitee can view and accept or decline a global Vratmitra invitation
The system SHALL surface pending global Vratmitra invitations to the invitee. The invitee
SHALL be able to accept the invitation, making the relationship ACTIVE. The invitee SHALL
be able to decline (remove) the invitation without accepting.

#### Scenario: Invitee sees pending global invitation
- **WHEN** `GET /api/v1/vratmitra/global/pending` is called by the invitee
- **THEN** a list of pending global invitations for that user is returned (each with inviter name, invited_at)

#### Scenario: Accept global invitation
- **WHEN** `POST /api/v1/vratmitra/global/accept` is called by the invitee
- **THEN** the `UserVratmitra` status becomes `ACTIVE` and `accepted_at` is set

#### Scenario: Decline (remove) global invitation
- **WHEN** `DELETE /api/v1/vratmitra/global` is called by the invitee on a PENDING invitation
- **THEN** the record is removed

---

### Requirement: Either party can remove the global Vratmitra relationship
The system SHALL allow the owner (inviter) or the Vratmitra (invitee) to remove the
global relationship at any time (PENDING or ACTIVE). After removal, either party MAY
initiate a fresh invitation.

#### Scenario: Owner removes global relationship
- **WHEN** `DELETE /api/v1/vratmitra/global` is called by the inviter
- **THEN** the `UserVratmitra` record is deleted (hard delete)

#### Scenario: Vratmitra removes themselves
- **WHEN** `DELETE /api/v1/vratmitra/global` is called by the invitee (ACTIVE Vratmitra)
- **THEN** the `UserVratmitra` record is deleted

#### Scenario: Re-invite after removal
- **WHEN** `POST /api/v1/vratmitra/global` is called after the previous relationship was removed
- **THEN** a new PENDING relationship is created

---

### Requirement: Journey Vratmitra tab shows "Use global Vratmitra" prompt
When a user has an ACTIVE global Vratmitra AND a journey has no current Vratmitra (no
PENDING or ACTIVE JourneyVratmitra), the journey's Vratmitra tab SHALL display a prompt:
"Continue with `{global Vratmitra name}` as Vratmitra for this journey?" with two actions:
**Yes, use them** and **Choose different**.

Choosing **Yes, use them** SHALL call `POST /vratmitra/journeys/:id/invite` with the
global Vratmitra's user ID (via `invitee_id`, not email). Choosing **Choose different**
SHALL dismiss the prompt and show the `UserSearchCombobox` invite form.

#### Scenario: Prompt shown when conditions met
- **WHEN** a user with an ACTIVE global Vratmitra opens a journey's Vratmitra tab that has no current Vratmitra
- **THEN** the prompt card is displayed above the invite form showing the global Vratmitra's name

#### Scenario: Prompt not shown when journey already has Vratmitra
- **WHEN** the journey already has a PENDING or ACTIVE JourneyVratmitra
- **THEN** the global Vratmitra prompt is NOT shown

#### Scenario: Prompt not shown when no global Vratmitra
- **WHEN** the user has no ACTIVE global Vratmitra
- **THEN** the prompt is NOT shown and only the search invite form is shown

#### Scenario: Use global Vratmitra
- **WHEN** user clicks "Yes, use them" on the prompt
- **THEN** `POST /vratmitra/journeys/:id/invite` is called with the global Vratmitra's ID and the invitation is created (PENDING, waiting for acceptance)

#### Scenario: Dismiss prompt and use search
- **WHEN** user clicks "Choose different"
- **THEN** the prompt is hidden and the UserSearchCombobox invite form is shown
