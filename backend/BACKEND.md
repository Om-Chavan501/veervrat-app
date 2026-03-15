# Veervrat Backend — FastAPI

A REST API for the Veervrat character development platform. Built with FastAPI, SQLAlchemy, and PostgreSQL.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Running](#setup--running)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Database Models](#database-models)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Users & Dashboard](#users--dashboard)
  - [Ontology](#ontology)
  - [Shortlists](#shortlists)
  - [Assessments](#assessments)
  - [Journeys](#journeys)
  - [Reflections](#reflections)
  - [Exposures](#exposures)
  - [Vratmitra](#vratmitra)
- [Seeding the Database](#seeding-the-database)
- [Error Handling](#error-handling)

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| FastAPI | 0.115.0 | Web framework |
| SQLAlchemy | 2.0.35 | ORM |
| Alembic | 1.13.3 | Migrations |
| psycopg2-binary | latest | PostgreSQL driver |
| python-jose | 3.3.0 | JWT tokens |
| bcrypt | latest | Password hashing |
| Pydantic | 2.9.2 | Schema validation |
| pydantic-settings | 2.6.1 | Env-based config |
| uvicorn | 0.30.6 | ASGI server |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py             # FastAPI app, CORS, router mounting
│   ├── config.py           # Pydantic settings (reads .env)
│   ├── database.py         # SQLAlchemy engine + SessionLocal + get_db
│   ├── auth/
│   │   ├── jwt_handler.py  # Token creation/decoding, password hashing
│   │   └── dependencies.py # get_current_user FastAPI dependency
│   ├── models/
│   │   └── models.py       # All SQLAlchemy ORM models + Enum definitions
│   ├── schemas/
│   │   └── schemas.py      # All Pydantic request/response schemas
│   ├── routers/
│   │   ├── auth.py         # /auth — register, login, refresh, me
│   │   ├── users.py        # /users — profile, dashboard stats
│   │   ├── ontology.py     # /ontology — lacunae, virtues, sentences
│   │   ├── shortlists.py   # /shortlists — lacuna shortlist sessions
│   │   ├── assessments.py  # /assessments — create, respond, complete
│   │   ├── journeys.py     # /journeys — CRUD, state transitions, clarifications, resolutions
│   │   ├── reflections.py  # /journeys/:id/reflections — daily logs
│   │   ├── exposures.py    # /journeys/:id/exposures — exposure tracking
│   │   └── vratmitra.py    # /vratmitra — mentor invitations
│   └── seed/
│       └── seed.py         # Reads prisma/data/*.csv and populates DB
├── alembic/
│   └── env.py              # Alembic migration environment
├── alembic.ini
├── requirements.txt
├── .env                    # Local environment variables (not committed)
└── .env.example            # Template
```

---

## Setup & Running

### Prerequisites
- Python 3.12+
- PostgreSQL running locally
- `uv` (recommended) or `pip`

### 1. Create virtual environment

```bash
cd backend
uv venv --python 3.12 --seed
source .venv/bin/activate        # bash/zsh
source .venv/bin/activate.fish   # fish
```

### 2. Install dependencies

```bash
uv pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your database URL and secret key
```

### 4. Create tables + seed data

```bash
# Tables are auto-created on first run via Base.metadata.create_all()
# Seed the ontology (lacunae, virtues, sentences):
python -m app.seed.seed
```

### 5. Start the server

```bash
uvicorn app.main:app --reload --port 8000
```

- API root: `http://localhost:8000`
- Interactive docs (Swagger): `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/health`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `SECRET_KEY` | — | JWT signing secret (min 32 chars in prod) |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token TTL |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |

Example `.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/veervrat_db_dev
SECRET_KEY=your-secret-key-min-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=http://localhost:5173
```

---

## Authentication

The API uses **JWT Bearer token authentication**.

### Token Types

| Type | TTL | Purpose |
|---|---|---|
| Access token | 60 minutes | Authorizes API requests |
| Refresh token | 7 days | Obtains a new access token |

### Usage

Include the access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Token Refresh Flow

When an access token expires (401 response), call `POST /api/v1/auth/refresh` with the refresh token to get a new pair. The frontend Axios interceptor handles this automatically.

### Protected Routes

All routes except `POST /auth/register` and `POST /auth/login` require a valid access token. The `get_current_user` FastAPI dependency handles validation.

---

## Database Models

All models are defined in `app/models/models.py` using SQLAlchemy 2.0.

### Enums

| Enum | Values |
|---|---|
| `JourneyState` | `ACTIVE`, `INACTIVE`, `COMPLETED` |
| `AssessmentStatus` | `IN_PROGRESS`, `COMPLETED` |
| `Rating` | `ALWAYS`, `OFTEN`, `RARELY`, `NEVER` |
| `IrrationalBelief` | `MUST_BE_LOVED`, `MUST_BE_COMPETENT`, `MUST_HAVE_COMFORT` |
| `LacunaCategory` | `A`, `B`, `C` |
| `GovernanceStatus` | `PROPOSED`, `APPROVED`, `REJECTED` |
| `ChallengeStatus` | `APPLIED`, `APPROVED`, `ACTIVE`, `COMPLETED`, `CANCELLED` |
| `VratmitraStatus` | `PENDING`, `ACTIVE`, `DETACHED` |

### Core Models

#### `User`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID string | Primary key |
| `name` | String | Required |
| `email` | String | Unique, nullable |
| `phone` | String | Unique, nullable |
| `password_hash` | String | bcrypt hash |
| `created_at` | DateTime | Auto |

#### `Lacuna` (ontology)
| Column | Type | Notes |
|---|---|---|
| `id` | UUID string | |
| `name_en` | String | Unique |
| `name_mr` | String | Marathi name |
| `category` | Enum | A, B, or C |

#### `SentenceJourney` (core unit)
| Column | Type | Notes |
|---|---|---|
| `id` | UUID string | |
| `user_id` | FK → User | |
| `sentence_id` | FK → Sentence | |
| `state` | Enum | ACTIVE/INACTIVE/COMPLETED |
| `created_at` | DateTime | |
| `inactive_at` | DateTime | Nullable |
| `inactive_reason` | Text | Nullable |
| Unique | | `(user_id, sentence_id)` |

#### `DailyReflection`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID string | |
| `journey_id` | FK → SentenceJourney | |
| `date` | DateTime | Day only (midnight UTC) |
| `applied` | Boolean | Did they apply the sentence? |
| `context_note` | Text | Situational description |
| `insight_note` | Text | What was learned |
| `difficulty` | Integer | 1–10, nullable |
| Unique | | `(journey_id, date)` |

Full model list: `User`, `AdminRole`, `Lacuna`, `Virtue`, `SubVirtue`, `LacunaSubVirtue`, `Sentence`, `LacunaShortlistSession`, `LacunaShortlistItem`, `LacunaAssessment`, `AssessmentResponse`, `SuggestedSentenceSnapshot`, `SentenceJourney`, `SentenceJourneyAssessmentLink`, `JourneyVratmitra`, `ExposureInstance`, `CommunityExposure`, `ExposureRecommendation`, `ResolutionInstance`, `CommunityResolution`, `ResolutionRecommendation`, `ChallengeInstance`, `CommunityChallenge`, `DailyReflection`, `ReflectionComment`.

---

## API Reference

Base URL: `/api/v1`

### Auth

#### `POST /auth/register`
Register a new user.

**Request body:**
```json
{
  "name": "string",
  "email": "user@example.com",
  "password": "string (min 8 chars)",
  "confirm_password": "string"
}
```

**Response:** `TokenResponse` — access token, refresh token, user object.

---

#### `POST /auth/login`
Authenticate with email and password.

**Request body:**
```json
{ "email": "user@example.com", "password": "string" }
```

**Response:** `TokenResponse`

---

#### `POST /auth/refresh`
Exchange a refresh token for a new token pair.

**Request body:**
```json
{ "refresh_token": "string" }
```

**Response:** `TokenResponse`

---

#### `GET /auth/me`
Returns the current authenticated user. 🔒

---

### Users & Dashboard

#### `GET /users/me` 🔒
Returns current user profile.

#### `PUT /users/me` 🔒
Update user profile.

**Request body:**
```json
{ "name": "string" }
```

#### `GET /users/me/dashboard` 🔒
Returns aggregated stats.

**Response:**
```json
{
  "active_journeys": 3,
  "total_reflections": 42,
  "pending_invitations": 1,
  "completed_journeys": 5
}
```

---

### Ontology

Read-only endpoints for the curated knowledge base.

#### `GET /ontology/lacunae` 🔒
List all lacunae, ordered by category then name.

#### `GET /ontology/lacunae/:id` 🔒
Get a lacuna with its full sub-virtue tree (includes sentences).

#### `GET /ontology/virtues` 🔒
List all virtues.

#### `GET /ontology/virtues/:id/sub-virtues` 🔒
List sub-virtues for a virtue.

#### `GET /ontology/sentences?sub_virtue_id=` 🔒
List sentences, optionally filtered by sub-virtue.

---

### Shortlists

#### `GET /shortlists` 🔒
List all shortlist sessions for the current user (with items).

#### `POST /shortlists` 🔒
Create a new shortlist session.

**Request body:**
```json
{ "note": "optional string" }
```

#### `GET /shortlists/:session_id` 🔒
Get a session with its items.

#### `POST /shortlists/:session_id/items` 🔒
Add a lacuna to the shortlist.

**Request body:**
```json
{ "lacuna_id": "uuid" }
```

#### `DELETE /shortlists/:session_id/items/:lacuna_id` 🔒
Remove a lacuna from the shortlist.

---

### Assessments

#### `POST /assessments/start` 🔒
Start or resume an assessment for a lacuna.

If an `IN_PROGRESS` assessment already exists for `(user, lacuna)`, it is returned unchanged.

**Request body:**
```json
{
  "lacuna_id": "uuid",
  "shortlist_session_id": "uuid (optional)"
}
```

#### `GET /assessments` 🔒
List all assessments for the current user.

#### `GET /assessments/:id` 🔒
Get full assessment with lacuna sub-virtues, sentences, existing responses, and suggestions.

#### `POST /assessments/:id/responses` 🔒
Save or update a sentence rating.

**Request body:**
```json
{ "sentence_id": "uuid", "rating": "RARELY" }
```

Allowed ratings: `ALWAYS`, `OFTEN`, `RARELY`, `NEVER`

#### `DELETE /assessments/:id/responses/:sentence_id` 🔒
Remove a rating (unselect).

#### `POST /assessments/:id/complete` 🔒
Complete the assessment. Marks status as `COMPLETED` and generates sentence suggestions.

**Suggestion algorithm:** Sentences rated `RARELY` or `NEVER` are collected and sorted by their sub-virtue's priority in the lacuna's sub-virtue mapping.

#### `GET /assessments/:id/suggestions` 🔒
Get the generated suggestions for a completed assessment.

---

### Journeys

#### `GET /journeys?state=` 🔒
List journeys. Optional `state` filter: `ACTIVE`, `INACTIVE`, `COMPLETED`.

#### `POST /journeys` 🔒
Create or link a journey for a sentence.

- If no journey exists for `(user, sentence)`: creates new `ACTIVE` journey.
- If an existing journey exists: returns it.

**Request body:**
```json
{ "sentence_id": "uuid", "assessment_id": "uuid" }
```

#### `GET /journeys/:id` 🔒
Get journey details including sentence, clarification links, and resolutions.

#### `POST /journeys/:id/clarify/:assessment_id` 🔒
Save or update a clarification link.

**Request body:**
```json
{
  "virtue_relation_note": "string (optional)",
  "lacuna_reduction_note": "string (required)",
  "unified_insight_note": "string (required)",
  "personal_context_note": "string (required)",
  "irrational_belief": "MUST_BE_LOVED"
}
```

Allowed beliefs: `MUST_BE_LOVED`, `MUST_BE_COMPETENT`, `MUST_HAVE_COMFORT`

#### `GET /journeys/:id/clarifications` 🔒
List all clarification links for a journey.

#### `POST /journeys/:id/resolutions` 🔒
Add a resolution. Requires journey to be `ACTIVE` and have at least one clarification.

**Request body:**
```json
{ "text": "string", "frequency": "Daily" }
```

#### `PUT /journeys/:id/resolutions/:resolution_id` 🔒
Update a resolution (only if journey is `ACTIVE`).

#### `DELETE /journeys/:id/resolutions/:resolution_id` 🔒
Delete a resolution (only if journey is `ACTIVE`).

#### `POST /journeys/:id/pause` 🔒
Transition `ACTIVE → INACTIVE`.

**Request body:**
```json
{ "reason": "string (optional)" }
```

#### `POST /journeys/:id/resume` 🔒
Transition `INACTIVE → ACTIVE`.

#### `POST /journeys/:id/complete` 🔒
Transition `ACTIVE → COMPLETED`. Requires at least one reflection.

---

### Reflections

All reflection endpoints are nested under `/journeys/:journey_id/reflections`.

Access is granted to the journey **owner** and any **active Vratmitra**.

#### `GET /journeys/:journey_id/reflections` 🔒
List all reflections for a journey (with comments), ordered newest first.

#### `GET /journeys/:journey_id/reflections/today` 🔒
Get today's reflection if it exists, or `null`.

#### `POST /journeys/:journey_id/reflections` 🔒
Create today's reflection. Only the owner can create. Only one per day.

**Request body:**
```json
{
  "applied": true,
  "context_note": "string (required)",
  "insight_note": "string (required)",
  "difficulty": 6
}
```

#### `PUT /journeys/:journey_id/reflections/:id` 🔒
Update today's reflection. Reflections from previous days are immutable.

#### `DELETE /journeys/:journey_id/reflections/:id` 🔒
Delete today's reflection only.

#### `POST /journeys/:journey_id/reflections/:id/comments` 🔒
Add a comment to a reflection (available to owner and active Vratmitra).

**Request body:**
```json
{ "text": "string" }
```

---

### Exposures

Nested under `/journeys/:journey_id/exposures`.

Read access: owner + active Vratmitra. Write access: owner only.

#### `GET /journeys/:journey_id/exposures` 🔒
List all exposures (newest first).

#### `POST /journeys/:journey_id/exposures` 🔒
Create an exposure.

**Request body:**
```json
{ "description": "string", "context_note": "string (optional)" }
```

#### `PUT /journeys/:journey_id/exposures/:id` 🔒
Update an exposure.

#### `DELETE /journeys/:journey_id/exposures/:id` 🔒
Delete an exposure.

---

### Vratmitra

#### `GET /vratmitra/pending` 🔒
Get pending Vratmitra invitations for the current user.

#### `GET /vratmitra/my-mentored-journeys` 🔒
Get journeys where the current user is an active Vratmitra.

#### `POST /vratmitra/journeys/:journey_id/invite` 🔒
Invite a user as Vratmitra. Only journey owner can invite. Journey can only have one active/pending Vratmitra at a time.

**Request body:**
```json
{ "invitee_email": "user@example.com" }
```

#### `POST /vratmitra/journeys/:journey_id/accept` 🔒
Accept a pending invitation. Only the invited user can accept.

#### `POST /vratmitra/journeys/:journey_id/detach` 🔒
Detach the Vratmitra. Either the journey owner or the Vratmitra themselves can detach.

#### `GET /vratmitra/journeys/:journey_id/current` 🔒
Get the current active Vratmitra for a journey (or null).

---

## Seeding the Database

The seed script reads from `../prisma/data/*.csv` and populates:
- 6 Virtues
- 33 SubVirtues
- 35 Lacunae
- 179 LacunaSubVirtue priority mappings
- 226 Sentences

```bash
cd backend
source .venv/bin/activate.fish
python -m app.seed.seed
```

The script is idempotent — if data already exists, it skips.

CSV column names expected:

| File | Columns |
|---|---|
| `virtues.csv` | `name_en`, `name_mr` |
| `subvirtues.csv` | `name_en`, `name_mr`, `virtue_name_en` |
| `lacunae.csv` | `name_en`, `name_mr`, `category` |
| `lacuna_subvirtues.csv` | `lacuna_name_en`, `subvirtue_name_en`, `priority` |
| `sentences.csv` | `text_en`, `text_mr`, `subvirtue_name_en` |

---

## Error Handling

All errors return JSON with a `detail` field:

```json
{ "detail": "Error message" }
```

| Status | Meaning |
|---|---|
| 400 | Bad request / business rule violation |
| 401 | Missing or invalid/expired token |
| 403 | Authenticated but not authorized (ownership check) |
| 404 | Resource not found |
| 422 | Pydantic validation error |
| 500 | Internal server error |
