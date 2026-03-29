## Why

The clarification form — where the user articulates *why* a sentence matters for their specific lacuna — has no clear home in the redesigned journey flow. It was removed as a gate but left as a buried tab in the Practice phase, disconnected from the assessment context that makes it meaningful. The right moment to clarify is right after creating a journey, while the lacuna is still fresh in mind.

## What Changes

- Move clarification out of the Practice phase "Clarification" tab and into the Setup phase as a dedicated **"Understand the Why" card**
- The card pre-fills the assessment picker with `originating_assessment_id` so the user doesn't have to hunt for context
- After clarifying, the card shows a ✓ state with a preview of the `lacuna_reduction_note`
- A `+ Add another` link on the completed card allows linking a second assessment (e.g. after re-assessing the same lacuna later)
- When "Add another" is used, a dropdown lists the user's completed assessments for the journey's lacuna — the user picks which one to link
- Remove the standalone `Clarification` tab from the Practice phase (its read-only summary view moves into the Setup card's expanded state)
- The existing `/journeys/:id/clarify/:assessmentId` route and backend remain unchanged — only the entry point and surface change

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `journeys`: Setup phase gains a Clarification card; Practice phase loses the Clarification tab; entry into the Clarify page is now always assessment-contextualised

## Impact

- `frontend/src/pages/JourneyDetail.tsx` — primary change (Setup phase card, remove Practice tab)
- `frontend/src/pages/Clarify.tsx` — minor: ensure it handles the case where assessmentId comes from Setup card context
- `frontend/src/api/assessments.ts` — need a way to list completed assessments for a given lacuna (for "Add another" picker)
- `frontend/src/i18n/translations.ts` — new keys for the Setup card states
- No backend changes required
