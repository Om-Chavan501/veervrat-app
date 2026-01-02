# Vratmitra Attachment System

## Overview

The Vratmitra (Companion) attachment system enables users to invite trusted companions to support their virtue-building journeys. A Vratmitra provides read-only support by viewing journey progress without modifying the journey's content, reflections, or resolutions.

## Key Concepts

### Users & Roles
- **Vratarthi**: A user actively working on a sentence journey (default role for all users)
- **Vratmitra**: A companion invited to support a specific journey (optional, revocable)
- A user can be a Vratarthi on multiple journeys and/or a Vratmitra on other journeys

### Attachment Rules
- Only the journey owner can invite a Vratmitra
- A journey can have **at most one active Vratmitra** at a time
- Invitation is explicit: invited user must accept
- Attachment is revocable: either party can detach at any time
- Detachment does NOT delete records (full audit trail preserved)

### Invitation Status
- **PENDING**: Invitation sent, awaiting acceptance
- **ACTIVE**: Invitation accepted, Vratmitra is active
- **DETACHED**: Attachment ended (either accepted then detached, or pending invitation declined)

## Database Schema

### VratmitraStatus Enum
```prisma
enum VratmitraStatus {
  PENDING
  ACTIVE
  DETACHED
}
```

### JourneyVratmitra Model
```prisma
model JourneyVratmitra {
  id         String         @id @default(uuid())
  journeyId  String
  userId     String
  status     VratmitraStatus @default(PENDING)
  createdAt  DateTime       @default(now())
  acceptedAt DateTime?
  detachedAt DateTime?

  journey SentenceJourney @relation(fields: [journeyId], references: [id])
  user    User            @relation(fields: [userId], references: [id])

  @@unique([journeyId, userId])
}
```

**Fields**:
- `status`: Current status of the attachment
- `acceptedAt`: Timestamp when invitation was accepted
- `detachedAt`: Timestamp when attachment was terminated

## Server Actions

All server actions are in [`app/actions/vratmitra.ts`](app/actions/vratmitra.ts)

### `inviteVratmiraAction(journeyId, inviteeEmail)`
Invite a user as Vratmitra for a journey.

**Requirements**:
- Session required (authenticated user)
- User must own the journey
- Invitee must exist by email
- Cannot invite self
- No existing active/pending invitation to same user
- Journey must not have an active Vratmitra

**Returns**: Created `JourneyVratmitra` record (status: PENDING)

**Throws**: Error if any requirement violated

---

### `acceptVratmiraInvitationAction(journeyId)`
Accept a pending Vratmitra invitation.

**Requirements**:
- Session required
- Pending invitation must exist for current user
- Invitation status must be PENDING

**Returns**: Updated `JourneyVratmitra` record (status: ACTIVE, acceptedAt set)

**Throws**: Error if requirements not met

---

### `detachVratmiraAction(journeyId, vratmiraId?)`
Detach Vratmitra from journey.

**Requirements**:
- Session required
- Must be either journey owner OR the Vratmitra being detached
- Attachment must exist

**Returns**: Updated `JourneyVratmitra` record (status: DETACHED, detachedAt set)

**Throws**: Error if unauthorized

---

### `getActiveVratmiraAction(journeyId)`
Get the currently active Vratmitra for a journey.

**Requirements**:
- Session required
- Journey must exist

**Returns**: Active `JourneyVratmitra` record with user details, or null

---

### `getPendingInvitationsAction()`
Get all pending Vratmitra invitations for the current user.

**Returns**: Array of pending `JourneyVratmitra` records with journey details

## UI Components

### InviteVratmiraForm
**File**: [`app/(app)/journeys/[journeyId]/invite-vratmitra-form.tsx`](app/(app)/journeys/[journeyId]/invite-vratmitra-form.tsx)

A form for journey owners to invite Vratmitras by email.

**Props**:
- `journeyId: string` - The journey to invite for
- `onSuccess?: () => void` - Callback after successful invitation
- `onError?: (error: string) => void` - Callback on error

**Features**:
- Email input with validation
- Loading state during submission
- Success/error message display
- Auto-clears on success

---

