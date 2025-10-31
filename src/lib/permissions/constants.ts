/**
 * Permission constants and role definitions for the AgilSpace RBAC system
 */

// =====================================================
// PERMISSION CONSTANTS
// =====================================================

export const SPACE_PERMISSIONS = {
  VIEW: 'space:view',
  UPDATE: 'space:update',
  DELETE: 'space:delete',
  MANAGE_SETTINGS: 'space:manage_settings',
} as const;

export const MEMBER_PERMISSIONS = {
  VIEW: 'members:view',
  INVITE: 'members:invite',
  REMOVE: 'members:remove',
  UPDATE_ROLES: 'members:update_roles',
  UPDATE_OWN_PROFILE: 'members:update_own_profile',
} as const;

export const ISSUE_PERMISSIONS = {
  VIEW: 'issues:view',
  CREATE: 'issues:create',
  UPDATE_OWN: 'issues:update_own',
  UPDATE_ALL: 'issues:update_all',
  DELETE_OWN: 'issues:delete_own',
  DELETE_ALL: 'issues:delete_all',
} as const;

export const PR_PERMISSIONS = {
  VIEW: 'prs:view',
  CREATE: 'prs:create',
  UPDATE_OWN: 'prs:update_own',
  UPDATE_ALL: 'prs:update_all',
  DELETE_OWN: 'prs:delete_own',
  DELETE_ALL: 'prs:delete_all',
} as const;

export const CHANGE_REQUEST_PERMISSIONS = {
  VIEW: 'change_requests:view',
  CREATE: 'change_requests:create',
  UPDATE_OWN: 'change_requests:update_own',
  UPDATE_ALL: 'change_requests:update_all',
  DELETE_OWN: 'change_requests:delete_own',
  DELETE_ALL: 'change_requests:delete_all',
} as const;

export const REPO_PERMISSIONS = {
  VIEW: 'repos:view',
  MANAGE: 'repos:manage',
} as const;

export const ANALYTICS_PERMISSIONS = {
  VIEW_OWN: 'analytics:view_own',
  VIEW_TEAM: 'analytics:view_team',
  EXPORT: 'analytics:export',
} as const;

// Combined permissions object
export const PERMISSIONS = {
  SPACE: SPACE_PERMISSIONS,
  MEMBERS: MEMBER_PERMISSIONS,
  ISSUES: ISSUE_PERMISSIONS,
  PRS: PR_PERMISSIONS,
  CHANGE_REQUESTS: CHANGE_REQUEST_PERMISSIONS,
  REPOS: REPO_PERMISSIONS,
  ANALYTICS: ANALYTICS_PERMISSIONS,
} as const;

// =====================================================
// PERMISSION TYPES
// =====================================================

export type SpacePermission = (typeof SPACE_PERMISSIONS)[keyof typeof SPACE_PERMISSIONS];
export type MemberPermission = (typeof MEMBER_PERMISSIONS)[keyof typeof MEMBER_PERMISSIONS];
export type IssuePermission = (typeof ISSUE_PERMISSIONS)[keyof typeof ISSUE_PERMISSIONS];
export type PrPermission = (typeof PR_PERMISSIONS)[keyof typeof PR_PERMISSIONS];
export type ChangeRequestPermission = (typeof CHANGE_REQUEST_PERMISSIONS)[keyof typeof CHANGE_REQUEST_PERMISSIONS];
export type RepoPermission = (typeof REPO_PERMISSIONS)[keyof typeof REPO_PERMISSIONS];
export type AnalyticsPermission = (typeof ANALYTICS_PERMISSIONS)[keyof typeof ANALYTICS_PERMISSIONS];

export type Permission =
  | SpacePermission
  | MemberPermission
  | IssuePermission
  | PrPermission
  | ChangeRequestPermission
  | RepoPermission
  | AnalyticsPermission;

// =====================================================
// ROLE TYPES
// =====================================================

export const ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
  OBSERVER: 'observer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// =====================================================
// PERMISSION CATEGORIES
// =====================================================

export const PERMISSION_CATEGORIES = {
  SPACE: 'space',
  MEMBERS: 'members',
  ISSUES: 'issues',
  PRS: 'prs',
  CHANGE_REQUESTS: 'change_requests',
  REPOS: 'repos',
  ANALYTICS: 'analytics',
} as const;

export type PermissionCategory = (typeof PERMISSION_CATEGORIES)[keyof typeof PERMISSION_CATEGORIES];

