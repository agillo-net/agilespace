# Database Management Scripts - Implementation Summary

## What Was Created

I've created a complete set of scripts to manage your Supabase database with easy reset and schema application capabilities.

### Scripts Created

1. **`supabase/scripts/apply-schemas.sh`** - Apply database schemas
2. **`supabase/scripts/reset-db.sh`** - Reset database (drop all tables)
3. **`supabase/scripts/seed-data.sh`** - Seed sample data
4. **`supabase/scripts/combine-schemas.sh`** - Combine schemas into one file

### Package.json Commands Added

```json
{
  "db:reset": "Reset database (delete all data)",
  "db:apply": "Apply database schemas",
  "db:seed": "Seed sample data",
  "db:combine": "Combine all schemas into one file",
  "db:setup": "Complete setup (reset + apply + seed)",
  "db:types": "Generate TypeScript types from database"
}
```

### Documentation Created

1. **`DATABASE_SCRIPTS_GUIDE.md`** - Complete usage guide
2. **`supabase/scripts/README.md`** - Detailed script documentation
3. **`.env.example`** - Updated with all required variables

## Quick Start

### 1. Setup Environment

```bash
# Copy example file
cp .env.example .env

# Edit with your credentials
nano .env
```

Required variables:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_PROJECT_ID=your-project-id
```

### 2. Choose Your Method

#### Option A: Supabase CLI (Recommended)

```bash
# Install
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply schemas
pnpm db:apply

# Generate types
pnpm db:types
```

#### Option B: Manual via Dashboard

```bash
# Combine all schemas
pnpm db:combine

# This creates: supabase/combined-schema.sql
# Copy contents and paste into Supabase SQL Editor
```

## Usage Examples

### First Time Setup

```bash
# Apply all schemas
pnpm db:apply

# Generate TypeScript types
pnpm db:types
```

### Daily Development

```bash
# Fresh start
pnpm db:setup

# This does:
# 1. Reset database
# 2. Apply all schemas
# 3. Seed sample data
```

### Making Schema Changes

```bash
# Create new schema file
# supabase/schemas/08_new_feature.sql

# Test it
pnpm db:reset -- --force
pnpm db:apply

# Update types
pnpm db:types
```

### Quick Testing

```bash
# Apply specific schemas only
pnpm db:apply 06 07

