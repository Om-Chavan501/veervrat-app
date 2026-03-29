## Context

The journey redesign (now archived) restructured the journey into three phases: Setup, Practice, Challenge. Clarification — the `SentenceJourneyAssessmentLink` where a user writes why a sentence matters for their lacuna — was placed as a tab in the Practice phase with no assessment context passed to it.

This is broken in two ways:
1. The Clarify page (`/journeys/:id/clarify/:assessmentId`) requires an `assessmentId` in the URL, but the Practice tab's "Add clarification" button links to `/journeys/:id/clarify` with no id — a dead route.
2. The Practice phase is the wrong timing. Clarification is most meaningful immediately after assessment, while the lacuna is fresh. In Practice, the user is in "log and reflect" mode.

The fix: surface clarification as a card in the Setup phase, pre-loaded with `originating_assessment_id`, with a path for linking additional assessments later.

## Goals / Non-Goals

**Goals:**
- Give clarification a clear, visually distinct home in the Setup phase
- Pre-fill `originating_assessment_id` so entry requires zero friction for the primary case
- Support "Add another" for users who re-assess the same lacuna over time
- Remove the broken Clarification tab from Practice phase
- Keep the existing Clarify page and backend completely unchanged

**Non-Goals:**
- Changing the Clarify page design or form fields
- Making clarification required or gated
- Adding a new backend endpoint (existing `/journeys/:id/clarify/:assessmentId` is sufficient)

## Decisions

### Decision 1: Clarification card lives in Setup, not as a persistent floating element

**Chosen:** Setup phase card (Shape B from exploration)

**Rationale:** Setup is the grounding phase — Vratmitra, Exposures, Resolutions, and now "Understand the Why." The card has visual weight (its own section), is skippable, and naturally captures the assessment context from `originating_assessment_id`. A floating button or header nudge would be ambient UI noise with no moment of intention.

**Alternative considered:** Persistent header nudge — rejected because nudges are ignored; the setup card creates a clear intentional moment.

### Decision 2: "Add another" picker uses assessments filtered by the journey's lacuna

**Chosen:** When the user clicks "+ Add another clarification", show a dropdown of their completed `LacunaAssessment` records that share the same `lacuna_id` as the journey's originating assessment.

**Rationale:** The clarification form asks "how does this sentence address *your lacuna*?" — only assessments of the same lacuna are relevant. Showing all assessments would be noisy and confusing.

**Implementation:** The frontend already has `assessmentsApi`. We need to filter by lacuna_id client-side from the journey's `originating_assessment_id` → assessment → `lacuna_id`. This avoids a new backend endpoint.

**Alternative considered:** Backend endpoint `GET /assessments?lacuna_id=x` — more correct but unnecessary complexity for now. Client-side filter from cached assessment list is sufficient.

### Decision 3: Card states — empty, done, multi-link

```
State A: No clarification yet
┌──────────────────────────────────────────────┐
│ 💡 Understand the Why           [optional]   │
│ Articulate how this sentence connects        │
│ to your lacuna before you start practicing.  │
│                                              │
│              [ Clarify → ]                  │
└──────────────────────────────────────────────┘
  → navigates to /journeys/:id/clarify/:originatingAssessmentId

State B: One clarification link exists
┌──────────────────────────────────────────────┐
│ ✓ Why understood                             │
│ "This sentence reduces my tendency to..."   │  ← lacuna_reduction_note preview (truncated)
│ For: [Lacuna name] assessment               │
│                         [ + Add another ]   │
└──────────────────────────────────────────────┘

State C: Clicking "+ Add another"
  → Shows a dropdown of completed assessments for the same lacuna
  → User picks one → navigates to /journeys/:id/clarify/:selectedAssessmentId
  → (Clarify page already handles existing links by checking for duplicate and updating)

State D: Multiple clarification links
  → Card shows a count badge "2 clarifications"
  → Expandable list showing each link's lacuna_reduction_note preview
  → [ + Add another ] still present
```

### Decision 4: Remove Practice → Clarification tab entirely

The read-only view of clarification notes (currently in the Practice tab) moves into the Setup card's expanded/done state. This avoids duplicating the display in two places and keeps clarification in one coherent location.

The Practice phase becomes: Exposures | Resolutions | Reflections (3 tabs, not 4).

## Risks / Trade-offs

**[Risk] Users who already have clarifications won't see them** if they've never been to the Setup phase → Mitigation: The card always appears in Setup regardless of journey age, showing existing links in State B/D. Users who go to Practice will no longer find the tab but will naturally discover it in Setup.

**[Risk] `originating_assessment_id` is null for legacy journeys** → Mitigation: When null, State A shows the button but navigates to `/journeys/:id/clarify` with no assessmentId — the Clarify page already has a route that handles this (`/journeys/:journeyId/clarify` without assessmentId). We need to confirm that route works without the id param, or add a small assessment picker inside the Clarify page as fallback.

**[Trade-off] "Add another" requires knowing the lacuna_id** — derived from `originating_assessment_id → assessment.lacuna_id`. For legacy journeys with no `originating_assessment_id`, this chain breaks. Fallback: show all user assessments unfiltered.
