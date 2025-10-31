# Roles and Permissions System Setup Guide

This guide will help you implement the new roles and permissions system in your AgilSpace application.

## Overview

The permissions system has been implemented with:
- Database-driven permissions stored in Supabase
- Three roles: **Admin**, **Member**, and **Observer**
- 33 granular permissions across 7 categories
- Row Level Security (RLS) policies enforcing permissions at the database level
- React hooks and components for easy client-side permission checks

## Prerequisites

- Supabase project set up and running
- Supabase CLI installed (optional but recommended)
- Node.js and pnpm installed

## Step 1: Apply Database Schemas

### Option A: Using Supabase CLI (Recommended)

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Apply the permissions schema
supabase db push
```

### Option B: Manual Application

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Execute the following files in order:
   - `supabase/schemas/06_permissions.sql`
   - `supabase/schemas/07_rls_policies.sql`

## Step 2: Verify Database Setup

Run these queries in the Supabase SQL Editor to verify:

```sql
-- Check permissions were created (should return 33)
SELECT COUNT(*) FROM permissions;

-- Check admin role permissions (should return 33)
SELECT COUNT(*) FROM role_permissions WHERE role = 'admin';

-- Check member role permissions (should return 18)
SELECT COUNT(*) FROM role_permissions WHERE role = 'member';

-- Check observer role permissions (should return 10)
SELECT COUNT(*) FROM role_permissions WHERE role = 'observer';

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

## Step 3: Update TypeScript Database Types

Generate new TypeScript types from your updated database:

```bash
# Generate types
supabase gen types typescript --project-id your-project-ref > src/types/database.types.ts
```

## Step 4: Install Dependencies

The permissions system is already integrated with your existing dependencies:
- `@tanstack/react-query` for data fetching
- `@supabase/supabase-js` for database access

## Step 5: Use Permission Checks in Your Code

### Basic Permission Check

```typescript
import { usePermission } from '@/hooks/api/use-permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

function MyComponent({ spaceId }: { spaceId: string }) {
  const { hasPermission, isLoading } = usePermission(
    spaceId,
    PERMISSIONS.ISSUES.CREATE
  );

  if (isLoading) return <div>Loading...</div>;
  if (!hasPermission) return null;

  return <CreateIssueButton />;
}
```

### Using Permission Gate Component

```typescript
import { PermissionGate } from '@/components/permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

function MyComponent({ spaceId }: { spaceId: string }) {
  return (
    <PermissionGate
      spaceId={spaceId}
      permission={PERMISSIONS.ISSUES.CREATE}
      fallback={<UpgradePrompt />}
    >
      <CreateIssueButton />
    </PermissionGate>
  );
}
```

### Using Role Gate Component

```typescript
import { RoleGate } from '@/components/permissions';
import { ROLES } from '@/lib/permissions/constants';

function MyComponent({ spaceId }: { spaceId: string }) {
  return (
    <RoleGate spaceId={spaceId} role={ROLES.ADMIN}>
      <AdminPanel />
    </RoleGate>
  );
}
```

### Checking Multiple Permissions

```typescript
import { usePermissions } from '@/hooks/api/use-permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

function MyComponent({ spaceId }: { spaceId: string }) {
  const { permissions, hasPermission } = usePermissions(spaceId, [
    PERMISSIONS.ISSUES.UPDATE_OWN,
    PERMISSIONS.ISSUES.UPDATE_ALL,
  ]);

  const canUpdate =
    hasPermission(PERMISSIONS.ISSUES.UPDATE_OWN) ||
    hasPermission(PERMISSIONS.ISSUES.UPDATE_ALL);

  return <EditButton disabled={!canUpdate} />;
}
```

### Convenience Hook for Common Checks

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

## Step 6: Update Existing Components

Review and update your existing components to use permission checks:

### Components to Update

