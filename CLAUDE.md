# Veervrat App — Agent Context

## What this app is
A learning/growth tracking platform. Users go through Journeys (learning paths),
do Assessments, track Exposures (learning events), write Reflections, manage
Shortlists, explore Ontology (knowledge structure), identify Lacunae (gaps),
and interact with Vratmitra (AI companion).

## Read these first for deeper context
- `frontend/FRONTEND.md` — frontend architecture, patterns, decisions
- `backend/BACKEND.md` — backend architecture, patterns, decisions

## Project layout
```
veervrat-app/
├── frontend/                        # React app (Vite)
│   └── src/
│       ├── api/                     # All HTTP calls — one file per domain
│       │   ├── client.ts            # Axios instance (base URL, interceptors, auth header)
│       │   ├── auth.ts
│       │   ├── assessments.ts
│       │   ├── exposures.ts
│       │   ├── journeys.ts
│       │   ├── lacunae.ts
│       │   ├── reflections.ts
│       │   ├── shortlists.ts
│       │   └── vratmitra.ts
│       ├── components/
│       │   ├── layout/              # AppLayout, Sidebar, MobileNav
│       │   └── ui/                  # Badge, Button, Card, Input, Modal,
│       │                            # EmptyState, LoadingSpinner
│       ├── contexts/                # ThemeContext, LanguageContext
│       ├── i18n/translations.ts     # i18n strings
│       ├── pages/                   # Route-level components (flat, no sub-folders except auth/)
│       │   ├── auth/                # Login.tsx, Register.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Journeys.tsx / JourneyDetail.tsx
│       │   ├── Assessments.tsx / Assessment.tsx / AssessmentResults.tsx
│       │   ├── Exposures → uses exposures API (no dedicated page file visible — check)
│       │   ├── Reflections → reflections API
│       │   ├── ShortlistReview.tsx
│       │   ├── Ontology.tsx
│       │   ├── Lacunae.tsx
│       │   ├── Clarify.tsx
│       │   ├── Archive.tsx
│       │   └── Vratmitra.tsx
│       ├── store/authStore.ts       # Zustand — auth state ONLY
│       └── types/index.ts           # Shared TypeScript types
│
├── backend/
│   └── app/
│       ├── auth/                    # JWT handler + FastAPI dependencies
│       │   ├── jwt_handler.py
│       │   └── dependencies.py      # get_current_user etc.
│       ├── models/models.py         # SQLAlchemy ORM models
│       ├── schemas/schemas.py       # Pydantic request/response schemas
│       ├── routers/                 # One file per domain
│       │   ├── auth.py
│       │   ├── users.py
│       │   ├── journeys.py
│       │   ├── assessments.py
│       │   ├── exposures.py
│       │   ├── reflections.py
│       │   ├── shortlists.py
│       │   ├── ontology.py
│       │   └── vratmitra.py
│       ├── config.py                # pydantic-settings config
│       ├── database.py              # SQLAlchemy session, engine
│       ├── main.py                  # App init, router registration, CORS
│       └── seed/seed.py             # Seed data
│
├── openspec/                        # Spec-driven development artifacts
│   ├── specs/                       # Source of truth — current feature specs
│   └── changes/                     # In-progress change proposals
└── .claude/skills/                  # Stack skills — load on demand
```

## Tech stack (exact versions)

**Frontend**
- React 18.3 + TypeScript + Vite 5
- Tailwind CSS 3.4 + tailwind-merge + clsx
- TanStack React Query v5 — ALL server state
- Zustand v5 — auth state only (src/store/authStore.ts)
- Axios — all HTTP via src/api/client.ts
- React Router v6
- lucide-react icons
- react-hot-toast notifications
- date-fns date formatting

**Backend**
- FastAPI + Uvicorn
- SQLAlchemy (sync) + Alembic migrations
- PostgreSQL (psycopg2-binary)
- Pydantic v2 + pydantic-settings
- python-jose (JWT auth)
- passlib[bcrypt] (password hashing)

## Hard conventions — follow these exactly

### Frontend
- **All API calls go through `src/api/client.ts`** — never use fetch() or create
  a new axios instance anywhere else
- **Domain API files** (`src/api/journeys.ts` etc.) export typed async functions,
  not hooks — hooks live in pages/components using useQuery/useMutation
- **Server state = React Query** (useQuery, useMutation, useInfiniteQuery)
- **Auth state = Zustand** (authStore) — do not put auth in React Query
- **Styling = Tailwind utility classes only** — no custom CSS except index.css
  Use `cn()` (clsx + tailwind-merge) for conditional classes
- **Components = named exports** from PascalCase files
- **Icons = lucide-react only** — do not add other icon libraries
- **Toasts = react-hot-toast** — do not use alert() or custom toast systems
- **i18n** — user-facing strings should use the translations system in
  src/i18n/translations.ts via LanguageContext

### Backend
- **One router file per domain** in `backend/app/routers/`
- **All Pydantic schemas in `schemas/schemas.py`** — do not scatter schemas
- **All SQLAlchemy models in `models/models.py`** — do not scatter models
- **Auth via dependency injection**: `current_user: User = Depends(get_current_user)`
- **Config via pydantic-settings** in `config.py` — never read env vars directly
- **No business logic in routers** — routers are thin, logic goes in service
  functions (currently inline in routers — when refactoring, extract to services/)

## What NOT to read (ignore entirely)
- `node_modules/`, `frontend/dist/`, `.venv/`, `__pycache__/`, `*.pyc`
- `*.lock`, `frontend/tsconfig.tsbuildinfo`
- `.DS_Store`, `.env` files (read .env.example instead)
- `openspec/changes/archive/` (historical, not current state)
- `ctx-full.xml`, `files.py` (tooling artifacts, not app code)

## Testing status
**No tests exist yet.** When asked to write tests:
- Frontend: use Vitest + React Testing Library (not yet installed — ask before
  adding test infra)
- Backend: use pytest + httpx TestClient (not yet installed — ask before adding)
- Do NOT assume any test setup exists

## Spec-driven workflow
- **New feature / modify / remove feature** → always go through OpenSpec:
  `/opsx:propose` → fill spec → `/opsx:apply` → `/opsx:archive`
- **Bug fix under ~20 lines** → fix directly, no spec needed
- **Systemic bug** → minimal OpenSpec change for traceability
- Specs live in `openspec/specs/` (source of truth) and
  `openspec/changes/` (in-progress)

## Session discipline
- One task per session — reference the specific task from openspec/changes/
- Load only the relevant Repomix context, not the full repo
- Backend tasks: load only backend/ files
- Frontend tasks: load only frontend/src/ files
- Full-repo context only for architecture questions

## Skills (load on demand — do not pre-load)
- `"Load .claude/skills/react-tailwind.md"` — component patterns, Tailwind conventions
- `"Load .claude/skills/fastapi.md"` — endpoint patterns, Pydantic, auth
- `"Load .claude/skills/testing.md"` — test patterns (once testing is set up)
