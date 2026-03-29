# Change Proposal: Assessment Results — Browse All Rated Sentences

## Problem
After completing an assessment, only the algorithmically suggested sentences are shown.
The remaining rated sentences are invisible. Users cannot choose to start a journey on
any sentence outside the suggestion set, even if they have a reason to.

## Domain Clarification
Sentences are **positive behavioural statements**. Ratings mean:
- NEVER  → user never exhibits this positive behaviour → BIGGEST gap → highest priority
- RARELY → rarely exhibits it → significant gap
- OFTEN  → often exhibits it → minor gap
- ALWAYS → always exhibits it → already a strength → lowest priority

The suggestion algorithm surfaces NEVER/RARELY rated sentences by priority rank.

## Goal
Keep suggestions as the primary CTA. Below them, expose all remaining rated sentences
in folded sections grouped by rating — collapsed by default so the primary flow is
unobstructed, but available for users who want to choose their own path.

## Design Decisions

### Suggestions stay prominent
The existing suggested sentences section is unchanged in position and visual weight.
It remains the first thing the user sees.

### Folded rating sections below suggestions
Four collapsible sections appear below, one per rating value, in priority order:
NEVER → RARELY → OFTEN → ALWAYS

Each section contains only sentences NOT already in suggestions (no duplication).
Empty sections (no sentences with that rating outside suggestions) are not rendered.

### ALWAYS section note
The ALWAYS section gets a subtle "already a strength" label to contextualise why
these are lowest priority — but all sentences in it are fully selectable.

### Collapsed by default
All four sections start collapsed. User expands what they want to explore.

### Unified selection + sticky bar
Sentences from both suggestions and rating sections feed into the same `selectedIds`
set. The existing sticky bottom bar ("N selected · Start →") works unchanged.

### No backend changes needed
`assessment.responses` (already fetched via `assessmentsApi.get`) contains all rated
sentences with their ratings and sentence detail. No new API call required.

## Files affected
- `frontend/src/pages/AssessmentResults.tsx` — add folded rating sections below suggestions
