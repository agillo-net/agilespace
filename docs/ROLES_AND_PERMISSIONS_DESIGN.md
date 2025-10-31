# Roles and Permissions System Design

## Overview

This document outlines the roles and permissions system for AgilSpace, built on Supabase authentication.

## Role Hierarchy

### 1. Admin
**Full control over the space**

Permissions:
- Space management:
  - Update space settings (name, avatar, plan)
  - Delete space
  - Manage GitHub organization connection

- Member management:
  - Invite new members
  - Remove members
  - Change member roles
  - View all members

- Content management:
  - Create, edit, delete all issues
  - Create, edit, delete all pull requests
  - Create, edit, delete all change requests
  - Manage repositories

- Analytics:
  - View all analytics and insights
  - Export data

### 2. Member
**Standard collaboration permissions**

Permissions:
- Space access:
  - View space details
  - View members

- Content management:
  - Create issues
  - Edit own issues
  - Comment on issues
  - Create pull requests
  - Edit own pull requests
  - Create change requests
  - Edit own change requests

- Profile management:
  - Update own nickname
  - Update own status
  - Update own location

- Analytics:
  - View team analytics
  - View own analytics

### 3. Observer
**Read-only access**

Permissions:
- View space details
- View members
- View issues (read-only)
- View pull requests (read-only)
- View change requests (read-only)
- View analytics (read-only)

## Permission Categories

### Space Permissions
```typescript
enum SpacePermission {
  VIEW_SPACE = 'space:view',
  UPDATE_SPACE = 'space:update',
  DELETE_SPACE = 'space:delete',
  MANAGE_SETTINGS = 'space:manage_settings',
}
```

### Member Permissions
```typescript
enum MemberPermission {
  VIEW_MEMBERS = 'members:view',
  INVITE_MEMBERS = 'members:invite',
  REMOVE_MEMBERS = 'members:remove',
  UPDATE_MEMBER_ROLES = 'members:update_roles',
  UPDATE_OWN_PROFILE = 'members:update_own_profile',
}
```

### Content Permissions
```typescript
enum ContentPermission {
  // Issues
  VIEW_ISSUES = 'issues:view',
  CREATE_ISSUES = 'issues:create',
  UPDATE_OWN_ISSUES = 'issues:update_own',
  UPDATE_ALL_ISSUES = 'issues:update_all',
  DELETE_OWN_ISSUES = 'issues:delete_own',
  DELETE_ALL_ISSUES = 'issues:delete_all',

  // Pull Requests
  VIEW_PRS = 'prs:view',
  CREATE_PRS = 'prs:create',
  UPDATE_OWN_PRS = 'prs:update_own',
  UPDATE_ALL_PRS = 'prs:update_all',
  DELETE_OWN_PRS = 'prs:delete_own',
  DELETE_ALL_PRS = 'prs:delete_all',

  // Change Requests
  VIEW_CRS = 'change_requests:view',
  CREATE_CRS = 'change_requests:create',
  UPDATE_OWN_CRS = 'change_requests:update_own',
  UPDATE_ALL_CRS = 'change_requests:update_all',
  DELETE_OWN_CRS = 'change_requests:delete_own',
  DELETE_ALL_CRS = 'change_requests:delete_all',

  // Repositories
  VIEW_REPOS = 'repos:view',
  MANAGE_REPOS = 'repos:manage',
}
```

### Analytics Permissions
```typescript
enum AnalyticsPermission {
  VIEW_OWN_ANALYTICS = 'analytics:view_own',
  VIEW_TEAM_ANALYTICS = 'analytics:view_team',
  EXPORT_DATA = 'analytics:export',
}
```

## Role to Permission Mapping

```typescript
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    // Space
    'space:view',
    'space:update',
    'space:delete',
    'space:manage_settings',

    // Members
    'members:view',
    'members:invite',
    'members:remove',
    'members:update_roles',
    'members:update_own_profile',

    // Issues
    'issues:view',
    'issues:create',
    'issues:update_own',
    'issues:update_all',
    'issues:delete_own',
    'issues:delete_all',

    // Pull Requests
    'prs:view',
    'prs:create',
    'prs:update_own',
    'prs:update_all',
    'prs:delete_own',
    'prs:delete_all',

    // Change Requests
    'change_requests:view',
    'change_requests:create',
    'change_requests:update_own',
    'change_requests:update_all',
    'change_requests:delete_own',
    'change_requests:delete_all',

    // Repositories
    'repos:view',
    'repos:manage',

    // Analytics
    'analytics:view_own',
    'analytics:view_team',
    'analytics:export',
  ],

  member: [
    // Space
    'space:view',

    // Members
    'members:view',
    'members:update_own_profile',

    // Issues
    'issues:view',
    'issues:create',
    'issues:update_own',
    'issues:delete_own',

    // Pull Requests
    'prs:view',
    'prs:create',
    'prs:update_own',
    'prs:delete_own',

    // Change Requests
    'change_requests:view',
    'change_requests:create',
    'change_requests:update_own',
    'change_requests:delete_own',

    // Repositories
    'repos:view',

    // Analytics
    'analytics:view_own',
    'analytics:view_team',
  ],

  observer: [
    // Space
    'space:view',

    // Members
    'members:view',
    'members:update_own_profile',

    // Content (read-only)
    'issues:view',
    'prs:view',
    'change_requests:view',
    'repos:view',

    // Analytics (read-only)
    'analytics:view_own',
    'analytics:view_team',
  ],
};
```

