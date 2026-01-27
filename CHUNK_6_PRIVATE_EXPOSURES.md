# Private Exposures System

## Overview

The Private Exposures system allows users to log intentional experiences during their virtue-building journeys. An Exposure represents a one-time, deliberate attempt to practice or experience the virtue described in the sentence journey.

## Key Concepts

### Exposure
A **one-time intentional experience** logged by the journey owner during an active journey. It captures:
- **Description**: What the exposure was (required)
- **Context Note**: Optional additional context or reflections

### Privacy & Visibility
- **Private by default**: Only visible to journey owner and active Vratmitra
- **Vratarthi (Journey Owner)**: Full access (view, create, edit, delete)
- **Vratmitra (Companion)**: Read-only access
- **Others**: No access

### Characteristics
- ✅ No frequency tracking
- ✅ No completion/success state
- ✅ No enforcement or validation
- ✅ Simple chronological logging

## Database Schema

### ExposureInstance Model
Already exists in the schema:

```prisma
model ExposureInstance {
  id          String   @id @default(uuid())
  journeyId   String
  description String
  contextNote String?
  createdAt   DateTime @default(now())

  journey SentenceJourney @relation(fields: [journeyId], references: [id])
}
```

**Fields**:
- `id`: Unique identifier
- `journeyId`: Reference to the journey
- `description`: Required description of the exposure
- `contextNote`: Optional context or additional notes
- `createdAt`: Timestamp of creation (used for ordering)

**Notes**:
- No `updatedAt` field (simple model)
- Ordered by `createdAt` descending (newest first)

## Server Actions

All server actions are in [`app/actions/exposure.ts`](app/actions/exposure.ts)

### `addExposureAction(journeyId, data)`
Add a new exposure to a journey.

**Parameters**:
- `journeyId: string` - The journey to add exposure to
- `data: { description: string; contextNote?: string }` - Exposure data

**Requirements**:
- Session required (authenticated user)
- User must own the journey
- Description required and cannot be empty

**Returns**: Created `ExposureInstance`

**Throws**: Error if unauthorized or validation fails

---

### `updateExposureAction(exposureId, data)`
Update an existing exposure.

**Parameters**:
- `exposureId: string` - The exposure to update
- `data: { description: string; contextNote?: string }` - Updated data

**Requirements**:
- Session required
- User must own the exposure's journey
- Description required and cannot be empty

**Returns**: Updated `ExposureInstance`

**Throws**: Error if unauthorized or not found

---

### `deleteExposureAction(exposureId)`
Delete an exposure.

**Parameters**:
- `exposureId: string` - The exposure to delete

**Requirements**:
- Session required
- User must own the exposure's journey

**Returns**: `{ success: true }`

**Throws**: Error if unauthorized or not found

---

### `getExposuresAction(journeyId)`
Get all exposures for a journey.

**Parameters**:
- `journeyId: string` - The journey to fetch exposures for

**Requirements**:
- Session required
- Journey must exist
- User must be journey owner OR active Vratmitra

**Returns**: Array of `ExposureInstance` ordered by `createdAt` DESC (newest first)

**Throws**: Error if unauthorized

## UI Components

### ExposureForm
**File**: [`app/(app)/journeys/[journeyId]/exposure-form.tsx`](app/(app)/journeys/%5BjourneyId%5D/exposure-form.tsx)

Form for adding or editing exposures.

**Props**:
- `journeyId: string` - Journey to add exposure to
- `exposure?: ExposureInstance` - If provided, form is in edit mode
- `onSuccess?: () => void` - Callback after successful save
- `onCancel?: () => void` - Callback to cancel editing
- `onError?: (error: string) => void` - Error callback

**Features**:
- Auto-switches between add/edit modes
- Textarea for description (3 rows)
- Optional context textarea (2 rows)
- Loading state during submission
- Success/error messaging
- Auto-clears on success

**Accessibility**:
- Clear labels for fields
- Helper text explaining what to enter
- Proper form validation

---

### ExposureList
**File**: [`app/(app)/journeys/[journeyId]/exposure-list.tsx`](app/(app)/journeys/%5BjourneyId%5D/exposure-list.tsx)

Displays list of exposures with edit/delete controls (owner only).

**Props**:
- `exposures: ExposureInstance[]` - Exposures to display
- `journeyId: string` - Journey ID
- `isOwner: boolean` - Whether current user owns the journey
- `onRefresh?: () => void` - Callback to refresh list

**Features**:
- Chronologically ordered (newest first)
- Shows description and context note
- Displays timestamp
- Edit/Delete buttons (owner only)
- Empty state message
- Inline editing with form replacement
- Confirmation before delete

---

