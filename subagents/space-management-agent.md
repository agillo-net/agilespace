# Space Management Agent

This agent specializes in workspace (space) operations, member management, role-based access control, and organization integration within AgileSpace.

## Expertise Areas

- Space creation and configuration
- Member management and role assignments
- Role-based access control (RBAC)
- GitHub organization integration
- Space settings and permissions
- Member invitation and onboarding workflows

## Key Directories and Files

- `src/components/organization-card.tsx` - Organization selection and space creation
- `src/components/team-members-card.tsx` - Member display and management
- `src/components/sidebars/space-sidebar.tsx` - Space navigation
- `src/hooks/api/use-spaces.ts` - Space data management
- `src/hooks/api/use-space-members.ts` - Member management
- `src/hooks/api/use-space-role.ts` - Role and permission handling
- `src/routes/spaces/route.tsx` - Spaces overview page
- `src/routes/space/$slug/members/index.tsx` - Member management page

## Data Models

### Space Entity
```typescript
interface Space {
  id: string
  name: string
  slug: string
  avatar_url: string
  github_org_id: number
  created_at: string
}

interface SpaceWithMembership extends Space {
  member_role: 'admin' | 'member' | 'observer'
  member_count?: number
  active_sessions_count?: number
}
```

### Space Member Entity
```typescript
interface SpaceMember {
  id: string
  space_id: string
  user_id: string
  role: 'admin' | 'member' | 'observer'
  created_at: string
}

interface SpaceMemberWithProfile extends SpaceMember {
  user: {
    id: string
    full_name: string
    github_username: string
    avatar_url: string | null
  }
}
```

### Role Permissions
```typescript
interface RolePermissions {
  admin: {
    canManageMembers: true
    canViewAllSessions: true
    canManageSettings: true
    canDeleteSpace: true
    canViewAnalytics: true
    canApproveChangeRequests: true
  }
  member: {
    canManageMembers: false
    canViewAllSessions: true
    canManageSettings: false
    canDeleteSpace: false
    canViewAnalytics: true
    canApproveChangeRequests: false
  }
  observer: {
    canManageMembers: false
    canViewAllSessions: false // Only own sessions
    canManageSettings: false
    canDeleteSpace: false
    canViewAnalytics: false
    canApproveChangeRequests: false
  }
}
```

## Space Creation and Setup

### GitHub Organization Integration
```typescript
// Create space from GitHub organization
export async function createSpaceFromOrganization({
  githubOrg,
  customName,
  customSlug
}: {
  githubOrg: GitHubOrganization
  customName?: string
  customSlug?: string
}) {
  const user = await getUser()
  if (!user?.id) throw new Error("User ID is required")

  // Generate slug from org name or use custom
  const slug = customSlug || generateSlugFromName(customName || githubOrg.login)
  
  // Check if slug is available
  const existingSpace = await getSpaceBySlug(slug)
  if (existingSpace) {
    throw new Error("Space slug already exists")
  }

  // Create the space
  const space = await createSpace({
    name: customName || githubOrg.name || githubOrg.login,
    slug,
    avatar_url: githubOrg.avatar_url,
    github_org_id: githubOrg.id
  })

  // Add creator as admin
  await createSpaceMember({
    space_id: space.id,
    role: 'admin'
  })

  // Optionally sync org members
  await syncOrganizationMembers(space.id, githubOrg.login)

  return space
}

// Sync GitHub organization members
async function syncOrganizationMembers(spaceId: string, orgLogin: string) {
  try {
    const orgMembers = await getOrgMembers(orgLogin)
    
    for (const member of orgMembers) {
      // Check if user exists in our system
      const profile = await getProfileByGitHubId(member.id)
      
      if (profile) {
        // Add as member if not already added
        const existingMembership = await getSpaceMembership(spaceId, profile.id)
        
        if (!existingMembership) {
          await createSpaceMember({
            space_id: spaceId,
            user_id: profile.id,
            role: 'member'
          })
        }
      }
    }
  } catch (error) {
    console.error('Failed to sync organization members:', error)
    // Non-blocking error - space creation should still succeed
  }
}
```

### Space Configuration
```typescript
// Update space settings
export async function updateSpaceSettings(
  spaceId: string,
  updates: {
    name?: string
    description?: string
    settings?: {
      allowSelfRegistration?: boolean
      defaultMemberRole?: 'member' | 'observer'
      requireApprovalForDurationChanges?: boolean
      enableNotifications?: boolean
    }
  }
) {
  // Verify admin permissions
  const membership = await getCurrentUserSpaceMembership(spaceId)
  if (membership?.role !== 'admin') {
    throw new Error('Admin permissions required')
  }

  const { data, error } = await supabase
    .from("spaces")
    .update({
      name: updates.name,
      description: updates.description,
      settings: updates.settings
    })
    .eq("id", spaceId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Generate unique slug
function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}
```