## Database Schema Additions

### Option 1: Permission Matrix (Recommended for Simple Systems)
Keep the current role-based system and check permissions in application code.

**Pros:**
- Simpler schema
- Easier to understand
- Permissions defined in code

**Cons:**
- Changing permissions requires code deployment
- Less flexible for custom permissions per space

### Option 2: Database-Driven Permissions (Recommended for Complex Systems)
Add tables to store permissions and role-permission mappings.

```sql
-- Permissions table
create table permissions (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  category text not null,
  created_at timestamp with time zone default now()
);

-- Role permissions junction table
create table role_permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  permission_id uuid references permissions(id) on delete cascade,
  unique(role, permission_id)
);

-- Optional: Space-specific permission overrides
create table space_member_permissions (
  id uuid primary key default gen_random_uuid(),
  space_member_id uuid references space_members(id) on delete cascade,
  permission_id uuid references permissions(id) on delete cascade,
  granted boolean default true,
  unique(space_member_id, permission_id)
);
```

## Row Level Security (RLS) Policies

All tables should have RLS enabled with policies based on space membership and roles.

### Example: Issues Table RLS

```sql
-- Enable RLS
alter table issues enable row level security;

-- View: All space members can view
create policy "Space members can view issues"
  on issues for select
  using (
    exists (
      select 1 from space_members
      where space_members.space_id = issues.space_id
        and space_members.user_id = auth.uid()
    )
  );

-- Insert: Members and admins can create
create policy "Members can create issues"
  on issues for insert
  with check (
    exists (
      select 1 from space_members
      where space_members.space_id = issues.space_id
        and space_members.user_id = auth.uid()
        and space_members.role in ('admin', 'member')
    )
  );

-- Update: Admins can update all, members can update own
create policy "Users can update issues"
  on issues for update
  using (
    exists (
      select 1 from space_members
      where space_members.space_id = issues.space_id
        and space_members.user_id = auth.uid()
        and (
          space_members.role = 'admin'
          or (space_members.role = 'member' and issues.created_by = auth.uid())
        )
    )
  );

-- Delete: Admins can delete all, members can delete own
create policy "Users can delete issues"
  on issues for delete
  using (
    exists (
      select 1 from space_members
      where space_members.space_id = issues.space_id
        and space_members.user_id = auth.uid()
        and (
          space_members.role = 'admin'
          or (space_members.role = 'member' and issues.created_by = auth.uid())
        )
    )
  );
```

## Implementation Plan

### Phase 1: Core Permission System
1. Define permission constants and types
2. Create `usePermission` hook for checking permissions
3. Create `usePermissions` hook for bulk permission checks
4. Create `PermissionGate` component for conditional rendering

### Phase 2: Database Integration
1. Add RLS policies to all tables
2. Create helper functions for permission checks
3. Update mutations to respect permissions
4. Add server-side permission validation

### Phase 3: UI Integration
1. Update components to use permission gates
2. Hide/disable actions based on permissions
3. Add permission-based routing guards
4. Update forms and buttons with permission checks

### Phase 4: Admin Tools
1. Create member management UI
2. Add role assignment interface
3. Create audit log for permission changes
4. Add permission debugging tools (dev mode)

## Usage Examples

### Checking Permissions in Components

```typescript
// Single permission check
const { hasPermission } = usePermission(spaceId, 'issues:create');

if (hasPermission) {
  return <CreateIssueButton />;
}

// Multiple permission checks
const { hasPermissions } = usePermissions(spaceId, [
  'issues:update_all',
  'issues:delete_all',
]);

// Permission gate component
<PermissionGate spaceId={spaceId} permission="issues:delete_all">
  <DeleteButton />
</PermissionGate>

// Role-based check
const isAdmin = useIsSpaceAdmin(spaceId);
```

### Checking Permissions in Queries

```typescript
// Server-side permission check
export const deleteIssue = async (issueId: string) => {
  const hasPermission = await checkUserPermission(
    issueId,
    ['issues:delete_own', 'issues:delete_all']
  );

  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }

  // Proceed with deletion
};
```

## Security Considerations

1. **Defense in Depth:** Check permissions at multiple layers:
   - UI (hide unauthorized actions)
   - Client-side (prevent unauthorized requests)
   - Database (RLS policies as final enforcement)

2. **Principle of Least Privilege:** Users should have minimum permissions needed

3. **Audit Trail:** Log all permission changes and sensitive actions

4. **Token Validation:** Always validate GitHub tokens for GitHub API operations

5. **Owner Transfer:** Consider special handling for space ownership transfer

## Future Enhancements

1. **Custom Roles:** Allow spaces to define custom roles
2. **Fine-grained Permissions:** Per-resource permissions (e.g., specific issue access)
3. **Temporary Permissions:** Time-limited elevated access
4. **Permission Inheritance:** Team/project-level permission inheritance
5. **API Keys:** Service account permissions for integrations
