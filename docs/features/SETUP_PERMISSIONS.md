# Setting Up Permissions System - Step by Step Guide

This guide will walk you through applying the permissions schema and using it in your app.

## Prerequisites

- ✅ Database scripts created (done!)
- ✅ Permission system code created (done!)
- ⏳ Need to apply schemas to database
- ⏳ Need to generate TypeScript types

## Step 1: Choose Your Database Type

### Option A: Remote/Hosted Supabase (Most Common) ⭐

**When to use:** You have a Supabase project at https://your-project.supabase.co

**Setup:**
1. Get your database connection string
2. Configure environment variables
3. Apply schemas remotely

### Option B: Local Supabase

**When to use:** You're running Supabase locally for development

**Setup:**
1. Start local Supabase
2. Apply schemas locally
3. Develop with local database

---

## Option A: Remote/Hosted Database Setup

### Step 1.1: Get Database Connection String

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Navigate to: **Settings → Database**
4. Scroll to **Connection String** section
5. Select **"Transaction" mode** (uses connection pooler)
6. Click **"URI"** format
7. Copy the connection string

It looks like:
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Important:** Replace `[YOUR-PASSWORD]` with your actual database password!

### Step 1.2: Configure Environment Variables

Add to `.env.local`:

```bash
# Database Connection (for scripts)
DATABASE_URL=postgresql://postgres.your-project:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# Supabase Configuration (if not already set)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_PROJECT_ID=your-project-id
```

### Step 1.3: Install PostgreSQL Client

The remote scripts need `psql`:

**macOS:**
```bash
brew install postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

**Verify installation:**
```bash
psql --version
```

### Step 1.4: Apply Permissions Schemas

Apply only the permissions schemas (06 and 07):

```bash
# Apply permissions schema
pnpm db:apply:remote 06 07
```

Or apply all schemas if starting fresh:

```bash
# Apply ALL schemas (recommended for first time)
pnpm db:apply:remote
```

### Step 1.5: Verify in Supabase Dashboard

1. Go to **Table Editor** in Supabase Dashboard
2. Check these tables exist:
   - ✅ `permissions` (should have 33 rows)
   - ✅ `role_permissions` (should have ~61 rows)
   - ✅ `space_member_permissions` (empty until you add overrides)

3. Check functions exist:
   - Go to **Database → Functions**
   - Look for: `user_has_permission`, `get_user_permissions`

### Step 1.6: Generate TypeScript Types

```bash
# Generate types from your remote database
pnpm db:types
```

This creates/updates: `src/types/database.types.ts`

---

## Option B: Local Database Setup

### Step 2.1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2.2: Start Local Supabase

```bash
# Start local Supabase (first time may take a while)
supabase start

# Wait for it to start...
# You'll see output with local credentials
```

### Step 2.3: Apply Schemas Locally

```bash
# Apply all schemas to local database
pnpm db:apply
```

Or apply only permissions schemas:

```bash
# Apply specific schemas
pnpm db:apply 06 07
```

### Step 2.4: Generate Types from Local

```bash
# Generate types from local database
pnpm supabase:db:generate
```

This creates: `src/types/database.types.ts`

---

## Step 2: Verify Permissions Setup

### Check Permissions in Database

Run this in **Supabase SQL Editor** (or `psql`):

```sql
-- Check permissions were created (should return 33)
SELECT COUNT(*) FROM permissions;

-- View all permissions
SELECT category, name, description
FROM permissions
ORDER BY category, name;

-- Check admin role permissions (should return 33)
SELECT COUNT(*)
FROM role_permissions
WHERE role = 'admin';

-- Check member role permissions (should return 18)
SELECT COUNT(*)
FROM role_permissions
WHERE role = 'member';

-- Check observer role permissions (should return 10)
SELECT COUNT(*)
FROM role_permissions
WHERE role = 'observer';

-- View role breakdown
SELECT role, COUNT(*) as permission_count
FROM role_permissions
GROUP BY role
ORDER BY role;
```

**Expected output:**
```
 role     | permission_count
----------+------------------
 admin    |               33
 member   |               18
 observer |               10
