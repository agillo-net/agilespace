# Production Migration Guide - PR #92

This guide will help you safely apply the database migrations from PR #92 to your production Supabase database.

## Prerequisites

You have in `.env.local`:
- `VITE_SUPABASE_URL` (your production Supabase URL)
- `VITE_SUPABASE_ANON_KEY` (your production anon key)

You need to add:
- `SUPABASE_DB_PASSWORD` (your database password)
- `SUPABASE_PROJECT_ID` (your project ID)

## Step 1: Get Required Credentials

### Get Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings → Database**
4. Under **Database Password**, click **Reset Database Password** if you don't have it
5. Copy the password

### Get Database URL

1. In the same page (**Settings → Database**)
2. Scroll down to **Connection String**
3. Select **"Transaction" mode** (uses connection pooler, port 6543)
4. Copy the URI

It looks like:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Get Project ID

From your Supabase URL:
- URL: `https://rgzdcdglkpzvozdtytlp.supabase.co`
- Project ID: `rgzdcdglkpzvozdtytlp` (the subdomain)

## Step 2: Update .env.local

Add these lines to your `.env.local`:

```bash
# Database connection for migrations
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
SUPABASE_DB_PASSWORD=YOUR_PASSWORD
SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

**Example:**
```bash
# If your URL is https://abcdefghijklmnop.supabase.co
SUPABASE_PROJECT_ID=abcdefghijklmnop
SUPABASE_DB_PASSWORD=your_password_here
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:your_password_here@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

## Step 3: Install PostgreSQL Client Tools

The migration scripts need `psql` and `pg_dump` commands.

**macOS:**
```bash
brew install postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

## Step 4: Test Database Connection

Verify your credentials work:

```bash
psql "$DATABASE_URL" -c "SELECT version();"
```

If you see PostgreSQL version info, you're connected successfully!

## Step 5: Create Database Backup

**IMPORTANT:** Always backup before migrations!

```bash
pnpm db:backup:remote
```

This will:
- Create a backup in `supabase/backups/backup_TIMESTAMP.sql`
- Keep the last 10 backups
- Show you the restore command if needed

**To restore later (if something goes wrong):**
```bash
psql "$DATABASE_URL" -f supabase/backups/backup_YYYYMMDD_HHMMSS.sql
```

## Step 6: Apply New Schemas

Apply schemas 06-10 (new features from PR #92):

```bash
pnpm db:apply:remote 06 07 08 09 10
```

Or apply all schemas:

```bash
pnpm db:apply:remote
```

You should see:
```
✅ Successfully applied 06_permissions.sql
✅ Successfully applied 07_rls_policies.sql
✅ Successfully applied 08_time_off.sql
✅ Successfully applied 09_github_repo_permissions.sql
✅ Successfully applied 10_notifications.sql
```

## Step 7: Regenerate TypeScript Types

Update your TypeScript types to match the new database schema:

```bash
pnpm db:types
```

This will update `src/types/database.types.ts` with the new tables.

## Step 8: Verify in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Table Editor**
4. Verify these new tables exist:
   - ✅ `notifications`
   - ✅ `notification_preferences`
   - ✅ `time_off_requests`
   - ✅ `github_repo_permissions`
   - ✅ `permissions`
   - ✅ `role_permissions`
   - ✅ `space_member_permissions`

## Step 9: Deploy to Cloudflare Pages

After merging the PR, Cloudflare Pages will automatically deploy. Just:

1. Merge PR #92
2. Wait for Cloudflare Pages deployment (automatic)
3. Check deployment status in the PR comments

## Complete Checklist

- [ ] Get database password from Supabase Dashboard
- [ ] Get database URL (Transaction mode, port 6543)
- [ ] Get project ID from Supabase URL
- [ ] Add `DATABASE_URL`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID` to `.env.local`
- [ ] Install PostgreSQL client (`brew install postgresql@16`)
- [ ] Test database connection with `psql`
- [ ] Create backup: `pnpm db:backup:remote`
- [ ] Apply schemas: `pnpm db:apply:remote 06 07 08 09 10`
- [ ] Regenerate types: `pnpm db:types`
- [ ] Verify tables in Supabase Dashboard
- [ ] Merge PR #92
- [ ] Wait for Cloudflare Pages deployment
- [ ] Test new features: permissions, notifications, time-off

## Rollback Plan (If Something Goes Wrong)

If you need to rollback:

```bash
# Restore from backup
psql "$DATABASE_URL" -f supabase/backups/backup_TIMESTAMP.sql

# Or go to Supabase Dashboard → Database → Backups
# And restore from automatic daily backup
```

## Troubleshooting

### "DATABASE_URL not configured"

Make sure you added `DATABASE_URL` to `.env.local` with the correct format.

### "psql: command not found"

Install PostgreSQL client tools (see Step 3).

### "Authentication failed"

- Check your database password is correct
- Try resetting the password in Supabase Dashboard
- Make sure you're using the right project URL

### "Table already exists"

This is usually safe - the schemas use `CREATE TABLE IF NOT EXISTS`. But if you want a clean state, backup first then:

```bash
pnpm db:reset:remote
pnpm db:apply:remote
```

### "Connection timed out"

- Check your internet connection
- Verify VPN isn't blocking
- Check if project is paused in Supabase Dashboard

## What Gets Added

This migration adds:

**New Features:**
- 🔐 Permissions system (role-based access control)
- 🏖️ Time-off management
- 🔔 Notifications system
- 🔗 GitHub repository permissions
- 📊 Enhanced analytics

**New Database Tables:**
- `permissions` - Permission definitions
- `role_permissions` - Permissions by role
- `space_member_permissions` - Per-member overrides
- `time_off_requests` - Time-off tracking
- `notifications` - Notification queue
- `notification_preferences` - User notification settings
- `github_repo_permissions` - Repo access tracking

**No Data Loss:**
All migrations are additive - existing data is preserved.

## Need Help?

- Review the full docs in `supabase/scripts/QUICK_START.md`
- Check `supabase/scripts/README.md` for script details
- Join the team chat for support
