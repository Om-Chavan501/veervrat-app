## Context

The `irrational_belief` column on `sentence_journey_assessment_links` is currently `nullable=False` with an enum type `irrational_belief` (PostgreSQL). It is required in the Pydantic schema and validated in the frontend before form submission. Removing it requires a DB migration, backend model/schema cleanup, and frontend form cleanup.

## Goals / Non-Goals

**Goals:**
- Fully remove `irrational_belief` from DB, backend, and frontend
- Keep all other clarification fields intact (`lacuna_reduction_note`, `personal_context_note`, `unified_insight_note`, `virtue_relation_note`)
- Clean removal with no legacy remnants

**Non-Goals:**
- Migrating existing IB values to any other field
- Any other changes to the clarification flow
- Changes to the journey creation flow (separate change)

## Decisions

**Drop column before dropping enum type**
PostgreSQL requires the column to be dropped before the enum type can be dropped. Migration runs in order: `ALTER TABLE ... DROP COLUMN`, then `DROP TYPE irrational_belief`.

**Hard drop, no data migration**
Existing `irrational_belief` values are discarded. No user-facing value is derived from this field post-removal, so migration is unnecessary.

**Make clarification form submittable without IB**
The `isValid` check in `Clarify.tsx` currently gates submission on `irrational_belief` being selected. Remove that condition — the remaining three required fields (`lacuna_reduction_note`, `personal_context_note`, `unified_insight_note`) are sufficient.

## Risks / Trade-offs

- **Existing API clients sending `irrational_belief`**: Pydantic v2 ignores extra fields by default, so any client still sending the field will not break. No risk.
- **Rollback**: If migration needs to be rolled back, the column and enum can be recreated but historical values are lost. Acceptable given the field is being intentionally removed.

## Migration Plan

1. Deploy backend changes (model, schema, router) with `irrational_belief` removed
2. Run Alembic migration: drop column, then drop enum type
3. Deploy frontend (Clarify.tsx form update)
