# Team Setup Guide: Testing with Production Data

This guide will help you set up your local environment to test with real production data from Supabase.

## Prerequisites

Before you start, make sure you have:

1. **Local Supabase running**
   ```bash
   supabase start
   ```

2. **PostgreSQL client tools installed**
   ```bash
   # macOS
   brew install postgresql

   # Ubuntu/Debian
   sudo apt-get install postgresql-client
   ```

3. **Git configured with your email**
   ```bash
   # Check your git email
   git config user.email

   # If not set, configure it:
   git config user.email "your.email@example.com"
   ```

4. **Environment variables configured**
   - Make sure `supabase/.env` has the required credentials
   - Ask a team lead if you don't have access to the `.env` file

## Quick Start

### Step 1: Pull Production Database

Run the pull script to download and restore production data to your local instance:

```bash
./supabase/scripts/pull-remote-to-local.sh
```

This script will:
- ✅ Backup your current local database (for safety)
- ✅ Download production data
- ✅ Restore it to your local database
- ✅ Fix permissions automatically
- ✅ Add your user to all spaces as admin

The entire process takes 1-2 minutes depending on your internet connection.

### Step 2: Verify Everything Works

Test that you can access the data:

```bash
# Using service role (bypasses RLS)
curl 'http://127.0.0.1:54321/rest/v1/spaces?select=*' \
  -H 'apikey: sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz' \
  -H 'Authorization: Bearer sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'
```

You should see production data returned as JSON.

### Step 3: Test Your Application

Start your application and test with real data:

```bash
# Start your app (adjust port as needed)
pnpm dev
```

Your app should now be connected to the local Supabase instance with production data.

## Common Issues & Solutions

### Issue: "permission denied for schema public"

**Solution:** Re-run the sync script to fix permissions:
```bash
./supabase/scripts/sync-local-user.sh
```

### Issue: "Could not get local database URL"

**Solution:** Make sure Supabase is running:
```bash
supabase status
# If not running:
supabase start
```

### Issue: "No email provided"

**Solution:** Either configure git email or provide it manually:
```bash
# Option 1: Configure git
git config user.email "your.email@example.com"

# Option 2: Provide email to script
./supabase/scripts/sync-local-user.sh your.email@example.com
```

### Issue: Empty results from API

**Possible causes:**

1. **RLS (Row Level Security) is blocking access**
   - Solution: Use the service role key for testing (see examples above)
   - Or: Make sure your user is synced with `./supabase/scripts/sync-local-user.sh`

2. **No data in production**
   - Check if production actually has data

3. **Wrong API endpoint or filters**
   - Check your API call syntax

## Advanced Usage

### Skip Local Backup (Faster)

If you don't need to backup your local database before pulling:

```bash
./supabase/scripts/pull-remote-to-local.sh --skip-backup
```

### Sync Different User

If you need to test as a different user:

```bash
./supabase/scripts/sync-local-user.sh other.user@example.com
```

### Manual User Sync

If the automatic sync didn't work, you can manually add your user:

```bash
# Run the sync script with your email
./supabase/scripts/sync-local-user.sh your.email@example.com
```

### View Backups

All backups are stored in `supabase/backups/`:

```bash
ls -lh supabase/backups/
```

The script keeps the last 10 backups of each type (local and remote).

### Restore from Backup

If something goes wrong, you can restore from a backup:

```bash
# Get local database URL
LOCAL_DB_URL=$(supabase status | grep "Database URL" | awk '{print $3}')

# Restore from backup
psql "$LOCAL_DB_URL" -f supabase/backups/backup_TIMESTAMP.sql
```

## Testing Workflow

### Recommended Flow

1. **Pull fresh data when needed:**
   ```bash
   ./supabase/scripts/pull-remote-to-local.sh
   ```

2. **Develop and test locally:**
   - Make changes to your code
   - Test with real production data
   - Database changes are isolated to your local instance

3. **Re-pull when production data changes:**
   - Run the pull script again to get latest data
   - Your local changes will be overwritten (that's why we backup!)

### Testing Authenticated Endpoints

**Option 1: Use Service Role (Easiest)**

For quick API testing, use the service role key which bypasses RLS:

```bash
curl 'http://127.0.0.1:54321/rest/v1/YOUR_ENDPOINT' \
  -H 'apikey: sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz' \
  -H 'Authorization: Bearer sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'
```

**Option 2: Sign In Through Your App**

For realistic testing, sign in through your application:
- Your email will already be synced with the spaces
- If you need a password, it's set to `password123` by the sync script
- Test the full authentication flow

## Safety Notes

⚠️ **Important Reminders:**

1. **This is production data** - Treat it carefully and don't expose it
2. **Local changes are isolated** - Your local testing won't affect production
3. **Re-pulling overwrites local data** - Make sure you're okay losing local changes
4. **Backups are automatic** - The script creates backups before making changes
5. **Don't commit .env files** - Never commit production credentials to git

## Need Help?

If you encounter issues:

1. Check the [main README](./README.md) for more details
2. Review the script output for error messages
3. Ask a team member who has successfully set this up
4. Check that your `.env` file has the correct credentials

## Scripts Reference

- `pull-remote-to-local.sh` - Pull production database to local
- `sync-local-user.sh` - Add your user to all spaces
- Full documentation: [supabase/scripts/README.md](./README.md)
