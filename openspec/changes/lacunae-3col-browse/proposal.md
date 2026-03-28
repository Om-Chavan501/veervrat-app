# Change Proposal: Lacunae 3-Column Browse + Shortlisting Redesign

## Problem
The current `/lacunae` page stacks lacunae in three sequential sections (A, B, C), forcing
users to scroll through a long vertical page to see all options. This makes side-by-side
comparison across categories impossible. The page also has unnecessary friction:
- A "Start Shortlist" button that must be tapped before any lacuna can be added
- A direct "Assess" button that bypasses the shortlisting intent entirely
- Category filter tabs (All/A/B/C) that are redundant if all categories are always visible

Primary usage is mobile. The redesign must work well at ~375px width.

## Goal
A single browse screen where all three categories are visible simultaneously — without
scrolling past each other — so users can scan across categories and make shortlisting
decisions in one view.

## Decisions

### Layout: permanent 3-column, each independently scrollable
No filter tabs. All three categories always visible side by side. Each column has its
own scroll — the user never needs to scroll the whole page to see another category.

On desktop: equal-width columns in the full viewport.
On mobile: all three columns fit in the viewport at once using compact cards.
Each column has a fixed height that fills the available screen (below the header/search
and above the sticky bottom bar), with `overflow-y: auto` per column.

### Card design: compact, no Assess button
Each card shows:
- Lacuna name (primary language, bold, truncated to 2 lines max)
- Lacuna name (secondary language, muted, single line)
- Add / Remove toggle button (icon + label or icon-only on mobile)

No "Assess" button. Assessment is triggered from the Shortlist Review screen only.

### Shortlist session: auto-created on first Add
Remove the explicit "Start Shortlist" button. When the user taps "Add" on any lacuna:
- If no active session exists → silently create one via POST /shortlists, then add the lacuna
- If a session is already active → add directly

Recent sessions panel (resume previous shortlist) is also removed from this screen.
Users can access past shortlists from a different route if needed.

### Sticky bottom bar
A fixed bar at the bottom of the screen, always visible while browsing:
- Left: count of selected lacunae ("3 selected")
- Right: "Review Shortlist →" button (disabled when count = 0)

## Out of scope
- Reordering within the shortlist (handled in ShortlistReview)
- Backend API changes (existing POST /shortlists + PATCH /shortlists/:id/items is sufficient)
- Changes to ShortlistReview page

## Files affected
- `frontend/src/pages/Lacunae.tsx` — full rewrite of layout and interaction
- `frontend/src/i18n/translations.ts` — remove unused keys, add new ones
