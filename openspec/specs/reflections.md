# Daily Reflections — Specification

## What it does
A **DailyReflection** is the primary habit-reinforcement mechanism. Once per calendar day,
the journey owner records whether they applied the sentence, how difficult it was, and
what insights emerged. An active Vratmitra can add **comments** to any reflection, enabling
peer accountability.

Key constraints:
- One reflection per journey per calendar day (UTC).
- Only today's reflection can be edited or deleted — past reflections are immutable.
- Only the journey owner can create, edit, or delete reflections.
- Both owner and active Vratmitra can read reflections and add comments.

---

## Domain Model

```
DailyReflection  (belongs to SentenceJourney, unique on journey_id + date)
  - date         : datetime (midnight UTC of that day)
  - applied      : boolean (did they apply the sentence today?)
  - context_note : string|null (what situation arose?)
  - insight_note : string|null (what was learned?)
  - difficulty   : integer|null (self-rated 1–5)
  └─ ReflectionComment  (authored by owner or Vratmitra, append-only)
       - text    : string
       - user_id : uuid (can be owner or Vratmitra)
```

---

## API Contract

All endpoints are nested under `/api/v1/journeys/{journey_id}/reflections`.

### GET `/api/v1/journeys/{journey_id}/reflections`
Returns all reflections for the journey, newest date first, with comments embedded.

**Access** — owner or active Vratmitra

**Response** `200 List[ReflectionOut]`
```json
[{
  "id": "uuid",
  "journey_id": "uuid",
  "date": "datetime",
  "applied": true,
  "context_note": "string|null",
  "insight_note": "string|null",
  "difficulty": 3,
  "comments": [{ "id": "uuid", "reflection_id": "uuid", "user_id": "uuid",
                 "text": "string", "created_at": "datetime",
                 "user": { "id": "...", "name": "...", "email": "..." } }]
}]
```

---

### GET `/api/v1/journeys/{journey_id}/reflections/today`
Returns today's reflection or `null` if none exists yet.

**Access** — owner or active Vratmitra

**Response** `200 ReflectionOut | null`

---

### POST `/api/v1/journeys/{journey_id}/reflections`
Creates today's reflection.

**Access** — journey owner only

**Request**
```json
{
  "applied": true,
  "context_note": "string|null",
  "insight_note": "string|null",
  "difficulty": 3
}
```

**Response** `200 ReflectionOut`

**Errors**
- `400` — journey is not ACTIVE
- `400` — reflection already exists for today
- `403` — caller is not the owner

---

### PUT `/api/v1/journeys/{journey_id}/reflections/{reflection_id}`
Updates today's reflection (partial update).

**Access** — journey owner only

**Request** — same shape as POST, all fields optional (null = no change)

**Response** `200 ReflectionOut`

**Errors**
- `404` — reflection not found
- `400` — reflection is from a previous day (immutable)
- `403` — caller is not the owner

---

### DELETE `/api/v1/journeys/{journey_id}/reflections/{reflection_id}`
Deletes today's reflection.

**Access** — journey owner only

**Response** `200 { "success": true }`

**Errors**
- `404` — reflection not found
- `400` — reflection is from a previous day (immutable)
- `403` — caller is not the owner

---

### POST `/api/v1/journeys/{journey_id}/reflections/{reflection_id}/comments`
Adds a comment to a reflection. Can be called by both owner and active Vratmitra.

**Access** — owner or active Vratmitra

**Request**
```json
{ "text": "string" }
```

**Response** `200 ReflectionOut` (reflection with updated comments list)

**Errors**
- `404` — reflection not found
- `403` — caller has no access to this journey

---

## Acceptance Criteria

### Daily limit
```
GIVEN a journey with no reflection for today
WHEN POST /reflections is called
THEN a new reflection is created for today's UTC date

GIVEN today's reflection already exists
WHEN POST /reflections is called again
THEN a 400 error is returned ("Reflection already exists for today")
```

### Immutability of past reflections
```
GIVEN a reflection from yesterday
WHEN PUT /reflections/{id} is called
THEN a 400 error is returned ("Cannot edit reflection from previous days")

GIVEN a reflection from yesterday
WHEN DELETE /reflections/{id} is called
THEN a 400 error is returned ("Cannot delete reflection from previous days")
```

### Active journey requirement
```
GIVEN a PAUSED (INACTIVE) journey
WHEN POST /reflections is called
THEN a 400 error is returned ("Journey is not active")
```

### Vratmitra read access
```
GIVEN an active Vratmitra for the journey
WHEN GET /reflections is called
THEN all reflections are returned with comments

GIVEN an active Vratmitra
WHEN POST /reflections/{id}/comments is called
THEN the comment is added and the updated reflection is returned

GIVEN an active Vratmitra
WHEN POST /reflections is called (create reflection)
THEN a 403 error is returned (only owner can create)
```

### Comment authorship
```
GIVEN a comment added by the Vratmitra
WHEN reflections are listed
THEN the comment includes the Vratmitra's user object (id, name, email)
```
