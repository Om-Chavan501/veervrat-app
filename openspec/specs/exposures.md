# Exposure Instances — Specification

## What it does
Allows a user to log real-world encounters where they applied (or failed to apply)
the sentence they are practising on a journey. Each **ExposureInstance** is a
timestamped record with a description and an optional context note.

Exposures are scoped to a journey. Both the journey owner and an ACTIVE Vratmitra
can **read** exposures, but only the journey owner can **write** (create, update, delete).

---

## Domain Model

```
ExposureInstance  (belongs to SentenceJourney)
  - description   : string (what happened)
  - context_note  : string|null (surrounding context / reflection)
  - created_at    : datetime (set on creation, immutable)
```

---

## API Contract

All endpoints are nested under `/api/v1/journeys/{journey_id}/exposures`.

### GET `/api/v1/journeys/{journey_id}/exposures`
Returns all exposures for the journey, newest first.

**Access** — journey owner OR active Vratmitra

**Response** `200 List[ExposureOut]`
```json
[{
  "id": "uuid",
  "journey_id": "uuid",
  "description": "string",
  "context_note": "string|null",
  "created_at": "datetime"
}]
```

**Errors**
- `404` — journey not found
- `403` — caller is neither the owner nor an active Vratmitra

---

### POST `/api/v1/journeys/{journey_id}/exposures`
Creates a new exposure log entry.

**Access** — journey owner only

**Request**
```json
{ "description": "string", "context_note": "string|null" }
```

**Response** `200 ExposureOut`

**Errors**
- `403` — caller is not the journey owner
- `404` — journey not found

---

### PUT `/api/v1/journeys/{journey_id}/exposures/{exposure_id}`
Updates an existing exposure (partial update — only provided fields are changed).

**Access** — journey owner only

**Request**
```json
{ "description": "string|null", "context_note": "string|null" }
```

**Response** `200 ExposureOut`

**Errors**
- `404` — exposure not found or does not belong to this journey
- `403` — caller is not the journey owner

---

### DELETE `/api/v1/journeys/{journey_id}/exposures/{exposure_id}`
Permanently removes an exposure.

**Access** — journey owner only

**Response** `200 { "success": true }`

**Errors**
- `404` — exposure not found
- `403` — caller is not the journey owner

---

## Acceptance Criteria

### Read access
```
GIVEN a journey owner
WHEN GET /journeys/{id}/exposures is called
THEN all exposures for that journey are returned sorted newest-first

GIVEN an ACTIVE Vratmitra for the journey
WHEN GET /journeys/{id}/exposures is called
THEN all exposures are returned (read-only access granted)

GIVEN an authenticated user who is neither owner nor active Vratmitra
WHEN GET /journeys/{id}/exposures is called
THEN a 403 error is returned
```

### Create
```
GIVEN the journey owner and a description
WHEN POST /journeys/{id}/exposures is called
THEN a new ExposureInstance is created and returned with created_at set to now

GIVEN an active Vratmitra (not the owner)
WHEN POST /journeys/{id}/exposures is called
THEN a 403 error is returned
```

### Update
```
GIVEN the journey owner and an existing exposure
WHEN PUT /journeys/{id}/exposures/{exposure_id} is called with new description/context_note
THEN only the provided non-null fields are updated; created_at is unchanged

GIVEN an exposure_id that does not belong to this journey
WHEN PUT /journeys/{id}/exposures/{exposure_id} is called
THEN a 404 error is returned
```

### Delete
```
GIVEN the journey owner
WHEN DELETE /journeys/{id}/exposures/{exposure_id} is called
THEN the exposure is permanently deleted and { "success": true } is returned

GIVEN an exposure_id that does not exist
WHEN DELETE is called
THEN a 404 error is returned
```