## Member Management

### Adding and Removing Members
```typescript
// Invite user to space
export async function inviteUserToSpace({
  spaceId,
  githubUsername,
  role = 'member'
}: {
  spaceId: string
  githubUsername: string
  role?: 'admin' | 'member' | 'observer'
}) {
  // Verify admin permissions
  const membership = await getCurrentUserSpaceMembership(spaceId)
  if (membership?.role !== 'admin') {
    throw new Error('Admin permissions required to invite members')
  }

  // Find user by GitHub username
  const profile = await getProfileByGitHubUsername(githubUsername)
  if (!profile) {
    throw new Error('User not found. They need to sign up first.')
  }

  // Check if already a member
  const existingMembership = await getSpaceMembership(spaceId, profile.id)
  if (existingMembership) {
    throw new Error('User is already a member of this space')
  }

  // Add member
  const { data, error } = await supabase
    .from("space_members")
    .insert({
      space_id: spaceId,
      user_id: profile.id,
      role
    })
    .select(`
      *,
      user:profiles!space_members_user_id_fkey(
        id, full_name, github_username, avatar_url
      )
    `)
    .single()

  if (error) throw new Error(error.message)

  // Send notification to invited user
  await sendMemberInviteNotification(profile.id, spaceId, role)

  return data
}

// Update member role
export async function updateMemberRole(
  spaceId: string,
  userId: string,
  newRole: 'admin' | 'member' | 'observer'
) {
  const currentMembership = await getCurrentUserSpaceMembership(spaceId)
  if (currentMembership?.role !== 'admin') {
    throw new Error('Admin permissions required')
  }

  // Prevent last admin from demoting themselves
  if (currentMembership.user_id === userId && newRole !== 'admin') {
    const adminCount = await getSpaceAdminCount(spaceId)
    if (adminCount <= 1) {
      throw new Error('Cannot remove the last admin from a space')
    }
  }

  const { data, error } = await supabase
    .from("space_members")
    .update({ role: newRole })
    .eq("space_id", spaceId)
    .eq("user_id", userId)
    .select(`
      *,
      user:profiles!space_members_user_id_fkey(
        id, full_name, github_username, avatar_url
      )
    `)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Remove member from space
export async function removeMemberFromSpace(spaceId: string, userId: string) {
  const currentMembership = await getCurrentUserSpaceMembership(spaceId)
  if (currentMembership?.role !== 'admin') {
    throw new Error('Admin permissions required')
  }

  // Prevent removing last admin
  const memberToRemove = await getSpaceMembership(spaceId, userId)
  if (memberToRemove?.role === 'admin') {
    const adminCount = await getSpaceAdminCount(spaceId)
    if (adminCount <= 1) {
      throw new Error('Cannot remove the last admin from a space')
    }
  }

  const { error } = await supabase
    .from("space_members")
    .delete()
    .eq("space_id", spaceId)
    .eq("user_id", userId)

  if (error) throw new Error(error.message)

  // Archive or transfer user's active sessions
  await handleMemberRemovalCleanup(spaceId, userId)
}
```

### Member Queries and Management
```typescript
// Get space members with filtering
export async function getSpaceMembers(
  spaceId: string,
  filters: {
    role?: 'admin' | 'member' | 'observer'
    search?: string
    includeStats?: boolean
  } = {}
) {
  let query = supabase
    .from("space_members")
    .select(`
      *,
      user:profiles!space_members_user_id_fkey(
        id, full_name, github_username, avatar_url
      )
    `)
    .eq("space_id", spaceId)

  if (filters.role) {
    query = query.eq("role", filters.role)
  }

  if (filters.search) {
    query = query.or(
      `user.full_name.ilike.%${filters.search}%,user.github_username.ilike.%${filters.search}%`
    )
  }

  query = query.order("created_at", { ascending: false })

  const { data, error } = await query
  if (error) throw new Error(error.message)

  // Optionally include member statistics
  if (filters.includeStats && data) {
    const membersWithStats = await Promise.all(
      data.map(async (member) => {
        const stats = await getMemberStats(spaceId, member.user_id)
        return { ...member, stats }
      })
    )
    return membersWithStats
  }

  return data || []
}

// Get member statistics
async function getMemberStats(spaceId: string, userId: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select("status, actual_duration")
    .eq("space_id", spaceId)
    .eq("user_id", userId)

  if (error) return null

  const stats = data.reduce(
    (acc, session) => {
      acc.totalSessions++
      if (session.status === 'completed') {
        acc.completedSessions++
        acc.totalTime += session.actual_duration || 0
      } else if (session.status === 'active') {
        acc.activeSessions++
      }
      return acc
    },
    {
      totalSessions: 0,
      completedSessions: 0,
      activeSessions: 0,
      totalTime: 0
    }
  )

  return stats
}
```

