# Journey Exposures — Specification

## What it does
Allows a user to plan and log real-world encounters where they applied (or intend to apply)
the sentence they are practising on a journey. Each **JourneyExposure** is a catalog-backed
or custom entry with a status of PLANNED, TAKEN, or SKIPPED, and an optional `taken_at`
timestamp recorded when the status changes to TAKEN.

Exposures are scoped to a journey. Only the journey owner can read or write exposures.

---

## Domain Model

```
JourneyExposure  (belongs to SentenceJourney)
  - catalog_item_id : uuid|null (references ExposureCatalogItem; null for custom entries)
  - title           : string
  - status          : enum PLANNED | TAKEN | SKIPPED
  - taken_at        : datetime|null (set automatically when status changes to TAKEN)
  - created_at      : datetime (set on creation, immutable)
```

Custom exposures (`catalog_item_id=null`) are private to the journey and do not appear
in the global catalog.

---

## API Contract

All endpoints are nested under `/api/v1/journeys/{journey_id}/exposures`.

### GET `/api/v1/journeys/{journey_id}/exposures`
Returns all journey exposures with status and catalog metadata.

**Access** — journey owner only

**Response** `200 List[JourneyExposureOut]`
```json
[{
  "id": "uuid",
  "journey_id": "uuid",
  "catalog_item_id": "uuid|null",
  "title": "string",
  "status": "PLANNED|TAKEN|SKIPPED",
  "taken_at": "datetime|null",
  "created_at": "datetime"
}]
```

**Errors**
- `404` — journey not found
- `403` — caller is not the journey owner

---

### POST `/api/v1/journeys/{journey_id}/exposures`
Creates a new exposure (catalog-backed or custom).

**Access** — journey owner only

**Request**
```json
{ "catalog_item_id": "uuid|null", "title": "string" }
```

**Response** `200 JourneyExposureOut` — created with `status=PLANNED`

**Errors**
- `403` — caller is not the journey owner
- `404` — journey not found

---

### PUT `/api/v1/journeys/{journey_id}/exposures/{exposure_id}`
Updates an existing exposure (status, title). Setting `status=TAKEN` automatically
sets `taken_at` to now.

**Access** — journey owner only

**Request**
```json
{ "status": "PLANNED|TAKEN|SKIPPED", "title": "string|null" }
```

**Response** `200 JourneyExposureOut`

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

### List
```
GIVEN the journey owner
WHEN GET /journeys/{id}/exposures is called
THEN all JourneyExposure records for the journey are returned with status and catalog metadata

GIVEN an authenticated user who is not the journey owner
WHEN GET /journeys/{id}/exposures is called
THEN a 403 error is returned
```

### Create
```
GIVEN the journey owner and a catalog_item_id
WHEN POST /journeys/{id}/exposures is called with { "catalog_item_id": "<id>", "title": "..." }
THEN a JourneyExposure is created with catalog_item_id set and status=PLANNED

GIVEN the journey owner and no catalog_item_id
WHEN POST /journeys/{id}/exposures is called with { "title": "My custom exposure" }
THEN a JourneyExposure is created with catalog_item_id=null and status=PLANNED

GIVEN a user who is not the journey owner
WHEN POST /journeys/{id}/exposures is called
THEN a 403 error is returned
```

### Update
```
GIVEN the journey owner and an existing exposure
WHEN PUT /journeys/{id}/exposures/{eid} is called with { "status": "TAKEN" }
THEN the exposure status becomes TAKEN and taken_at is set to now

GIVEN an exposure_id that does not belong to this journey
WHEN PUT /journeys/{id}/exposures/{eid} is called
THEN a 404 error is returned
```

### Delete
```
GIVEN the journey owner
WHEN DELETE /journeys/{id}/exposures/{eid} is called
THEN the exposure is permanently deleted and { "success": true } is returned

GIVEN an exposure_id that does not exist
WHEN DELETE is called
THEN a 404 error is returned
```
