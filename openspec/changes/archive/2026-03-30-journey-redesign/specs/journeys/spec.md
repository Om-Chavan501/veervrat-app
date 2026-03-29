## MODIFIED Requirements

### Requirement: Journey stores originating assessment context
When a journey is created, the system SHALL store the `assessment_id` that originated the journey directly on the `SentenceJourney` record as `originating_assessment_id`. This makes the lacuna context immediately available without joining through clarification links. For journeys created before this change, `originating_assessment_id` MAY be null.

#### Scenario: Journey creation stores originating assessment
- **WHEN** `POST /journeys` is called with `{ "sentence_id": "...", "assessment_id": "..." }`
- **THEN** the created journey has `originating_assessment_id` set to the provided `assessment_id`

#### Scenario: Journey detail includes originating assessment id
- **WHEN** `GET /journeys/:id` is called
- **THEN** the response includes `originating_assessment_id` (may be null for legacy journeys)

---

### Requirement: Journey completion requires a completed challenge
The system SHALL only allow journey completion when a `JourneyChallenge` with `status=COMPLETED` exists for the journey. The previous requirement of ≥1 reflection is removed.

#### Scenario: Complete journey with completed challenge
- **WHEN** `POST /journeys/:id/complete` is called and a COMPLETED challenge exists
- **THEN** the journey state becomes COMPLETED

#### Scenario: Cannot complete journey without completed challenge
- **WHEN** `POST /journeys/:id/complete` is called and no COMPLETED challenge exists
- **THEN** a `400` response is returned with a message indicating a challenge must be completed first

#### Scenario: Cannot complete journey with only a planned challenge
- **WHEN** `POST /journeys/:id/complete` is called and the challenge status is PLANNED (not COMPLETED)
- **THEN** a `400` response is returned

## REMOVED Requirements

### Requirement: Journey resolutions require at least one clarification link
**Reason**: Clarification is now an optional, ongoing activity in the Practice phase. Activities (exposures, resolutions) should be available from the start of the journey without being gated by clarification.
**Migration**: No data migration needed. The gate was enforced at the API layer only — existing resolution records are unaffected.
