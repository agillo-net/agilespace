# ✅ Permissions System Successfully Applied!

The permissions system has been applied to your local Supabase database.

## What Was Created

### Tables Created ✅

1. **`permissions`** - 32 permissions across 7 categories
2. **`role_permissions`** - 59 role-permission mappings
3. **`space_member_permissions`** - Permission overrides (empty initially)

### Roles Configured ✅

- **Admin**: 32 permissions (full access)
- **Member**: 18 permissions (standard access)
- **Observer**: 9 permissions (read-only)

### Functions Created ✅

1. `user_has_permission(user_id, space_id, permission)` - Check single permission
2. `get_user_permissions(user_id, space_id)` - Get all user permissions
3. `create_space_with_admin(name, slug, ...)` - Create space with admin

### TypeScript Types Generated ✅

Updated: `src/types/database.types.ts`

## Next Steps

### 1. Assign Yourself as Admin

If you already have a space, make yourself an admin:

```sql
-- Find your user ID and space ID
SELECT id, email FROM auth.users;
SELECT id, slug, name FROM spaces;

-- Assign yourself as admin (replace the IDs)
INSERT INTO space_members (space_id, user_id, role)
VALUES (
  'your-space-id-here',
  'your-user-id-here',
  'admin'
)
ON CONFLICT (space_id, user_id)
DO UPDATE SET role = 'admin';
```

Run this in Supabase Studio: http://127.0.0.1:54323

### 2. Start Using Permissions in Your Code

#### Example 1: Simple Permission Gate

```typescript
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

#### Example 2: Using Hooks

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

#### Example 3: Role-Based Gates

```typescript
import { RoleGate } from '@/components/permissions';
import { ROLES } from '@/lib/permissions/constants';

<RoleGate spaceId={spaceId} role={ROLES.ADMIN}>
  <AdminPanel />
</RoleGate>

<RoleGate spaceId={spaceId} anyRoles={[ROLES.ADMIN, ROLES.MEMBER]}>
  <EditButton />
</RoleGate>

<RoleGate spaceId={spaceId} excludeRoles={[ROLES.OBSERVER]}>
  <CreateButton />
</RoleGate>
```

### 3. Available Permissions

#### Space Permissions
- `PERMISSIONS.SPACE.VIEW` - View space details
- `PERMISSIONS.SPACE.UPDATE` - Update space settings
- `PERMISSIONS.SPACE.DELETE` - Delete space
- `PERMISSIONS.SPACE.MANAGE_SETTINGS` - Manage integrations

#### Member Permissions
- `PERMISSIONS.MEMBERS.VIEW` - View members
- `PERMISSIONS.MEMBERS.INVITE` - Invite members
- `PERMISSIONS.MEMBERS.REMOVE` - Remove members
- `PERMISSIONS.MEMBERS.UPDATE_ROLES` - Change roles
- `PERMISSIONS.MEMBERS.UPDATE_OWN_PROFILE` - Update own profile

#### Issue Permissions
- `PERMISSIONS.ISSUES.VIEW` - View issues
- `PERMISSIONS.ISSUES.CREATE` - Create issues
- `PERMISSIONS.ISSUES.UPDATE_OWN` - Update own issues
- `PERMISSIONS.ISSUES.UPDATE_ALL` - Update all issues
- `PERMISSIONS.ISSUES.DELETE_OWN` - Delete own issues
- `PERMISSIONS.ISSUES.DELETE_ALL` - Delete all issues

#### Pull Request Permissions
- `PERMISSIONS.PRS.VIEW` - View PRs
- `PERMISSIONS.PRS.CREATE` - Create PRs
- `PERMISSIONS.PRS.UPDATE_OWN` - Update own PRs
- `PERMISSIONS.PRS.UPDATE_ALL` - Update all PRs
- `PERMISSIONS.PRS.DELETE_OWN` - Delete own PRs
- `PERMISSIONS.PRS.DELETE_ALL` - Delete all PRs

#### Change Request Permissions
- `PERMISSIONS.CHANGE_REQUESTS.VIEW` - View change requests
- `PERMISSIONS.CHANGE_REQUESTS.CREATE` - Create change requests
- `PERMISSIONS.CHANGE_REQUESTS.UPDATE_OWN` - Update own
- `PERMISSIONS.CHANGE_REQUESTS.UPDATE_ALL` - Update all
- `PERMISSIONS.CHANGE_REQUESTS.DELETE_OWN` - Delete own
- `PERMISSIONS.CHANGE_REQUESTS.DELETE_ALL` - Delete all

#### Repository Permissions
- `PERMISSIONS.REPOS.VIEW` - View repositories
- `PERMISSIONS.REPOS.MANAGE` - Manage repositories

#### Analytics Permissions
- `PERMISSIONS.ANALYTICS.VIEW_OWN` - View own analytics
- `PERMISSIONS.ANALYTICS.VIEW_TEAM` - View team analytics
- `PERMISSIONS.ANALYTICS.EXPORT` - Export data

## Verify Everything Works

### Check Tables in Supabase Studio

1. Open: http://127.0.0.1:54323
2. Go to **Table Editor**
3. You should see:
   - `permissions` (32 rows)
   - `role_permissions` (59 rows)
   - `space_member_permissions` (0 rows initially)

### Test Permission Function

In Supabase Studio SQL Editor:

```sql
-- Test the permission check function
SELECT user_has_permission(
  (SELECT id FROM auth.users LIMIT 1)::uuid,
  (SELECT id FROM spaces LIMIT 1)::uuid,
  'issues:view'
) as has_permission;

-- Get all permissions for a user
SELECT * FROM get_user_permissions(
  (SELECT id FROM auth.users LIMIT 1)::uuid,
  (SELECT id FROM spaces LIMIT 1)::uuid
);
```

### Test in Your App

1. Start dev server: `pnpm dev`
2. Navigate to a space
3. Check if permission gates work:
   - Admin should see all features
   - Member should see limited features
   - Observer should only see read-only content

## Troubleshooting

### "Cannot find module '@/lib/permissions/constants'"

**Solution:** The files are there, just rebuild:
```bash
pnpm build
```

### "hasPermission is always false"

**Solution:** Make sure you're a member of the space:
```sql
-- Check membership
SELECT * FROM space_members WHERE user_id = 'your-user-id';

-- Add yourself if needed
INSERT INTO space_members (space_id, user_id, role)
VALUES ('space-id', 'user-id', 'admin');
```

### "Tables don't appear in Studio"

**Solution:** Refresh the page in Supabase Studio (http://127.0.0.1:54323)

## Documentation

- **Quick Start Guide:** [SETUP_PERMISSIONS.md](SETUP_PERMISSIONS.md)
- **Usage Examples:** [src/lib/permissions/README.md](src/lib/permissions/README.md)
- **Code Examples:** [src/examples/permissions-example.tsx](src/examples/permissions-example.tsx)
- **Design Document:** [docs/ROLES_AND_PERMISSIONS_DESIGN.md](docs/ROLES_AND_PERMISSIONS_DESIGN.md)

## Ready to Code! 🚀

Start adding permission gates to your components:

```typescript
import { PermissionGate } from '@/components/permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

<PermissionGate spaceId={spaceId} permission={PERMISSIONS.ISSUES.CREATE}>
  <CreateIssueButton />
</PermissionGate>
```

See `src/examples/permissions-example.tsx` for more examples!