// =====================================================
// ROLE TO PERMISSIONS MAPPING
// =====================================================

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    // Space
    SPACE_PERMISSIONS.VIEW,
    SPACE_PERMISSIONS.UPDATE,
    SPACE_PERMISSIONS.DELETE,
    SPACE_PERMISSIONS.MANAGE_SETTINGS,

    // Members
    MEMBER_PERMISSIONS.VIEW,
    MEMBER_PERMISSIONS.INVITE,
    MEMBER_PERMISSIONS.REMOVE,
    MEMBER_PERMISSIONS.UPDATE_ROLES,
    MEMBER_PERMISSIONS.UPDATE_OWN_PROFILE,

    // Issues
    ISSUE_PERMISSIONS.VIEW,
    ISSUE_PERMISSIONS.CREATE,
    ISSUE_PERMISSIONS.UPDATE_OWN,
    ISSUE_PERMISSIONS.UPDATE_ALL,
    ISSUE_PERMISSIONS.DELETE_OWN,
    ISSUE_PERMISSIONS.DELETE_ALL,

    // Pull Requests
    PR_PERMISSIONS.VIEW,
    PR_PERMISSIONS.CREATE,
    PR_PERMISSIONS.UPDATE_OWN,
    PR_PERMISSIONS.UPDATE_ALL,
    PR_PERMISSIONS.DELETE_OWN,
    PR_PERMISSIONS.DELETE_ALL,

    // Change Requests
    CHANGE_REQUEST_PERMISSIONS.VIEW,
    CHANGE_REQUEST_PERMISSIONS.CREATE,
    CHANGE_REQUEST_PERMISSIONS.UPDATE_OWN,
    CHANGE_REQUEST_PERMISSIONS.UPDATE_ALL,
    CHANGE_REQUEST_PERMISSIONS.DELETE_OWN,
    CHANGE_REQUEST_PERMISSIONS.DELETE_ALL,

    // Repositories
    REPO_PERMISSIONS.VIEW,
    REPO_PERMISSIONS.MANAGE,

    // Analytics
    ANALYTICS_PERMISSIONS.VIEW_OWN,
    ANALYTICS_PERMISSIONS.VIEW_TEAM,
    ANALYTICS_PERMISSIONS.EXPORT,
  ],

  member: [
    // Space
    SPACE_PERMISSIONS.VIEW,

    // Members
    MEMBER_PERMISSIONS.VIEW,
    MEMBER_PERMISSIONS.UPDATE_OWN_PROFILE,

    // Issues
    ISSUE_PERMISSIONS.VIEW,
    ISSUE_PERMISSIONS.CREATE,
    ISSUE_PERMISSIONS.UPDATE_OWN,
    ISSUE_PERMISSIONS.DELETE_OWN,

    // Pull Requests
    PR_PERMISSIONS.VIEW,
    PR_PERMISSIONS.CREATE,
    PR_PERMISSIONS.UPDATE_OWN,
    PR_PERMISSIONS.DELETE_OWN,

    // Change Requests
    CHANGE_REQUEST_PERMISSIONS.VIEW,
    CHANGE_REQUEST_PERMISSIONS.CREATE,
    CHANGE_REQUEST_PERMISSIONS.UPDATE_OWN,
    CHANGE_REQUEST_PERMISSIONS.DELETE_OWN,

    // Repositories
    REPO_PERMISSIONS.VIEW,

    // Analytics
    ANALYTICS_PERMISSIONS.VIEW_OWN,
    ANALYTICS_PERMISSIONS.VIEW_TEAM,
  ],

  observer: [
    // Space
    SPACE_PERMISSIONS.VIEW,

    // Members
    MEMBER_PERMISSIONS.VIEW,
    MEMBER_PERMISSIONS.UPDATE_OWN_PROFILE,

    // Content (read-only)
    ISSUE_PERMISSIONS.VIEW,
    PR_PERMISSIONS.VIEW,
    CHANGE_REQUEST_PERMISSIONS.VIEW,
    REPO_PERMISSIONS.VIEW,

    // Analytics (read-only)
    ANALYTICS_PERMISSIONS.VIEW_OWN,
    ANALYTICS_PERMISSIONS.VIEW_TEAM,
  ],
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Check if a role has a specific permission (client-side check only)
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Get all permissions for a role (client-side)
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a permission allows updating/deleting all resources or just own
 */
export function isOwnResourcePermission(permission: Permission): boolean {
  return permission.includes('_own');
}

/**
 * Check if a permission allows updating/deleting all resources
 */
export function isAllResourcePermission(permission: Permission): boolean {
  return permission.includes('_all');
}

/**
 * Get the category of a permission
 */
export function getPermissionCategory(permission: Permission): PermissionCategory | null {
  const [category] = permission.split(':');
  if (Object.values(PERMISSION_CATEGORIES).includes(category as PermissionCategory)) {
    return category as PermissionCategory;
  }
  return null;
}

/**
 * Get all permissions in a category
 */
export function getPermissionsByCategory(category: PermissionCategory): Permission[] {
  const permissions: Permission[] = [];

  Object.values(PERMISSIONS).forEach((permissionGroup) => {
    Object.values(permissionGroup).forEach((permission) => {
      if (permission.startsWith(`${category}:`)) {
        permissions.push(permission as Permission);
      }
    });
  });

  return permissions;
}
