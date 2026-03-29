## MODIFIED Requirements

### Requirement: Journey owner invites Vratmitra by user ID or email
The journey-level invite endpoint SHALL accept either `invitee_email` (existing) OR
`invitee_id` (new) to identify the invitee. If `invitee_id` is provided it takes
precedence; `invitee_email` remains supported for backwards compatibility.
The invite form in the UI SHALL be replaced by a `UserSearchCombobox` (typeahead
dropdown) instead of a plain email text input.

#### Scenario: Invite by user ID
- **WHEN** `POST /vratmitra/journeys/:id/invite` is called with `{ "invitee_id": "<user_id>" }`
- **THEN** a PENDING invitation is created for the specified user

#### Scenario: Invite by email still works
- **WHEN** `POST /vratmitra/journeys/:id/invite` is called with `{ "invitee_email": "user@example.com" }`
- **THEN** a PENDING invitation is created (existing behaviour preserved)

#### Scenario: Both provided — ID takes precedence
- **WHEN** both `invitee_id` and `invitee_email` are provided
- **THEN** `invitee_id` is used to resolve the invitee
