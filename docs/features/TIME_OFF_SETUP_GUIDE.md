# Time Off Feature - Setup & Implementation Guide

## Overview

A comprehensive time off management system has been implemented with the following features:

### User Features
- Request time off (vacation, sick leave, personal, unpaid, other)
- View all time off requests (own and team members)
- Cancel pending or approved requests
- Delete pending requests
- Half-day support (morning/afternoon)
- Automatic business day calculation (excludes weekends)
- Conflict detection for overlapping requests

### Admin Features
- Approve or reject time off requests
- Add reviewer notes when approving/rejecting
- View all team time off requests
- Filter by status (pending, approved, rejected, cancelled)
- Permission-based access control

---

## Files Created

### Database Schema
- `supabase/schemas/08_time_off.sql` - Time off table schema with functions and triggers
- Updated `supabase/schemas/06_permissions.sql` - Added time_off permissions
- Updated `supabase/schemas/07_rls_policies.sql` - Added RLS policies for time_off_requests

### Backend (Supabase Queries & Mutations)
- Updated `src/lib/supabase/queries.ts` - Added time off query functions
- Updated `src/lib/supabase/mutations.ts` - Added time off mutation functions

### API Hooks
- `src/hooks/api/use-time-off-requests.ts` - React Query hooks for time off operations

### UI Components
- `src/components/time-off/request-time-off-dialog.tsx` - Form to create/edit requests
- `src/components/time-off/time-off-requests-list.tsx` - List view with filtering
- `src/components/time-off/review-time-off-dialog.tsx` - Approval/rejection dialog

### Routes
- `src/routes/space/$slug/time-off/index.tsx` - Main time off management page

---

## Setup Instructions

### Step 1: Apply Database Migrations

You need to apply the database schema changes to your Supabase instance.

#### Option A: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project root
cd /Users/osx/Documents/work/agillo/agilespace

# Run the migrations in order
supabase db push

# Or manually apply each schema file
psql YOUR_DATABASE_URL -f supabase/schemas/06_permissions.sql
psql YOUR_DATABASE_URL -f supabase/schemas/07_rls_policies.sql
psql YOUR_DATABASE_URL -f supabase/schemas/08_time_off.sql
```

#### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each file in this order:
   - `supabase/schemas/06_permissions.sql` (updated permissions)
   - `supabase/schemas/07_rls_policies.sql` (updated RLS policies)
   - `supabase/schemas/08_time_off.sql` (new time off schema)
4. Run each SQL script

### Step 2: Generate TypeScript Types

After applying the database changes, regenerate the TypeScript types:

```bash
# Generate types from your Supabase database
npm run db:types

# Or if using local Supabase
npm run supabase:db:generate
```

This will update `src/types/database.types.ts` with the new `time_off_requests` table types.

### Step 3: Install Missing Dependencies (if needed)

Check if you have all required dependencies:

```bash
# Check if date-fns is installed
npm list date-fns

# If not installed
npm install date-fns
```

### Step 4: Update Navigation (Optional)

Add a link to the time off page in your space navigation. Look for the space navigation component and add:

```tsx
{hasPermission(spaceId, 'time_off:view') && (
  <Link to="/space/$slug/time-off" params={{ slug: space.slug }}>
    <Calendar className="mr-2 h-4 w-4" />
    Time Off
  </Link>
)}
```

---

## Database Schema Details

### time_off_requests Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `space_id` | UUID | Reference to spaces |
| `user_id` | UUID | Reference to auth.users (requester) |
| `space_member_id` | UUID | Reference to space_members |
| `type` | ENUM | vacation, sick_leave, personal, unpaid, other |
| `start_date` | DATE | Start date of time off |
| `end_date` | DATE | End date of time off |
| `is_half_day` | BOOLEAN | Whether it's a half-day request |
| `half_day_period` | TEXT | morning or afternoon (for half-days) |
| `total_days` | NUMERIC(4,2) | Calculated business days |
| `reason` | TEXT | Optional reason for time off |
| `notes` | TEXT | Additional notes from requester |
| `status` | ENUM | pending, approved, rejected, cancelled |
| `requested_at` | TIMESTAMP | When request was created |
| `reviewed_at` | TIMESTAMP | When request was reviewed |
| `reviewed_by` | UUID | Reference to auth.users (reviewer) |
| `reviewer_notes` | TEXT | Notes from reviewer |

### Database Functions

1. **calculate_time_off_days** - Calculates business days between two dates
2. **check_time_off_conflicts** - Checks for overlapping time off requests
3. **get_team_time_off** - Gets team time off for a date range (for calendar views)

### Triggers

1. **Auto-calculate total_days** - Automatically calculates business days on insert/update
2. **Auto-set reviewed_at** - Sets reviewed timestamp when status changes to approved/rejected
3. **Auto-update updated_at** - Updates the updated_at timestamp on changes

---

## Permissions

The following permissions have been added:

| Permission | Description | Admin | Member | Observer |
|------------|-------------|-------|--------|----------|
| `time_off:view` | View time off requests | ✓ | ✓ | ✓ |
| `time_off:create` | Create time off requests | ✓ | ✓ | ✗ |
| `time_off:update_own` | Update own requests | ✓ | ✓ | ✗ |
| `time_off:delete_own` | Delete own requests | ✓ | ✓ | ✗ |
| `time_off:approve` | Approve/reject requests | ✓ | ✗ | ✗ |
| `time_off:delete_all` | Delete any request | ✓ | ✗ | ✗ |

---

## Usage Examples

### Creating a Time Off Request

```typescript
const { handleCreateRequest } = useTimeOffRequests(spaceId);

