# Journey Activities — Specification

## What it does
Provides the **catalog** of suggested activities (exposures, resolutions, challenges) per
sentence, and the **CRUD** endpoints for a user to plan, track, and complete their own
journey-level activities: `JourneyExposure`, `JourneyResolution`, and `JourneyChallenge`.

Catalog items are admin-seeded and read-only to regular users. A user picks from the
catalog or creates custom (private) entries on their journey.

---

## Domain Model

```
ExposureCatalogItem  (global, maps to a Sentence)
  - sentence_id          : uuid
  - title                : string
  - description          : string|null

ResolutionCatalogItem  (global, maps to a Sentence)
  - sentence_id          : uuid
  - title                : string
  - frequency_hint       : string|null   (e.g. "Daily", "Weekly")

ChallengeCatalogItem   (global, maps to a Sentence)
  - sentence_id          : uuid
  - title                : string
  - achievement_criteria : string|null

JourneyExposure  (belongs to SentenceJourney — see exposures.md)

JourneyResolution  (belongs to SentenceJourney)
  - catalog_item_id  : uuid|null  (references ResolutionCatalogItem; null for custom)
  - title            : string
  - frequency        : string
  - status           : enum ACTIVE | PAUSED | DONE
  - created_at       : datetime

JourneyChallenge  (belongs to SentenceJourney — at most one non-ABANDONED per journey)
  - catalog_item_id      : uuid|null  (references ChallengeCatalogItem; null for custom)
  - title                : string
  - achievement_criteria : string|null
  - status               : enum PLANNED | COMPLETED | ABANDONED
  - completed_at         : datetime|null  (set when status becomes COMPLETED or ABANDONED)
  - created_at           : datetime
```

---

## API Contract

### Catalog Endpoints

#### GET `/api/v1/catalog/exposures`
Returns catalog exposure items for a sentence.

**Query params** — `sentence_id` (required)

**Response** `200 List[ExposureCatalogItemOut]`
```json
[{ "id": "uuid", "sentence_id": "uuid", "title": "string", "description": "string|null" }]
```

**Errors**
- `400` — `sentence_id` not provided
- `404` — sentence not found

---

#### GET `/api/v1/catalog/resolutions`
Returns catalog resolution items for a sentence.

**Query params** — `sentence_id` (required)

**Response** `200 List[ResolutionCatalogItemOut]`
```json
[{ "id": "uuid", "sentence_id": "uuid", "title": "string", "frequency_hint": "string|null" }]
```

---

#### GET `/api/v1/catalog/challenges`
Returns catalog challenge items for a sentence.

**Query params** — `sentence_id` (required)

**Response** `200 List[ChallengeCatalogItemOut]`
```json
[{ "id": "uuid", "sentence_id": "uuid", "title": "string", "achievement_criteria": "string|null" }]
```

---

### JourneyResolution Endpoints

All endpoints nested under `/api/v1/journeys/{journey_id}/resolutions`.
Access: journey owner only.

#### POST `/api/v1/journeys/{journey_id}/resolutions`
Creates a resolution (catalog-backed or custom) with `status=ACTIVE`.

**Request**
```json
{ "catalog_item_id": "uuid|null", "title": "string", "frequency": "string" }
```

**Response** `200 JourneyResolutionOut`

**Errors**
- `403` — caller is not the journey owner
- `404` — journey not found

---

#### PUT `/api/v1/journeys/{journey_id}/resolutions/{resolution_id}`
Updates a resolution's title, frequency, or status.

**Request**
```json
{ "title": "string|null", "frequency": "string|null", "status": "ACTIVE|PAUSED|DONE|null" }
```

**Response** `200 JourneyResolutionOut`

**Errors**
- `404` — resolution not found or does not belong to this journey
- `403` — caller is not the journey owner

---

#### DELETE `/api/v1/journeys/{journey_id}/resolutions/{resolution_id}`
Permanently removes a resolution.

**Response** `200 { "success": true }`

**Errors**
- `404` — resolution not found
- `403` — caller is not the journey owner

---

