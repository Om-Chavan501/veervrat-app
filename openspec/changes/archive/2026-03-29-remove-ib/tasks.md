# Tasks: remove-ib

## 1. Backend — Alembic Migration

- [x] 1.1 Create migration: `alembic revision -m "remove_irrational_belief"`
- [x] 1.2 Write upgrade: `ALTER TABLE sentence_journey_assessment_links DROP COLUMN irrational_belief`, then `DROP TYPE irrationalbelief`
- [x] 1.3 Write downgrade: recreate enum type then add column back as nullable
- [x] 1.4 Run `alembic upgrade head`

## 2. Backend — Model

- [x] 2.1 `backend/app/models/models.py` — remove `irrational_belief` column from `SentenceJourneyAssessmentLink`
- [x] 2.2 `backend/app/models/models.py` — remove `IrrationalBelief` enum class

## 3. Backend — Schemas

- [x] 3.1 `backend/app/schemas/schemas.py` — remove `irrational_belief` field from `ClarificationLinkCreate` (or equivalent request schema)
- [x] 3.2 `backend/app/schemas/schemas.py` — remove `irrational_belief` field from `ClarificationLinkOut` (or equivalent response schema)
- [x] 3.3 `backend/app/schemas/schemas.py` — remove `IrrationalBelief` enum import/definition

## 4. Backend — Router

- [x] 4.1 `backend/app/routers/journeys.py` — remove `irrational_belief` from clarification endpoint logic (no longer set on model instance)

## 5. Frontend — Types

- [x] 5.1 `frontend/src/types/index.ts` — remove `IrrationalBelief` type

## 6. Frontend — API

- [x] 6.1 `frontend/src/api/journeys.ts` — remove `irrational_belief` from the `saveClarification` payload type

## 7. Frontend — Clarify Page

- [x] 7.1 `frontend/src/pages/Clarify.tsx` — remove `IRRATIONAL_BELIEFS` constant array
- [x] 7.2 `frontend/src/pages/Clarify.tsx` — remove `irrational_belief` from form state and `setForm` calls
- [x] 7.3 `frontend/src/pages/Clarify.tsx` — remove IB selection card from JSX
- [x] 7.4 `frontend/src/pages/Clarify.tsx` — remove `irrational_belief` from `isValid` check
- [x] 7.5 `frontend/src/pages/Clarify.tsx` — remove `IrrationalBelief` type import
