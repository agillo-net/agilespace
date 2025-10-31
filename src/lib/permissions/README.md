# Permissions System Usage Guide

Quick reference for using the AgilSpace permissions system.

## Import Permissions Constants

```typescript
import { PERMISSIONS, ROLES } from '@/lib/permissions/constants';
```

## Available Permissions

### Space Permissions
- `PERMISSIONS.SPACE.VIEW` - View space details
- `PERMISSIONS.SPACE.UPDATE` - Update space settings
- `PERMISSIONS.SPACE.DELETE` - Delete space
- `PERMISSIONS.SPACE.MANAGE_SETTINGS` - Manage space settings and integrations

### Member Permissions
- `PERMISSIONS.MEMBERS.VIEW` - View space members
- `PERMISSIONS.MEMBERS.INVITE` - Invite new members
- `PERMISSIONS.MEMBERS.REMOVE` - Remove members
- `PERMISSIONS.MEMBERS.UPDATE_ROLES` - Update member roles
- `PERMISSIONS.MEMBERS.UPDATE_OWN_PROFILE` - Update own profile

### Issue Permissions
- `PERMISSIONS.ISSUES.VIEW` - View issues
- `PERMISSIONS.ISSUES.CREATE` - Create issues
- `PERMISSIONS.ISSUES.UPDATE_OWN` - Update own issues
- `PERMISSIONS.ISSUES.UPDATE_ALL` - Update all issues
- `PERMISSIONS.ISSUES.DELETE_OWN` - Delete own issues
- `PERMISSIONS.ISSUES.DELETE_ALL` - Delete all issues

### Pull Request Permissions
- `PERMISSIONS.PRS.VIEW` - View pull requests
- `PERMISSIONS.PRS.CREATE` - Create pull requests
- `PERMISSIONS.PRS.UPDATE_OWN` - Update own pull requests
- `PERMISSIONS.PRS.UPDATE_ALL` - Update all pull requests
- `PERMISSIONS.PRS.DELETE_OWN` - Delete own pull requests
- `PERMISSIONS.PRS.DELETE_ALL` - Delete all pull requests

### Change Request Permissions
- `PERMISSIONS.CHANGE_REQUESTS.VIEW` - View change requests
- `PERMISSIONS.CHANGE_REQUESTS.CREATE` - Create change requests
- `PERMISSIONS.CHANGE_REQUESTS.UPDATE_OWN` - Update own change requests
- `PERMISSIONS.CHANGE_REQUESTS.UPDATE_ALL` - Update all change requests
- `PERMISSIONS.CHANGE_REQUESTS.DELETE_OWN` - Delete own change requests
- `PERMISSIONS.CHANGE_REQUESTS.DELETE_ALL` - Delete all change requests

### Repository Permissions
- `PERMISSIONS.REPOS.VIEW` - View repositories
- `PERMISSIONS.REPOS.MANAGE` - Manage repositories

### Analytics Permissions
- `PERMISSIONS.ANALYTICS.VIEW_OWN` - View own analytics
- `PERMISSIONS.ANALYTICS.VIEW_TEAM` - View team analytics
- `PERMISSIONS.ANALYTICS.EXPORT` - Export analytics data

## Roles

```typescript
ROLES.ADMIN    // Full access
ROLES.MEMBER   // Standard access
ROLES.OBSERVER // Read-only access
```

## Using Hooks

### Single Permission Check

```typescript
import { usePermission } from '@/hooks/api/use-permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

function Component({ spaceId }) {
  const { hasPermission, isLoading } = usePermission(
    spaceId,
    PERMISSIONS.ISSUES.CREATE
  );

  if (isLoading) return <Spinner />;
  if (!hasPermission) return null;

  return <CreateButton />;
}
```

### Multiple Permission Check

```typescript
import { usePermissions } from '@/hooks/api/use-permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

function Component({ spaceId }) {
  const { permissions, hasPermission } = usePermissions(spaceId, [
    PERMISSIONS.ISSUES.UPDATE_OWN,
    PERMISSIONS.ISSUES.UPDATE_ALL,
  ]);

  const canEdit =
    hasPermission(PERMISSIONS.ISSUES.UPDATE_OWN) ||
    hasPermission(PERMISSIONS.ISSUES.UPDATE_ALL);

  return <Button disabled={!canEdit}>Edit</Button>;
}
```

### Check Any Permission

