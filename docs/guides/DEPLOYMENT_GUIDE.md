# Production Deployment Guide

## Deploying Notification System to Production

This guide explains how to safely deploy the notification system to production without losing any existing data.

### Prerequisites

- Access to Supabase Dashboard
- Database connection credentials
- Backup of production database (recommended)

---

## Option 1: Using Supabase Dashboard (Recommended)

This is the safest method for production deployment.

### Step 1: Backup Your Database (Optional but Recommended)

1. Go to Supabase Dashboard → Database → Backups
2. Create a manual backup before making changes
3. Wait for backup to complete

### Step 2: Run the Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file: `supabase/migrations/notifications_production_safe.sql`
3. Copy all the content
4. Paste into SQL Editor
5. Click **Run** or press `Ctrl/Cmd + Enter`

The script is designed to be **idempotent** - you can run it multiple times safely:
- Uses `CREATE TABLE IF NOT EXISTS` (won't drop existing tables)
- Uses `CREATE OR REPLACE FUNCTION` (updates functions safely)
- Uses `DROP TRIGGER IF EXISTS` before recreating (safe to rerun)
- Uses `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;` for enums

### Step 3: Verify the Migration

Run this query to check if everything was created:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'notification_preferences');

-- Check realtime is enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'notifications';

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('notifications', 'notification_preferences');
```

Expected results:
- 2 tables (notifications, notification_preferences)
- 1 realtime publication entry
- Both tables should have `rowsecurity = true`

---

## Option 2: Using Supabase CLI (Advanced)

If you have the Supabase CLI set up and linked to your production project:

### Step 1: Link to Production

```bash
# Link to your production project
supabase link --project-ref your-production-project-ref

# Verify you're connected to the right project
supabase status
```

### Step 2: Run Migration

```bash
# Run the migration
psql "$(supabase status -o env | grep 'DB_URL=' | cut -d= -f2- | tr -d '"')" \
  -f supabase/migrations/notifications_production_safe.sql
```

---

## Option 3: Using Database Connection String

If you have direct database access:

```bash
# Set your production database URL
export PROD_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"

# Run the migration
psql "$PROD_DB_URL" -f supabase/migrations/notifications_production_safe.sql
```

---

## Post-Deployment Verification

### 1. Test Notification Creation

Run this in SQL Editor to create a test notification:

```sql
-- Replace with your actual user_id and space_id
SELECT create_notification(
  'YOUR_USER_ID'::uuid,
  'system_announcement'::notification_type,
  'Test Notification',
  'This is a test notification to verify the system is working',
  'YOUR_SPACE_ID'::uuid,
  NULL,
  'medium'::notification_priority,
  NULL,
  NULL,
  NULL,
  '{}'::jsonb
);

-- Check if notification was created
SELECT * FROM notifications
WHERE user_id = 'YOUR_USER_ID'::uuid
ORDER BY created_at DESC
LIMIT 1;
```

### 2. Test Real-time Subscriptions

In your frontend application:
1. Log in as a user
2. Open browser console
3. Look for logs: `[Notifications] Setting up realtime subscriptions for user:`
4. Have another user (or admin) create a time-off request
5. You should see: `[Notifications] New notification received:`

### 3. Test Time-Off Notifications

1. Create a time-off request as a regular user
2. Admin users should receive a notification immediately
3. Approve/reject the request as admin
4. The requester should receive a notification

---

## Rollback Plan

If something goes wrong, you can rollback:

### Remove Notifications Tables Only (Keep Other Data)

```sql
-- Disable triggers first
DROP TRIGGER IF EXISTS trigger_notify_time_off_requested ON time_off_requests;
DROP TRIGGER IF EXISTS trigger_notify_time_off_approved ON time_off_requests;
DROP TRIGGER IF EXISTS trigger_notify_time_off_rejected ON time_off_requests;

-- Drop tables (will cascade delete all notifications)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS create_notification CASCADE;
DROP FUNCTION IF EXISTS notify_space_admins CASCADE;
DROP FUNCTION IF EXISTS get_unread_notification_count CASCADE;
DROP FUNCTION IF EXISTS mark_all_notifications_read CASCADE;
DROP FUNCTION IF EXISTS delete_old_notifications CASCADE;
DROP FUNCTION IF EXISTS notify_time_off_requested CASCADE;
DROP FUNCTION IF EXISTS notify_time_off_approved CASCADE;
DROP FUNCTION IF EXISTS notify_time_off_rejected CASCADE;
DROP FUNCTION IF EXISTS set_notification_read_at CASCADE;
DROP FUNCTION IF EXISTS update_notification_preferences_updated_at CASCADE;

-- Drop types
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_priority CASCADE;
```

### Restore from Backup

If you created a backup:
1. Go to Supabase Dashboard → Database → Backups
2. Find your backup
3. Click **Restore**

---

## Frontend Deployment

After database migration is complete, deploy your frontend:

```bash
# Build your application
npm run build  # or pnpm build

# Deploy to your hosting provider
# (Vercel, Netlify, etc.)
```

---

## Monitoring

After deployment, monitor:

1. **Notification Creation Rate**
```sql
SELECT DATE_TRUNC('hour', created_at) as hour, COUNT(*)
FROM notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

2. **Unread Notifications**
```sql
SELECT COUNT(*) as unread_count, type
FROM notifications
WHERE read = false
GROUP BY type;
```

3. **Database Size**
```sql
SELECT
  pg_size_pretty(pg_total_relation_size('notifications')) as notifications_size,
  pg_size_pretty(pg_total_relation_size('notification_preferences')) as preferences_size;
```

---

## Cleanup Old Notifications

Set up a scheduled job (using Supabase Cron or external service) to clean up old notifications:

```sql
-- Delete notifications older than 90 days
SELECT delete_old_notifications(90);
```

Or in Supabase Dashboard → Database → Cron Jobs:

```sql
-- Run daily at midnight
SELECT cron.schedule(
  'delete-old-notifications',
  '0 0 * * *',
  $$SELECT delete_old_notifications(90);$$
);
```

---

## Troubleshooting

### Issue: "relation already exists" errors
**Solution:** These are safe to ignore. The script uses `IF NOT EXISTS` clauses.

### Issue: Real-time not working
**Solution:**
1. Check if table is in publication: `SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';`
2. If not, run: `ALTER PUBLICATION supabase_realtime ADD TABLE notifications;`

### Issue: Users can't see notifications
**Solution:**
1. Check RLS policies are created
2. Verify user is authenticated
3. Check browser console for errors

### Issue: Triggers not firing
**Solution:**
1. Check if triggers exist: `SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';`
2. Re-run the trigger creation section of the migration

---

## Support

For issues or questions:
- Check application logs
- Review Supabase logs in Dashboard → Logs
- Check browser console for client-side errors
