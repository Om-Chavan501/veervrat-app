# Sentence Journeys — Specification

## What it does
A **SentenceJourney** is the core growth unit. A user commits to working on a specific
**Sentence** (virtue statement) over time. Journeys have a lifecycle:
`ACTIVE → INACTIVE (paused) → ACTIVE (resumed)` or `ACTIVE → COMPLETED`.

Each journey accumulates:
- **Clarification links** — how this sentence relates to a completed assessment
- **Resolutions** — commitments (text + frequency) for practising the sentence
- **Reflections** — daily check-ins (see reflections.md)
- **Exposures** — logged real-world encounters (see exposures.md)
- **Vratmitra** — peer mentor attachment (see vratmitra.md)

A user can have at most one journey per sentence (unique constraint).
Creating a journey for a sentence that already has one simply returns the existing journey.

---

## Domain Model

```
SentenceJourney  (user + sentence, state: ACTIVE|INACTIVE|COMPLETED)
  ├─ SentenceJourneyAssessmentLink  (clarification — journey + assessment link)
  ├─ ResolutionInstance             (text + frequency commitment)
  ├─ DailyReflection                (see reflections.md)
  ├─ ExposureInstance               (see exposures.md)
  └─ JourneyVratmitra               (see vratmitra.md)
```

---

## API Contract

### GET `/api/v1/journeys`
Returns all journeys for the current user.

**Query params**
- `state` (optional) — filter by `ACTIVE | INACTIVE | COMPLETED`
- `skip` (default 0), `limit` (default 50, max 200)

**Response** `200 List[JourneyOut]`
```json
[{
  "id": "uuid", "user_id": "uuid", "sentence_id": "uuid",
  "state": "ACTIVE|INACTIVE|COMPLETED",
  "created_at": "datetime", "inactive_at": "datetime|null", "inactive_reason": "string|null",
  "sentence": { ...SentenceDetailOut with sub_virtue → virtue chain... }
}]
```

---

### GET `/api/v1/journeys/counts`
Returns counts grouped by state.

**Response** `200 JourneyCountsOut`
```json
{ "ACTIVE": 3, "INACTIVE": 1, "COMPLETED": 2 }
```

---

### POST `/api/v1/journeys`
Creates a new journey (or returns existing) for a sentence, linked to an assessment.

**Request**
```json
{ "sentence_id": "uuid", "assessment_id": "uuid" }
```

**Response** `200 JourneyDetailOut` — full detail with clarification links and resolutions

**Errors**
- `404` — assessment not found
- `403` — assessment belongs to another user

---

### GET `/api/v1/journeys/{journey_id}`
Returns full journey detail with clarification links and resolutions.

**Response** `200 JourneyDetailOut`

**Errors**
- `404`, `403`

---

### POST `/api/v1/journeys/{journey_id}/pause`
Sets journey state to INACTIVE.

**Request**
```json
{ "reason": "string|null" }
```

**Response** `200 JourneyOut`

**Errors**
- `400` — journey is not ACTIVE

---

### POST `/api/v1/journeys/{journey_id}/resume`
Sets journey state back to ACTIVE from INACTIVE (clears inactive_at and inactive_reason).

**Response** `200 JourneyOut`

**Errors**
- `400` — journey is not INACTIVE

---

### POST `/api/v1/journeys/{journey_id}/complete`
Sets journey state to COMPLETED. Requires at least one reflection.

**Response** `200 JourneyOut`

**Errors**
- `400` — journey is not ACTIVE
- `400` — no reflections exist for this journey

---

## Clarification Sub-Resource

### POST `/api/v1/journeys/{journey_id}/clarify/{assessment_id}`
Creates or updates the clarification link connecting a journey to an assessment.
The link captures the user's personal insight notes about how this sentence connects to their lacuna.

**Request**
```json
{
  "virtue_relation_note": "string|null",
  "lacuna_reduction_note": "string (required)",
  "unified_insight_note": "string (required)",
  "personal_context_note": "string (required)"
}
```

**Response** `200 ClarificationLinkOut`

**Errors**
- `404` — journey or assessment not found
- `403` — journey or assessment belongs to another user

---

### GET `/api/v1/journeys/{journey_id}/clarifications`
Lists all clarification links for a journey, newest first.

**Response** `200 List[ClarificationLinkOut]`

---

## Resolutions Sub-Resource

Resolutions can only be added/edited/deleted on ACTIVE journeys, and only after at least
one clarification link exists.

### POST `/api/v1/journeys/{journey_id}/resolutions`
**Request** `{ "text": "string", "frequency": "string" }`
**Response** `200 ResolutionOut`
**Errors**
- `400` — journey not ACTIVE
- `400` — no clarification link exists yet

### PUT `/api/v1/journeys/{journey_id}/resolutions/{resolution_id}`
**Request** `{ "text": "string", "frequency": "string" }`
**Response** `200 ResolutionOut`
**Errors** — journey not ACTIVE

### DELETE `/api/v1/journeys/{journey_id}/resolutions/{resolution_id}`
**Response** `200 { "success": true }`
**Errors** — journey not ACTIVE

---

## Acceptance Criteria

### Journey creation
```
GIVEN a valid sentence_id and assessment_id belonging to the current user
WHEN POST /journeys is called
THEN a new ACTIVE journey is created and returned with full detail

GIVEN the user already has a journey for that sentence
WHEN POST /journeys is called with the same sentence_id
THEN the existing journey is returned (idempotent)

GIVEN an assessment_id not belonging to the current user
WHEN POST /journeys is called
THEN a 403 error is returned
```

### Lifecycle
```
GIVEN an ACTIVE journey
WHEN POST /journeys/{id}/pause is called with an optional reason
THEN state becomes INACTIVE, inactive_at is set, inactive_reason is stored

GIVEN an INACTIVE journey
WHEN POST /journeys/{id}/resume is called
THEN state returns to ACTIVE, inactive_at and inactive_reason are cleared

GIVEN an ACTIVE journey with at least one reflection
WHEN POST /journeys/{id}/complete is called
THEN state becomes COMPLETED

GIVEN an ACTIVE journey with no reflections
WHEN POST /journeys/{id}/complete is called
THEN a 400 error is returned

GIVEN a COMPLETED or INACTIVE journey
WHEN POST /journeys/{id}/pause is called
THEN a 400 error is returned
```

### Clarification
```
GIVEN a journey and a completed assessment both belonging to the current user
WHEN POST /journeys/{id}/clarify/{assessment_id} is called with all required fields
THEN a clarification link is created

GIVEN calling the same endpoint again with different notes
WHEN POST /journeys/{id}/clarify/{assessment_id} is called
THEN the existing link is updated (upsert behaviour)
```

### Resolutions
```
GIVEN an ACTIVE journey with a clarification link
WHEN POST /journeys/{id}/resolutions is called
THEN a new resolution is created

GIVEN an ACTIVE journey with NO clarification link
WHEN POST /journeys/{id}/resolutions is called
THEN a 400 error is returned

GIVEN an INACTIVE or COMPLETED journey
WHEN any resolution write endpoint is called
THEN a 400 error is returned
```
