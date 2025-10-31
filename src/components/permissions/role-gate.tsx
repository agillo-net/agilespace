/**
 * RoleGate component for conditional rendering based on user roles
 */

import type { ReactNode } from 'react';
import type { Role } from '@/lib/permissions/constants';
import { useSpaceRole } from '@/hooks/api/use-space-role';

interface RoleGateProps {
  /** The space ID to check role for */
  spaceId: string | undefined;

  /** Single role to check */
  role?: Role;

  /** Multiple roles - require any of them */
  anyRoles?: Role[];

  /** Roles to exclude */
  excludeRoles?: Role[];

  /** Content to render when role matches */
  children: ReactNode;

  /** Content to render when role doesn't match (optional) */
  fallback?: ReactNode;

  /** Show loading state while checking role (optional) */
  showLoading?: boolean;

  /** Custom loading component (optional) */
  loadingComponent?: ReactNode;
}

/**
 * Gate component that conditionally renders children based on user role
 *
 * @example
 * // Single role check
 * <RoleGate spaceId={spaceId} role="admin">
 *   <AdminPanel />
 * </RoleGate>
 *
 * @example
 * // Check if user has any of the roles
 * <RoleGate spaceId={spaceId} anyRoles={['admin', 'member']}>
 *   <EditButton />
 * </RoleGate>
 *
 * @example
 * // Exclude certain roles
 * <RoleGate spaceId={spaceId} excludeRoles={['observer']}>
 *   <CreateButton />
 * </RoleGate>
 */
export function RoleGate({
  spaceId,
  role,
  anyRoles,
  excludeRoles,
  children,
  fallback = null,
  showLoading = false,
  loadingComponent = null,
}: RoleGateProps) {
  const { data: userRole, isLoading } = useSpaceRole(spaceId || '');

  // Show loading state if requested
  if (showLoading && isLoading) {
    return <>{loadingComponent}</>;
  }

  // If no role data, show fallback
  if (!userRole) {
    return <>{fallback}</>;
  }

  // Check role conditions
  let hasRole = false;

  if (role) {
    hasRole = userRole === role;
  } else if (anyRoles && anyRoles.length > 0) {
    hasRole = anyRoles.includes(userRole as Role);
  } else if (excludeRoles && excludeRoles.length > 0) {
    hasRole = !excludeRoles.includes(userRole as Role);
  } else {
    // If no conditions specified, render children by default
    hasRole = true;
  }

  // If role doesn't match, show fallback
  if (!hasRole) {
    return <>{fallback}</>;
  }

  // User has matching role, render children
  return <>{children}</>;
}

/**
 * Hook version of RoleGate for use in render logic
 *
 * @example
 * const isAdmin = useIsRole(spaceId, 'admin');
 * if (!isAdmin) return null;
 */
export function useIsRole(
  spaceId: string | undefined,
  role: Role
): boolean {
  const { data: userRole } = useSpaceRole(spaceId || '');
  return userRole === role;
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasAnyRole(
  spaceId: string | undefined,
  roles: Role[]
): boolean {
  const { data: userRole } = useSpaceRole(spaceId || '');
  return roles.includes(userRole as Role);
}
