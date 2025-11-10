/**
 * PermissionGate component for conditional rendering based on permissions
 */

import type { ReactNode } from 'react';
import type { Permission } from '@/lib/permissions/constants';
import { usePermission, useHasAnyPermission, useHasAllPermissions } from '@/hooks/api/use-permissions';

interface PermissionGateProps {
  /** The space ID to check permissions for */
  spaceId: string | undefined;

  /** Single permission to check */
  permission?: Permission;

  /** Multiple permissions - require any of them */
  anyPermissions?: Permission[];

  /** Multiple permissions - require all of them */
  allPermissions?: Permission[];

  /** Content to render when permission is granted */
  children: ReactNode;

  /** Content to render when permission is denied (optional) */
  fallback?: ReactNode;

  /** Show loading state while checking permissions (optional) */
  showLoading?: boolean;

  /** Custom loading component (optional) */
  loadingComponent?: ReactNode;
}

/**
 * Gate component that conditionally renders children based on user permissions
 *
 * @example
 * // Single permission check
 * <PermissionGate spaceId={spaceId} permission="issues:create">
 *   <CreateIssueButton />
 * </PermissionGate>
 *
 * @example
 * // Check if user has any of the permissions
 * <PermissionGate spaceId={spaceId} anyPermissions={['issues:update_own', 'issues:update_all']}>
 *   <EditButton />
 * </PermissionGate>
 *
 * @example
 * // Check if user has all of the permissions
 * <PermissionGate spaceId={spaceId} allPermissions={['issues:delete_own', 'members:view']}>
 *   <DeleteButton />
 * </PermissionGate>
 *
 * @example
 * // With fallback content
 * <PermissionGate
 *   spaceId={spaceId}
 *   permission="issues:create"
 *   fallback={<UpgradePrompt />}
 * >
 *   <CreateIssueButton />
 * </PermissionGate>
 */
export function PermissionGate({
  spaceId,
  permission,
  anyPermissions,
  allPermissions,
  children,
  fallback = null,
  showLoading = false,
  loadingComponent = null,
}: PermissionGateProps) {
  // Single permission check
  const singlePermissionResult = usePermission(
    permission ? spaceId : undefined,
    permission!
  );

  // Any permissions check
  const anyPermissionsResult = useHasAnyPermission(
    anyPermissions ? spaceId : undefined,
    anyPermissions || []
  );

  // All permissions check
  const allPermissionsResult = useHasAllPermissions(
    allPermissions ? spaceId : undefined,
    allPermissions || []
  );

  // Determine which result to use
  let hasPermission = false;
  let isLoading = false;

  if (permission) {
    hasPermission = singlePermissionResult.hasPermission;
    isLoading = singlePermissionResult.isLoading;
  } else if (anyPermissions) {
    hasPermission = anyPermissionsResult.hasAnyPermission;
    isLoading = anyPermissionsResult.isLoading;
  } else if (allPermissions) {
    hasPermission = allPermissionsResult.hasAllPermissions;
    isLoading = allPermissionsResult.isLoading;
  }

  // Show loading state if requested
  if (showLoading && isLoading) {
    return <>{loadingComponent}</>;
  }

  // If no permission, show fallback or nothing
  if (!hasPermission) {
    return <>{fallback}</>;
  }

  // User has permission, render children
  return <>{children}</>;
}

/**
 * Hook version of PermissionGate for use in render logic
 *
 * @example
 * const canEdit = useCanRender(spaceId, 'issues:update_all');
 * if (!canEdit) return null;
 */
export function useCanRender(
  spaceId: string | undefined,
  permission: Permission
): boolean {
  const { hasPermission } = usePermission(spaceId, permission);
  return hasPermission;
}
