/**
 * Example component demonstrating the permissions system
 *
 * This file shows various ways to use the permissions system in your components.
 * You can use this as a reference when implementing permission checks in your app.
 */

import { PermissionGate, RoleGate } from '@/components/permissions';
import { usePermission, useSpacePermissions } from '@/hooks/api/use-permissions';
import { PERMISSIONS, ROLES } from '@/lib/permissions/constants';
import { Button } from '@/components/ui/button';

interface ExampleComponentProps {
  spaceId: string;
}

// Example 1: Using PermissionGate component
export function Example1_PermissionGate({ spaceId }: ExampleComponentProps) {
  return (
    <div className="space-y-4">
      <h2>Example 1: Permission Gate</h2>

      {/* Only show create button if user has permission */}
      <PermissionGate spaceId={spaceId} permission={PERMISSIONS.ISSUES.CREATE}>
        <Button>Create Issue</Button>
      </PermissionGate>

      {/* Show fallback if permission is denied */}
      <PermissionGate
        spaceId={spaceId}
        permission={PERMISSIONS.SPACE.DELETE}
        fallback={<p className="text-muted-foreground">You cannot delete this space</p>}
      >
        <Button variant="destructive">Delete Space</Button>
      </PermissionGate>
    </div>
  );
}

// Example 2: Using RoleGate component
export function Example2_RoleGate({ spaceId }: ExampleComponentProps) {
  return (
    <div className="space-y-4">
      <h2>Example 2: Role Gate</h2>

      {/* Only admins see this */}
      <RoleGate spaceId={spaceId} role={ROLES.ADMIN}>
        <div className="rounded-lg bg-primary/10 p-4">
          <h3>Admin Panel</h3>
          <p>This is only visible to admins</p>
        </div>
      </RoleGate>

      {/* Admins and members see this */}
      <RoleGate spaceId={spaceId} anyRoles={[ROLES.ADMIN, ROLES.MEMBER]}>
        <Button>Create Content</Button>
      </RoleGate>

      {/* Everyone except observers */}
      <RoleGate spaceId={spaceId} excludeRoles={[ROLES.OBSERVER]}>
        <Button>Edit Settings</Button>
      </RoleGate>
    </div>
  );
}

// Example 3: Using permission hooks
export function Example3_PermissionHooks({ spaceId }: ExampleComponentProps) {
  const { hasPermission: canCreate } = usePermission(
    spaceId,
    PERMISSIONS.ISSUES.CREATE
  );

  const { hasPermission: canDelete } = usePermission(
    spaceId,
    PERMISSIONS.ISSUES.DELETE_ALL
  );

  return (
    <div className="space-y-4">
      <h2>Example 3: Permission Hooks</h2>

      <div className="space-x-2">
        <Button disabled={!canCreate}>
          {canCreate ? 'Create Issue' : 'No Permission'}
        </Button>

        {canDelete && (
          <Button variant="destructive">Delete Issue</Button>
        )}
      </div>
    </div>
  );
}

// Example 4: Using convenience hook
export function Example4_ConvenienceHook({ spaceId }: ExampleComponentProps) {
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
    <div className="space-y-4">
      <h2>Example 4: Convenience Hook</h2>

      {/* Show role badge */}
      <div className="flex gap-2">
        {isAdmin && <span className="rounded bg-red-500 px-2 py-1 text-xs text-white">Admin</span>}
        {isMember && <span className="rounded bg-blue-500 px-2 py-1 text-xs text-white">Member</span>}
        {isObserver && <span className="rounded bg-gray-500 px-2 py-1 text-xs text-white">Observer</span>}
      </div>

      {/* Conditional features */}
      <div className="space-x-2">
        {canCreateIssues && <Button>Create Issue</Button>}
        {canInviteMembers && <Button>Invite Members</Button>}
        {canManageRepos && <Button>Manage Repos</Button>}
        {canExportAnalytics && <Button>Export Data</Button>}
      </div>
    </div>
  );
}

// Example 5: Complex permission checks
export function Example5_ComplexChecks({ spaceId }: ExampleComponentProps) {
  const {
    canUpdateOwnIssues,
    canUpdateAllIssues,
    canDeleteOwnIssues,
    canDeleteAllIssues,
  } = useSpacePermissions(spaceId);

  // User can edit if they can update own OR all issues
  const canEdit = canUpdateOwnIssues || canUpdateAllIssues;

  // User can delete if they can delete own OR all issues
  const canDelete = canDeleteOwnIssues || canDeleteAllIssues;

  return (
    <div className="space-y-4">
      <h2>Example 5: Complex Checks</h2>

      <div className="space-x-2">
        <Button disabled={!canEdit}>
          {canEdit ? 'Edit' : 'Cannot Edit'}
        </Button>

        <Button disabled={!canDelete} variant="destructive">
          {canDelete ? 'Delete' : 'Cannot Delete'}
        </Button>
      </div>

      {canUpdateAllIssues && (
        <p className="text-sm text-muted-foreground">
          You can edit all issues (not just your own)
        </p>
      )}
    </div>
  );
}

