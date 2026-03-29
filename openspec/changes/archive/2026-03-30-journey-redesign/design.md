## Context

Current state:
- `SentenceJourney` has no direct reference to the originating assessment/lacuna
- `ExposureInstance` and `ResolutionInstance` are free-form log entries — no catalog, no status, no plan vs. log distinction
- JourneyDetail UI is flat tabs with no guidance on sequence or progress
- Journey completion has no meaningful gate (just requires ≥1 reflection)
- Clarification blocks resolutions (gate removed in remove-ib change but gate logic still exists)

The redesign introduces a structured three-phase arc and replaces the two free-form tables with catalog-backed activity tables covering all three activity types.

---

## Goals / Non-Goals

**Goals:**
- Store originating lacuna context directly on the journey row
- Replace `ExposureInstance` + `ResolutionInstance` with unified catalog + plan model
- Introduce `JourneyChallenge` as the achievement gate for journey completion
- Present the journey as a phased arc (Setup → Practice → Challenge) in the UI
- Seed catalog content for existing sentences

**Non-Goals:**
- Admin UI for catalog management (manual seed only for now)
- In-app Vratmitra messaging (VM interactions remain offline)
- Changing the assessment flow or sentence selection flow
- Any changes to `DailyReflection` behavior or schema

---

## Decisions

### D1: `originating_assessment_id` on `SentenceJourney` (not derived from link table)

The originating assessment determines the lacuna context for this journey's growth narrative. Querying through `SentenceJourneyAssessmentLink` adds a join to every journey load. Storing it directly on the journey row makes it a first-class, immediately available attribute.

`nullable=True` for legacy rows (journeys created before this change). New journeys always populate it.

Alternative considered: derive from first clarification link. Rejected — clarification is now optional and can be added anytime; the creation-time context is distinct from the clarification-time context.

### D2: Catalog items are sentence-scoped only (no lacuna_id)

Same catalog items are shown for a sentence regardless of which lacuna the journey originated from. The lacuna context informs the *user's reasoning* about why they choose specific items — not which items are shown. This keeps the catalog simple to seed and maintain.

### D3: Separate catalog tables per activity type

Three separate tables (`exposure_catalog_items`, `resolution_catalog_items`, `challenge_catalog_items`) rather than a single polymorphic `catalog_items` table. Reason: the fields differ meaningfully — challenges have `achievement_criteria`, resolutions have `frequency_hint`, exposures are simpler. Polymorphic tables with nullable columns create confusion.

### D4: Journey activity tables with `catalog_item_id nullable`

`catalog_item_id = null` means the item is user-created and private to this journey. This avoids a separate "custom items" table while preserving the distinction. Custom items will never appear in catalog browsing for other users.

### D5: Data migration — ExposureInstance → JourneyExposure as TAKEN/custom

Existing exposure records have `description` and optional `context_note`. They map to `JourneyExposure` with:
- `catalog_item_id = null` (custom)
- `title = description[:120]`
- `description = context_note` (or empty)
- `status = TAKEN`
- `taken_at = created_at`

Existing resolution records map to `JourneyResolution` with:
- `catalog_item_id = null`
- `title = text`
- `frequency = frequency`
- `status = ACTIVE`

After migration, `exposure_instances` and `resolution_instances` are dropped.

### D6: Challenge completion gates journey completion

`POST /journeys/:id/complete` now returns `400` unless a `JourneyChallenge` with `status=COMPLETED` exists for the journey. This makes challenge completion the meaningful milestone rather than an arbitrary reflection count.

### D7: Clarification is no longer gated by anything

The previous gate (resolutions require clarification) is removed. Clarification is available anytime in the Practice phase. No other action requires it.

### D8: Frontend — phased UI with progress indicator, not new wizard route

The phase progression (Setup → Practice → Challenge) lives within `JourneyDetail.tsx` as a phase-aware top bar. On first visit (no Vratmitra + no activities), the journey automatically opens in Setup mode showing the three setup steps inline. This avoids a separate route/page and keeps all journey context in one place.

Setup steps are non-blocking — the user can skip Vratmitra and add it later. "Setup complete" is soft: once at least one exposure or resolution is added, the journey enters Practice phase.

---

## Data Model

```
sentence_journeys
  + originating_assessment_id  VARCHAR FK(lacuna_assessments.id) nullable

exposure_catalog_items         { id, sentence_id FK, title, description }
resolution_catalog_items       { id, sentence_id FK, title, description, frequency_hint }
challenge_catalog_items        { id, sentence_id FK, title, description, achievement_criteria }

journey_exposures
  id, journey_id FK, catalog_item_id FK nullable,
  title, description nullable,
  status ENUM(PLANNED, TAKEN, SKIPPED), taken_at nullable,
  created_at

journey_resolutions
  id, journey_id FK, catalog_item_id FK nullable,
  title, description nullable, frequency,
  status ENUM(ACTIVE, PAUSED, DONE),
  created_at

journey_challenges
  id, journey_id FK, catalog_item_id FK nullable,
  title, description nullable, achievement_criteria,
  status ENUM(PLANNED, COMPLETED, ABANDONED), completed_at nullable,
  created_at
  UniqueConstraint(journey_id)  ← one active challenge per journey
```

---

## API Shape

```
# Catalog (read-only, auth required)
GET /catalog/exposures?sentence_id=
GET /catalog/resolutions?sentence_id=
GET /catalog/challenges?sentence_id=

# Journey Exposures
GET    /journeys/:id/exposures
POST   /journeys/:id/exposures       { catalog_item_id?, title, description? }
PUT    /journeys/:id/exposures/:eid  { title?, description?, status? }
DELETE /journeys/:id/exposures/:eid

# Journey Resolutions (replaces existing endpoints, same URL shape)
GET    /journeys/:id/resolutions
POST   /journeys/:id/resolutions     { catalog_item_id?, title, description?, frequency }
PUT    /journeys/:id/resolutions/:rid
DELETE /journeys/:id/resolutions/:rid

# Journey Challenge
GET    /journeys/:id/challenge
POST   /journeys/:id/challenge       { catalog_item_id?, title, description?, achievement_criteria }
POST   /journeys/:id/challenge/complete  { outcome: COMPLETED | ABANDONED }
DELETE /journeys/:id/challenge
```

---

## Risks / Trade-offs

- **[Risk] Large migration** → Mitigate by running migration steps in order: add column → create tables → migrate data → drop old tables. Each step is independently reversible.
- **[Risk] Catalog seed data needed before frontend is useful** → Seed data is part of the implementation tasks. Frontend catalog browse degrades gracefully to "no items" until seeded.
- **[Risk] UniqueConstraint on journey_challenges journey_id** → Only one non-ABANDONED challenge per journey at a time. If user wants to redo, they must abandon the current one first.
- **[Trade-off] Flat resolution endpoints URL shape unchanged** → Keeps frontend migration smaller. The old `/journeys/:id/resolutions` URL is reused with the new schema.

---

## Migration Plan

1. Alembic: add `originating_assessment_id` to `sentence_journeys`
2. Alembic: create catalog tables + journey activity tables
3. Alembic: migrate `exposure_instances` → `journey_exposures`, `resolution_instances` → `journey_resolutions`
4. Alembic: drop `exposure_instances`, `resolution_instances`
5. Seed catalog data via `seed/seed.py`
6. Backend: update models, schemas, routers
7. Frontend: update JourneyDetail, AssessmentResults, API layer

Rollback: migrations have downgrade functions. Frontend can be reverted independently.

---

## Open Questions

None — all design decisions are settled from the exploration session.
