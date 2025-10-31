# Database Management Scripts Guide

Complete guide for managing your Supabase database using the included scripts.

## Quick Start

```bash
# 1. Setup environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 2. Install Supabase CLI (recommended)
npm install -g supabase

# 3. Link to your project
supabase link --project-ref your-project-ref

# 4. Apply database schemas
pnpm db:apply

# 5. Generate TypeScript types
pnpm db:types
```

## Available Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `pnpm db:apply` | Apply all schema files to database |
| `pnpm db:reset` | Drop all tables (⚠️ deletes data!) |
| `pnpm db:seed` | Insert sample development data |
| `pnpm db:combine` | Combine schemas into one file |
| `pnpm db:setup` | Reset + Apply + Seed in one command |
| `pnpm db:types` | Generate TypeScript types from database |

### Detailed Usage

#### Apply Schemas

```bash
# Apply all schemas in order
pnpm db:apply

# Apply specific schemas by number
pnpm db:apply 06 07

# Show help
pnpm db:apply --help
```

**When to use:**
- First time setting up the database
- After creating new schema files
- When deploying to a new environment

#### Reset Database

```bash
# Interactive confirmation
pnpm db:reset

# Skip confirmation (dangerous!)
pnpm db:reset -- --force
```

**⚠️ WARNING:** This deletes ALL data in your database!

**When to use:**
- Starting fresh in development
- Testing schema changes from scratch
- Fixing broken migrations

#### Seed Data

```bash
pnpm db:seed
```

**When to use:**
- After applying schemas to a fresh database
- Need sample data for testing
- Development environment setup

#### Combine Schemas

```bash
# Combine all schemas
pnpm db:combine

# Combine specific schemas
pnpm db:combine 06 07
```

**When to use:**
- You prefer using Supabase Dashboard SQL Editor
- Sharing schema with team members
- Creating deployment scripts

**Output:** Creates `supabase/combined-schema.sql` and copies to clipboard

#### Complete Setup

```bash
pnpm db:setup
```

**What it does:**
1. Drops all tables
2. Applies all schemas
3. Seeds sample data

**When to use:**
- Complete fresh start
- Automated testing setup
- Quick development environment reset

#### Generate Types

```bash
pnpm db:types
```

**When to use:**
- After applying new schemas
- After modifying table structure
- When TypeScript types are out of sync

**Requirements:**
- `SUPABASE_PROJECT_ID` in `.env`
- Supabase CLI installed

## Setup Methods

Choose the method that works best for your workflow:

### Method 1: Supabase CLI (Recommended) ⭐

**Setup:**
```bash
# Install
npm install -g supabase

# Link to project
supabase link --project-ref your-project-ref

# Verify
supabase status
```

**Pros:**
- ✅ Best integration
- ✅ Automatic authentication
- ✅ Local development support
- ✅ Easiest to use

**Cons:**
- Requires additional tool installation

### Method 2: Direct PostgreSQL Connection

**Setup:**
```bash
# Get connection string from Supabase Dashboard:
# Settings > Database > Connection string

# Add to .env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Pros:**
- ✅ Direct database access
- ✅ Works with standard PostgreSQL tools

**Cons:**
- Requires PostgreSQL client (`psql`)
- Need to manage credentials manually

### Method 3: Manual (Fallback)

**Process:**
1. Run `pnpm db:combine`
2. Copy the generated SQL
3. Paste into Supabase Dashboard SQL Editor
4. Execute

**Pros:**
- ✅ No setup required
- ✅ Works anywhere

**Cons:**
- Manual process
- Slower for repeated operations

## Environment Variables

### Required

```bash
# Supabase Project URL
VITE_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anonymous Key (safe to expose in frontend)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Required for Scripts

```bash
# Service Role Key (keep secret!)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Project ID (for type generation)
SUPABASE_PROJECT_ID=abcdefghijklmnop
```

### Optional

```bash
# Direct PostgreSQL connection
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

# GitHub Configuration
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID=...
SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET=...
```

### Finding Your Values

1. **Project URL & Keys:**
   - Supabase Dashboard → Settings → API

2. **Project ID:**
   - Supabase Dashboard → Settings → General
   - Or from the URL: `https://app.supabase.com/project/[PROJECT_ID]`

3. **Database URL:**
   - Supabase Dashboard → Settings → Database → Connection string
   - Select "URI" mode

## Common Workflows

### Initial Project Setup

```bash
# 1. Clone repository
git clone your-repo

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 4. Setup Supabase CLI
npm install -g supabase
supabase link --project-ref your-project-ref

# 5. Apply schemas
pnpm db:apply

# 6. Generate types
pnpm db:types

# 7. Seed data (optional)
pnpm db:seed
```

### Making Schema Changes

```bash
# 1. Create new schema file
# supabase/schemas/08_new_feature.sql

# 2. Test locally
pnpm db:reset -- --force
pnpm db:apply

# 3. If successful, commit
git add supabase/schemas/08_new_feature.sql
git commit -m "feat: add new feature schema"

# 4. Update types
pnpm db:types
git add src/types/database.types.ts
git commit -m "chore: update database types"
```

### Daily Development

```bash
# Fresh start each morning
pnpm db:setup

# After pulling changes
git pull
pnpm db:apply
pnpm db:types

# Before committing schema changes
pnpm db:reset -- --force
pnpm db:apply
# Test your changes
```

### Production Deployment

