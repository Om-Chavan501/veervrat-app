# Lacuna Shortlisting — Specification

## What it does
Allows a user to create a prioritised shortlist of Lacunae (character gaps) they want
to work on. A shortlist is grouped into a **Session** (a snapshot in time). Each session
holds an ordered list of Lacunae by rank. Shortlists feed into Assessments — a session_id
can be attached when starting an assessment.

Users can have multiple sessions over time (historical snapshots are preserved).

---

## Domain Model

```
LacunaShortlistSession  (owned by user)
  └─ LacunaShortlistItem  (lacuna_id + rank, unique per session+lacuna)
```

---

## API Contract

### GET `/api/v1/shortlists`
Returns all shortlist sessions for the current user, newest first, each with items.

**Response** `200 List[ShortlistSessionOut]`
```json
[{
  "id": "uuid",
  "user_id": "uuid",
  "note": "string|null",
  "created_at": "datetime",
  "items": [{ "id": "...", "session_id": "...", "lacuna_id": "...", "rank": 1, "lacuna": {...} }]
}]
```

---

### POST `/api/v1/shortlists`
Creates a new shortlist session (starts empty).

**Request**
```json
{ "note": "string|null" }
```

**Response** `200 ShortlistSessionOut` (items: [])

---

### GET `/api/v1/shortlists/{session_id}`
Returns a single session with its items.

**Errors**
- `404` — session not found
- `403` — session belongs to another user

---

### POST `/api/v1/shortlists/{session_id}/items`
Appends a lacuna to the end of the shortlist.

**Request**
```json
{ "lacuna_id": "uuid" }
```

**Response** `200 ShortlistSessionOut` (updated session)

**Errors**
- `400` — lacuna already in shortlist
- `403` / `404` — session access errors

---

### DELETE `/api/v1/shortlists/{session_id}/items/{lacuna_id}`
Removes a lacuna from the shortlist.

**Response** `200 ShortlistSessionOut` (updated session)

---

### PATCH `/api/v1/shortlists/{session_id}/items`
**Batch-replace** the entire shortlist with a new ordered list.
Existing items are deleted and recreated from the provided list in order.

**Request**
```json
{ "lacuna_ids": ["uuid", "uuid", ...] }
```

**Response** `200 ShortlistSessionOut`

---

## Acceptance Criteria

### Session lifecycle
```
GIVEN an authenticated user
WHEN POST /shortlists is called with an optional note
THEN a new empty session is created and returned

GIVEN an authenticated user with existing sessions
WHEN GET /shortlists is called
THEN all their sessions are returned newest-first with items and lacuna detail embedded
```

### Adding items
```
GIVEN an open session
WHEN POST /shortlists/{session_id}/items is called with a lacuna_id
THEN that lacuna is appended at the next rank (max existing rank + 1)

GIVEN a lacuna already in the session
WHEN POST /shortlists/{session_id}/items is called with the same lacuna_id
THEN a 400 error is returned
```

### Batch update
```
GIVEN a session with existing items
WHEN PATCH /shortlists/{session_id}/items is called with a new ordered lacuna_ids list
THEN all previous items are removed and replaced with the new list in rank order (1-based)

GIVEN an empty lacuna_ids list
WHEN PATCH /shortlists/{session_id}/items is called
THEN all existing items are removed and the session has no items
```

### Removing items
```
GIVEN a session with a lacuna item
WHEN DELETE /shortlists/{session_id}/items/{lacuna_id} is called
THEN the item is removed (no rank rebalancing — ranks of remaining items are unchanged)

GIVEN a lacuna not in the session
WHEN DELETE /shortlists/{session_id}/items/{lacuna_id} is called
THEN a 200 is returned (idempotent)
```

### Ownership
```
GIVEN session belonging to user A
WHEN user B calls any write or read endpoint for that session
THEN a 403 error is returned
```
