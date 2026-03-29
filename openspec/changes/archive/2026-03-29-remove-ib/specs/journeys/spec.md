## MODIFIED Requirements

### Requirement: Journey owner submits a clarification link
The journey owner SHALL be able to create or update a clarification link connecting a journey to an assessment by providing `lacuna_reduction_note` (required), `personal_context_note` (required), `unified_insight_note` (required), and optionally `virtue_relation_note`. The `irrational_belief` field is no longer accepted or required.

#### Scenario: Clarification saved without irrational_belief
- **WHEN** `POST /journeys/:id/clarify/:assessmentId` is called with `lacuna_reduction_note`, `personal_context_note`, and `unified_insight_note` but no `irrational_belief`
- **THEN** a `200` response is returned with the clarification link created or updated

#### Scenario: irrational_belief field is ignored if sent
- **WHEN** `POST /journeys/:id/clarify/:assessmentId` is called with `irrational_belief` included in the body
- **THEN** the field is silently ignored and the clarification link is saved using the remaining fields

## REMOVED Requirements

### Requirement: Journey clarification requires irrational belief selection
**Reason**: The IB (Irrational Belief) framing from Ellis's REBT no longer fits the app's growth model. Removed as part of the journey redesign direction.
**Migration**: No migration needed. Existing stored IB values are discarded. The clarification endpoint continues to work without this field.