## Role-Based Access Control

### Permission Checking
```typescript
// Check specific permissions
export async function checkPermission(
  spaceId: string,
  permission: keyof RolePermissions['admin']
): Promise<boolean> {
  const membership = await getCurrentUserSpaceMembership(spaceId)
  if (!membership) return false

  const rolePermissions: RolePermissions = {
    admin: {
      canManageMembers: true,
      canViewAllSessions: true,
      canManageSettings: true,
      canDeleteSpace: true,
      canViewAnalytics: true,
      canApproveChangeRequests: true
    },
    member: {
      canManageMembers: false,
      canViewAllSessions: true,
      canManageSettings: false,
      canDeleteSpace: false,
      canViewAnalytics: true,
      canApproveChangeRequests: false
    },
    observer: {
      canManageMembers: false,
      canViewAllSessions: false,
      canManageSettings: false,
      canDeleteSpace: false,
      canViewAnalytics: false,
      canApproveChangeRequests: false
    }
  }

  return rolePermissions[membership.role][permission] || false
}

// Permission hook for UI components
export function useSpacePermissions(spaceId: string) {
  const { data: membership } = useSpaceMembership(spaceId)
  
  return useMemo(() => {
    if (!membership) {
      return {
        canManageMembers: false,
        canViewAllSessions: false,
        canManageSettings: false,
        canDeleteSpace: false,
        canViewAnalytics: false,
        canApproveChangeRequests: false,
        role: null
      }
    }

    const permissions = {
      admin: {
        canManageMembers: true,
        canViewAllSessions: true,
        canManageSettings: true,
        canDeleteSpace: true,
        canViewAnalytics: true,
        canApproveChangeRequests: true
      },
      member: {
        canManageMembers: false,
        canViewAllSessions: true,
        canManageSettings: false,
        canDeleteSpace: false,
        canViewAnalytics: true,
        canApproveChangeRequests: false
      },
      observer: {
        canManageMembers: false,
        canViewAllSessions: false,
        canManageSettings: false,
        canDeleteSpace: false,
        canViewAnalytics: false,
        canApproveChangeRequests: false
      }
    }

    return {
      ...permissions[membership.role],
      role: membership.role
    }
  }, [membership])
}
```

### Conditional UI Rendering
```typescript
// Conditional navigation based on permissions
function SpaceNavigation({ spaceId }: { spaceId: string }) {
  const permissions = useSpacePermissions(spaceId)
  const { slug } = useParams()

  return (
    <nav>
      <Link to="/space/$slug" params={{ slug }}>
        Dashboard
      </Link>
      
      <Link to="/space/$slug/sessions" params={{ slug }}>
        {permissions.canViewAllSessions ? 'All Sessions' : 'My Sessions'}
      </Link>
      
      {permissions.canViewAnalytics && (
        <Link to="/space/$slug/analytics" params={{ slug }}>
          Analytics
        </Link>
      )}
      
      {permissions.canManageMembers && (
        <Link to="/space/$slug/members" params={{ slug }}>
          Members
        </Link>
      )}
      
      {permissions.canApproveChangeRequests && (
        <Link to="/space/$slug/change-requests" params={{ slug }}>
          Change Requests
        </Link>
      )}
      
      {permissions.canManageSettings && (
        <Link to="/space/$slug/settings" params={{ slug }}>
          Settings
        </Link>
      )}
    </nav>
  )
}

// Member management interface
function MemberManagement({ spaceId }: { spaceId: string }) {
  const permissions = useSpacePermissions(spaceId)
  const { data: members } = useSpaceMembers(spaceId)

  if (!permissions.canManageMembers) {
    return <div>You don't have permission to manage members.</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2>Members</h2>
        <Button onClick={() => setShowInviteDialog(true)}>
          Invite Member
        </Button>
      </div>
      
      <div className="space-y-4">
        {members?.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            canChangeRole={permissions.canManageMembers}
            onRoleChange={(newRole) => updateMemberRole(spaceId, member.user_id, newRole)}
            onRemove={() => removeMemberFromSpace(spaceId, member.user_id)}
          />
        ))}
      </div>
    </div>
  )
}
```

