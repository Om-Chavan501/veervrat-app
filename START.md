# Veervrat v2.0 — FastAPI + React/Vite

## Quick Start

### Backend (FastAPI)
```bash
cd backend
source .venv/bin/activate.fish   # fish shell
# or: source .venv/bin/activate  # bash/zsh

# First run only — seed the database:
python -m app.seed.seed

# Start development server:
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend (React + Vite)
```bash
cd frontend
npm install   # first run only
npm run dev
```

App: http://localhost:5175 (or 5173 if available)

---

## Architecture

```
backend/          FastAPI + SQLAlchemy + PostgreSQL
  app/
    main.py       App entry point, CORS, routers
    config.py     Pydantic settings from .env
    database.py   SQLAlchemy engine + session
    models/       SQLAlchemy ORM models
    schemas/      Pydantic request/response schemas
    auth/         JWT handler + Bearer dependencies
    routers/      API route handlers
    seed/         DB seed from prisma/data/ CSVs
  .env            DATABASE_URL, SECRET_KEY, etc.
  .venv/          Python 3.12 virtual environment

frontend/         React 18 + Vite + TypeScript
  src/
    api/          Axios API clients per domain
    components/   UI components (Button, Card, Modal…)
    pages/        All page components
    store/        Zustand auth store
    types/        TypeScript types matching API
  tailwind.config.js  Earthy sage/terra palette
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/auth/register | Register user |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/refresh | Refresh token |
| GET | /api/v1/auth/me | Current user |
| GET | /api/v1/users/me/dashboard | Dashboard stats |
| GET | /api/v1/ontology/lacunae | List lacunae |
| GET | /api/v1/ontology/virtues | List virtues |
| GET | /api/v1/ontology/sentences | List sentences |
| POST | /api/v1/assessments/start | Start assessment |
| GET | /api/v1/assessments/:id | Assessment details |
| POST | /api/v1/assessments/:id/responses | Save response |
| POST | /api/v1/assessments/:id/complete | Complete |
| GET | /api/v1/shortlists | List sessions |
| POST | /api/v1/shortlists | Create session |
| POST | /api/v1/journeys | Create/link journey |
| GET | /api/v1/journeys | List journeys |
| POST | /api/v1/journeys/:id/clarify/:assessmentId | Save clarification |
| POST | /api/v1/journeys/:id/resolutions | Add resolution |
| POST | /api/v1/journeys/:id/pause | Pause journey |
| POST | /api/v1/journeys/:id/resume | Resume journey |
| POST | /api/v1/journeys/:id/complete | Complete journey |
| GET/POST | /api/v1/journeys/:id/reflections | Reflections |
| GET/POST | /api/v1/journeys/:id/exposures | Exposures |
| GET | /api/v1/vratmitra/pending | Pending invitations |
| POST | /api/v1/vratmitra/journeys/:id/invite | Invite mentor |
| POST | /api/v1/vratmitra/journeys/:id/accept | Accept invite |
| POST | /api/v1/vratmitra/journeys/:id/detach | Detach mentor |

## Auth Flow
- JWT Bearer tokens (access + refresh)
- Access token: 60 min
- Refresh token: 7 days
- Auto-refresh on 401 via Axios interceptor
- Tokens stored in localStorage via Zustand persist
