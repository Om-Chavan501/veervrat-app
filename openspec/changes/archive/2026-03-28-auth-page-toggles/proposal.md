# Change Proposal: Theme & Language Toggles on Auth Pages

## Problem
Login and Register pages render outside AppLayout — they have no Sidebar or MobileNav.
Users arriving at these pages (first visit, logged-out state) have no way to switch
theme or language before signing in.

## Goal
Add theme (dark/light) and language (mr/en) toggles to both Login and Register pages.

## Decision
Place a small toggle row in the top-right corner of each auth page (absolutely positioned).
Icon buttons only — no labels — to keep the auth UI clean and uncluttered.
Reuse the same ThemeContext and LanguageContext already available app-wide.

## Files affected
- `frontend/src/pages/auth/Login.tsx` — add toggle row
- `frontend/src/pages/auth/Register.tsx` — add toggle row
