## Why

The current UI is visually bland — dark mode loses the app's warm earthy identity by substituting everything with neutral grays, virtue sentences (the hero content) are rendered in plain sans-serif with no editorial weight, and animations are barely used despite keyframes being defined. The app deserves a visual layer that matches its purpose: deep, personal, meditative growth work.

## What Changes

- **Dark mode** replaced with a "Night Forest" palette — deep olive-dark backgrounds that retain the app's warm identity instead of going gray
- **Virtue sentence typography** elevated to a serif font (Lora) with quote-like rendering, making aphorisms feel like scripture rather than list items
- **Animation system** made expressive — 300–400ms transitions, list stagger on entry, button press feedback, status-change icon pops, card hover lift
- **Badge dark variants** added — semantic colors (success/warning/info) currently render light-mode-only colors in dark mode
- **Button** gains `active:scale` press feedback
- **Dashboard stat numbers** count up on mount for a "loaded" moment

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- none

## Impact

- `frontend/tailwind.config.js` — new color tokens (Night Forest), new keyframes, new animation utilities
- `frontend/index.html` — Lora Google Font import
- `frontend/src/index.css` — dark mode CSS variables, glass utility update
- `frontend/src/components/ui/` — Card, Button, Badge dark mode + animation updates
- `frontend/src/components/layout/` — Sidebar, MobileNav Night Forest colors
- `frontend/src/pages/` — serif applied to sentence displays across Dashboard, JourneyDetail, Clarify, AssessmentResults, Journeys; stagger on lists; countUp on Dashboard stats
- No backend changes, no API changes, no routing changes
