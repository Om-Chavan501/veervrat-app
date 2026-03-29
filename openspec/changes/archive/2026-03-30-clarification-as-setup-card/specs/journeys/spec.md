## MODIFIED Requirements

### Requirement: Clarification is surfaced in the Setup phase as a card
The journey Setup phase SHALL display a "Understand the Why" card that surfaces the clarification flow directly. The card SHALL pre-fill the assessment context from `originating_assessment_id` when available. The card SHALL be optional — no gate blocks progress if skipped. The card SHALL display in one of four states based on existing clarification links: empty (no links), done (one link), multi-link (more than one link), or adding-another (picker open).

#### Scenario: Setup card with no clarification and originating assessment known
- **WHEN** the user views the Setup phase and `originating_assessment_id` is set and `links` is empty
- **THEN** the card shows an empty state with a "Clarify →" button that navigates to `/journeys/:id/clarify/:originatingAssessmentId`

#### Scenario: Setup card with no clarification and no originating assessment
- **WHEN** the user views the Setup phase and `originating_assessment_id` is null and `links` is empty
- **THEN** the card shows an empty state with a "Clarify →" button that navigates to `/journeys/:id/clarify` (no assessmentId; the Clarify page handles the assessmentless route)

#### Scenario: Setup card after one clarification is saved
- **WHEN** the user views the Setup phase and `links` has exactly one entry
- **THEN** the card shows a ✓ done state with a truncated preview of `lacuna_reduction_note` and a "+ Add another" link

#### Scenario: Setup card with multiple clarification links
- **WHEN** `links` has more than one entry
- **THEN** the card shows a count badge and an expandable list of `lacuna_reduction_note` previews, plus a "+ Add another" link

#### Scenario: Adding another clarification link
- **WHEN** the user clicks "+ Add another" on the Setup card
- **THEN** a dropdown appears listing the user's completed assessments for the same lacuna (filtered by `lacuna_id` from `originating_assessment_id`); selecting one navigates to `/journeys/:id/clarify/:selectedAssessmentId`

#### Scenario: Adding another clarification when lacuna context is unavailable
- **WHEN** the user clicks "+ Add another" and `originating_assessment_id` is null
- **THEN** the dropdown lists all of the user's completed assessments (unfiltered)

## REMOVED Requirements

### Requirement: Practice phase contains a Clarification tab
**Reason**: Clarification is now surfaced in the Setup phase card. Having it in both places duplicates the surface and places it in the wrong phase (Practice is for logging and reflecting, not articulating foundational understanding).
**Migration**: No data migration needed. The `SentenceJourneyAssessmentLink` records are unaffected. Users who previously accessed clarifications via the Practice tab will find them in the Setup card.
