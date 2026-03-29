## MODIFIED Requirements

### Requirement: Journey exposures are catalog-backed with status tracking
The `ExposureInstance` model is replaced by `JourneyExposure`. Exposures are now either chosen from the sentence catalog (`catalog_item_id` set) or user-created custom entries (`catalog_item_id=null`). Each exposure has a status (PLANNED, TAKEN, SKIPPED) instead of being an implicit log entry. The API endpoints move from `/exposures/...` to `/journeys/:id/exposures`.

#### Scenario: List journey exposures
- **WHEN** `GET /journeys/:id/exposures` is called by the journey owner
- **THEN** all `JourneyExposure` records for the journey are returned with status and catalog metadata

#### Scenario: Add exposure and mark as taken
- **WHEN** `POST /journeys/:id/exposures` is called, then `PUT /journeys/:id/exposures/:eid` with `status=TAKEN`
- **THEN** the exposure is created then updated; `taken_at` is set on status change to TAKEN

## REMOVED Requirements

### Requirement: Exposure instances are free-form log entries
**Reason**: Free-form log entries with no catalog backing, no status, and no plan vs. log distinction are replaced by the richer `JourneyExposure` model.
**Migration**: Existing `ExposureInstance` records are migrated to `JourneyExposure` with `catalog_item_id=null`, `status=TAKEN`, `title` derived from `description`, and `taken_at` set from `created_at`. The `exposure_instances` table is then dropped.
