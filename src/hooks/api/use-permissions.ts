/**
 * React hooks for permission checking
 */

import { useQuery } from '@tanstack/react-query';
import type { Permission } from '@/lib/permissions/constants';
import {
  checkUserPermission,
  checkUserHasAnyPermission,
  checkUserHasAllPermissions,
  getUserPermissions,
} from '@/lib/permissions/queries';

/**
 * Hook to check if the current user has a specific permission in a space
 *
 * @example
 * const { hasPermission, isLoading } = usePermission(spaceId, 'issues:create');
 */
export function usePermission(spaceId: string | undefined, permission: Permission) {
  const query = useQuery({
    queryKey: ['permission', spaceId, permission],
    queryFn: () => {
      if (!spaceId) return Promise.resolve(false);
      return checkUserPermission(spaceId, permission);
    },
    enabled: !!spaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    hasPermission: query.data ?? false,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to check if the current user has any of the specified permissions in a space
 *
 * @example
 * const { hasAnyPermission } = useHasAnyPermission(spaceId, ['issues:update_own', 'issues:update_all']);
 */
export function useHasAnyPermission(
  spaceId: string | undefined,
  permissions: Permission[]
) {
  const query = useQuery({
    queryKey: ['permissions:any', spaceId, permissions],
    queryFn: () => {
      if (!spaceId) return Promise.resolve(false);
      return checkUserHasAnyPermission(spaceId, permissions);
    },
    enabled: !!spaceId && permissions.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    hasAnyPermission: query.data ?? false,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to check if the current user has all of the specified permissions in a space
 *
 * @example
 * const { hasAllPermissions } = useHasAllPermissions(spaceId, ['issues:create', 'issues:delete_own']);
 */
export function useHasAllPermissions(
  spaceId: string | undefined,
  permissions: Permission[]
) {
  const query = useQuery({
    queryKey: ['permissions:all', spaceId, permissions],
    queryFn: () => {
      if (!spaceId) return Promise.resolve(false);
      return checkUserHasAllPermissions(spaceId, permissions);
    },
    enabled: !!spaceId && permissions.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    hasAllPermissions: query.data ?? false,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get all permissions for the current user in a space
 * Returns an object mapping permission names to boolean values
 *
 * @example
 * const { permissions, isLoading } = useUserPermissions(spaceId);
 * // permissions = { 'issues:create': true, 'issues:update_all': false, ... }
 */
export function useUserPermissions(spaceId: string | undefined) {
  const query = useQuery({
    queryKey: ['permissions:user', spaceId],
    queryFn: () => {
      if (!spaceId) return Promise.resolve({} as Record<Permission, boolean>);
      return getUserPermissions(spaceId);
    },
    enabled: !!spaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    permissions: query.data ?? ({} as Record<Permission, boolean>),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    hasPermission: (permission: Permission) => query.data?.[permission] ?? false,
  };
}

/**
 * Hook to check multiple specific permissions at once
 * Returns an object mapping each permission to its boolean value
 *
 * @example
 * const { permissions } = usePermissions(spaceId, ['issues:create', 'issues:update_own']);
 * // permissions = { 'issues:create': true, 'issues:update_own': false }
 */
export function usePermissions(
  spaceId: string | undefined,
  permissionsToCheck: Permission[]
) {
  const query = useQuery({
    queryKey: ['permissions:specific', spaceId, permissionsToCheck],
    queryFn: async () => {
      if (!spaceId) {
        return permissionsToCheck.reduce(
          (acc, p) => ({ ...acc, [p]: false }),
          {} as Record<Permission, boolean>
        );
      }

      const results = await Promise.all(
        permissionsToCheck.map(async (permission) => ({
          permission,
          hasPermission: await checkUserPermission(spaceId, permission),
        }))
      );

      return results.reduce(
        (acc, { permission, hasPermission }) => ({
          ...acc,
          [permission]: hasPermission,
        }),
        {} as Record<Permission, boolean>
      );
    },
    enabled: !!spaceId && permissionsToCheck.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    permissions: query.data ?? ({} as Record<Permission, boolean>),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    hasPermission: (permission: Permission) => query.data?.[permission] ?? false,
  };
}

/**
 * Convenience hook that combines useSpaceRole and returns common permission checks
 *
 * @example
 * const { isAdmin, isMember, canManageMembers } = useSpacePermissions(spaceId);
 */
export function useSpacePermissions(spaceId: string | undefined) {
  const { permissions, isLoading } = useUserPermissions(spaceId);

  return {
    permissions,
    isLoading,
    // Convenience getters
    isAdmin: permissions['space:delete'] ?? false, // Only admins can delete spaces
    isMember: permissions['issues:create'] ?? false, // Members can create issues
    isObserver: !(permissions['issues:create'] ?? false), // Observers cannot create

    // Common permission checks
    canViewSpace: permissions['space:view'] ?? false,
    canUpdateSpace: permissions['space:update'] ?? false,
    canDeleteSpace: permissions['space:delete'] ?? false,
    canManageSettings: permissions['space:manage_settings'] ?? false,

    canViewMembers: permissions['members:view'] ?? false,
    canInviteMembers: permissions['members:invite'] ?? false,
    canRemoveMembers: permissions['members:remove'] ?? false,
    canUpdateRoles: permissions['members:update_roles'] ?? false,
    canUpdateOwnProfile: permissions['members:update_own_profile'] ?? false,

    canViewIssues: permissions['issues:view'] ?? false,
    canCreateIssues: permissions['issues:create'] ?? false,
    canUpdateOwnIssues: permissions['issues:update_own'] ?? false,
    canUpdateAllIssues: permissions['issues:update_all'] ?? false,
    canDeleteOwnIssues: permissions['issues:delete_own'] ?? false,
    canDeleteAllIssues: permissions['issues:delete_all'] ?? false,

    canViewPrs: permissions['prs:view'] ?? false,
    canCreatePrs: permissions['prs:create'] ?? false,

    canViewRepos: permissions['repos:view'] ?? false,
    canManageRepos: permissions['repos:manage'] ?? false,

    canViewOwnAnalytics: permissions['analytics:view_own'] ?? false,
    canViewTeamAnalytics: permissions['analytics:view_team'] ?? false,
    canExportAnalytics: permissions['analytics:export'] ?? false,
  };
}
