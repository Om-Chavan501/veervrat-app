# Tasks: journey-redesign

## 1. Backend — Migrations

- [x] 1.1 Alembic: add `originating_assessment_id` VARCHAR FK(lacuna_assessments.id) nullable to `sentence_journeys`
- [x] 1.2 Alembic: create `exposure_catalog_items` table `{ id, sentence_id FK, title, description }`
- [x] 1.3 Alembic: create `resolution_catalog_items` table `{ id, sentence_id FK, title, description, frequency_hint }`
- [x] 1.4 Alembic: create `challenge_catalog_items` table `{ id, sentence_id FK, title, description, achievement_criteria }`
- [x] 1.5 Alembic: create `journey_exposures` table `{ id, journey_id FK, catalog_item_id FK nullable, title, description nullable, status ENUM(PLANNED/TAKEN/SKIPPED), taken_at nullable, created_at }`
- [x] 1.6 Alembic: create `journey_resolutions` table `{ id, journey_id FK, catalog_item_id FK nullable, title, description nullable, frequency, status ENUM(ACTIVE/PAUSED/DONE), created_at }`
- [x] 1.7 Alembic: create `journey_challenges` table `{ id, journey_id FK UNIQUE, catalog_item_id FK nullable, title, description nullable, achievement_criteria, status ENUM(PLANNED/COMPLETED/ABANDONED), completed_at nullable, created_at }`
- [x] 1.8 Alembic: migrate `exposure_instances` → `journey_exposures` (catalog_item_id=null, status=TAKEN, title=description[:120], description=context_note, taken_at=created_at)
- [x] 1.9 Alembic: migrate `resolution_instances` → `journey_resolutions` (catalog_item_id=null, status=ACTIVE, title=text, frequency=frequency)
- [x] 1.10 Alembic: drop `exposure_instances` table
- [x] 1.11 Alembic: drop `resolution_instances` table
- [x] 1.12 Run `alembic upgrade head`

## 2. Backend — Models

- [x] 2.1 `models/models.py` — add `originating_assessment_id` column + relationship to `SentenceJourney`
- [x] 2.2 `models/models.py` — add `ExposureCatalogItem`, `ResolutionCatalogItem`, `ChallengeCatalogItem` models
- [x] 2.3 `models/models.py` — add `ExposureStatus`, `ResolutionStatus`, `ChallengeStatus` enums
- [x] 2.4 `models/models.py` — add `JourneyExposure`, `JourneyResolution`, `JourneyChallenge` models with relationships to `SentenceJourney`
- [x] 2.5 `models/models.py` — remove `ExposureInstance`, `ResolutionInstance` model classes
- [x] 2.6 `models/models.py` — remove `exposures` and `resolutions` relationships from `SentenceJourney`, add `journey_exposures`, `journey_resolutions`, `journey_challenges`

## 3. Backend — Schemas

- [x] 3.1 `schemas/schemas.py` — add `ExposureCatalogItemOut`, `ResolutionCatalogItemOut`, `ChallengeCatalogItemOut`
- [x] 3.2 `schemas/schemas.py` — add `JourneyExposureOut`, `JourneyExposureCreate`, `JourneyExposureUpdate`
- [x] 3.3 `schemas/schemas.py` — add `JourneyResolutionOut`, `JourneyResolutionCreate`, `JourneyResolutionUpdate` (replace `ResolutionOut` / `CreateResolutionRequest`)
- [x] 3.4 `schemas/schemas.py` — add `JourneyChallengeOut`, `JourneyChallengeCreate`, `ChallengeChallengeOutcome`
- [x] 3.5 `schemas/schemas.py` — add `originating_assessment_id` to `JourneyOut` and `JourneyDetailOut`
- [x] 3.6 `schemas/schemas.py` — update `JourneyDetailOut`: replace `resolutions: List[ResolutionOut]` with `journey_exposures` + `journey_resolutions` + `journey_challenges` lists
- [x] 3.7 `schemas/schemas.py` — remove `ResolutionOut`, `CreateResolutionRequest`

## 4. Backend — Routers

- [x] 4.1 `routers/journeys.py` — update `create_journey`: set `originating_assessment_id` on new journey
- [x] 4.2 `routers/journeys.py` — update `complete_journey`: check for COMPLETED `JourneyChallenge` instead of ≥1 reflection
- [x] 4.3 `routers/journeys.py` — remove resolution endpoints (`POST/PUT/DELETE /journeys/:id/resolutions`) — will move to new router
- [x] 4.4 `routers/journeys.py` — remove old exposure-gate logic (clarification required check)
- [x] 4.5 Create `routers/activities.py` with catalog endpoints:
      `GET /catalog/exposures`, `GET /catalog/resolutions`, `GET /catalog/challenges`
