## 1. Frontend — ClarificationSetupCard component

- [x] 1.1 Create `components/journey/ClarificationSetupCard.tsx` — handles all 4 card states (empty, done, multi-link, adding-another)
- [x] 1.2 State A (empty, originating assessment known): show "Understand the Why" description + "Clarify →" button linking to `/journeys/:id/clarify/:originatingAssessmentId`
- [x] 1.3 State A (empty, no originating assessment): show same but link to `/journeys/:id/clarify` with no assessmentId
- [x] 1.4 State B (one link): show ✓ header, truncated `lacuna_reduction_note` preview, lacuna name, "+ Add another" link
- [x] 1.5 State C (multiple links): show count badge, expandable list of `lacuna_reduction_note` previews, "+ Add another" link
- [x] 1.6 State D (adding-another): show assessment picker dropdown — fetch user's completed assessments, filter by `lacuna_id` derived from `originating_assessment_id`; if lacuna unavailable, show all assessments unfiltered
- [x] 1.7 Assessment picker navigates to `/journeys/:id/clarify/:selectedAssessmentId` on selection

## 2. Frontend — JourneyDetail Setup phase

- [x] 2.1 Add `ClarificationSetupCard` as the first card in the Setup phase (above Vratmitra, or after — match the grounding-first intent)
- [x] 2.2 Pass `journey.links`, `journey.originating_assessment_id`, and `journeyId` as props to the card
- [x] 2.3 Remove the `Clarification` tab from the `PRACTICE_TABS` array in `JourneyDetail.tsx`
- [x] 2.4 Remove the `practiceTab === 'Clarification'` render block from the Practice phase section
- [x] 2.5 Remove `FileText` icon import if no longer used elsewhere in the file

## 3. Frontend — API

- [x] 3.1 In `api/assessments.ts`, verify `assessmentsApi.list()` exists and returns enough info (lacuna_id) to filter by lacuna; add if missing
- [x] 3.2 In the ClarificationSetupCard, derive `lacuna_id` from: fetch assessment by `originating_assessment_id` → use `assessment.lacuna_id` to filter completed assessments

## 4. Frontend — Clarify page (edge case)

- [x] 4.1 In `Clarify.tsx`, handle the case where `assessmentId` param is undefined — show a fallback picker or a message rather than crashing; `assessmentsApi.get(undefined)` must not be called

## 5. Frontend — i18n

- [x] 5.1 Add `'journey.clarify.cardTitle'`, `'journey.clarify.cardDesc'`, `'journey.clarify.cardDone'`, `'journey.clarify.addAnother'`, `'journey.clarify.pickAssessment'` to both `mr` and `en` blocks in `translations.ts`