handleCreateRequest({
  spaceId: 'space-uuid',
  spaceMemberId: 'member-uuid',
  type: 'vacation',
  startDate: '2025-11-01',
  endDate: '2025-11-05',
  isHalfDay: false,
  reason: 'Family vacation',
  notes: 'Will be unreachable',
  totalDays: 5
});
```

### Approving a Request (Admin)

```typescript
const { handleApproveRequest } = useTimeOffRequests(spaceId);

handleApproveRequest(
  'request-uuid',
  'Approved. Enjoy your time off!'
);
```

### Checking for Conflicts

```typescript
const { data: conflicts } = useTimeOffConflicts(
  spaceMemberId,
  '2025-11-01',
  '2025-11-05'
);

if (conflicts.length > 0) {
  // Show warning to user
}
```

---

## Testing Checklist

### As a Regular Member

- [ ] Navigate to `/space/{slug}/time-off`
- [ ] Click "Request Time Off" button
- [ ] Fill out the form:
  - [ ] Select type (vacation, sick leave, etc.)
  - [ ] Choose start and end dates
  - [ ] Try enabling half-day option
  - [ ] Verify total days calculation
  - [ ] Add reason and notes
- [ ] Submit the request
- [ ] Verify the request appears in the "Pending" tab
- [ ] Try cancelling the request
- [ ] Create another request and try deleting it

### As an Admin

- [ ] Navigate to `/space/{slug}/time-off`
- [ ] Verify you see all team members' requests
- [ ] Click "Approve" on a pending request
- [ ] Add reviewer notes
- [ ] Verify the request moves to "Approved" tab
- [ ] Try rejecting a pending request
- [ ] Verify reviewer information shows on the request
- [ ] Test filtering by different statuses

### Edge Cases to Test

- [ ] Try creating overlapping requests (should show conflict warning)
- [ ] Test half-day requests (start and end dates should be the same)
- [ ] Test weekend exclusion in day calculation
- [ ] Try cancelling an approved request
- [ ] Test as an observer (should only be able to view)
- [ ] Test permission-based UI element visibility

---

## API Reference

### Query Functions (src/lib/supabase/queries.ts)

```typescript
// Fetch time off requests with optional filtering
getTimeOffRequests(spaceId, filters?)

// Fetch a single request by ID
getTimeOffRequestById(requestId)

// Check for conflicting requests
checkTimeOffConflicts(spaceMemberId, startDate, endDate, excludeRequestId?)

// Get team time off for calendar view
getTeamTimeOff(spaceId, startDate, endDate, statusFilter?)

// Get user statistics
getUserTimeOffStats(spaceId, userId, year?)
```

### Mutation Functions (src/lib/supabase/mutations.ts)

```typescript
// Create a new request
createTimeOffRequest(params)

// Update a pending request
updateTimeOffRequest(requestId, params)

// Approve a request (admin only)
approveTimeOffRequest(requestId, reviewerNotes?)

// Reject a request (admin only)
rejectTimeOffRequest(requestId, reviewerNotes?)

// Cancel a request (user's own)
cancelTimeOffRequest(requestId)

// Delete a request
deleteTimeOffRequest(requestId)
```

### React Query Hooks (src/hooks/api/use-time-off-requests.ts)

```typescript
// Main hook for time off operations
const {
  timeOffRequests,
  pendingRequests,
  approvedRequests,
  pendingCount,
  isLoading,
  handleCreateRequest,
  handleApproveRequest,
  handleRejectRequest,
  handleCancelRequest,
  handleDeleteRequest,
} = useTimeOffRequests(spaceId, filters?)

// Single request hook
const { data: request } = useTimeOffRequest(requestId)

// Conflicts hook
const { data: conflicts } = useTimeOffConflicts(spaceMemberId, startDate, endDate)

// Team time off hook (for calendar)
const { data: teamTimeOff } = useTeamTimeOff(spaceId, startDate, endDate, statusFilter)

// Statistics hook
const { data: stats } = useUserTimeOffStats(spaceId, userId, year)
```

---

## Future Enhancements

Potential improvements for future iterations:

1. **Calendar View** - Add a visual calendar showing team availability
2. **Time Off Balance** - Track remaining vacation days per user
3. **Holiday Integration** - Exclude company holidays from day calculations
4. **Email Notifications** - Notify users when requests are approved/rejected
5. **Bulk Actions** - Allow admins to approve/reject multiple requests
6. **Export Functionality** - Export time off reports to CSV/PDF
7. **Time Off Policies** - Configure approval workflows and limits per space
8. **Recurring Time Off** - Support for recurring time off patterns
9. **Delegation** - Allow admins to delegate approval authority
10. **Mobile Optimization** - Enhanced mobile UI for on-the-go requests

---

## Troubleshooting

### Common Issues

**Issue: "Permission denied" errors**
- Ensure RLS policies are applied correctly
- Check that permissions are seeded in the database
- Verify user has the correct role in the space

**Issue: Type errors after adding schema**
- Run `npm run db:types` to regenerate TypeScript types
- Restart your TypeScript server

**Issue: Queries not working**
- Check that all schema files are applied in order
- Verify table exists: `SELECT * FROM time_off_requests LIMIT 1;`
- Check RLS is enabled: `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='time_off_requests';`

**Issue: Business day calculation seems wrong**
- The function excludes only Saturday and Sunday
- It doesn't account for company holidays (needs manual configuration)
- Verify date ranges are correct

---

## Support

For questions or issues:
1. Check the code comments in the implementation files
2. Review the database schema comments
3. Test with the provided testing checklist
4. Check browser console for errors

---

## Implementation Complete ✅

All components have been created and are ready to use. Follow the setup instructions above to deploy the feature to your environment.
