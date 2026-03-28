# Tasks: lacunae-3col-browse

## Frontend

- [x] Rewrite `Lacunae.tsx`:
  - Remove category filter tabs (All/A/B/C)
  - Replace stacked sections with 3-column layout (flex row, each col `overflow-y: auto`, fixed height filling viewport)
  - Compact card component (name primary, name secondary, add/remove toggle)
  - Remove "Start Shortlist" button — auto-create session on first Add tap
  - Remove "Assess" button from cards
  - Remove recent sessions panel
  - Add sticky bottom bar: selected count + "Review Shortlist →" button

- [x] Update `frontend/src/i18n/translations.ts`:
  - Remove: `lacunae.startShortlist`, `lacunae.recentShortlists`, `lacunae.sessionStarted`, `lacunae.sessionResumed`, `lacunae.startSessionFirst`, `lacunae.all`, `lacunae.cat`
  - Add: `lacunae.colA`, `lacunae.colB`, `lacunae.colC` (column header labels)