### VratmitraStatusDisplay
**File**: [`app/(app)/journeys/[journeyId]/vratmitra-status-display.tsx`](app/(app)/journeys/[journeyId]/vratmitra-status-display.tsx)

Displays active Vratmitra information with detach capability.

**Props**:
- `vratmitra: (JourneyVratmitra & { user: User }) | null` - Active Vratmitra or null
- `journeyId: string` - Journey ID
- `isJourneyOwner: boolean` - Whether current user owns journey
- `onDetach?: () => void` - Callback after detachment
- `onError?: (error: string) => void` - Callback on error

**Features**:
- Shows Vratmitra name and email
- Detach button (visible to journey owner only)
- Confirmation dialog before detaching
- Loading state during detachment

---

### PendingVratmiraInvitations
**File**: [`app/(app)/dashboard/pending-vratmitra-invitations.tsx`](app/(app)/dashboard/pending-vratmitra-invitations.tsx)

Displays all pending Vratmitra invitations on the dashboard.

**Features**:
- Shows journey details (sentence, virtue, sub-virtue)
- Shows inviter name
- Accept/Decline buttons
- Loading states
- Success/error messaging

## Integration Points

### Journey Page
**File**: [`app/(app)/journeys/[journeyId]/page.tsx`](app/(app)/journeys/[journeyId]/page.tsx)

The journey detail page includes:
1. **Vratmitra section** with:
   - Active Vratmitra display (if attached)
   - Invite form (if no active Vratmitra)
2. **Loading active Vratmitra**: `await getActiveVratmiraAction(journey.id)`

---

### Dashboard Page
**File**: [`app/(app)/dashboard/page.tsx`](app/(app)/dashboard/page.tsx)

The dashboard displays:
1. **Vratmitra Invitations section** at the top
2. Uses `PendingVratmiraInvitations` component
3. Shows pending invitations before journeys/assessments

## Permissions & Access

### Journey Owner
- Can view own journey fully
- Can invite Vratmitra
- Can detach Vratmitra
- Can see Vratmitra details

### Active Vratmitra
- **Read-only access** to:
  - Sentence text (both languages)
  - Virtue/Sub-virtue details
  - Assessment clarifications
  - Reflection history
- **No access** to:
  - Write reflections
  - Modify resolutions
  - Create/update challenges
  - Change journey state

### Non-attached Users
- Cannot view journey details
- Cannot accept invitations they don't have

## Usage Examples

### Inviting a Vratmitra
1. Navigate to journey page
2. Scroll to "Vratmitra" section
3. Fill in invitee's email
4. Click "Send Invitation"
5. Success message confirms

### Accepting Invitation
1. View dashboard
2. See "Vratmitra Invitations" section
3. Click "Accept" on desired invitation
4. Redirects or shows confirmation

### Detaching Vratmitra
**Journey Owner**:
1. Open journey
2. Click "Detach" next to Vratmitra name
3. Confirm in dialog

**Vratmitra**:
1. Open journey (if currently attached)
2. Click "Detach" button
3. Confirm in dialog

## Data Preservation

All detachments preserve the attachment record:
- Original invitation timestamp (`createdAt`) remains
- Acceptance timestamp (`acceptedAt`) is preserved if accepted
- Detachment timestamp (`detachedAt`) is set
- Status changes to DETACHED

This allows for:
- Complete audit trail of all attachments
- Historical analysis of companionship patterns
- Re-invitation after previous detachment

## Future Enhancements (Not Implemented)

Explicitly out of scope per requirements:
- ❌ Notifications system
- ❌ Metrics/dashboards for Vratmitra activity
- ❌ Multiple concurrent Vratmitras
- ❌ Scheduled/expiring invitations
- ❌ Vratmitra-specific permissions management

## Testing Checklist

- [ ] Invite user as Vratmitra (success case)
- [ ] Invite with invalid email (error)
- [ ] Invite when journey has active Vratmitra (error)
- [ ] Invite self (error)
- [ ] Accept pending invitation
- [ ] Decline pending invitation
- [ ] Detach as journey owner
- [ ] Detach as Vratmitra
- [ ] Verify read-only access for Vratmitra
- [ ] Verify journey owner sees Vratmitra info
- [ ] Verify invited user sees pending invitations on dashboard