### JourneyChallenge Endpoints

All endpoints nested under `/api/v1/journeys/{journey_id}/challenge`.
Access: journey owner only.
A journey may have at most one non-ABANDONED challenge at a time.

#### GET `/api/v1/journeys/{journey_id}/challenge`
Returns the current challenge for the journey (if any).

**Response** `200 JourneyChallengeOut | null`

---

#### POST `/api/v1/journeys/{journey_id}/challenge`
Creates a challenge (catalog-backed or custom) with `status=PLANNED`.

**Request**
```json
{ "catalog_item_id": "uuid|null", "title": "string", "achievement_criteria": "string|null" }
```

**Response** `200 JourneyChallengeOut`

**Errors**
- `400` — a PLANNED challenge already exists for this journey
- `403` — caller is not the journey owner
- `404` — journey not found

---

#### POST `/api/v1/journeys/{journey_id}/challenge/complete`
Resolves the challenge as COMPLETED or ABANDONED.

**Request**
```json
{ "outcome": "COMPLETED|ABANDONED" }
```

**Response** `200 JourneyChallengeOut` — `completed_at` is set to now

**Errors**
- `404` — no active challenge found
- `403` — caller is not the journey owner

---

#### DELETE `/api/v1/journeys/{journey_id}/challenge`
Removes the PLANNED challenge.

**Response** `200 { "success": true }`

**Errors**
- `400` — challenge is not in PLANNED status
- `404` — no challenge found
- `403` — caller is not the journey owner

---

## Acceptance Criteria

### Catalog
```
GIVEN an authenticated user
WHEN GET /catalog/exposures?sentence_id=<id> is called
THEN a 200 response returns a list of ExposureCatalogItem records for that sentence

WHEN GET /catalog/resolutions?sentence_id=<id> is called
THEN a 200 response returns a list of ResolutionCatalogItem records including frequency_hint

WHEN GET /catalog/challenges?sentence_id=<id> is called
THEN a 200 response returns a list of ChallengeCatalogItem records including achievement_criteria

GIVEN no items are seeded for that sentence
WHEN GET /catalog/exposures?sentence_id=<id> is called
THEN a 200 response returns an empty list
```

### JourneyResolution
```
GIVEN the journey owner and a catalog_item_id
WHEN POST /journeys/{id}/resolutions is called with catalog_item_id, title, and frequency
THEN a JourneyResolution is created with status=ACTIVE

GIVEN the journey owner and no catalog_item_id
WHEN POST /journeys/{id}/resolutions is called with title and frequency only
THEN a JourneyResolution is created with catalog_item_id=null and status=ACTIVE

GIVEN a journey with no clarification links
WHEN POST /journeys/{id}/resolutions is called
THEN the resolution is created successfully (no clarification gate)

WHEN PUT /journeys/{id}/resolutions/{rid} is called with { "status": "DONE" }
THEN the resolution status becomes DONE

GIVEN a user who is not the journey owner
WHEN any resolution write endpoint is called
THEN a 403 response is returned
```

### JourneyChallenge
```
GIVEN the journey owner and a catalog_item_id
WHEN POST /journeys/{id}/challenge is called with catalog_item_id and title
THEN a JourneyChallenge is created with status=PLANNED

GIVEN the journey owner and no catalog_item_id
WHEN POST /journeys/{id}/challenge is called with title and achievement_criteria
THEN a JourneyChallenge is created with catalog_item_id=null and status=PLANNED

GIVEN a PLANNED challenge already exists
WHEN POST /journeys/{id}/challenge is called
THEN a 400 response is returned

WHEN POST /journeys/{id}/challenge/complete is called with { "outcome": "COMPLETED" }
THEN the challenge status becomes COMPLETED and completed_at is set to now

WHEN POST /journeys/{id}/challenge/complete is called with { "outcome": "ABANDONED" }
THEN the challenge status becomes ABANDONED, freeing the journey to add a new challenge

WHEN DELETE /journeys/{id}/challenge is called on a PLANNED challenge
THEN the challenge is removed
```
