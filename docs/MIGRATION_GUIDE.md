# Database Migration Guide

Complete guide for migrating your Supabase database to include the latest features: permissions system, time off management, GitHub repo permissions, and notifications.

## Table of Contents

- [Overview](#overview)
- [What's Being Added](#whats-being-added)
- [Pre-Migration Checklist](#pre-migration-checklist)
- [Migration Options](#migration-options)
- [Step-by-Step Migration](#step-by-step-migration)
- [Post-Migration Verification](#post-migration-verification)
- [Troubleshooting](#troubleshooting)
- [Rollback Instructions](#rollback-instructions)

---

## Overview

This migration adds several new features to your application:

- ✅ **Permissions System** - Role-based access control with per-member overrides
- ✅ **Time Off Management** - Request, approve, and track team time off
- ✅ **GitHub Repo Permissions** - Track which users can access which repositories
- ✅ **Notifications** - In-app notifications for important events

**Impact:** These changes are **additive only** - no existing data will be modified or deleted.

---

## What's Being Added

### New Database Tables

| Table | Description | Records |
|-------|-------------|---------|
| `permissions` | All available permissions | ~37 records seeded |
| `role_permissions` | Permission mappings for roles | ~80 records seeded |
| `space_member_permissions` | Per-member permission overrides | Empty initially |
| `time_off_requests` | Time off requests and approvals | Empty initially |
| `github_repo_permissions` | User repository access levels | Empty initially |
| `notifications` | In-app notifications | Empty initially |
| `notification_preferences` | User notification settings | Empty initially |

### New Functions

| Function | Purpose |
|----------|---------|
| `user_has_permission()` | Check if user has a specific permission |
| `get_user_permissions()` | Get all user permissions in a space |
| `calculate_time_off_days()` | Calculate business days for time off |
| `check_time_off_conflicts()` | Find overlapping time off requests |
| `get_team_time_off()` | Get team calendar for date range |
| `create_notification()` | Create a new notification |
| `notify_space_admins()` | Notify all space admins |
| `get_unread_notification_count()` | Count unread notifications |
| `mark_all_notifications_read()` | Mark all as read |

### New RLS Policies

RLS (Row Level Security) policies are being added to **existing** tables:
- `profiles` - View all, update own
- `spaces` - Members view, admins manage
- `space_members` - Permission-based access
- `tracks` - Permission-based access
- `sessions` - Permission-based access
- `tags` - Permission-based access

And **new** tables get RLS policies:
- `permissions` - All authenticated users can view
- `role_permissions` - All authenticated users can view
- `space_member_permissions` - Only admins can manage
- `time_off_requests` - Permission-based access
- `github_repo_permissions` - (Policies to be added)
- `notifications` - Users can manage own notifications
- `notification_preferences` - Users can manage own preferences

### New Enums

```sql
-- Time off types
CREATE TYPE time_off_type AS ENUM (
  'vacation', 'sick_leave', 'personal', 'unpaid', 'other'
);

-- Time off status
CREATE TYPE time_off_status AS ENUM (
  'pending', 'approved', 'rejected', 'cancelled'
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'time_off_requested', 'time_off_approved', 'time_off_rejected',
  'time_off_cancelled', 'member_joined', 'member_left',
  'issue_assigned', 'issue_mentioned', 'change_request_review',
  'change_request_approved', 'change_request_rejected',
  'system_announcement', 'other'
);

-- Notification priority
CREATE TYPE notification_priority AS ENUM (
  'low', 'medium', 'high', 'urgent'
);
```

---

## Pre-Migration Checklist

### 1. Backup Your Database

**Via Supabase Dashboard:**
```
Dashboard → Project Settings → Database → Backups → Create Backup
```

**Via Command Line (if you have direct access):**
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

### 2. Check Current Database State

```bash
# List existing tables
psql $DATABASE_URL -c "\dt"

# Or via Supabase Dashboard: Table Editor
```

### 3. Verify Environment Variables

Ensure your `.env` file has:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key  # For scripts
SUPABASE_PROJECT_ID=your-project-id    # For type generation
```

### 4. Test in Development First

**Never run migrations directly on production!** Always test on:
- Local Supabase instance, OR
- Development/Staging environment

---

## Migration Options

### Option 1: Automated Script (Recommended) ⭐

**Prerequisites:**
- Supabase CLI installed
- Project linked

**Steps:**
```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
pnpm db:apply 06 07 08 09 10

# Generate TypeScript types
pnpm db:types
```

**Pros:**
- ✅ Fastest method
- ✅ Automatic error handling
- ✅ Transaction support
- ✅ Easy to roll back

**Cons:**
- Requires Supabase CLI setup

---

### Option 2: Manual via Dashboard

**Steps:**
```bash
# 1. Combine schema files into one
pnpm db:combine 06 07 08 09 10

# 2. This creates: supabase/combined-schema.sql
# 3. Copy the file contents

# 4. Open Supabase Dashboard → SQL Editor
# 5. Paste the SQL
# 6. Click "Run"

# 7. Generate types locally
pnpm db:types
```

**Pros:**
- ✅ No CLI required
- ✅ Visual feedback
- ✅ Easy to review SQL before running

**Cons:**
- Manual process
- Need to copy/paste
- No automatic transactions

---

### Option 3: Create Migration File

**Steps:**
```bash
# 1. Create a new migration file
cat supabase/schemas/06_permissions.sql \
    supabase/schemas/07_rls_policies.sql \
    supabase/schemas/08_time_off.sql \
    supabase/schemas/09_github_repo_permissions.sql \
    supabase/schemas/10_notifications.sql \
    > supabase/migrations/$(date +%Y%m%d%H%M%S)_add_all_features.sql

# 2. Apply via Supabase CLI
supabase db push

# Or apply manually via dashboard
# Copy migration file to SQL Editor and run
```

**Pros:**
- ✅ Follows migration best practices
- ✅ Version controlled
- ✅ Easy to share with team

**Cons:**
- Still requires CLI or manual application

---

## Step-by-Step Migration

### Step 1: Prepare

```bash
# Pull latest code
git pull origin vite

# Install dependencies
pnpm install

# Verify schema files exist
ls -la supabase/schemas/
```

Expected output:
```
06_permissions.sql
07_rls_policies.sql
08_time_off.sql
09_github_repo_permissions.sql
10_notifications.sql
```

### Step 2: Apply Schemas (Choose One Method)

#### Method A: Automated (Recommended)

```bash
# Apply all new schemas in order
pnpm db:apply 06 07 08 09 10
```

Expected output:
```
✓ Applying schema 06_permissions.sql...
✓ Applying schema 07_rls_policies.sql...
✓ Applying schema 08_time_off.sql...
✓ Applying schema 09_github_repo_permissions.sql...
✓ Applying schema 10_notifications.sql...
✓ All schemas applied successfully!
```

#### Method B: Manual via Dashboard

```bash
# 1. Generate combined SQL
pnpm db:combine 06 07 08 09 10

# 2. Output is copied to clipboard and saved to:
#    supabase/combined-schema.sql

# 3. Open Supabase Dashboard
open https://app.supabase.com/project/your-project-id

# 4. Navigate to: SQL Editor
# 5. Paste the SQL
# 6. Click "Run" (or Cmd/Ctrl + Enter)
```

### Step 3: Verify Tables Created

**Via Supabase Dashboard:**
```
Dashboard → Table Editor
```

You should see these **new** tables:
- ✅ permissions
- ✅ role_permissions
- ✅ space_member_permissions
- ✅ time_off_requests
- ✅ github_repo_permissions
- ✅ notifications
- ✅ notification_preferences

**Via SQL:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'permissions',
  'role_permissions',
  'space_member_permissions',
  'time_off_requests',
  'github_repo_permissions',
  'notifications',
  'notification_preferences'
)
ORDER BY table_name;
```

Expected: 7 rows returned

### Step 4: Verify Seed Data

```sql
-- Check permissions were seeded (should return 37)
SELECT COUNT(*) as permission_count FROM permissions;

-- Check role permissions were seeded (should return ~80)
SELECT COUNT(*) as role_permission_count FROM role_permissions;

-- View sample permissions
SELECT category, COUNT(*) as count
FROM permissions
GROUP BY category
ORDER BY category;
```

Expected output:
```
category         | count
-----------------|------
analytics        | 3
change_requests  | 6
issues           | 6
members          | 5
prs              | 6
repos            | 2
space            | 4
time_off         | 5
```

### Step 5: Verify Functions Created

```sql
-- List new functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'user_has_permission',
  'get_user_permissions',
  'calculate_time_off_days',
  'check_time_off_conflicts',
  'get_team_time_off',
  'create_notification',
  'notify_space_admins',
  'get_unread_notification_count',
  'mark_all_notifications_read'
)
ORDER BY routine_name;
```

Expected: 9 functions returned

### Step 6: Verify RLS Policies

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;
```

Expected tables with RLS enabled:
- notifications
- notification_preferences
- permissions
- profiles
- role_permissions
- session_tags
- sessions
- space_member_permissions
- space_members
- spaces
- tags
- time_off_requests
- tracks

```sql
-- Count RLS policies
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```

### Step 7: Generate TypeScript Types

```bash
# Generate types from database
pnpm db:types
```

Expected output:
```
Generating types...
✓ Generated types saved to: src/types/database.types.ts
```

**Verify types file:**
```bash
# Check file was updated
ls -lh src/types/database.types.ts

# Check it includes new tables
grep -E "(permissions|time_off_requests|notifications)" src/types/database.types.ts
```

### Step 8: Test Application

```bash
# Start development server
pnpm dev
```

**Test Checklist:**
- [ ] App loads without errors
- [ ] Can view spaces
- [ ] Can view members
- [ ] No console errors related to database
- [ ] TypeScript compiles without errors

---

## Post-Migration Verification

### Full Verification Checklist

```sql
-- 1. Verify all tables exist
SELECT
  COUNT(*) as table_count,
  string_agg(table_name, ', ' ORDER BY table_name) as tables
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'permissions', 'role_permissions', 'space_member_permissions',
  'time_off_requests', 'github_repo_permissions',
  'notifications', 'notification_preferences'
);
-- Expected: table_count = 7

-- 2. Verify permissions seeded
SELECT COUNT(*) as permission_count FROM permissions;
-- Expected: 37

-- 3. Verify role permissions seeded
SELECT
  role,
  COUNT(*) as permission_count
FROM role_permissions
GROUP BY role
ORDER BY role;
-- Expected:
--   admin: 37 permissions
--   member: ~20 permissions
--   observer: ~10 permissions

-- 4. Test permission function
SELECT user_has_permission(
  auth.uid(),
  (SELECT id FROM spaces LIMIT 1),
  'space:view'
) as has_permission;
-- Expected: true (if you're a member of a space)

-- 5. Test time off calculation
SELECT calculate_time_off_days(
  '2025-01-01'::date,
  '2025-01-05'::date,
  false
) as business_days;
-- Expected: 5 (for a weekday-only range)

-- 6. Verify RLS policies
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public';
-- Expected: 40+ policies

-- 7. Verify triggers
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN (
  'time_off_requests',
  'notifications',
  'notification_preferences'
)
ORDER BY event_object_table, trigger_name;
-- Expected: Multiple triggers for automatic notifications and calculations

-- 8. Verify enums
SELECT
  t.typname as enum_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN (
  'time_off_type',
  'time_off_status',
  'notification_type',
  'notification_priority'
)
GROUP BY t.typname
ORDER BY t.typname;
-- Expected: 4 enums with their values
```

### Application-Level Tests

```bash
# 1. Check TypeScript compilation
pnpm build

# 2. Check no type errors
pnpm tsc --noEmit

# 3. Run development server
pnpm dev

# 4. Test in browser
# - Navigate to /spaces
# - Check browser console for errors
# - Try accessing /space/{slug}/time-off
# - Check notification bell appears in navbar
```

---

## Troubleshooting

### Error: "relation already exists"

**Cause:** Tables were already created in a previous migration attempt.

**Solution:**
```sql
-- Option 1: Drop and recreate (CAUTION: This deletes data!)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
-- ... repeat for other tables

-- Then rerun migration

-- Option 2: Skip the error if tables are correct
-- Just verify the schema matches expected structure
```

### Error: "function user_has_permission does not exist"

**Cause:** Schemas applied in wrong order (07 before 06).

**Solution:**
```bash
# Apply schemas in correct order
pnpm db:apply 06
pnpm db:apply 07
pnpm db:apply 08
pnpm db:apply 09
pnpm db:apply 10
```

### Error: "publication does not exist"

**Cause:** Line in 10_notifications.sql tries to add to realtime publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

**Solution Option 1:** Remove realtime if not using it:
```sql
-- Comment out or remove this line from 10_notifications.sql:
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

**Solution Option 2:** Enable Realtime:
```bash
# In Supabase Dashboard:
# Database → Replication → Enable Realtime
```

### Error: "permission denied for schema public"

**Cause:** Using wrong credentials or service key not set.

**Solution:**
```bash
# Verify credentials
echo $SUPABASE_SERVICE_KEY

# Or use Supabase Dashboard instead
```

### TypeScript Errors After Migration

**Cause:** Types not regenerated after schema changes.

**Solution:**
```bash
# Regenerate types
pnpm db:types

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Build Fails: "Cannot find module"

**Cause:** New imports referencing types that don't exist yet.

**Solution:**
```bash
# 1. Generate types
pnpm db:types

# 2. Clean and rebuild
rm -rf .tanstack node_modules/.cache
pnpm install
pnpm build
```

---

## Rollback Instructions

### If You Need to Undo the Migration

#### Option 1: Restore from Backup (Safest)

**Via Supabase Dashboard:**
```
Dashboard → Database → Backups → Select Backup → Restore
```

**Via pg_restore:**
```bash
psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql
```

#### Option 2: Manual Rollback (Advanced)

```sql
-- Drop new tables (in reverse order to avoid FK errors)
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS github_repo_permissions CASCADE;
DROP TABLE IF EXISTS time_off_requests CASCADE;
DROP TABLE IF EXISTS space_member_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;

-- Drop new functions
DROP FUNCTION IF EXISTS user_has_permission;
DROP FUNCTION IF EXISTS get_user_permissions;
DROP FUNCTION IF EXISTS calculate_time_off_days;
DROP FUNCTION IF EXISTS check_time_off_conflicts;
DROP FUNCTION IF EXISTS get_team_time_off;
DROP FUNCTION IF EXISTS create_notification;
DROP FUNCTION IF EXISTS notify_space_admins;
DROP FUNCTION IF EXISTS get_unread_notification_count;
DROP FUNCTION IF EXISTS mark_all_notifications_read;

-- Drop new enums
DROP TYPE IF EXISTS notification_priority;
DROP TYPE IF EXISTS notification_type;
DROP TYPE IF EXISTS time_off_status;
DROP TYPE IF EXISTS time_off_type;

-- Remove RLS policies added to existing tables
-- (This is optional - you may want to keep them)
-- See 07_rls_policies.sql for policy names to drop
```

⚠️ **Warning:** Manual rollback is complex and error-prone. **Always restore from backup if possible.**

---

## Next Steps

After successful migration:

1. **Update Documentation:**
   - Update README with new features
   - Document permission system usage
   - Add time off workflow guide

2. **Test New Features:**
   - Create a time off request
   - Test permission checks
   - Verify notifications appear

3. **Team Onboarding:**
   - Share migration guide with team
   - Update development setup docs
   - Run migration on staging/production

4. **Monitor:**
   - Check Supabase logs for errors
   - Monitor RLS policy performance
   - Watch for permission-related issues

---

## FAQ

### Q: Do I need to run this migration on every environment?

**A:** Yes, run on local → dev → staging → production (in that order).

### Q: Will this affect existing users?

**A:** No data is modified. Existing functionality continues to work. New features just become available.

### Q: Can I run this migration on production directly?

**A:** Not recommended. Always test on dev/staging first.

### Q: How long does migration take?

**A:** ~10-30 seconds for most databases. Larger databases may take longer.

### Q: What if migration fails halfway?

**A:** Most operations are in transactions and will rollback automatically. If not, restore from backup.

### Q: Do I need to notify users?

**A:** No downtime required. You may want to announce new features after migration.

---

## Support

- **Documentation:** See `/docs` folder for detailed guides
- **Database Scripts:** See `/docs/database/` for schema documentation
- **Issues:** Check troubleshooting section above
- **Team:** Ask in your team chat if stuck

---

## Summary

✅ **Safe Migration** - All changes are additive
✅ **No Downtime** - Apply without service interruption
✅ **Reversible** - Can rollback if needed
✅ **Well-Tested** - RLS policies and constraints in place
✅ **Type-Safe** - TypeScript types generated automatically

**Estimated Time:** 15-30 minutes including verification

**Risk Level:** Low (with proper backup)

Good luck with your migration! 🚀