- [x] 4.6 `routers/activities.py` — add journey exposure CRUD: `GET/POST /journeys/:id/exposures`, `PUT/DELETE /journeys/:id/exposures/:eid`
- [x] 4.7 `routers/activities.py` — add journey resolution CRUD: `GET/POST /journeys/:id/resolutions`, `PUT/DELETE /journeys/:id/resolutions/:rid`
- [x] 4.8 `routers/activities.py` — add journey challenge endpoints: `GET/POST /journeys/:id/challenge`, `POST /journeys/:id/challenge/complete`, `DELETE /journeys/:id/challenge`
- [x] 4.9 `routers/exposures.py` — remove or gut (replaced by activities router); update or delete file
- [x] 4.10 `main.py` — register `activities` router; remove `exposures` router if deleted

## 5. Backend — Seed

- [x] 5.1 `seed/seed.py` — add catalog seed data: for each existing sentence, add at least 2–3 `ExposureCatalogItem`, 2–3 `ResolutionCatalogItem`, 1–2 `ChallengeCatalogItem` entries
- [x] 5.2 Run seed to populate catalog tables

## 6. Frontend — API Layer

- [x] 6.1 `api/activities.ts` (new file) — `getCatalogExposures(sentenceId)`, `getCatalogResolutions(sentenceId)`, `getCatalogChallenges(sentenceId)`
- [x] 6.2 `api/activities.ts` — `listExposures(journeyId)`, `addExposure(journeyId, payload)`, `updateExposure(journeyId, exposureId, payload)`, `deleteExposure(journeyId, exposureId)`
- [x] 6.3 `api/activities.ts` — `listResolutions(journeyId)`, `addResolution(journeyId, payload)`, `updateResolution(journeyId, resolutionId, payload)`, `deleteResolution(journeyId, resolutionId)`
- [x] 6.4 `api/activities.ts` — `getChallenge(journeyId)`, `addChallenge(journeyId, payload)`, `completeChallenge(journeyId, outcome)`, `deleteChallenge(journeyId)`
- [x] 6.5 `api/exposures.ts` — remove (replaced by activities.ts)
- [x] 6.6 `api/journeys.ts` — remove resolution methods (addResolution, updateResolution, deleteResolution); update `saveClarification` (already done); add `originating_assessment_id` to `JourneyDetail` type usage
- [x] 6.7 `types/index.ts` — add `JourneyExposure`, `JourneyResolution`, `JourneyChallenge`, catalog item types; remove `Exposure`, `Resolution` old types

## 7. Frontend — Components

- [x] 7.1 `components/journey/CatalogPicker.tsx` (new) — generic catalog browser + "Add custom" option; props: `items: CatalogItem[]`, `onSelect(item)`, `onAddCustom(title)`
- [x] 7.2 `components/journey/ActivityList.tsx` (new) — renders a list of journey activities (exposures or resolutions) with status toggle and delete
- [x] 7.3 `components/journey/ChallengeCard.tsx` (new) — shows current challenge with Complete / Abandon actions, or empty state prompting to add one
- [x] 7.4 `components/journey/JourneyPhaseBar.tsx` (new) — phase indicator: Setup / Practice / Challenge with visual state (complete, active, locked)

## 8. Frontend — JourneyDetail Page

- [x] 8.1 `pages/JourneyDetail.tsx` — add phase computation: `setup` (no exposures/resolutions yet), `practice` (has activities), `challenge` (has COMPLETED challenge or journey COMPLETED)
- [x] 8.2 `pages/JourneyDetail.tsx` — replace top tab bar with `JourneyPhaseBar` + tabs within each phase
- [x] 8.3 `pages/JourneyDetail.tsx` — Setup phase: Vratmitra step (existing logic), Exposures step (CatalogPicker + add first exposures), Resolutions step (CatalogPicker + add first resolutions)
- [x] 8.4 `pages/JourneyDetail.tsx` — Practice phase tabs: Exposures (ActivityList), Resolutions (ActivityList), Clarification (existing form), Reflections (existing form)
- [x] 8.5 `pages/JourneyDetail.tsx` — Challenge section: ChallengeCard at top of Practice phase when activities exist; or as a standalone phase tab
- [x] 8.6 `pages/JourneyDetail.tsx` — update journey completion button: disabled unless challenge is COMPLETED; show tooltip/hint if not yet

## 9. Frontend — Other Pages

- [x] 9.1 `pages/AssessmentResults.tsx` — after journey creation, redirect to `/journeys/:id` (setup phase) instead of `/journeys/:id/clarify/:assessmentId`

## 10. Frontend — i18n

- [x] 10.1 `i18n/translations.ts` — add keys for journey phases, activity status labels, catalog picker, challenge card (both `en` and `mr`)