```

### Check RLS Policies

In Supabase Dashboard:
1. Go to **Authentication → Policies**
2. You should see policies for each table
3. Example: `spaces` table should have:
   - "Space members can view spaces"
   - "Space admins can update spaces"
   - "Space admins can delete spaces"

---

## Step 3: Assign Roles to Existing Users

If you have existing users and spaces, assign them roles:

### Find Your User ID

In SQL Editor:
```sql
-- Find your user ID
SELECT id, email FROM auth.users;
```

### Find Your Space ID

```sql
-- Find your space ID
SELECT id, slug, name FROM spaces;
```

### Assign Yourself as Admin

```sql
-- Make yourself an admin of your space
INSERT INTO space_members (space_id, user_id, role)
VALUES (
  'your-space-id-here',
  'your-user-id-here',
  'admin'
)
ON CONFLICT (space_id, user_id)
DO UPDATE SET role = 'admin';
```

### Or Use the Helper Function

```sql
-- Create a new space and automatically become admin
SELECT create_space_with_admin(
  'My Space',           -- name
  'my-space',          -- slug
  null,                -- avatar_url (optional)
  null                 -- github_org_id (optional)
);
```

---

## Step 4: Use Permissions in Your Code

### Import Permission Constants

```typescript
import { PERMISSIONS } from '@/lib/permissions/constants';
import { PermissionGate } from '@/components/permissions';
```

### Basic Usage Examples

#### 1. Simple Permission Gate

```typescript
// In any component
import { PermissionGate } from '@/components/permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

function MyComponent({ spaceId }: { spaceId: string }) {
  return (
    <PermissionGate spaceId={spaceId} permission={PERMISSIONS.ISSUES.CREATE}>
      <Button>Create Issue</Button>
    </PermissionGate>
  );
}
```

#### 2. Using Hooks

```typescript
import { usePermission } from '@/hooks/api/use-permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

function MyComponent({ spaceId }: { spaceId: string }) {
  const { hasPermission, isLoading } = usePermission(
    spaceId,
    PERMISSIONS.ISSUES.CREATE
  );

  if (isLoading) return <Spinner />;
  if (!hasPermission) return null;

  return <Button>Create Issue</Button>;
}
```

#### 3. Convenience Hook

```typescript
import { useSpacePermissions } from '@/hooks/api/use-permissions';

function MyComponent({ spaceId }: { spaceId: string }) {
  const {
    isAdmin,
    canCreateIssues,
    canInviteMembers,
    canManageRepos,
  } = useSpacePermissions(spaceId);

  return (
    <div>
      {isAdmin && <AdminBadge />}
      {canCreateIssues && <CreateButton />}
      {canInviteMembers && <InviteButton />}
      {canManageRepos && <RepoSettings />}
    </div>
  );
}
```

#### 4. Role-Based Gates

```typescript
import { RoleGate } from '@/components/permissions';
import { ROLES } from '@/lib/permissions/constants';

function MyComponent({ spaceId }: { spaceId: string }) {
  return (
    <>
      <RoleGate spaceId={spaceId} role={ROLES.ADMIN}>
        <AdminPanel />
      </RoleGate>

      <RoleGate spaceId={spaceId} anyRoles={[ROLES.ADMIN, ROLES.MEMBER]}>
        <EditButton />
      </RoleGate>

      <RoleGate spaceId={spaceId} excludeRoles={[ROLES.OBSERVER]}>
        <CreateButton />
      </RoleGate>
    </>
  );
}
```

---

## Step 5: Update Existing Components

### Example: Update Space Settings

**Before:**
```typescript
function SpaceSettings({ spaceId }) {
  return (
    <div>
      <h1>Space Settings</h1>
      <Button>Delete Space</Button>
    </div>
  );
}
```

**After:**
```typescript
import { PermissionGate } from '@/components/permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

function SpaceSettings({ spaceId }) {
  return (
    <div>
      <h1>Space Settings</h1>

      <PermissionGate
        spaceId={spaceId}
        permission={PERMISSIONS.SPACE.DELETE}
        fallback={<p>Only admins can delete spaces</p>}
      >
        <Button variant="destructive">Delete Space</Button>
      </PermissionGate>
    </div>
  );
}
```

### Example: Update Member Management

```typescript
import { useSpacePermissions } from '@/hooks/api/use-permissions';