### ExposuresSection
**File**: [`app/(app)/journeys/[journeyId]/exposures-section.tsx`](app/(app)/journeys/%5BjourneyId%5D/exposures-section.tsx)

Client component wrapper that manages exposure list state and refresh.

**Props**:
- `initialExposures: ExposureInstance[]` - Server-fetched exposures
- `journeyId: string` - Journey ID
- `isOwner: boolean` - Whether current user owns journey

**Features**:
- Manages local state for exposures
- Handles refresh after add/edit/delete
- Passes refresh callback to ExposureList

## Integration Points

### Journey Page
**File**: [`app/(app)/journeys/[journeyId]/page.tsx`](app/(app)/journeys/%5BjourneyId%5D/page.tsx)

The journey detail page includes:
1. **Exposures section** between Vratmitra and Reflections sections
2. **Components used**:
   - `ExposureForm` - Always visible for adding
   - `ExposuresSection` - Displays list with refresh capability
3. **Data fetching**: `await getExposuresAction(journey.id)`

**Order on page**:
1. Sentence details header
2. JourneyContent
3. Vratmitra section
4. **Exposures section** ← NEW
5. Reflections section
6. Back button

## Permissions & Access

### Journey Owner (Vratarthi)
- ✅ Can add exposures
- ✅ Can view all their exposures
- ✅ Can edit their exposures
- ✅ Can delete their exposures

### Active Vratmitra
- ✅ Can view exposures (read-only)
- ❌ Cannot add exposures
- ❌ Cannot edit exposures
- ❌ Cannot delete exposures

### Non-attached Users
- ❌ Cannot view exposures
- ❌ Cannot perform any action

### Admins
- No special access (not involved in permission checks)

## Usage Examples

### Adding an Exposure
1. Navigate to journey page
2. Scroll to "Exposures" section
3. Fill in description (e.g., "Practiced listening without interrupting during conversation with colleague")
4. Optionally add context (e.g., "Found it easier today than last week")
5. Click "Add Exposure"
6. Exposure appears in list below form

### Editing an Exposure
1. Scroll to exposure in the list
2. Click "Edit" button
3. Form appears with current values
4. Make changes
5. Click "Update Exposure"
6. Closes edit mode and shows updated entry

### Deleting an Exposure
1. Scroll to exposure in the list
2. Click "Delete" button
3. Confirm in dialog
4. Exposure removed from list

### Vratmitra Viewing Exposures
1. Accept Vratmitra invitation
2. View journey from "Accepted journeys" or similar (future feature)
3. See Exposures section with read-only list
4. No edit/delete buttons visible

## UI/UX Design

### Section Layout
- White background, gray border, consistent with other journey sections
- Heading with description
- Form and list in same section
- Clean, minimal design

### Empty State
- Message: "No exposures logged yet."
- For owners: "Add your first exposure above."
- For non-owners: No button visible

### Timestamps
- Format: "MM/DD/YYYY at HH:MM:SS AM/PM"
- Helps track when exposure occurred

### Editing
- Inline editing (form replaces display)
- Cancel button to exit edit mode
- No separate modal or page

## Data Validation

### Description
- ✅ Required (cannot be empty or whitespace-only)
- ✅ Trimmed on save
- ✅ No length limit enforced

### Context Note
- ✅ Optional
- ✅ Trimmed on save
- ✅ Stored as NULL if empty

## Error Handling

### User-Facing Errors
- Ownership verification failures
- Not found errors
- Validation failures (e.g., empty description)

### Error Messages
- Clear, specific messages
- Shown in error boxes within components
- Logged to console for debugging

## Testing Checklist

- [ ] Add exposure as journey owner (success)
- [ ] Add exposure with empty description (error)
- [ ] Add exposure with context note
- [ ] Add exposure without context note
- [ ] Edit exposure (success)
- [ ] Delete exposure (success)
- [ ] Confirm delete dialog
- [ ] View exposures as journey owner
- [ ] View exposures as active Vratmitra (read-only)
- [ ] Try to edit/delete as Vratmitra (error/no buttons)
- [ ] Try to add exposure as non-owner (error)
- [ ] List shows newest exposures first
- [ ] Timestamps display correctly
- [ ] Empty state message shows when no exposures
- [ ] UI matches existing journey page styling

## No Features
Explicitly NOT implemented (per requirements):
- ❌ Frequency tracking
- ❌ Success/failure states
- ❌ Enforcement or validation
- ❌ Admin dashboards
- ❌ Notifications
- ❌ Metrics/analytics
- ❌ Sharing exposures
- ❌ Community exposures (separate system)

## Future Enhancements (Out of Scope)
- Multiple exposure types
- Tags/categories
- Image attachments
- Ratings/scores
- Search/filter capabilities
- Export/reporting