```bash
# 1. Test schemas locally
pnpm db:reset -- --force
pnpm db:apply

# 2. Generate combined schema
pnpm db:combine

# 3. Apply to production via Supabase Dashboard
#    (Or use Supabase CLI linked to production)

# 4. Verify
#    Check tables in Supabase Dashboard

# 5. Update types
pnpm db:types
```

## Troubleshooting

### "Command not found: supabase"

**Problem:** Supabase CLI is not installed

**Solution:**
```bash
npm install -g supabase
```

### "Permission denied"

**Problem:** Scripts are not executable

**Solution:**
```bash
chmod +x supabase/scripts/*.sh
```

### "Missing environment variables"

**Problem:** `.env` file is not configured

**Solution:**
```bash
# Copy example
cp .env.example .env

# Edit with your values
nano .env  # or use your preferred editor
```

### "Authentication failed"

**Problem:** Wrong credentials or not linked

**Solution:**
```bash
# Check environment variables
cat .env

# Re-link to Supabase
supabase link --project-ref your-project-ref

# Or use DATABASE_URL instead
```

### Scripts hang or timeout

**Problem:** Network issues or wrong URL

**Solutions:**
1. Check `VITE_SUPABASE_URL` is correct
2. Verify project is not paused
3. Check firewall/VPN settings
4. Use manual method as fallback

### Types not generating

**Problem:** Missing project ID or permission

**Solutions:**
```bash
# Check project ID is set
echo $SUPABASE_PROJECT_ID

# Or use local generation (if using local Supabase)
supabase gen types typescript --local > src/types/database.types.ts
```

### "Table already exists" errors

**Problem:** Schema already applied

**Solutions:**
- This is often harmless - check if tables exist in dashboard
- If you want to start fresh: `pnpm db:reset` then `pnpm db:apply`
- Errors are expected if reapplying schemas

## Best Practices

### 1. Version Control

```bash
# Always commit schema files
git add supabase/schemas/
git commit -m "feat: add new schema"

# Keep types in sync
pnpm db:types
git add src/types/database.types.ts
git commit -m "chore: update types"
```

### 2. Never Modify Existing Schemas

❌ **Wrong:**
```bash
# Don't modify 01_profiles.sql after it's applied
```

✅ **Right:**
```bash
# Create a new migration file
# supabase/schemas/08_add_new_column.sql
ALTER TABLE profiles ADD COLUMN bio text;
```

### 3. Test Before Production

```bash
# Always test on a dev database first
pnpm db:reset -- --force
pnpm db:apply

# Verify everything works
pnpm dev

# Then apply to production
```

### 4. Backup Before Reset

```bash
# Backup data before destructive operations
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Then reset
pnpm db:reset
```

### 5. Keep .env Secure

```bash
# Never commit .env
echo ".env" >> .gitignore

# Use separate .env for different environments
.env.local      # Local development
.env.staging    # Staging environment
.env.production # Production (never commit!)
```

### 6. Document Schema Changes

Always add comments to your SQL files:

```sql
-- Add bio field to user profiles
-- Created: 2025-01-15
-- Author: Your Name
ALTER TABLE profiles ADD COLUMN bio text;
```

## Advanced Usage

### Running Specific Schema Numbers

```bash
# Apply only permissions schema
pnpm db:apply 06

# Apply permissions and RLS policies
pnpm db:apply 06 07
```

### Combining Specific Schemas

```bash
# Combine only new schemas
pnpm db:combine 06 07 08
```

### Using with CI/CD

```yaml
# Example GitHub Actions workflow
- name: Apply Database Schemas
  run: |
    pnpm install -g supabase
    echo "${{ secrets.SUPABASE_ACCESS_TOKEN }}" | supabase login
    supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
    pnpm db:apply
```

## File Structure

```
agilespace/
├── supabase/
│   ├── schemas/
│   │   ├── 01_profiles.sql
│   │   ├── 02_spaces.sql
│   │   ├── 03_tracks.sql
│   │   ├── 04_sessions.sql
│   │   ├── 05_tags.sql
│   │   ├── 06_permissions.sql
│   │   └── 07_rls_policies.sql
│   ├── scripts/
│   │   ├── apply-schemas.sh
│   │   ├── reset-db.sh
│   │   ├── seed-data.sh
│   │   ├── combine-schemas.sh
│   │   └── README.md
│   ├── combined-schema.sql  (generated)
│   └── README.md
├── .env.example
├── .env  (gitignored)
└── package.json
```

## Getting Help

### Check Script Help

```bash
pnpm db:apply --help
```

### View Script Source

```bash
cat supabase/scripts/apply-schemas.sh
```

### Supabase CLI Help

```bash
supabase help
supabase db help
```

### Documentation

- [Scripts README](supabase/scripts/README.md)
- [Supabase README](supabase/README.md)
- [Permissions Setup](PERMISSIONS_SETUP.md)

## Support

If you encounter issues:

1. Check this guide
2. Review `supabase/scripts/README.md`
3. Check Supabase Dashboard for errors
4. Verify environment variables
5. Try manual application method

---

**Quick Reference Card**

| Task | Command |
|------|---------|
| First time setup | `pnpm db:apply && pnpm db:types` |
| Fresh start | `pnpm db:setup` |
| Update schema | `pnpm db:apply && pnpm db:types` |
| Copy all schemas | `pnpm db:combine` |
| Generate types | `pnpm db:types` |
| Reset everything | `pnpm db:reset` |
