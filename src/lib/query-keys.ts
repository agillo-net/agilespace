/**
 * Centralized Query Keys Configuration
 *
 * This file defines all React Query cache keys used throughout the application.
 * Benefits:
 * - Prevents cache key collisions
 * - Provides type safety for query keys
 * - Makes it easier to find and update query keys
 * - Enables better cache management and invalidation
 *
 * Usage:
 * import { queryKeys } from '@/lib/query-keys'
 *
 * useQuery({
 *   queryKey: queryKeys.spaces.bySlug(slug),
 *   queryFn: () => getSpaceBySlug(slug)
 * })
 */

export const queryKeys = {
  // Space queries
  spaces: {
    all: ['spaces'] as const,
    lists: () => [...queryKeys.spaces.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.spaces.lists(), filters] as const,
    details: () => [...queryKeys.spaces.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.spaces.details(), id] as const,
    bySlug: (slug: string) => [...queryKeys.spaces.all, 'slug', slug] as const,
    withMembership: () => [...queryKeys.spaces.all, 'withMembership'] as const,
    withTracks: (slug: string) =>
      [...queryKeys.spaces.all, 'withTracks', slug] as const,
  },

  // Space members queries
  spaceMembers: {
    all: ['spaceMembers'] as const,
    bySpace: (spaceSlug: string) =>
      [...queryKeys.spaceMembers.all, spaceSlug] as const,
    withProfiles: (spaceSlug: string) =>
      [...queryKeys.spaceMembers.all, 'withProfiles', spaceSlug] as const,
    count: (spaceId: string) =>
      [...queryKeys.spaceMembers.all, 'count', spaceId] as const,
  },

  // Track queries
  tracks: {
    all: ['tracks'] as const,
    bySpace: (spaceId: string) =>
      [...queryKeys.tracks.all, 'space', spaceId] as const,
    byIssue: (spaceId: string, repoOwner: string, repoName: string, issueNumber: number) =>
      [...queryKeys.tracks.all, 'issue', spaceId, repoOwner, repoName, issueNumber] as const,
    withSessionData: (spaceId: string) =>
      [...queryKeys.tracks.all, 'withSessionData', spaceId] as const,
    count: (spaceId: string) =>
      [...queryKeys.tracks.all, 'count', spaceId] as const,
  },

  // Session queries
  sessions: {
    all: ['sessions'] as const,
    active: (slug?: string) =>
      slug ? [...queryKeys.sessions.all, 'active', slug] as const : [...queryKeys.sessions.all, 'active'] as const,
    activeByUser: (userId: string) =>
      [...queryKeys.sessions.all, 'active', 'user', userId] as const,
    closed: (spaceId: string) =>
      [...queryKeys.sessions.all, 'closed', spaceId] as const,
    byTrack: (trackId: string) =>
      [...queryKeys.sessions.all, 'track', trackId] as const,
    stats: (trackIds: string[]) =>
      [...queryKeys.sessions.all, 'stats', trackIds] as const,
    activeCount: (spaceId: string) =>
      [...queryKeys.sessions.all, 'activeCount', spaceId] as const,
    closedCount: (spaceId: string) =>
      [...queryKeys.sessions.all, 'closedCount', spaceId] as const,
    aggregations: (spaceId: string, timeFilter: string) =>
      [...queryKeys.sessions.all, 'aggregations', spaceId, timeFilter] as const,
  },

  // User/Profile queries
  users: {
    all: ['users'] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
    profile: (userId?: string) =>
      userId ? [...queryKeys.users.all, 'profile', userId] as const : [...queryKeys.users.all, 'profile'] as const,
  },

  // Tag queries
  tags: {
    all: ['tags'] as const,
    bySpace: (spaceId: string) =>
      [...queryKeys.tags.all, 'space', spaceId] as const,
    count: (spaceId: string) =>
      [...queryKeys.tags.all, 'count', spaceId] as const,
  },

  // GitHub repo permissions
  repoPermissions: {
    all: ['repoPermissions'] as const,
    bySpace: (spaceId: string) =>
      [...queryKeys.repoPermissions.all, 'space', spaceId] as const,
    byRepo: (spaceId: string, repoOwner: string, repoName: string) =>
      [...queryKeys.repoPermissions.all, 'repo', spaceId, repoOwner, repoName] as const,
    checkAccess: (spaceId: string, repoOwner: string, repoName: string, minPermission: string) =>
      [...queryKeys.repoPermissions.all, 'checkAccess', spaceId, repoOwner, repoName, minPermission] as const,
    accessible: (spaceId: string, minPermission: string) =>
      [...queryKeys.repoPermissions.all, 'accessible', spaceId, minPermission] as const,
  },

  // Session change requests
  sessionChangeRequests: {
    all: ['sessionChangeRequests'] as const,
    bySpace: (spaceId: string) =>
      [...queryKeys.sessionChangeRequests.all, 'space', spaceId] as const,
    detail: (requestId: string) =>
      [...queryKeys.sessionChangeRequests.all, 'detail', requestId] as const,
  },

  // Time off requests
  timeOffRequests: {
    all: ['timeOffRequests'] as const,
    bySpace: (spaceId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.timeOffRequests.all, 'space', spaceId, filters] as const,
    detail: (requestId: string) =>
      [...queryKeys.timeOffRequests.all, 'detail', requestId] as const,
    conflicts: (spaceMemberId: string, startDate: string, endDate: string) =>
      [...queryKeys.timeOffRequests.all, 'conflicts', spaceMemberId, startDate, endDate] as const,
    teamTimeOff: (spaceId: string, startDate: string, endDate: string) =>
      [...queryKeys.timeOffRequests.all, 'team', spaceId, startDate, endDate] as const,
    stats: (spaceId: string, userId: string, year?: number) =>
      [...queryKeys.timeOffRequests.all, 'stats', spaceId, userId, year] as const,
  },

  // Organization queries
  organizations: {
    all: ['organizations'] as const,
    byGithubId: (githubOrgId: string) =>
      [...queryKeys.organizations.all, 'github', githubOrgId] as const,
    userOrgs: () => [...queryKeys.organizations.all, 'user'] as const,
    repositories: (organizationLogin: string) =>
      [...queryKeys.organizations.all, 'repositories', organizationLogin] as const,
  },

  // Member stats and analytics
  memberStats: {
    all: ['memberStats'] as const,
    detail: (memberId: string, spaceId: string) =>
      [...queryKeys.memberStats.all, 'detail', memberId, spaceId] as const,
    sessions: (memberId: string, timeFilter: string, startDate: string, endDate: string) =>
      [...queryKeys.memberStats.all, 'sessions', memberId, timeFilter, startDate, endDate] as const,
    trackStats: (memberId: string, timeFilter: string, startDate: string, endDate: string) =>
      [...queryKeys.memberStats.all, 'trackStats', memberId, timeFilter, startDate, endDate] as const,
    activeSession: (memberId: string) =>
      [...queryKeys.memberStats.all, 'activeSession', memberId] as const,
  },

  // Dashboard analytics
  analytics: {
    all: ['analytics'] as const,
    timeHeatmap: (spaceId: string) =>
      [...queryKeys.analytics.all, 'timeHeatmap', spaceId] as const,
    productivityTrend: (spaceId: string) =>
      [...queryKeys.analytics.all, 'productivityTrend', spaceId] as const,
    activityTimeline: (spaceId: string) =>
      [...queryKeys.analytics.all, 'activityTimeline', spaceId] as const,
    focusTimeDistribution: (spaceId: string) =>
      [...queryKeys.analytics.all, 'focusTimeDistribution', spaceId] as const,
    productivityMetrics: (spaceId: string) =>
      [...queryKeys.analytics.all, 'productivityMetrics', spaceId] as const,
    teamProductivityInsights: (spaceId: string) =>
      [...queryKeys.analytics.all, 'teamProductivityInsights', spaceId] as const,
    productivityTrends: (spaceId: string) =>
      [...queryKeys.analytics.all, 'productivityTrends', spaceId] as const,
    burnoutIndicators: (spaceId: string) =>
      [...queryKeys.analytics.all, 'burnoutIndicators', spaceId] as const,
  },

  // Team insights
  teamInsights: {
    all: ['teamInsights'] as const,
    collaboration: (spaceId: string) =>
      [...queryKeys.teamInsights.all, 'collaboration', spaceId] as const,
    memberActivity: (spaceId: string) =>
      [...queryKeys.teamInsights.all, 'memberActivity', spaceId] as const,
    dynamics: (spaceId: string) =>
      [...queryKeys.teamInsights.all, 'dynamics', spaceId] as const,
    skillDistribution: (spaceId: string) =>
      [...queryKeys.teamInsights.all, 'skillDistribution', spaceId] as const,
    performance: (spaceId: string) =>
      [...queryKeys.teamInsights.all, 'performance', spaceId] as const,
  },

  // Permissions
  permissions: {
    all: ['permissions'] as const,
    single: (spaceId: string, permission: string) =>
      [...queryKeys.permissions.all, 'single', spaceId, permission] as const,
    any: (spaceId: string, permissions: string[]) =>
      [...queryKeys.permissions.all, 'any', spaceId, permissions] as const,
    allRequired: (spaceId: string, permissions: string[]) =>
      [...queryKeys.permissions.all, 'allRequired', spaceId, permissions] as const,
    user: (spaceId: string) =>
      [...queryKeys.permissions.all, 'user', spaceId] as const,
    specific: (spaceId: string, permissionsToCheck: Record<string, boolean>) =>
      [...queryKeys.permissions.all, 'specific', spaceId, permissionsToCheck] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (params: { spaceId?: string; read?: boolean; types?: string[] }) =>
      [...queryKeys.notifications.all, 'list', params] as const,
    count: (spaceId?: string) =>
      [...queryKeys.notifications.all, 'count', spaceId] as const,
    detail: (notificationId: string) =>
      [...queryKeys.notifications.all, 'detail', notificationId] as const,
    preferences: (spaceId?: string) =>
      [...queryKeys.notifications.all, 'preferences', spaceId] as const,
  },

  // Search queries
  search: {
    all: ['search'] as const,
    sessions: (slug: string, searchQuery: string) =>
      [...queryKeys.search.all, 'sessions', slug, searchQuery] as const,
    tracks: (spaceId: string, trackIds: string[]) =>
      [...queryKeys.search.all, 'tracks', spaceId, trackIds] as const,
    trackStats: (trackIds: string[]) =>
      [...queryKeys.search.all, 'trackStats', trackIds] as const,
  },
} as const;

/**
 * Helper function to invalidate all queries for a specific space
 * Usage: invalidateSpaceQueries(queryClient, spaceId)
 */
export function getSpaceRelatedQueryKeys(spaceIdOrSlug: string) {
  return [
    queryKeys.spaces.bySlug(spaceIdOrSlug),
    queryKeys.spaces.withTracks(spaceIdOrSlug),
    queryKeys.spaceMembers.bySpace(spaceIdOrSlug),
    queryKeys.tracks.bySpace(spaceIdOrSlug),
    queryKeys.sessions.active(spaceIdOrSlug),
    queryKeys.tags.bySpace(spaceIdOrSlug),
  ];
}

/**
 * Helper type for query key arrays
 * This type extracts all possible query key types from the queryKeys object
 */
export type QueryKey = readonly unknown[];