// Example 6: List with permission checks
interface Issue {
  id: string;
  title: string;
  createdBy: string;
}

export function Example6_ListWithPermissions({
  spaceId,
  issues,
  currentUserId,
}: ExampleComponentProps & { issues: Issue[]; currentUserId: string }) {
  const { canCreateIssues, canUpdateAllIssues, canDeleteAllIssues } =
    useSpacePermissions(spaceId);

  return (
    <div className="space-y-4">
      <h2>Example 6: List with Permissions</h2>

      {canCreateIssues && (
        <Button className="mb-4">Create New Issue</Button>
      )}

      <div className="space-y-2">
        {issues.map((issue) => {
          // User can edit their own issues or if they have update_all permission
          const canEdit =
            issue.createdBy === currentUserId || canUpdateAllIssues;

          // User can delete their own issues or if they have delete_all permission
          const canDelete =
            issue.createdBy === currentUserId || canDeleteAllIssues;

          return (
            <div
              key={issue.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <h3>{issue.title}</h3>

              <div className="flex gap-2">
                {canEdit && (
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                )}

                {canDelete && (
                  <Button size="sm" variant="destructive">
                    Delete
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Example 7: Settings menu with permissions
export function Example7_SettingsMenu({ spaceId }: ExampleComponentProps) {
  const {
    canUpdateSpace,
    canManageSettings,
    canInviteMembers,
    canRemoveMembers,
    canUpdateRoles,
    canManageRepos,
  } = useSpacePermissions(spaceId);

  return (
    <div className="space-y-4">
      <h2>Example 7: Settings Menu</h2>

      <nav className="space-y-1">
        {canUpdateSpace && (
          <Button variant="ghost" className="w-full justify-start">
            General Settings
          </Button>
        )}

        {canManageSettings && (
          <Button variant="ghost" className="w-full justify-start">
            Integrations
          </Button>
        )}

        {(canInviteMembers || canRemoveMembers || canUpdateRoles) && (
          <Button variant="ghost" className="w-full justify-start">
            Member Management
          </Button>
        )}

        {canManageRepos && (
          <Button variant="ghost" className="w-full justify-start">
            Repositories
          </Button>
        )}
      </nav>
    </div>
  );
}

// Example 8: Loading and error states
export function Example8_LoadingStates({ spaceId }: ExampleComponentProps) {
  const { hasPermission, isLoading, error } = usePermission(
    spaceId,
    PERMISSIONS.ISSUES.CREATE
  );

  if (isLoading) {
    return <div>Checking permissions...</div>;
  }

  if (error) {
    return <div>Error checking permissions: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <h2>Example 8: Loading States</h2>

      {hasPermission ? (
        <Button>Create Issue</Button>
      ) : (
        <p className="text-muted-foreground">
          You don't have permission to create issues
        </p>
      )}
    </div>
  );
}

// Example 9: Multiple permission checks
export function Example9_MultiplePermissions({ spaceId }: ExampleComponentProps) {
  return (
    <div className="space-y-4">
      <h2>Example 9: Multiple Permissions</h2>

      {/* User needs ANY of these permissions */}
      <PermissionGate
        spaceId={spaceId}
        anyPermissions={[
          PERMISSIONS.ISSUES.UPDATE_OWN,
          PERMISSIONS.ISSUES.UPDATE_ALL,
        ]}
      >
        <Button>Edit Issue</Button>
      </PermissionGate>

      {/* User needs ALL of these permissions */}
      <PermissionGate
        spaceId={spaceId}
        allPermissions={[
          PERMISSIONS.MEMBERS.INVITE,
          PERMISSIONS.MEMBERS.UPDATE_ROLES,
        ]}
      >
        <Button>Manage Members</Button>
      </PermissionGate>
    </div>
  );
}

// Main example component showcasing all examples
export function PermissionsExampleShowcase({ spaceId }: ExampleComponentProps) {
  return (
    <div className="container mx-auto space-y-8 py-8">
      <h1 className="text-3xl font-bold">Permissions System Examples</h1>

      <Example1_PermissionGate spaceId={spaceId} />
      <Example2_RoleGate spaceId={spaceId} />
      <Example3_PermissionHooks spaceId={spaceId} />
      <Example4_ConvenienceHook spaceId={spaceId} />
      <Example5_ComplexChecks spaceId={spaceId} />
      <Example8_LoadingStates spaceId={spaceId} />
      <Example9_MultiplePermissions spaceId={spaceId} />
    </div>
  );
}
