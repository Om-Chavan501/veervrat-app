# Veervrat Frontend — React + Vite

A modern, responsive single-page application for the Veervrat character development platform. Built with React 18, TypeScript, and Vite.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Running](#setup--running)
- [Environment & Configuration](#environment--configuration)
- [Architecture](#architecture)
  - [Routing](#routing)
  - [Auth Flow](#auth-flow)
  - [Data Fetching](#data-fetching)
  - [State Management](#state-management)
- [Pages](#pages)
- [Components](#components)
- [API Layer](#api-layer)
- [Styling](#styling)
- [TypeScript Types](#typescript-types)

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| React | 18.3 | UI library |
| Vite | 5.4 | Build tool & dev server |
| TypeScript | 5.5 | Type safety |
| TailwindCSS | 3.4 | Utility-first styling |
| React Router | 6.26 | Client-side routing |
| TanStack Query | 5.56 | Data fetching + caching |
| Axios | 1.7 | HTTP client |
| Zustand | 5.0 | Auth state management |
| react-hot-toast | 2.4 | Toast notifications |
| lucide-react | 0.447 | Icons |
| date-fns | 3.6 | Date formatting |
| clsx + tailwind-merge | latest | Conditional class utilities |

---

## Project Structure

```
frontend/
├── index.html                  # Entry HTML (loads Inter font)
├── vite.config.ts              # Vite config + API proxy to :8000
├── tailwind.config.js          # Color palette, animations
├── postcss.config.js           # Autoprefixer
├── tsconfig.json               # Strict TypeScript config
└── src/
    ├── main.tsx                # React root — QueryClient, Router, Toaster
    ├── App.tsx                 # Route definitions + auth guards
    ├── index.css               # Tailwind directives + scrollbar + base styles
    │
    ├── types/
    │   └── index.ts            # All TypeScript interfaces (mirrors backend schemas)
    │
    ├── store/
    │   └── authStore.ts        # Zustand store — user, tokens, isAuthenticated
    │
    ├── api/
    │   ├── client.ts           # Axios instance + request interceptor + 401 auto-refresh
    │   ├── auth.ts             # register, login, refresh, me
    │   ├── lacunae.ts          # list, get
    │   ├── assessments.ts      # start, get, saveResponse, deleteResponse, complete, getSuggestions
    │   ├── shortlists.ts       # list, create, get, addItem, removeItem
    │   ├── journeys.ts         # list, create, get, clarify, resolutions, pause, resume, complete
    │   ├── reflections.ts      # list, getToday, create, update, delete, addComment
    │   ├── exposures.ts        # list, create, update, delete
    │   └── vratmitra.ts        # pending, myMentored, invite, accept, detach, getCurrent
    │
    ├── components/
    │   ├── ui/
    │   │   ├── index.tsx       # cn() utility (clsx + tailwind-merge)
    │   │   ├── Button.tsx      # 5 variants: primary, secondary, ghost, danger, outline
    │   │   ├── Card.tsx        # Card, CardHeader, CardTitle, CardDescription
    │   │   ├── Badge.tsx       # 6 variants: default, success, warning, danger, info, muted
    │   │   ├── Input.tsx       # Input + Textarea with label, error, hint
    │   │   ├── Modal.tsx       # Portal modal with backdrop, ESC close, 4 sizes
    │   │   ├── EmptyState.tsx  # Icon + title + description + action slot
    │   │   └── LoadingSpinner.tsx  # Spinner + PageLoader
    │   └── layout/
    │       ├── AppLayout.tsx   # Sidebar + main content + mobile nav wrapper
    │       ├── Sidebar.tsx     # Desktop left nav, user info, logout
    │       └── MobileNav.tsx   # Fixed bottom tab bar (mobile)
    │
    └── pages/
        ├── auth/
        │   ├── Login.tsx       # Email/password login form
        │   └── Register.tsx    # Registration form with confirm password
        ├── Dashboard.tsx       # Stats, active journeys, pending invitations, quick actions
        ├── Lacunae.tsx         # Browse lacunae, shortlist sessions, start assessment
        ├── Assessment.tsx      # Sentence rating UI with progress bar
        ├── AssessmentResults.tsx  # Suggestions with start-journey actions
        ├── Journeys.tsx        # List all journeys with state filter tabs
        ├── JourneyDetail.tsx   # Tabbed detail: Overview, Reflections, Exposures, Resolutions, Vratmitra
        ├── Clarify.tsx         # Clarification form (required before resolutions)
        ├── Archive.tsx         # Paused and completed journeys
        ├── Vratmitra.tsx       # Pending invitations + mentored journeys
        └── Ontology.tsx        # Hierarchical virtue/sub-virtue/sentence viewer
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- Backend running on port 8000

### Install & Start

```bash
cd frontend
npm install
npm run dev
```

The dev server starts on `http://localhost:5173` (or next available port).

### Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

---

## Environment & Configuration

Vite proxies all `/api` requests to the backend:

```ts
// vite.config.ts
proxy: {
  '/api': { target: 'http://localhost:8000', changeOrigin: true }
}
```

No `.env` file needed for local development — the proxy handles the API URL. For production, update `vite.config.ts` or set `VITE_API_URL`.

---

## Architecture

### Routing

Defined in `src/App.tsx` using React Router v6.

```
/                     → redirect to /dashboard
/login                → Login page (public)
/register             → Register page (public)
/dashboard            → Dashboard (protected)
/lacunae              → Lacunae browser (protected)
/assessments/:id      → Assessment test (protected)
/assessment-results/:id  → Suggestions after assessment (protected)
/journeys             → Journey list (protected)
/journeys/:id         → Journey detail (protected)
/journeys/:id/clarify/:assessmentId  → Clarification form (protected)
/archive              → Archived journeys (protected)
/vratmitra            → Mentor management (protected)
/ontology             → Ontology browser (protected)
```

**Route guards:**
- `ProtectedRoute` — redirects to `/login` if not authenticated
- `PublicRoute` — redirects to `/dashboard` if already authenticated

### Auth Flow

```
User submits login form
  → POST /api/v1/auth/login
  → Response: { access_token, refresh_token, user }
  → Zustand authStore.setAuth(user, accessToken, refreshToken)
  → Persisted to localStorage via zustand/middleware persist
  → Redirect to /dashboard

On any 401 response:
  → Axios interceptor intercepts
  → POST /api/v1/auth/refresh with stored refresh_token
  → On success: update tokens in store, retry original request
  → On failure: logout(), redirect to /login
```

### Data Fetching

All API calls use **TanStack Query v5**.

```ts
// Example: fetch journey detail
const { data: journey, isLoading } = useQuery({
  queryKey: ['journey', journeyId],
  queryFn: () => journeysApi.get(journeyId!),
  enabled: !!journeyId,
})

// Example: mutate
const mutation = useMutation({
  mutationFn: () => journeysApi.pause(journeyId!),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['journey', journeyId] })
    toast.success('Journey paused')
  },
  onError: (e) => toast.error(getErrorMessage(e)),
})
```

**Default query config** (set in `main.tsx`):
- `staleTime`: 5 minutes
- `retry`: 1
- `refetchOnWindowFocus`: false

### State Management

Only authentication state lives in Zustand. Everything else is server state managed by React Query.

```ts
// src/store/authStore.ts
interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth(user, accessToken, refreshToken): void
  logout(): void
}
```

State is **persisted** to `localStorage` under the key `veervrat-auth`, so users remain logged in across page refreshes.

---

## Pages

### `Dashboard`
- Greets user by name with time-based greeting
- Shows pending Vratmitra invitations as amber alert cards
- Stats grid: active journeys, total reflections, completed journeys, pending invitations
- Active journey list (max 5, with link to full list)
- Quick action cards linking to Lacunae, Journeys, Ontology

### `Lacunae`
- Browse all lacunae grouped by category (A = Primary, B = Secondary, C = Supporting)
- Search bar and category filter
- Start a shortlist session or resume a previous one
- Toggle lacunae in/out of shortlist
- "Assess" button directly starts an assessment

### `Assessment`
- Loads all sentences for the lacuna organized by sub-virtue
- Progress bar showing % of sentences rated
- Each sentence has 4 rating buttons (ALWAYS/OFTEN/RARELY/NEVER)
- Clicking same rating again deselects it
- "Complete" button disabled until at least one sentence is rated
- Info card explaining the rating guide

### `AssessmentResults`
- Shows suggested sentences (RARELY/NEVER rated, sorted by sub-virtue priority)
- Priority rank badge on each suggestion
- "Start journey" button on each suggestion → creates journey → redirects to Clarify

### `Journeys`
- Filter tabs: All, Active, Paused, Completed
- Journey cards with state badge, sub-virtue, sentence text, timestamp

### `JourneyDetail`
Five tabs:

| Tab | Content |
|---|---|
| **Overview** | Clarification notes grid. Link to add clarification if none exists. |
| **Reflections** | Daily reflection list. "Today's reflection" button. Edit/view comments. |
| **Exposures** | Exposure list with add/edit/delete. |
| **Resolutions** | Resolution list with add/edit/delete. Blocked until clarification exists. |
| **Vratmitra** | Current active mentor card, invite/detach buttons. |

State action buttons in the header:
- `ACTIVE` → Pause, Complete
- `INACTIVE` → Resume

### `Clarify`
- Full-screen clarification form (required before resolutions can be added)
- 4 text areas: lacuna reduction, personal context, unified insight, virtue relation (optional)
- 3 irrational belief selector cards (Ellis's REBT)
- Submit disabled until all required fields filled

### `Archive`
- Paused journeys with "Resume" button
- Completed journeys (read-only, link to detail)

### `Vratmitra`
- Pending invitations with Accept / Decline buttons
- Mentored journeys with Detach button

### `Ontology`
- Accordion list of virtues
- On expand: loads sub-virtues (lazy)
- On sub-virtue expand: loads sentences (lazy)
- Read-only with info banner

---

## Components

### UI Primitives (`src/components/ui/`)

#### `Button`
```tsx
<Button variant="primary" size="md" loading={false}>Click me</Button>
```
Variants: `primary` (sage green), `secondary` (warm beige), `ghost`, `danger` (red), `outline`
Sizes: `sm`, `md`, `lg`

#### `Card`
```tsx
<Card padding="md">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  Content
</Card>
```

#### `Badge`
```tsx
<Badge variant="success">Active</Badge>
```
Variants: `default`, `success`, `warning`, `danger`, `info`, `muted`

#### `Input` / `Textarea`
```tsx
<Input label="Email" type="email" error="Required" hint="We'll never share it" />
<Textarea label="Notes" rows={4} />
```

#### `Modal`
```tsx
<Modal open={open} onClose={() => setOpen(false)} title="Edit" size="md">
  <form>...</form>
</Modal>
```
Closes on ESC or backdrop click. Sizes: `sm`, `md`, `lg`, `xl`.

#### `EmptyState`
```tsx
<EmptyState
  icon={BookOpen}
  title="Nothing here"
  description="Some helpful text"
  action={<Button>Do something</Button>}
/>
```

#### `LoadingSpinner` / `PageLoader`
```tsx
<LoadingSpinner size="md" />
<PageLoader />  // centered spinner for full page loading
```

### Layout (`src/components/layout/`)

#### `AppLayout`
Wraps all protected pages. Renders `<Sidebar>` on desktop, `<MobileNav>` on mobile, and `<Outlet>` for page content.

#### `Sidebar`
Desktop-only left navigation. Shows logo, nav links with active state, user avatar/name/email, and sign-out button.

#### `MobileNav`
Fixed bottom tab bar on mobile. 5 items: Home, Lacunae, Journeys, Mentor, Archive.

---

## API Layer

Each domain has its own file in `src/api/`. All functions return the unwrapped data (not the Axios response).

```ts
// Example: src/api/journeys.ts
export const journeysApi = {
  list: (state?: JourneyState) =>
    api.get<Journey[]>('/journeys', { params: state ? { state } : {} }).then((r) => r.data),

  create: (sentence_id: string, assessment_id: string) =>
    api.post<JourneyDetail>('/journeys', { sentence_id, assessment_id }).then((r) => r.data),
  // ...
}
```

#### `getErrorMessage(error)` — `src/api/client.ts`
Extracts a human-readable error string from Axios errors:
```ts
import { getErrorMessage } from '../api/client'
toast.error(getErrorMessage(e))
```

---

## Styling

The design uses a calm, earthy palette aligned with Veervrat's philosophy of slow, intentional practice.

### Color Palette

| Name | Hex | Usage |
|---|---|---|
| `sage-500` | `#6b8e4e` | Primary buttons, active states, accents |
| `terra-500` | `#c47b5c` | Secondary accents, assess buttons |
| `warm-100` | `#f7ede4` | Page background |
| `warm-200` | `#eeddc8` | Card borders, dividers |
| `stone-800` | `#292524` | Primary text |
| `stone-500` | `#78716c` | Secondary text |
| `stone-400` | `#a8a29e` | Muted/placeholder text |

All colors are defined in `tailwind.config.js` as extended palettes: `sage`, `terra`, `warm`, `stone`.

### Animations

| Class | Effect |
|---|---|
| `animate-fade-in` | Opacity 0→1, 300ms |
| `animate-slide-up` | Slide up 10px + fade, 300ms |

Applied to page roots for smooth transitions:
```tsx
<div className="space-y-6 animate-fade-in">
```

### Typography
- Font: **Inter** (loaded from Google Fonts)
- Base size: 14px (`text-sm`) for most UI text
- Headings: `text-2xl font-bold` for page titles

---

## TypeScript Types

All types are in `src/types/index.ts` and mirror the backend Pydantic schemas.

Key interfaces:

```ts
interface User { id, name, email, created_at }
interface Journey { id, user_id, sentence_id, state, created_at, sentence? }
interface JourneyDetail extends Journey { links, resolutions }
interface Reflection { id, journey_id, date, applied, context_note, insight_note, difficulty, comments }
interface Assessment { id, user_id, lacuna_id, status, started_at, lacuna? }
interface AssessmentDetail extends Assessment { lacuna?, responses, suggestions }
```

Enums are typed as string unions:
```ts
type JourneyState = 'ACTIVE' | 'INACTIVE' | 'COMPLETED'
type Rating = 'ALWAYS' | 'OFTEN' | 'RARELY' | 'NEVER'
type IrrationalBelief = 'MUST_BE_LOVED' | 'MUST_BE_COMPETENT' | 'MUST_HAVE_COMFORT'
```