## Space Dashboard and Analytics

### Space Overview Data
```typescript
// Get comprehensive space dashboard data
export async function getSpaceDashboardData(spaceId: string) {
  const [
    space,
    members,
    recentSessions,
    activeSessionsCount,
    stats
  ] = await Promise.all([
    getSpace(spaceId),
    getSpaceMembers(spaceId, { includeStats: true }),
    getRecentSessions(spaceId, { limit: 10 }),
    getActiveSessionsCount(spaceId),
    getSpaceStatistics(spaceId, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      end: new Date().toISOString()
    })
  ])

  return {
    space,
    members,
    recentSessions,
    activeSessionsCount,
    stats
  }
}

// Space activity statistics
export async function getSpaceStatistics(
  spaceId: string,
  dateRange: { start: string; end: string }
) {
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("status, actual_duration, started_at, user_id")
    .eq("space_id", spaceId)
    .gte("started_at", dateRange.start)
    .lte("started_at", dateRange.end)

  if (error) throw new Error(error.message)

  const stats = sessions.reduce(
    (acc, session) => {
      acc.totalSessions++
      
      if (session.status === 'completed') {
        acc.completedSessions++
        acc.totalTime += session.actual_duration || 0
      }
      
      // Track unique active users
      acc.activeUsers.add(session.user_id)
      
      return acc
    },
    {
      totalSessions: 0,
      completedSessions: 0,
      totalTime: 0,
      activeUsers: new Set<string>()
    }
  )

  return {
    totalSessions: stats.totalSessions,
    completedSessions: stats.completedSessions,
    totalTime: stats.totalTime,
    averageSessionTime: stats.completedSessions > 0 
      ? Math.round(stats.totalTime / stats.completedSessions)
      : 0,
    activeUsersCount: stats.activeUsers.size
  }
}
```

## Space Cleanup and Lifecycle

### Member Removal Cleanup
```typescript
// Handle cleanup when member is removed
async function handleMemberRemovalCleanup(spaceId: string, userId: string) {
  // End any active sessions
  const { data: activeSessions } = await supabase
    .from("sessions")
    .select("id")
    .eq("space_id", spaceId)
    .eq("user_id", userId)
    .eq("status", "active")

  if (activeSessions && activeSessions.length > 0) {
    await Promise.all(
      activeSessions.map(session =>
        endSession(session.id, undefined, "Session ended due to member removal")
      )
    )
  }

  // Archive or reassign change requests
  await supabase
    .from("session_duration_change_requests")
    .update({ status: 'archived' })
    .eq("requester_id", userId)
    .eq("status", "pending")
}

// Delete space (admin only)
export async function deleteSpace(spaceId: string) {
  const membership = await getCurrentUserSpaceMembership(spaceId)
  if (membership?.role !== 'admin') {
    throw new Error('Admin permissions required to delete space')
  }

  // Ensure user is the only admin or get confirmation from all admins
  const adminCount = await getSpaceAdminCount(spaceId)
  if (adminCount > 1) {
    throw new Error('All admins must approve space deletion when multiple admins exist')
  }

  // Archive all data before deletion
  await archiveSpaceData(spaceId)

  // Delete space (cascading deletes will handle related data)
  const { error } = await supabase
    .from("spaces")
    .delete()
    .eq("id", spaceId)

  if (error) throw new Error(error.message)
}

async function archiveSpaceData(spaceId: string) {
  // Implementation depends on archival requirements
  // Could export to JSON, move to archive tables, etc.
}
```

## Integration Points

### GitHub Organization Sync
```typescript
// Periodic sync with GitHub organization
export async function syncSpaceWithGitHub(spaceId: string) {
  const space = await getSpace(spaceId)
  if (!space.github_org_id) return

  try {
    // Get current GitHub org data
    const orgData = await getOrganization(space.github_org_id)
    
    // Update space if org data changed
    if (orgData.name !== space.name || orgData.avatar_url !== space.avatar_url) {
      await updateSpace(spaceId, {
        name: orgData.name,
        avatar_url: orgData.avatar_url
      })
    }

    // Sync member list
    await syncOrganizationMembers(spaceId, orgData.login)
    
  } catch (error) {
    console.error('Failed to sync space with GitHub:', error)
  }
}
```

### Session Integration
- Space membership controls session visibility
- Role-based session management permissions
- Space-level session statistics and analytics

### Notification Integration
- Member invitation notifications
- Role change notifications
- Space activity summaries

### Analytics Integration
- Space-level activity tracking
- Member contribution analytics
- Time tracking aggregations across space members