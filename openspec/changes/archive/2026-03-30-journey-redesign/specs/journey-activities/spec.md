## ADDED Requirements

### Requirement: Global catalog of exposures, resolutions, and challenges per sentence
The system SHALL maintain a global catalog of suggested exposures, resolutions, and challenges, each mapped to a sentence. Catalog items SHALL be admin-seeded and read-only to regular users. A user SHALL be able to browse catalog items filtered by their journey's sentence. Catalog items SHALL be available via `GET /catalog/exposures`, `GET /catalog/resolutions`, and `GET /catalog/challenges` with a required `sentence_id` query parameter.

#### Scenario: Browse exposure catalog for a sentence
- **WHEN** `GET /catalog/exposures?sentence_id=<id>` is called by an authenticated user
- **THEN** a `200` response returns a list of `ExposureCatalogItem` records for that sentence

#### Scenario: Browse resolution catalog for a sentence
- **WHEN** `GET /catalog/resolutions?sentence_id=<id>` is called
- **THEN** a `200` response returns a list of `ResolutionCatalogItem` records including `frequency_hint`

#### Scenario: Browse challenge catalog for a sentence
- **WHEN** `GET /catalog/challenges?sentence_id=<id>` is called
- **THEN** a `200` response returns a list of `ChallengeCatalogItem` records including `achievement_criteria`

#### Scenario: Empty catalog is valid
- **WHEN** `GET /catalog/exposures?sentence_id=<id>` is called and no items are seeded for that sentence
- **THEN** a `200` response returns an empty list

---

### Requirement: User can plan and log exposures for a journey
A user SHALL be able to add exposures to their journey either from the catalog (by referencing `catalog_item_id`) or as a custom entry (no `catalog_item_id`). Each `JourneyExposure` has a status of PLANNED, TAKEN, or SKIPPED. Custom exposures are private to the journey and SHALL NOT appear in the global catalog. The user SHALL be able to update status and delete exposures.

#### Scenario: Add exposure from catalog
- **WHEN** `POST /journeys/:id/exposures` is called with `{ "catalog_item_id": "<id>", "title": "..." }`
- **THEN** a `JourneyExposure` is created with `catalog_item_id` set and `status=PLANNED`

#### Scenario: Add custom exposure
- **WHEN** `POST /journeys/:id/exposures` is called with `{ "title": "My custom exposure" }` and no `catalog_item_id`
- **THEN** a `JourneyExposure` is created with `catalog_item_id=null` and `status=PLANNED`

#### Scenario: Mark exposure as taken
- **WHEN** `PUT /journeys/:id/exposures/:eid` is called with `{ "status": "TAKEN" }`
- **THEN** the exposure status becomes TAKEN and `taken_at` is set to now

#### Scenario: Delete exposure
- **WHEN** `DELETE /journeys/:id/exposures/:eid` is called
- **THEN** the exposure is removed from the journey

#### Scenario: Only journey owner can modify exposures
- **WHEN** a user who does not own the journey calls any write endpoint
- **THEN** a `403` response is returned

---

### Requirement: User can plan and track resolutions for a journey
A user SHALL be able to add resolutions to their journey from the catalog or as custom entries. Each `JourneyResolution` has a `frequency` field and a status of ACTIVE, PAUSED, or DONE. The user SHALL be able to update and delete resolutions.

#### Scenario: Add resolution from catalog
- **WHEN** `POST /journeys/:id/resolutions` is called with `{ "catalog_item_id": "<id>", "title": "...", "frequency": "Weekly" }`
- **THEN** a `JourneyResolution` is created with `status=ACTIVE`

#### Scenario: Add custom resolution
- **WHEN** `POST /journeys/:id/resolutions` is called with `{ "title": "My habit", "frequency": "Daily" }` and no `catalog_item_id`
- **THEN** a `JourneyResolution` is created with `catalog_item_id=null` and `status=ACTIVE`

#### Scenario: Mark resolution as done
- **WHEN** `PUT /journeys/:id/resolutions/:rid` is called with `{ "status": "DONE" }`
- **THEN** the resolution status becomes DONE

#### Scenario: Resolution does not require clarification
- **WHEN** `POST /journeys/:id/resolutions` is called on a journey with no clarification links
- **THEN** the resolution is created successfully (no gate)

---

### Requirement: User can set and complete a journey challenge
A journey SHALL have at most one non-ABANDONED challenge at a time. A challenge is the achievement-based test of the journey's learnings. The user SHALL be able to add a challenge from the catalog or as a custom entry, then mark it COMPLETED or ABANDONED. A successfully COMPLETED challenge unlocks journey completion.

#### Scenario: Add challenge from catalog
- **WHEN** `POST /journeys/:id/challenge` is called with `{ "catalog_item_id": "<id>", "title": "...", "achievement_criteria": "..." }`
- **THEN** a `JourneyChallenge` is created with `status=PLANNED`

#### Scenario: Add custom challenge
- **WHEN** `POST /journeys/:id/challenge` is called with `{ "title": "...", "achievement_criteria": "..." }` and no `catalog_item_id`
- **THEN** a `JourneyChallenge` is created with `catalog_item_id=null` and `status=PLANNED`

#### Scenario: Cannot add challenge when one already exists
- **WHEN** `POST /journeys/:id/challenge` is called and a PLANNED challenge already exists
- **THEN** a `400` response is returned

#### Scenario: Complete a challenge
- **WHEN** `POST /journeys/:id/challenge/complete` is called with `{ "outcome": "COMPLETED" }`
- **THEN** the challenge status becomes COMPLETED and `completed_at` is set

#### Scenario: Abandon a challenge
- **WHEN** `POST /journeys/:id/challenge/complete` is called with `{ "outcome": "ABANDONED" }`
- **THEN** the challenge status becomes ABANDONED, freeing the journey to add a new challenge

#### Scenario: Delete a planned challenge
- **WHEN** `DELETE /journeys/:id/challenge` is called on a PLANNED challenge
- **THEN** the challenge is removed
