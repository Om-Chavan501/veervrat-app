## Why

The current journey model is a shallow container of free-form tabs with no structured practice arc. A journey needs to guide the user through a meaningful growth sequence: commit to a Vratmitra → choose exposures (one-time activities) and resolutions (repeated habits) from a sentence-mapped catalog → eventually take on a challenge that tests everything they've learned → complete the journey only when the challenge is achieved.

## What Changes

- **BREAKING** Remove `exposure_instances` table — replaced by `journey_exposures` (catalog-backed, plan + log)
- **BREAKING** Remove `resolution_instances` table — replaced by `journey_resolutions` (catalog-backed, plan + log)
- Add `originating_assessment_id` column to `sentence_journeys` — stores which lacuna assessment spawned this journey
- Add three global catalog tables: `exposure_catalog_items`, `resolution_catalog_items`, `challenge_catalog_items` — each mapped to a sentence, admin-seeded
- Add three journey activity tables: `journey_exposures`, `journey_resolutions`, `journey_challenges` — user's chosen/custom activities per journey
- Migrate existing `ExposureInstance` records → `journey_exposures` (status=TAKEN, custom)
- Migrate existing `ResolutionInstance` records → `journey_resolutions` (status=ACTIVE, custom)
- Remove the "no resolutions without clarification" gate — activities are independent of clarification
- New API endpoints: catalog browse, journey activity CRUD, challenge completion
- New frontend journey UX: phased flow (Setup → Practice → Challenge) replacing flat tabs
- Journey completion gated on a COMPLETED challenge existing for the journey
- Seed catalog data for all existing sentences

## Capabilities

### New Capabilities

- `journey-activities`: Catalog of exposures, resolutions, and challenges mapped to sentences; user's journey-level plan of chosen/custom activities; challenge completion as the journey's achievement gate

### Modified Capabilities

- `journeys`: Journey now stores `originating_assessment_id`; creation redirects to setup wizard instead of Clarify; completion requires a COMPLETED challenge; clarification is no longer a prerequisite for any other action
- `exposures`: **BREAKING** `ExposureInstance` model replaced by `JourneyExposure`; API endpoints change to reflect catalog-backed + custom items with status tracking
- `reflections`: No spec-level change — reflections remain free-form daily entries (unchanged behavior, but now in the Practice phase of the UI)

## Impact

- **Backend**: `models/models.py`, `schemas/schemas.py`, `routers/journeys.py`, `routers/exposures.py`, new `routers/activities.py`, Alembic migrations, `seed/seed.py`
- **Frontend**: `pages/JourneyDetail.tsx` (full rewrite), `pages/AssessmentResults.tsx` (post-creation redirect), `api/journeys.ts`, `api/exposures.ts`, new `api/activities.ts`, new setup wizard component, new catalog browser component
- **DB**: Multiple Alembic migrations — add column, new tables, data migration, drop old tables
