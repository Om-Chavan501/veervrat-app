# Tasks: assessment-results-browse

## Frontend

- [x] Update `AssessmentResults.tsx`:
  - Fetch `assessment` detail (already fetched, has `responses[]` with rating + sentence)
  - Build a map of suggested sentence IDs (to exclude from rating sections)
  - Group remaining responses by rating: NEVER, RARELY, OFTEN, ALWAYS (in that order)
  - Render a collapsible `RatingSection` below the suggestions block for each non-empty group
    - Section header: rating label + count badge, chevron toggle
    - ALWAYS section gets a subtle "already a strength" note in the header
    - Collapsed by default (local state per section)
    - Each expanded section lists sentence cards identical in style/behaviour to suggestion cards
      (selectable, same checkbox + sentence text + secondary language line)
      but without priority_rank or reason (those are suggestion-only fields)
  - Selection (`selectedIds`) is shared — selecting from rating sections works the same as
    selecting from suggestions; sticky bar count and Start button are unchanged
