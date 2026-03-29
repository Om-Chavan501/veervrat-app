# Vratmitra (Peer Mentor) — Specification

## What it does
**Vratmitra** (वरत्मित्र) is the peer accountability layer. A journey owner can invite
any other registered user by email to become their Vratmitra (mentor/witness) for a
specific journey. The invitee can accept, and either party can detach.

A Vratmitra gains **read access** to the journey's reflections and exposures. They can
**comment** on reflections. They do not control the journey itself.

Constraints:
- A journey can have at most **one ACTIVE Vratmitra** at a time.
- A user cannot invite themselves.
- Re-inviting a previously DETACHED user creates a fresh PENDING invitation.
- Inviting an already-PENDING or already-ACTIVE Vratmitra is blocked.

---

## Domain Model

```
JourneyVratmitra  (journey_id + user_id, status: PENDING | ACTIVE | DETACHED)
  - status      : VratmitraStatus enum
  - created_at  : datetime  (invitation sent)
  - accepted_at : datetime|null  (when accepted)
  - detached_at : datetime|null  (when detached)
```

---

## API Contract

### GET `/api/v1/vratmitra/pending`
Returns all PENDING invitations for the current user (invitations they have received
but not yet acted on).

**Response** `200 List[VratmitraOut]`
```json
[{
  "id": "uuid",
  "journey_id": "uuid",
  "user_id": "uuid",
  "status": "PENDING",
  "created_at": "datetime",
  "accepted_at": null,
  "detached_at": null,
  "journey": {
    "id": "...", "state": "ACTIVE", "user": { "id": "...", "name": "..." },
    "sentence": { "id": "...", "text_en": "...", "text_mr": "...", "sub_virtue": { ... } }
  },
  "user": { "id": "...", "name": "...", "email": "..." }
}]
```

---

### GET `/api/v1/vratmitra/my-mentored-journeys`
Returns all journeys where the current user is an ACTIVE Vratmitra.

**Response** `200 List[VratmitraOut]`

---

### POST `/api/v1/vratmitra/journeys/{journey_id}/invite`
Sends a Vratmitra invitation by invitee user ID or email.

**Access** — journey owner only

**Request**
```json
{ "invitee_id": "string (preferred)" }
```
or
```json
{ "invitee_email": "string (legacy)" }
```
If both are provided, `invitee_id` takes precedence. At least one must be provided.

**Response** `200 VratmitraOut` (status: PENDING)

**Errors**
- `404` — journey not found
- `403` — caller is not the journey owner
- `404` — no user found with that email or ID
- `400` — cannot invite yourself
- `400` — invitation already pending for this user
- `400` — user is already the active Vratmitra
- `400` — journey already has an active Vratmitra

#### Scenario: Invite by user ID
- **WHEN** `POST /vratmitra/journeys/:id/invite` is called with `{ "invitee_id": "<user_id>" }`
- **THEN** a PENDING invitation is created for the specified user

#### Scenario: Invite by email still works
- **WHEN** `POST /vratmitra/journeys/:id/invite` is called with `{ "invitee_email": "user@example.com" }`
- **THEN** a PENDING invitation is created (existing behaviour preserved)

#### Scenario: Both provided — ID takes precedence
- **WHEN** both `invitee_id` and `invitee_email` are provided
- **THEN** `invitee_id` is used to resolve the invitee

---

### POST `/api/v1/vratmitra/journeys/{journey_id}/accept`
Accepts a pending invitation.

**Access** — invitee (the user the invitation was sent to)

**Response** `200 VratmitraOut` (status: ACTIVE, accepted_at set)

**Errors**
- `404` — no invitation found for this journey for the current user
- `400` — invitation is not in PENDING status

---

### POST `/api/v1/vratmitra/journeys/{journey_id}/detach`
Detaches the current ACTIVE or PENDING Vratmitra relationship.

**Access** — journey owner OR the Vratmitra themselves

**Response** `200 VratmitraOut` (status: DETACHED, detached_at set)

**Errors**
- `404` — no active/pending attachment found for this journey
- `403` — caller is neither owner nor the Vratmitra

---

### GET `/api/v1/vratmitra/journeys/{journey_id}/current`
Returns the current ACTIVE Vratmitra for a journey, or `null`.

**Access** — journey owner only

**Response** `200 VratmitraOut | null`

---

## Acceptance Criteria

### Invitation flow
```
GIVEN a journey owner and a valid invitee email (different user)
WHEN POST /vratmitra/journeys/{id}/invite is called
THEN a PENDING invitation is created and returned

GIVEN an invitee with a PENDING invitation
WHEN POST /vratmitra/journeys/{id}/accept is called
THEN status becomes ACTIVE, accepted_at is set

GIVEN the invitation is accepted
WHEN GET /vratmitra/journeys/{id}/current is called by the owner
THEN the active VratmitraOut is returned
```

### Constraints
```
GIVEN a journey owner inviting themselves
WHEN POST /invite is called with their own email
THEN a 400 error is returned ("Cannot invite yourself as Vratmitra")

GIVEN a journey that already has an ACTIVE Vratmitra
WHEN POST /invite is called for a different invitee
THEN a 400 error is returned ("Journey already has an active Vratmitra")

GIVEN a pending invitation for user X
WHEN POST /invite is called again for user X
THEN a 400 error is returned ("Invitation already pending for this user")

GIVEN user X was previously DETACHED from the journey
WHEN POST /invite is called for user X again
THEN the old DETACHED record is removed and a new PENDING invitation is created
```

### Detach
```
GIVEN an active Vratmitra
WHEN POST /detach is called by the Vratmitra themselves
THEN status becomes DETACHED, detached_at is set

GIVEN an active Vratmitra
WHEN POST /detach is called by the journey owner
THEN status becomes DETACHED

GIVEN a user who is neither owner nor Vratmitra
WHEN POST /detach is called
THEN a 403 error is returned
```

### Access propagation
```
GIVEN an ACTIVE Vratmitra
WHEN GET /journeys/{id}/reflections is called by the Vratmitra
THEN all reflections are returned

GIVEN a DETACHED (formerly active) Vratmitra
WHEN GET /journeys/{id}/reflections is called by that user
THEN a 403 error is returned
```
