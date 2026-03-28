# Dashboard & User Profile — Specification

## What it does
Provides a high-level summary of the authenticated user's activity across all modules.
Used to populate the home screen with at-a-glance stats. Also covers profile read/update.

---

## API Contract

### GET `/api/v1/users/me`
Returns the current user's profile.

**Response** `200 UserOut`
```json
{ "id": "uuid", "name": "string", "email": "string", "created_at": "datetime" }
```

---

### PUT `/api/v1/users/me`
Updates the current user's profile. Currently only `name` is mutable.

**Request**
```json
{ "name": "string|null" }
```

**Response** `200 UserOut`

---

### GET `/api/v1/users/me/dashboard`
Returns aggregated stats for the current user.

**Response** `200 DashboardStats`
```json
{
  "active_journeys": 3,
  "completed_journeys": 2,
  "total_reflections": 47,
  "pending_invitations": 1
}
```

**Field definitions**
| Field | Description |
|---|---|
| `active_journeys` | Count of SentenceJourneys with state = ACTIVE |
| `completed_journeys` | Count of SentenceJourneys with state = COMPLETED |
| `total_reflections` | Total DailyReflections across all journeys owned by user |
| `pending_invitations` | JourneyVratmitra records where this user is the invitee and status = PENDING |

---

## Acceptance Criteria

### Dashboard stats
```
GIVEN a new user with no journeys or reflections
WHEN GET /users/me/dashboard is called
THEN all stats return 0

GIVEN a user with 3 ACTIVE and 2 COMPLETED journeys, 47 reflections, 1 pending invite
WHEN GET /users/me/dashboard is called
THEN { active_journeys: 3, completed_journeys: 2, total_reflections: 47, pending_invitations: 1 }

GIVEN a journey moves from ACTIVE to COMPLETED
WHEN GET /users/me/dashboard is called
THEN active_journeys decreases by 1 and completed_journeys increases by 1

GIVEN an invitation is accepted (PENDING → ACTIVE)
WHEN GET /users/me/dashboard is called
THEN pending_invitations decreases by 1
```

### Profile update
```
GIVEN a valid name string
WHEN PUT /users/me is called
THEN the user's name is updated and the updated UserOut is returned

GIVEN a null name
WHEN PUT /users/me is called
THEN the name is unchanged (null is treated as "no change")
```

### Authentication
```
GIVEN any dashboard or profile endpoint
WHEN called without a valid Bearer token
THEN a 401 error is returned
```