```typescript
import { useHasAnyPermission } from '@/hooks/api/use-permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

function Component({ spaceId }) {
  const { hasAnyPermission } = useHasAnyPermission(spaceId, [
    PERMISSIONS.ISSUES.UPDATE_OWN,
    PERMISSIONS.ISSUES.UPDATE_ALL,
  ]);

  if (!hasAnyPermission) return null;
  return <EditButton />;
}
```

### Check All Permissions

```typescript
import { useHasAllPermissions } from '@/hooks/api/use-permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

function Component({ spaceId }) {
  const { hasAllPermissions } = useHasAllPermissions(spaceId, [
    PERMISSIONS.MEMBERS.INVITE,
    PERMISSIONS.MEMBERS.UPDATE_ROLES,
  ]);

  if (!hasAllPermissions) return null;
  return <MemberManagementPanel />;
}
```

### Convenience Hook

```typescript
import { useSpacePermissions } from '@/hooks/api/use-permissions';

function Component({ spaceId }) {
  const {
    isAdmin,
    isMember,
    isObserver,
    canCreateIssues,
    canInviteMembers,
    canManageRepos,
    canExportAnalytics,
  } = useSpacePermissions(spaceId);

  return (
    <div>
      {isAdmin && <AdminBadge />}
      {canCreateIssues && <CreateButton />}
      {canInviteMembers && <InviteButton />}
      {canManageRepos && <RepoSettings />}
      {canExportAnalytics && <ExportButton />}
    </div>
  );
}
```

## Using Components

### PermissionGate

```typescript
import { PermissionGate } from '@/components/permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

// Basic usage
<PermissionGate spaceId={spaceId} permission={PERMISSIONS.ISSUES.CREATE}>
  <CreateIssueButton />
</PermissionGate>

// With fallback
<PermissionGate
  spaceId={spaceId}
  permission={PERMISSIONS.ISSUES.CREATE}
  fallback={<UpgradePrompt />}
>
  <CreateIssueButton />
</PermissionGate>

// Check any permission
<PermissionGate
  spaceId={spaceId}
  anyPermissions={[
    PERMISSIONS.ISSUES.UPDATE_OWN,
    PERMISSIONS.ISSUES.UPDATE_ALL,
  ]}
>
  <EditButton />
</PermissionGate>

// Check all permissions
<PermissionGate
  spaceId={spaceId}
  allPermissions={[
    PERMISSIONS.MEMBERS.INVITE,
    PERMISSIONS.MEMBERS.UPDATE_ROLES,
  ]}
>
  <MemberManagement />
</PermissionGate>

// With loading state
<PermissionGate
  spaceId={spaceId}
  permission={PERMISSIONS.ISSUES.CREATE}
  showLoading={true}
  loadingComponent={<Spinner />}
>
  <CreateButton />
</PermissionGate>
```

### RoleGate

```typescript
import { RoleGate } from '@/components/permissions';
import { ROLES } from '@/lib/permissions/constants';

// Single role
<RoleGate spaceId={spaceId} role={ROLES.ADMIN}>
  <AdminPanel />
</RoleGate>

// Any role
<RoleGate spaceId={spaceId} anyRoles={[ROLES.ADMIN, ROLES.MEMBER]}>
  <EditButton />
</RoleGate>

// Exclude roles
<RoleGate spaceId={spaceId} excludeRoles={[ROLES.OBSERVER]}>
  <CreateButton />
</RoleGate>
```

## Server-Side Checks

### Check Permission in Query/Mutation

```typescript
import { checkUserPermission } from '@/lib/permissions/queries';
import { PERMISSIONS } from '@/lib/permissions/constants';

async function deleteIssue(spaceId: string, issueId: string) {
  const hasPermission = await checkUserPermission(
    spaceId,
    PERMISSIONS.ISSUES.DELETE_ALL
  );

  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }

  // Proceed with deletion
}
```

### Get All User Permissions

```typescript
import { getUserPermissions } from '@/lib/permissions/queries';

async function checkPermissions(spaceId: string) {
  const permissions = await getUserPermissions(spaceId);

  // permissions = {
  //   'issues:create': true,
  //   'issues:update_all': false,
  //   ...
  // }

  if (permissions['issues:create']) {
    // User can create issues
  }
}
```

## Managing Permission Overrides

### Grant Permission

```typescript
import { grantPermissionToMember } from '@/lib/permissions/queries';
import { PERMISSIONS } from '@/lib/permissions/constants';

async function grantPermission(spaceMemberId: string) {
  const result = await grantPermissionToMember(
    spaceMemberId,
    PERMISSIONS.ISSUES.DELETE_ALL
  );

  if (result.success) {
    console.log('Permission granted');
  } else {
    console.error('Failed to grant permission:', result.error);
  }
}
```

