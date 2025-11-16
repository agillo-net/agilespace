# Supabase Database Management Scripts

This directory contains scripts to help you manage your Supabase database during development.

## Available Scripts

### 1. Apply Schemas

Apply database schema files to your Supabase database.

```bash
# Apply all schemas in order
pnpm db:apply

# Apply specific schemas by number
pnpm db:apply 06 07

# Show help
pnpm db:apply --help
```

**What it does:**
- Reads SQL files from `supabase/schemas/` directory
- Applies them in numerical order (01, 02, 03, etc.)
- Uses Supabase CLI if available, otherwise falls back to psql or manual instructions

### 2. Reset Database

Drop all tables and reset the database to a clean state.

**⚠️ WARNING: This will delete ALL data in your database!**

```bash
# With confirmation prompt
pnpm db:reset

# Skip confirmation (use with caution!)
pnpm db:reset -- --force
```

**What it does:**
- Drops all tables in reverse dependency order
- Drops all custom functions
- Provides a clean slate for reapplying schemas

### 3. Seed Data

Insert sample data for development.

```bash
pnpm db:seed
```

**What it does:**
- Creates a sample space
- Adds sample tags
- Inserts test data (you may need to customize user IDs)

### 4. Combine Schemas

Combine all schema files into a single SQL file for easy copy-paste.

```bash
# Combine all schemas
pnpm db:combine

# Combine specific schemas
pnpm db:combine 06 07
```

**What it does:**
- Reads all schema files
- Combines them into `supabase/combined-schema.sql`
- Copies the result to your clipboard (if available)
- Useful for manual application via Supabase Dashboard

### 5. Complete Setup

Reset database, apply schemas, and seed data in one command.

```bash
pnpm db:setup
```

**What it does:**
- Runs `db:reset --force` (no confirmation)
- Runs `db:apply`
- Runs `db:seed`

### 6. Generate Types

Generate TypeScript types from your Supabase database.

```bash
pnpm db:types
```

**What it does:**
- Connects to your Supabase project
- Generates TypeScript types
- Saves to `src/types/database.types.ts`

**Requirements:**
- `SUPABASE_PROJECT_ID` environment variable must be set

## Setup Requirements

The scripts support three execution methods (in order of preference):

### Method 1: Supabase CLI (Recommended)

Install and link the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Test connection
supabase status
```

**Pros:**
- Best integration with Supabase
- Automatic authentication
- Easiest to use

### Method 2: PostgreSQL Direct Connection

Set the `DATABASE_URL` environment variable:

```bash
# Add to .env file
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

Get the connection string from:
Supabase Dashboard → Project Settings → Database → Connection string

**Requirements:**
- `psql` command must be installed
- Connection must not require additional authentication

**Pros:**
- Direct database access
- No additional tools needed if you have PostgreSQL

### Method 3: Manual Application

If neither CLI nor DATABASE_URL is available, the scripts will provide:
- The SQL to copy
- Instructions for manual application via Supabase Dashboard

## Environment Variables

Required in `.env` file:

```bash
# Required for all operations
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Required for scripts (Method 1 or 2)
SUPABASE_SERVICE_KEY=your-service-role-key

# Required for type generation
SUPABASE_PROJECT_ID=your-project-id

# Optional: For direct connection (Method 2)
DATABASE_URL=postgresql://...
```

See `.env.example` for a complete template.

## Common Workflows

### Initial Setup

When setting up the database for the first time:

```bash
# 1. Apply all schemas
pnpm db:apply

# 2. Seed with sample data (optional)
pnpm db:seed

# 3. Generate TypeScript types
pnpm db:types
```

### Testing with Production Data

When you need to test with real production data:

```bash
# 1. Ensure local Supabase is running
supabase start

# 2. Pull production database to local
./supabase/scripts/pull-remote-to-local.sh

# 3. Your user is automatically synced, but if you need to re-sync:
./supabase/scripts/sync-local-user.sh

# 4. Test your app with real data at http://localhost:YOUR_PORT
```

**Note:** The sync script will automatically use your git config email. If you need a different email:
```bash
./supabase/scripts/sync-local-user.sh your.email@example.com
```