function MemberList({ spaceId, members }) {
  const { canInviteMembers, canRemoveMembers, canUpdateRoles } =
    useSpacePermissions(spaceId);

  return (
    <div>
      {canInviteMembers && <InviteButton />}

      {members.map(member => (
        <div key={member.id}>
          <span>{member.name}</span>

          {canUpdateRoles && (
            <RoleSelector memberId={member.id} />
          )}

          {canRemoveMembers && (
            <RemoveButton memberId={member.id} />
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Step 6: Test the Permissions

### Test as Different Roles

1. **Create test users** with different roles
2. **Test each role:**
   - Admin - Should see all features
   - Member - Should see create/edit own content
   - Observer - Should only see content (read-only)

### Test Checklist

- [ ] Admin can access all features
- [ ] Admin can invite/remove members
- [ ] Admin can delete space
- [ ] Member can create issues
- [ ] Member can edit own issues
- [ ] Member cannot edit others' issues
- [ ] Member cannot delete space
- [ ] Observer can view content
- [ ] Observer cannot create/edit anything
- [ ] UI elements hide/show correctly
- [ ] RLS prevents unauthorized database access

### Test with SQL

```sql
-- Test permission function
SELECT user_has_permission(
  'your-user-id'::uuid,
  'your-space-id'::uuid,
  'issues:create'
);

-- Get all permissions for a user
SELECT * FROM get_user_permissions(
  'your-user-id'::uuid,
  'your-space-id'::uuid
);
```

---

## Troubleshooting

### "Tables don't exist"

**Problem:** Schemas not applied

**Solution:**
```bash
pnpm db:apply:remote
```

### "Permission denied" on tables

**Problem:** RLS policies not applied

**Solution:**
```bash
# Apply RLS policies
pnpm db:apply:remote 07
```

### "user_has_permission function doesn't exist"

**Problem:** Functions not created

**Solution:**
```bash
# Reapply permissions schema
pnpm db:apply:remote 06
```

### TypeScript errors about missing types

**Problem:** Types not generated

**Solution:**
```bash
pnpm db:types
```

### Permission checks always return false

**Problem:** User not a member of space

**Solution:**
```sql
-- Add yourself to the space
INSERT INTO space_members (space_id, user_id, role)
VALUES ('space-id', 'user-id', 'admin');
```

### Build fails after adding permissions

**Problem:** Missing imports or types

**Solution:**
```bash
# Regenerate types
pnpm db:types

# Rebuild
pnpm build
```

---

## Next Steps

1. ✅ **Schemas applied** - Permissions system is in database
2. ✅ **Types generated** - TypeScript knows about new tables
3. 🎯 **Start using** - Add permission gates to your components
4. 📝 **Test thoroughly** - Verify each role works correctly
5. 🚀 **Deploy** - Push to production when ready

## Quick Reference

### Apply Permissions Schema
```bash
# Remote database
pnpm db:apply:remote 06 07

# Local database
pnpm db:apply 06 07
```

### Generate Types
```bash
# Remote
pnpm db:types

# Local
pnpm supabase:db:generate
```

### Use in Code
```typescript
import { PermissionGate } from '@/components/permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

<PermissionGate spaceId={spaceId} permission={PERMISSIONS.ISSUES.CREATE}>
  <CreateButton />
</PermissionGate>
```

## Documentation

- **Quick Start:** [supabase/scripts/QUICK_START.md](supabase/scripts/QUICK_START.md)
- **Usage Examples:** [src/lib/permissions/README.md](src/lib/permissions/README.md)
- **Code Examples:** [src/examples/permissions-example.tsx](src/examples/permissions-example.tsx)
- **Design Doc:** [docs/ROLES_AND_PERMISSIONS_DESIGN.md](docs/ROLES_AND_PERMISSIONS_DESIGN.md)

---

**Ready to get started? Run this:**

```bash
# For remote database
pnpm db:apply:remote 06 07
pnpm db:types

# For local database
pnpm db:apply 06 07
pnpm supabase:db:generate
```

Then start using permissions in your components! 🎉
