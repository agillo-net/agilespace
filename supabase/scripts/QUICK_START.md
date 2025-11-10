# Quick Start Guide - Database Scripts

## Which Scripts Should I Use?

### For Remote Supabase Database (Production/Hosted) ⭐ Most Common

If you're connecting to a **hosted Supabase project** (not running locally), use:

```bash
pnpm db:reset:remote       # Reset remote database
pnpm db:apply:remote       # Apply schemas to remote
pnpm db:setup:remote       # Complete setup (reset + apply)
```

### For Local Supabase (Development)

If you're running **Supabase locally** with `supabase start`, use:

```bash
pnpm db:reset              # Reset local database
pnpm db:apply              # Apply schemas to local
pnpm db:setup              # Complete setup (reset + apply + seed)
```

## Setup for Remote Database

### Step 1: Get Your Database URL

1. Go to your Supabase Dashboard
2. Navigate to **Settings → Database**
3. Find **Connection String**
4. Select **"Transaction" mode** (uses connection pooler)
5. Copy the URI

It will look like:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Step 2: Add to .env

Create or edit `.env.local` or `.env`:

```bash
# Add this line
DATABASE_URL=postgresql://postgres.abcdef:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# You should also have these
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Install PostgreSQL Client

The scripts need `psql` command:

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

### Step 4: Apply Schemas

```bash
# Apply all schemas
pnpm db:apply:remote

# Or do complete setup (resets first!)
pnpm db:setup:remote
```

## Common Workflows

### First Time Setup (Remote Database)

```bash
# 1. Configure environment
cp .env.example .env.local
# Edit .env.local with DATABASE_URL

# 2. Apply schemas
pnpm db:apply:remote

# 3. Verify in Supabase Dashboard
# Check tables exist under Table Editor
```

### Making Schema Changes

```bash
# 1. Create new schema file
# supabase/schemas/08_new_feature.sql

# 2. Test on remote
pnpm db:reset:remote -- --force
pnpm db:apply:remote

# 3. Verify and commit
git add supabase/schemas/08_new_feature.sql
git commit -m "feat: add new schema"
```

### Fresh Start on Remote

```bash
# ⚠️ WARNING: Deletes all data!
pnpm db:setup:remote
```

## Troubleshooting

### "DATABASE_URL not configured"

**Problem:** Missing connection string

**Solution:**
1. Get connection string from Supabase Dashboard
2. Add `DATABASE_URL=...` to `.env.local`
3. Make sure it's the **Transaction** mode URL (port 6543)

### "psql: command not found"

**Problem:** PostgreSQL client not installed

**Solution:**
```bash
# macOS
brew install postgresql

# Ubuntu
sudo apt-get install postgresql-client
```

### "Authentication failed"

**Problem:** Wrong password in DATABASE_URL

**Solutions:**
1. **Reset your database password** in Supabase Dashboard (Settings → Database)
2. Update DATABASE_URL with new password
3. Make sure you're using the correct project

### "Connection timed out"

**Problem:** Network or firewall issue

**Solutions:**
1. Check your internet connection
2. Verify VPN isn't blocking connection
3. Check if project is paused (Supabase Dashboard)
4. Try using different network

### "Table already exists"

**Problem:** Schemas were already applied

**Solution:** This is usually harmless. The schemas create tables with `IF NOT EXISTS`. If you want a fresh start:
```bash
pnpm db:reset:remote
pnpm db:apply:remote
```

## Script Comparison

| Feature | Local Scripts | Remote Scripts |
|---------|--------------|----------------|
| Target | Local Supabase | Hosted Supabase |
| Requires | Supabase CLI | DATABASE_URL + psql |
| Setup | `supabase start` | Database URL in .env |
| Speed | Fast | Network dependent |
| Use Case | Development | Testing/Production |

## Commands Reference

### Remote Database Commands (Most Common)

```bash
pnpm db:apply:remote              # Apply all schemas
pnpm db:apply:remote 06 07        # Apply specific schemas
pnpm db:reset:remote              # Drop all tables (asks confirmation)
pnpm db:reset:remote -- --force   # Drop without confirmation
pnpm db:setup:remote              # Reset + Apply
```

### Local Database Commands

```bash
pnpm db:apply                     # Apply all schemas
pnpm db:reset                     # Drop all tables
pnpm db:seed                      # Add sample data
pnpm db:setup                     # Reset + Apply + Seed
```

### Utility Commands

```bash
pnpm db:combine                   # Combine schemas to one file
pnpm db:types                     # Generate TypeScript types
```

## Quick Reference Card

**For hosted Supabase (most common):**
```bash
# First time
DATABASE_URL=... # Add to .env.local
pnpm db:apply:remote

# Daily development
pnpm db:apply:remote  # After schema changes

# Fresh start
pnpm db:setup:remote  # ⚠️ Deletes data!
```

**For local Supabase:**
```bash
# First time
supabase start
pnpm db:apply

# Daily development
pnpm db:setup
```

## Need More Help?

- **Full Guide:** [DATABASE_SCRIPTS_GUIDE.md](../../DATABASE_SCRIPTS_GUIDE.md)
- **Script Details:** [README.md](./README.md)
- **Supabase Docs:** https://supabase.com/docs