### Development Cycle

When making schema changes:

```bash
# 1. Make changes to schema files

# 2. Reset and reapply everything
pnpm db:setup

# 3. Regenerate types
pnpm db:types
```

### Testing Schema Changes

When testing new migrations:

```bash
# 1. Apply only the new schema file
pnpm db:apply 08  # Applies 08_*.sql

# 2. Test the changes

# 3. If needed, reset and try again
pnpm db:reset
pnpm db:apply
```

### Quick Copy-Paste

When you prefer to use the Supabase Dashboard:

```bash
# Combine all schemas and copy to clipboard
pnpm db:combine

# Then paste into Supabase SQL Editor and execute
```

## Troubleshooting

### "Command not found: supabase"

**Solution:** Install Supabase CLI or set DATABASE_URL

```bash
npm install -g supabase
```

### "Permission denied"

**Solution:** Make scripts executable

```bash
chmod +x supabase/scripts/*.sh
```

### "Authentication failed"

**Solution:** Check your environment variables

```bash
# Verify .env file has correct values
cat .env

# Test Supabase connection
supabase status
```

### Scripts don't connect

**Solutions:**

1. **Use Supabase CLI:**
   ```bash
   supabase link --project-ref your-ref
   ```

2. **Set DATABASE_URL:**
   ```bash
   # Add to .env
   DATABASE_URL=your-connection-string
   ```

3. **Manual application:**
   ```bash
   pnpm db:combine
   # Then manually paste SQL into dashboard
   ```

### Types not generating

**Solution:** Ensure SUPABASE_PROJECT_ID is set

```bash
# Add to .env
SUPABASE_PROJECT_ID=your-project-id

# Or use local generation
supabase gen types typescript --local > src/types/database.types.ts
```

## Script Files

- `apply-schemas.sh` - Apply schema files to database
- `reset-db.sh` - Drop all tables and functions
- `seed-data.sh` - Insert sample development data
- `combine-schemas.sh` - Combine all schemas into one file
- `apply-schemas.ts` - TypeScript version (experimental)
- `reset-db.ts` - TypeScript version (experimental)

## Best Practices

1. **Always backup before reset:**
   ```bash
   # Export data before resetting
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **Use version control:**
   - All schema files are numbered
   - Never modify existing schema files
   - Create new migration files for changes

3. **Test locally first:**
   - Use Supabase local development
   - Test migrations on a dev project
   - Only apply to production when confident

4. **Keep .env secure:**
   - Never commit `.env` to git
   - Use `.env.example` as template
   - Rotate keys if exposed

### 7. Pull Remote Database to Local

Pull your production database data to your local Supabase instance for testing with real data.

```bash
# Pull production data to local
./supabase/scripts/pull-remote-to-local.sh

# Skip local backup for faster execution
./supabase/scripts/pull-remote-to-local.sh --skip-backup
```

**What it does:**
- Backs up your current local database (optional)
- Downloads a dump of your production database
- Clears your local database
- Restores the production data locally
- Fixes schema permissions automatically
- Syncs your user with all spaces

**Requirements:**
- Local Supabase must be running (`supabase start`)
- `DATABASE_URL` configured in `.env` file (or `VITE_SUPABASE_URL` + `SUPABASE_DB_PASSWORD`)
- PostgreSQL client tools (`pg_dump` and `psql`)

**⚠️ Important Notes:**
- This pulls real production data - handle with care!
- Backups are kept in `supabase/backups/` (last 10 of each type)
- Your local user will be automatically added to all spaces as admin

### 8. Sync Local User with Spaces

Add your user to all spaces in the local database as an admin member.

```bash
# Uses email from git config
./supabase/scripts/sync-local-user.sh

# Specify email manually
./supabase/scripts/sync-local-user.sh your.email@example.com
```

**What it does:**
- Finds or creates a user with the specified email
- Adds the user to all spaces as admin
- Allows you to test with proper Row Level Security (RLS)

**When to use:**
- After pulling production data
- When you need to test authenticated API endpoints
- When setting up a new developer's local environment

**Note:** This is automatically run by `pull-remote-to-local.sh`

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/sql-editor)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
