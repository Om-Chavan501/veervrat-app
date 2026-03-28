# Change Proposal: Mobile Nav — More Bottom Sheet

## Problem
The mobile bottom nav has 7 items (5 nav + 2 utility toggles) crammed into a 375px bar,
leaving ~53px per item. Theme and language toggles are not navigation — they don't belong
in a nav bar. Sign out is completely absent from mobile. Assessments and Ontology are
unreachable on mobile.

## Goal
A clean 5-item bottom nav with a "More" tab that opens a bottom sheet housing secondary
nav items, settings (theme/language), and sign out.

## Decisions

### Core nav: 5 items
Home, Lacunae, Journeys, Vratmitra, More
~75px per item on a 375px screen — comfortable.

### Items moved to More sheet
- Assessments (reachable from flows, not primary nav)
- Archive (rarely visited)
- Ontology (reference, rarely visited)
- Theme toggle (dark/light)
- Language toggle (mr/en)
- User info + Sign out

### More sheet: bottom sheet
Slides up from the bottom. Tapping the backdrop or any nav link closes it.
Divided into sections with visual separators:
1. Secondary nav links (Assessments, Archive, Ontology)
2. Settings row (theme toggle + language toggle side by side)
3. User info + Sign out button

### Sheet open/close behaviour
- Opens: tap the More tab
- Closes: tap backdrop, tap any nav link inside, tap sign out, tap More tab again
- Backdrop: semi-transparent dark overlay behind the sheet

## Files affected
- `frontend/src/components/layout/MobileNav.tsx` — full rewrite
- No backend changes, no new routes, no translation key changes needed
