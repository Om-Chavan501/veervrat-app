## ADDED Requirements

### Requirement: User can search registered users by name or email
The system SHALL provide a `GET /api/v1/users/search` endpoint that returns a list of
registered users matching a query string against their name or email (case-insensitive,
substring match). The endpoint MUST require authentication. The requesting user MUST be
excluded from results. Results SHALL be limited to 10 per request. The query MUST be at
least 2 characters; shorter queries SHALL return an empty list without error.

#### Scenario: Returns matching users
- **WHEN** `GET /users/search?q=raj` is called by an authenticated user
- **THEN** a `200` response is returned with a list of `[{id, name, email}]` for all users whose name or email contains "raj" (case-insensitive), excluding the caller, up to 10 results

#### Scenario: Query too short
- **WHEN** `GET /users/search?q=r` is called (1 character)
- **THEN** a `200` response is returned with an empty list `[]`

#### Scenario: No matches
- **WHEN** `GET /users/search?q=zzznomatch` is called
- **THEN** a `200` response is returned with an empty list `[]`

#### Scenario: Caller excluded from results
- **WHEN** the authenticated user's own name/email matches the query
- **THEN** the caller is NOT included in the results

#### Scenario: Unauthenticated request blocked
- **WHEN** `GET /users/search?q=test` is called without a Bearer token
- **THEN** a `401` response is returned