1. **Space Settings** - Check `PERMISSIONS.SPACE.UPDATE`
2. **Member Management** - Check `PERMISSIONS.MEMBERS.INVITE`, `PERMISSIONS.MEMBERS.REMOVE`
3. **Issue Creation** - Check `PERMISSIONS.ISSUES.CREATE`
4. **Issue Editing** - Check `PERMISSIONS.ISSUES.UPDATE_OWN` or `PERMISSIONS.ISSUES.UPDATE_ALL`
5. **Repository Management** - Check `PERMISSIONS.REPOS.MANAGE`
6. **Analytics Export** - Check `PERMISSIONS.ANALYTICS.EXPORT`

### Example: Update Create Issue Button

```typescript
// Before
function CreateIssueButton() {
  return <Button>Create Issue</Button>;
}

// After
import { PermissionGate } from '@/components/permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

function CreateIssueButton({ spaceId }: { spaceId: string }) {
  return (
    <PermissionGate spaceId={spaceId} permission={PERMISSIONS.ISSUES.CREATE}>
      <Button>Create Issue</Button>
    </PermissionGate>
  );
}
```

## Step 7: Testing

### Test Different Roles

1. Create test users with different roles
2. Verify each role has correct permissions
3. Test permission overrides

### Test Checklist

- [ ] Admin can access all features
- [ ] Member can create and edit own content
- [ ] Member cannot delete other members' content
- [ ] Observer can only view content
- [ ] Observer cannot create or edit anything
- [ ] RLS policies prevent unauthorized database access
- [ ] Permission checks work correctly in UI
- [ ] Permission overrides work as expected

### Testing Script

```typescript
// test-permissions.ts
import { checkUserPermission } from '@/lib/permissions/queries';
import { PERMISSIONS } from '@/lib/permissions/constants';

async function testPermissions(spaceId: string) {
  const tests = [
    { permission: PERMISSIONS.ISSUES.CREATE, expected: true },
    { permission: PERMISSIONS.SPACE.DELETE, expected: false },
    // Add more tests
  ];

  for (const test of tests) {
    const hasPermission = await checkUserPermission(spaceId, test.permission);
    console.log(
      `${test.permission}: ${hasPermission ? '✓' : '✗'} (expected: ${test.expected})`
    );
  }
}
```

## Step 8: Migration Plan for Existing Data

If you have existing users and spaces:

### Assign Roles to Existing Space Members

```sql
-- Update existing space members to have the 'member' role by default
UPDATE space_members
SET role = 'member'
WHERE role IS NULL;

-- Make the first member of each space an admin
WITH first_members AS (
  SELECT DISTINCT ON (space_id) id, space_id
  FROM space_members
  ORDER BY space_id, joined_at ASC
)
UPDATE space_members sm
SET role = 'admin'
FROM first_members fm
WHERE sm.id = fm.id;
```

## Troubleshooting

### Issue: Permission checks return false for admin

**Solution**: Verify the user is actually an admin:
```sql
SELECT role FROM space_members WHERE user_id = 'user-uuid' AND space_id = 'space-uuid';
```

### Issue: RLS policies blocking legitimate queries

**Solution**: Check if RLS is properly configured:
```sql
-- View all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Temporarily disable RLS for testing (CAUTION: Only in development!)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### Issue: TypeScript errors about missing types

**Solution**: Regenerate database types:
```bash
supabase gen types typescript --project-id your-project-ref > src/types/database.types.ts
```

## Next Steps

1. **Add Audit Logging**: Track permission changes and sensitive actions
2. **Create Admin UI**: Build interface for managing roles and permission overrides
3. **Add Custom Roles**: Extend system to support custom roles per space
4. **Implement API Keys**: Add service account permissions for integrations

## Resources

- [Design Document](/docs/ROLES_AND_PERMISSIONS_DESIGN.md)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Database README](/supabase/README.md)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the database README
3. Verify RLS policies are correct
4. Check browser console for errors
5. Inspect network requests to Supabase

---

**Important**: Always test permission changes in a development environment before deploying to production.
