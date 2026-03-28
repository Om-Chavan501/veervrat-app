# Tasks: mobile-nav-more-sheet

## Frontend

- [x] Rewrite `MobileNav.tsx`:
  - Reduce core nav to 5 items: Home, Lacunae, Journeys, Vratmitra, More
  - Remove theme and language toggles from the nav bar
  - "More" tab toggles a bottom sheet (local `open` state)
  - Bottom sheet: slides up with backdrop, contains:
    - Secondary nav links: Assessments, Archive, Ontology
    - Settings row: theme toggle + language toggle
    - User info (name + email) + Sign out button
  - Sheet closes on: backdrop tap, nav link tap, sign out tap, More tab re-tap
  - Sign out: call `logout()` from authStore, navigate to `/login`