# Combine specific schemas
pnpm db:combine 06 07
```

## Available Commands

| Command | Description | Confirmation Required |
|---------|-------------|----------------------|
| `pnpm db:apply` | Apply database schemas | No |
| `pnpm db:apply 06 07` | Apply specific schemas | No |
| `pnpm db:reset` | Drop all tables | Yes |
| `pnpm db:reset -- --force` | Drop all tables (no confirm) | No |
| `pnpm db:seed` | Insert sample data | No |
| `pnpm db:combine` | Combine schemas to file | No |
| `pnpm db:setup` | Reset + Apply + Seed | No (auto --force) |
| `pnpm db:types` | Generate TS types | No |

## How the Scripts Work

### Script Execution Priority

The scripts try multiple methods in order:

1. **Supabase CLI** (if installed and linked)
   ```bash
   supabase db execute -f schema.sql
   ```

2. **PostgreSQL psql** (if DATABASE_URL is set)
   ```bash
   psql $DATABASE_URL -f schema.sql
   ```

3. **Manual Instructions** (fallback)
   - Prints SQL to console
   - Provides copy-paste instructions

### Schema Application Order

Schemas are applied in numerical order:
```
01_profiles.sql
02_spaces.sql
03_tracks.sql
04_sessions.sql
05_tags.sql
06_permissions.sql
07_rls_policies.sql
```

### Reset Order

Tables are dropped in reverse dependency order to avoid foreign key errors:
```
session_tags → tags → sessions → tracks
→ space_member_permissions → role_permissions → permissions
→ space_members → spaces → profiles
```

## Features

### ✅ Safe Operations

- **Confirmation prompts** for destructive operations
- **Force flag** available for automation
- **Error handling** with clear messages
- **Fallback options** if tools aren't available

### ✅ Flexible Execution

- **Supabase CLI** - Best integration
- **Direct psql** - Standard PostgreSQL
- **Manual mode** - Always works

### ✅ Developer-Friendly

- **Colored output** for better readability
- **Progress indicators** during execution
- **Helpful error messages** with solutions
- **Automatic clipboard** copy (when available)

### ✅ Production-Ready

- **Version control friendly** - All schemas tracked
- **Idempotent operations** - Safe to rerun
- **Environment-specific** - Via .env files
- **CI/CD compatible** - Can be automated

## Troubleshooting

### Scripts Won't Execute

**Problem:** Permission denied

**Solution:**
```bash
chmod +x supabase/scripts/*.sh
```

### Can't Connect to Database

**Problem:** Missing credentials or not linked

**Solutions:**

1. **For Supabase CLI:**
   ```bash
   supabase link --project-ref your-project-ref
   supabase status
   ```

2. **For psql:**
   ```bash
   # Add to .env
   DATABASE_URL=postgresql://...
   ```

3. **Manual fallback:**
   ```bash
   pnpm db:combine
   # Copy SQL to Supabase Dashboard
   ```

### Types Not Generating

**Problem:** Missing project ID

**Solution:**
```bash
# Add to .env
SUPABASE_PROJECT_ID=your-project-id

# Or use local
supabase gen types typescript --local > src/types/database.types.ts
```

### Build Errors

**Problem:** Types out of sync

**Solution:**
```bash
pnpm db:types
pnpm build
```

## Best Practices

### 1. Always Use Version Control

```bash
# Commit schema changes
git add supabase/schemas/
git commit -m "feat: add permissions system"

# Keep types in sync
pnpm db:types
git add src/types/database.types.ts
git commit -m "chore: update types"
```

### 2. Never Modify Existing Schemas

Create new migration files instead:

```bash
# ❌ Don't edit: 01_profiles.sql
# ✅ Create new: 08_add_bio_column.sql
```

### 3. Test Before Production

```bash
# Test on dev database
pnpm db:setup
pnpm dev

# Then apply to production
# (via Supabase Dashboard or CLI)
```

### 4. Keep .env Secure

```bash
# Never commit .env
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore
```

### 5. Backup Before Reset

```bash
# Backup important data
pg_dump $DATABASE_URL > backup.sql

# Then reset
pnpm db:reset
```

## Integration with Permissions System

The scripts work perfectly with the newly implemented permissions system:

```bash
# 1. Apply permissions schema
pnpm db:apply 06

# 2. Apply RLS policies
pnpm db:apply 07

# 3. Generate types
pnpm db:types

# 4. Start using in code
import { PERMISSIONS } from '@/lib/permissions/constants';
```

## Workflow Examples

### New Team Member Setup

```bash
git clone <repo>
pnpm install
cp .env.example .env
# Edit .env with credentials
pnpm db:apply
pnpm db:seed
pnpm db:types
pnpm dev
```

### Daily Development

```bash
git pull
pnpm db:apply  # If schemas changed
pnpm db:types  # If schemas changed
pnpm dev
```

### Creating a Feature

```bash
# 1. Create feature with database changes
# supabase/schemas/08_new_feature.sql

# 2. Test locally
pnpm db:setup
pnpm dev

# 3. Commit
git add supabase/schemas/08_new_feature.sql
pnpm db:types
git add src/types/database.types.ts
git commit -m "feat: add new feature"
```

### Deploying to Production

```bash
# 1. Test everything locally
pnpm db:reset -- --force
pnpm db:apply
pnpm build

# 2. Combine schemas
pnpm db:combine

# 3. Apply to production
# Use Supabase Dashboard SQL Editor
# Or: supabase link --project-ref prod-ref && pnpm db:apply

# 4. Verify
# Check tables in Supabase Dashboard
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
│   │   ├── 06_permissions.sql      ← Permissions system
│   │   └── 07_rls_policies.sql     ← Row Level Security
│   ├── scripts/
│   │   ├── apply-schemas.sh        ← Apply schemas
│   │   ├── reset-db.sh             ← Reset database
│   │   ├── seed-data.sh            ← Seed data
│   │   ├── combine-schemas.sh      ← Combine schemas
│   │   ├── apply-schemas.ts        ← TS version (experimental)
│   │   ├── reset-db.ts             ← TS version (experimental)
│   │   └── README.md               ← Script documentation
│   ├── combined-schema.sql         ← Generated file
│   └── README.md                   ← Database documentation
├── src/
│   ├── lib/
│   │   └── permissions/
│   │       ├── constants.ts        ← Permission constants
│   │       └── queries.ts          ← Permission queries
│   └── types/
│       └── database.types.ts       ← Generated types
├── .env.example                    ← Environment template
├── .env                            ← Your credentials (gitignored)
├── DATABASE_SCRIPTS_GUIDE.md       ← This guide
├── DATABASE_MANAGEMENT_SUMMARY.md  ← Quick reference
├── PERMISSIONS_SETUP.md            ← Permissions setup
└── package.json                    ← Scripts defined here
```

## Documentation

- **`DATABASE_SCRIPTS_GUIDE.md`** - Complete guide (you are here)
- **`supabase/scripts/README.md`** - Technical details
- **`PERMISSIONS_SETUP.md`** - Permissions system setup
- **`supabase/README.md`** - Database schema documentation

## Success Indicators

Your setup is working correctly if:

- ✅ `pnpm db:apply` runs without errors
- ✅ `pnpm db:types` generates types successfully
- ✅ `pnpm build` completes successfully
- ✅ You can see tables in Supabase Dashboard
- ✅ RLS policies are visible in dashboard
- ✅ Permissions table has 33 rows

## Next Steps

1. **Apply the schemas** to your database:
   ```bash
   pnpm db:apply
   ```

2. **Generate TypeScript types**:
   ```bash
   pnpm db:types
   ```

3. **Start using permissions** in your code:
   ```typescript
   import { PermissionGate } from '@/components/permissions';
   import { PERMISSIONS } from '@/lib/permissions/constants';
   ```

4. **See examples** at:
   - `src/examples/permissions-example.tsx`
   - `src/lib/permissions/README.md`

## Support

If you need help:

1. Check `DATABASE_SCRIPTS_GUIDE.md`
2. Review `supabase/scripts/README.md`
3. Check Supabase Dashboard for errors
4. Verify `.env` configuration
5. Try manual method as fallback

---

**Quick Command Reference:**

```bash
pnpm db:apply       # Apply schemas
pnpm db:reset       # Reset database
pnpm db:seed        # Add sample data
pnpm db:setup       # Do all three
pnpm db:types       # Generate types
pnpm db:combine     # Create combined SQL
```

✅ **All scripts are ready to use!**
