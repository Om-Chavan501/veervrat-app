## Why

The Irrational Belief (IB) field in the journey clarification step — drawn from Ellis's REBT framework — no longer fits the app's direction. The journey redesign removes this theoretical framing in favour of a more direct, personal growth-oriented clarification flow. The field is required and non-nullable in the DB, so it must be fully removed.

## What Changes

- **BREAKING** Remove `irrational_belief` column from `sentence_journey_assessment_links` table
- **BREAKING** Drop `IrrationalBelief` enum type from the database
- Remove `irrational_belief` from `SentenceJourneyAssessmentLink` SQLAlchemy model
- Remove `IrrationalBelief` enum class from Python codebase
- Remove `irrational_belief` from all Pydantic schemas
- Remove IB selection UI card from `Clarify.tsx`
- Remove `irrational_belief` from form state, validation, and API call in `Clarify.tsx`
- Remove `IrrationalBelief` TypeScript type from `types/index.ts`

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `journeys`: The clarification sub-resource (`POST /journeys/:id/clarify/:assessmentId`) no longer accepts or requires `irrational_belief` in the request body.

## Impact

- **Backend**: `models/models.py`, `schemas/schemas.py`, `routers/journeys.py`, Alembic migration
- **Frontend**: `pages/Clarify.tsx`, `types/index.ts`, `api/journeys.ts`
- **DB**: Alembic migration to drop column + enum type
- **Existing data**: Any stored `irrational_belief` values are discarded — no migration of values needed