### Revoke Permission

```typescript
import { revokePermissionFromMember } from '@/lib/permissions/queries';
import { PERMISSIONS } from '@/lib/permissions/constants';

async function revokePermission(spaceMemberId: string) {
  const result = await revokePermissionFromMember(
    spaceMemberId,
    PERMISSIONS.ISSUES.DELETE_ALL
  );

  if (result.success) {
    console.log('Permission revoked');
  }
}
```

### Remove Override (Revert to Role Default)

```typescript
import { removePermissionOverride } from '@/lib/permissions/queries';
import { PERMISSIONS } from '@/lib/permissions/constants';

async function resetPermission(spaceMemberId: string) {
  const result = await removePermissionOverride(
    spaceMemberId,
    PERMISSIONS.ISSUES.DELETE_ALL
  );

  if (result.success) {
    console.log('Permission reset to role default');
  }
}
```

## Common Patterns

### Edit Button with "Own" vs "All" Permission

```typescript
import { useHasAnyPermission } from '@/hooks/api/use-permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

function EditButton({ spaceId, issueOwnerId, currentUserId }) {
  const { hasAnyPermission } = useHasAnyPermission(spaceId, [
    PERMISSIONS.ISSUES.UPDATE_OWN,
    PERMISSIONS.ISSUES.UPDATE_ALL,
  ]);

  // Check if user owns the issue OR has update_all permission
  const canEdit =
    hasAnyPermission &&
    (issueOwnerId === currentUserId ||
     usePermission(spaceId, PERMISSIONS.ISSUES.UPDATE_ALL).hasPermission);

  return <Button disabled={!canEdit}>Edit</Button>;
}
```

### Conditional Rendering in List

```typescript
import { PermissionGate } from '@/components/permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

function IssueList({ spaceId, issues }) {
  return (
    <div>
      <PermissionGate spaceId={spaceId} permission={PERMISSIONS.ISSUES.CREATE}>
        <CreateButton />
      </PermissionGate>

      {issues.map((issue) => (
        <div key={issue.id}>
          <h3>{issue.title}</h3>

          <PermissionGate
            spaceId={spaceId}
            anyPermissions={[
              PERMISSIONS.ISSUES.UPDATE_OWN,
              PERMISSIONS.ISSUES.UPDATE_ALL,
            ]}
          >
            <EditButton issueId={issue.id} />
          </PermissionGate>
        </div>
      ))}
    </div>
  );
}
```

### Menu Items Based on Role

```typescript
import { useSpacePermissions } from '@/hooks/api/use-permissions';

function SettingsMenu({ spaceId }) {
  const {
    canUpdateSpace,
    canManageSettings,
    canInviteMembers,
    canManageRepos,
  } = useSpacePermissions(spaceId);

  return (
    <Menu>
      {canUpdateSpace && <MenuItem>General Settings</MenuItem>}
      {canManageSettings && <MenuItem>Integrations</MenuItem>}
      {canInviteMembers && <MenuItem>Members</MenuItem>}
      {canManageRepos && <MenuItem>Repositories</MenuItem>}
    </Menu>
  );
}
```

## Best Practices

1. **Use PermissionGate for UI elements** - Cleaner and more declarative
2. **Use hooks for complex logic** - When you need conditional rendering logic
3. **Check permissions on both client and server** - Defense in depth
4. **Cache permission checks** - React Query caches for 5 minutes by default
5. **Use constants** - Always import from `@/lib/permissions/constants`
6. **Handle loading states** - Show appropriate UI while checking permissions
7. **Provide fallbacks** - Show helpful messages when permissions are denied

## Debugging

### Check Permission in Console

```typescript
import { checkUserPermission } from '@/lib/permissions/queries';
import { PERMISSIONS } from '@/lib/permissions/constants';

// In browser console or component
const hasPermission = await checkUserPermission(
  'space-id',
  PERMISSIONS.ISSUES.CREATE
);
console.log('Has permission:', hasPermission);
```

### Get All Permissions

```typescript
import { getUserPermissions } from '@/lib/permissions/queries';

const permissions = await getUserPermissions('space-id');
console.log('All permissions:', permissions);
```

### Check User's Role

```typescript
import { useSpaceRole } from '@/hooks/api/use-space-role';

function Debug({ spaceId }) {
  const { data: role } = useSpaceRole(spaceId);
  console.log('User role:', role);
  return null;
}
```
