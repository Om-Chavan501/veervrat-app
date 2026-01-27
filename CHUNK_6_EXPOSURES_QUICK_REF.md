# Private Exposures - Quick Reference

## What are Exposures?

One-time intentional experiences logged during a journey. Simple, chronological records of practice attempts.

**Example**: "Practiced pausing before responding in a heated argument with my partner"

## Who Can Do What?

| Action | Owner | Vratmitra | Other |
|--------|-------|-----------|-------|
| Add | ✅ | ❌ | ❌ |
| View | ✅ | ✅ | ❌ |
| Edit | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ |

## Where is it on the Journey Page?

**Between** Vratmitra Section and Reflections Section

Order:
1. Sentence header
2. Journey content
3. **Vratmitra** (companion)
4. **→ Exposures** ← NEW
5. Reflections
6. Back button

## Server Actions

```typescript
// Add exposure
await addExposureAction(journeyId, {
  description: "What I experienced",
  contextNote: "Optional context"
});

// Get exposures (with permission checks)
const exposures = await getExposuresAction(journeyId);

// Edit exposure
await updateExposureAction(exposureId, {
  description: "Updated description",
  contextNote: "Updated context"
});

// Delete exposure
await deleteExposureAction(exposureId);
```

## UI Components

### ExposureForm
- Always visible on journey page
- Add new exposures
- Can also edit when in edit mode

### ExposureList
- Shows all exposures (newest first)
- Edit/Delete buttons (owner only)
- Timestamps and context

### ExposuresSection
- Wrapper component
- Manages list state
- Handles refresh after mutations

## Key Features

- 📝 Description + optional context
- 🔒 Private (owner + Vratmitra only)
- ⏰ Chronological (newest first)
- ✏️ Editable by owner
- 🗑️ Deletable by owner
- 🔐 Read-only for Vratmitra
- 📋 No frequency, no states, no enforcement

## Files

**Actions**: `app/actions/exposure.ts`
**Components**: 
- `app/(app)/journeys/[journeyId]/exposure-form.tsx`
- `app/(app)/journeys/[journeyId]/exposure-list.tsx`
- `app/(app)/journeys/[journeyId]/exposures-section.tsx`

**Documentation**: 
- `PRIVATE_EXPOSURES.md` (complete reference)
- `PRIVATE_EXPOSURES_IMPLEMENTATION.md` (implementation details)

## Permission Checks

All server actions verify:
1. User is authenticated
2. Journey exists
3. User is owner OR (Vratmitra AND read-only action)

## Data Format

```typescript
ExposureInstance {
  id: string           // UUID
  journeyId: string    // FK to SentenceJourney
  description: string  // Required, trimmed
  contextNote: string | null  // Optional, trimmed
  createdAt: DateTime  // Auto-set
}
```

## Integration Points

- ✅ Uses existing `ExposureInstance` model (no schema changes)
- ✅ Uses `SentenceJourney` relationship
- ✅ Integrates with Vratmitra system (permission checks)
- ✅ No impact on reflections, resolutions, or assessments

## Styling

- White background with gray border (like other journey sections)
- Tailwind utility classes
- Responsive design
- Consistent with existing page

## Error Handling

- Empty description → error
- Non-owner trying to edit/delete → 401 error
- Non-owner trying to add → 401 error
- User visible error messages
- Console logging for debugging

## Empty State

"No exposures logged yet. Add your first exposure above." (owner only)
