# TanStack Query Agent

This agent specializes in server state management, data fetching, caching strategies, and real-time updates using TanStack Query v5.76.1.

## Expertise Areas

- Server state management and synchronization
- Query and mutation patterns
- Caching strategies and invalidation
- Optimistic updates and error handling
- Real-time data with Supabase subscriptions
- Background refetching and stale-while-revalidate
- Infinite queries and pagination

## Key Directories and Files

- `src/hooks/api/` - Custom query and mutation hooks
- `src/hooks/api/use-auth.tsx` - Authentication state management
- `src/hooks/api/use-sessions.ts` - Session data management
- `src/hooks/api/use-spaces.ts` - Space data management
- `src/hooks/api/use-space-members.ts` - Member data management
- `src/hooks/api/use-tracks.ts` - Track data management
- `src/hooks/api/use-tags.ts` - Tag data management

## Core Query Client Configuration

### Main Query Client Setup
```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - data considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      
      // Garbage collection time - keep in cache for 10 minutes after last use
      gcTime: 1000 * 60 * 10,
      
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error: any) => {
        if (error?.status === 404 || error?.status === 403) {
          return false // Don't retry on 404/403
        }
        return failureCount < 3
      },
      
      // Refetch on window focus for important data
      refetchOnWindowFocus: true,
      
      // Don't refetch on reconnect by default
      refetchOnReconnect: false,
      
      // Background refetch interval for active data
      refetchInterval: false, // Set per-query for real-time data
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Network mode for offline support
      networkMode: 'online',
    }
  }
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

## Query Patterns and Custom Hooks

### Authentication Queries
```typescript
// src/hooks/api/use-auth.tsx
export function useAuth() {
  return useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const user = await getUser()
      if (!user) return { user: null, profile: null }
      
      try {
        const profile = await getProfile()
        return { user, profile }
      } catch (error) {
        // Profile might not exist yet
        return { user, profile: null }
      }
    },
    staleTime: 1000 * 60 * 10, // Auth data fresh for 10 minutes
    gcTime: 1000 * 60 * 30,    // Keep in cache for 30 minutes
    refetchOnWindowFocus: true,
    retry: false // Don't retry auth failures
  })
}

export function useProfile() {
  const { data: auth } = useAuth()
  
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: !!auth?.user,
    staleTime: 1000 * 60 * 15, // Profile data fresh for 15 minutes
  })
}

// Create profile mutation
export function useCreateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: getOrCreateProfile,
    onSuccess: (profile) => {
      // Update auth cache with new profile
      queryClient.setQueryData(['auth'], (old: any) => ({
        ...old,
        profile
      }))
      
      // Set profile cache
      queryClient.setQueryData(['profile'], profile)
    },
    onError: (error) => {
      console.error('Failed to create profile:', error)
    }
  })
}
```

### Space Management Queries
```typescript
// src/hooks/api/use-spaces.ts
export function useUserSpaces() {
  const { data: auth } = useAuth()
  
  return useQuery({
    queryKey: ['spaces', 'user'],
    queryFn: getUserSpaces,
    enabled: !!auth?.user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (spaces) => {
      // Transform data for UI consumption
      return spaces.map(space => ({
        ...space,
        isAdmin: space.member_role === 'admin',
        canManage: ['admin', 'member'].includes(space.member_role)
      }))
    }
  })
}

export function useSpace(slug: string) {
  return useQuery({
    queryKey: ['space', slug],
    queryFn: () => getSpaceBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10, // Space data fresh for 10 minutes
    throwOnError: true // Let route handle errors
  })
}

export function useSpaceMembers(spaceId: string, filters?: MemberFilters) {
  return useQuery({
    queryKey: ['space-members', spaceId, filters],
    queryFn: () => getSpaceMembers(spaceId, filters),
    enabled: !!spaceId,
    staleTime: 1000 * 60 * 3, // Member data fresh for 3 minutes
  })
}

// Create space mutation
export function useCreateSpace() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createSpaceFromOrganization,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['spaces'] })
      
      // Snapshot previous value
      const previousSpaces = queryClient.getQueryData(['spaces', 'user'])
      
      // Optimistically update
      queryClient.setQueryData(['spaces', 'user'], (old: any) => [
        {
          id: 'temp-' + Date.now(),
          name: variables.customName || variables.githubOrg.login,
          slug: variables.customSlug || variables.githubOrg.login,
          member_role: 'admin',
          ...variables.githubOrg
        },
        ...(old || [])
      ])
      
      return { previousSpaces }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousSpaces) {
        queryClient.setQueryData(['spaces', 'user'], context.previousSpaces)
      }
    },
    onSuccess: (newSpace) => {
      // Update with real data
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
      queryClient.setQueryData(['space', newSpace.slug], newSpace)
    }
  })
}
```

### Session Management Queries
```typescript
// src/hooks/api/use-sessions.ts
export function useSessions(
  spaceId: string, 
  filters: SessionFilters = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['sessions', spaceId, filters],
    queryFn: () => getSpaceSessions(spaceId, filters),
    enabled: !!spaceId && (options.enabled !== false),
    staleTime: 1000 * 60 * 2, // Sessions fresh for 2 minutes
    refetchInterval: filters.status === 'active' ? 1000 * 30 : false, // Refetch active sessions every 30s
    select: (sessions) => {
      // Sort and transform sessions
      return sessions
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
        .map(session => ({
          ...session,
          duration: session.actual_duration || calculateElapsedTime(session.started_at),
          canEdit: session.status === 'active',
          isOwn: session.user_id === getCurrentUserId()
        }))
    }
  })
}

export function useActiveSessionsCount(spaceId: string) {
  return useQuery({
    queryKey: ['active-sessions-count', spaceId],
    queryFn: () => getActiveSessionsCount(spaceId),
    enabled: !!spaceId,
    staleTime: 1000 * 30, // Fresh for 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  })
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId),
    enabled: !!sessionId,
    staleTime: 1000 * 60, // Individual session fresh for 1 minute
  })
}

// Session mutations
export function useCreateSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createSession,
    onMutate: async (variables) => {
      // Cancel related queries
      await queryClient.cancelQueries({ queryKey: ['sessions', variables.space_id] })
      
      // Create optimistic session
      const optimisticSession = {
        id: 'temp-' + Date.now(),
        ...variables,
        status: 'active',
        started_at: new Date().toISOString(),
        user: await getCurrentUser()
      }
      
      // Update sessions list
      queryClient.setQueryData(['sessions', variables.space_id], (old: any) => [
        optimisticSession,
        ...(old || [])
      ])
      
      return { optimisticSession }
    },
    onSuccess: (newSession, variables) => {
      // Replace optimistic with real data
      queryClient.setQueryData(['session', newSession.id], newSession)
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.space_id] })
      queryClient.invalidateQueries({ queryKey: ['active-sessions-count'] })
    },
    onError: (error, variables, context) => {
      // Remove optimistic update
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.space_id] })
    }
  })
}

export function useEndSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ sessionId, actualDuration, endMessage }: EndSessionParams) =>
      endSession(sessionId, actualDuration, endMessage),
    onMutate: async (variables) => {
      // Optimistically update session
      queryClient.setQueryData(['session', variables.sessionId], (old: any) => ({
        ...old,
        status: 'completed',
        ended_at: new Date().toISOString(),
        actual_duration: variables.actualDuration
      }))
    },
    onSuccess: (endedSession) => {
      // Update all related caches
      queryClient.setQueryData(['session', endedSession.id], endedSession)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['active-sessions-count'] })
      queryClient.invalidateQueries({ queryKey: ['space-stats'] })
    }
  })
}
```

## Advanced Query Patterns

### Infinite Queries for Pagination
```typescript
export function useInfiniteSessions(spaceId: string, filters: SessionFilters) {
  return useInfiniteQuery({
    queryKey: ['sessions-infinite', spaceId, filters],
    queryFn: ({ pageParam = 0 }) => 
      getSpaceSessions(spaceId, { 
        ...filters, 
        offset: pageParam * 20, 
        limit: 20 
      }),
    enabled: !!spaceId,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length : undefined
    },
    staleTime: 1000 * 60 * 5,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      sessions: data.pages.flat()
    })
  })
}
```

### Dependent Queries
```typescript
export function useSessionWithTrack(sessionId: string) {
  const { data: session } = useSession(sessionId)
  
  const { data: track } = useQuery({
    queryKey: ['track', session?.track_id],
    queryFn: () => getTrack(session!.track_id!),
    enabled: !!session?.track_id,
    staleTime: 1000 * 60 * 10
  })
  
  return {
    session,
    track,
    isLoading: !session || (session.track_id && !track)
  }
}
```

### Parallel Queries with Promise.all Pattern
```typescript
export function useSpaceDashboard(spaceId: string) {
  return useQuery({
    queryKey: ['space-dashboard', spaceId],
    queryFn: async () => {
      const [space, members, recentSessions, stats] = await Promise.all([
        getSpace(spaceId),
        getSpaceMembers(spaceId),
        getRecentSessions(spaceId, { limit: 10 }),
        getSpaceStatistics(spaceId, { 
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        })
      ])
      
      return { space, members, recentSessions, stats }
    },
    enabled: !!spaceId,
    staleTime: 1000 * 60 * 5
  })
}
```

## Real-time Updates with Supabase

### Real-time Subscriptions
```typescript
export function useRealtimeSessions(spaceId: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    if (!spaceId) return
    
    const channel = supabase
      .channel(`space-${spaceId}-sessions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `space_id=eq.${spaceId}`
        },
        (payload) => {
          handleSessionChange(payload, queryClient, spaceId)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [spaceId, queryClient])
}

function handleSessionChange(payload: any, queryClient: QueryClient, spaceId: string) {
  const { eventType, new: newRecord, old: oldRecord } = payload
  
  switch (eventType) {
    case 'INSERT':
      // Add new session to cache
      queryClient.setQueryData(['sessions', spaceId], (old: any) => 
        [newRecord, ...(old || [])]
      )
      queryClient.setQueryData(['session', newRecord.id], newRecord)
      break
      
    case 'UPDATE':
      // Update session in cache
      queryClient.setQueryData(['session', newRecord.id], newRecord)
      queryClient.setQueryData(['sessions', spaceId], (old: any) =>
        old?.map((session: any) => 
          session.id === newRecord.id ? newRecord : session
        )
      )
      break
      
    case 'DELETE':
      // Remove session from cache
      queryClient.removeQueries({ queryKey: ['session', oldRecord.id] })
      queryClient.setQueryData(['sessions', spaceId], (old: any) =>
        old?.filter((session: any) => session.id !== oldRecord.id)
      )
      break
  }
  
  // Invalidate related queries
  queryClient.invalidateQueries({ queryKey: ['active-sessions-count', spaceId] })
  queryClient.invalidateQueries({ queryKey: ['space-stats', spaceId] })
}
```

### Optimistic Updates with Rollback
```typescript
export function useUpdateSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ sessionId, updates }: { sessionId: string; updates: Partial<Session> }) =>
      updateSession(sessionId, updates),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['session', variables.sessionId] })
      
      // Snapshot previous value
      const previousSession = queryClient.getQueryData(['session', variables.sessionId])
      
      // Optimistically update
      queryClient.setQueryData(['session', variables.sessionId], (old: any) => ({
        ...old,
        ...variables.updates
      }))
      
      return { previousSession, sessionId: variables.sessionId }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousSession) {
        queryClient.setQueryData(['session', context.sessionId], context.previousSession)
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['session', variables.sessionId] })
    }
  })
}
```

## Caching Strategies

### Query Key Patterns
```typescript
// Consistent query key structure
export const queryKeys = {
  // Authentication
  auth: ['auth'] as const,
  profile: ['profile'] as const,
  
  // Spaces
  spaces: {
    all: ['spaces'] as const,
    user: ['spaces', 'user'] as const,
    detail: (slug: string) => ['space', slug] as const,
    members: (spaceId: string) => ['space-members', spaceId] as const,
    stats: (spaceId: string) => ['space-stats', spaceId] as const,
  },
  
  // Sessions
  sessions: {
    all: ['sessions'] as const,
    bySpace: (spaceId: string) => ['sessions', spaceId] as const,
    filtered: (spaceId: string, filters: SessionFilters) => 
      ['sessions', spaceId, filters] as const,
    detail: (sessionId: string) => ['session', sessionId] as const,
    activeCount: (spaceId: string) => ['active-sessions-count', spaceId] as const,
  },
  
  // Tracks and Tags
  tracks: (spaceId: string) => ['tracks', spaceId] as const,
  tags: (spaceId: string) => ['tags', spaceId] as const,
} as const
```

### Smart Cache Invalidation
```typescript
export function useSmartInvalidation() {
  const queryClient = useQueryClient()
  
  const invalidateSpaceData = useCallback((spaceId: string) => {
    // Invalidate all space-related queries
    queryClient.invalidateQueries({ queryKey: ['space-members', spaceId] })
    queryClient.invalidateQueries({ queryKey: ['space-stats', spaceId] })
    queryClient.invalidateQueries({ queryKey: ['sessions', spaceId] })
    queryClient.invalidateQueries({ queryKey: ['active-sessions-count', spaceId] })
  }, [queryClient])
  
  const invalidateUserData = useCallback(() => {
    // Invalidate user-specific queries
    queryClient.invalidateQueries({ queryKey: ['auth'] })
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    queryClient.invalidateQueries({ queryKey: ['spaces', 'user'] })
  }, [queryClient])
  
  return { invalidateSpaceData, invalidateUserData }
}
```

### Background Refetching Strategies
```typescript
// Different refetch strategies based on data importance
export const refetchStrategies = {
  // Critical real-time data
  activeSessions: {
    refetchInterval: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 1000 * 15 // 15 seconds
  },
  
  // Important but less frequent updates
  sessionList: {
    refetchInterval: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 // 1 minute
  },
  
  // Static-ish data
  spaceMembers: {
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10 // 10 minutes
  },
  
  // Rarely changing data
  userProfile: {
    refetchInterval: false,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 15 // 15 minutes
  }
}
```

## Error Handling and Loading States

### Centralized Error Handling
```typescript
export function useErrorHandler() {
  const queryClient = useQueryClient()
  
  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Query error${context ? ` in ${context}` : ''}:`, error)
    
    // Handle specific error types
    if (error?.status === 401) {
      // Clear auth cache and redirect to login
      queryClient.clear()
      window.location.href = '/login'
    } else if (error?.status === 403) {
      // Permission denied - show toast or redirect
      toast.error('You do not have permission to access this resource')
    } else if (error?.status >= 500) {
      // Server error - show retry option
      toast.error('Server error. Please try again later.')
    }
  }, [queryClient])
  
  return { handleError }
}

// Global error boundary for queries
export const globalQueryErrorHandler = (error: any) => {
  console.error('Global query error:', error)
  // Log to error reporting service
}
```

### Loading State Management
```typescript
export function useLoadingStates() {
  return {
    // Combine multiple loading states
    isSomeLoading: (...queries: Array<{ isLoading: boolean }>) =>
      queries.some(q => q.isLoading),
    
    // Check if any query is fetching
    isSomeFetching: (...queries: Array<{ isFetching: boolean }>) =>
      queries.some(q => q.isFetching),
    
    // Get overall loading state for a feature
    getFeatureLoadingState: (queries: Array<{ isLoading: boolean; error: any; data: any }>) => {
      const hasError = queries.some(q => q.error)
      const isLoading = queries.some(q => q.isLoading)
      const hasData = queries.every(q => q.data !== undefined)
      
      return {
        isLoading: isLoading && !hasData,
        hasError,
        isReady: !isLoading && !hasError && hasData
      }
    }
  }
}
```

## Performance Optimization

### Query Deduplication
```typescript
// Automatic deduplication for same queries
export function useDedupedQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options?: any
) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
    // TanStack Query automatically deduplicates identical queries
  })
}
```

### Selective Updates
```typescript
// Only update specific parts of large datasets
export function useSelectiveSessionUpdate() {
  const queryClient = useQueryClient()
  
  const updateSessionInList = useCallback((
    spaceId: string,
    sessionId: string,
    updates: Partial<Session>
  ) => {
    queryClient.setQueryData(['sessions', spaceId], (oldSessions: Session[]) =>
      oldSessions?.map(session =>
        session.id === sessionId ? { ...session, ...updates } : session
      )
    )
  }, [queryClient])
  
  return { updateSessionInList }
}
```

### Memory Management
```typescript
// Configure garbage collection for different data types
export const gcTimes = {
  // Keep user data longer
  userData: 1000 * 60 * 30, // 30 minutes
  
  // Keep session data moderately long
  sessionData: 1000 * 60 * 10, // 10 minutes
  
  // Clean up search results quickly
  searchResults: 1000 * 60 * 2, // 2 minutes
  
  // Keep temporary data very briefly
  temporaryData: 1000 * 30 // 30 seconds
}
```

## Integration with Router and Components

### Route-level Data Prefetching
```typescript
// Prefetch data in route loaders
export const Route = createFileRoute('/space/$slug/sessions/')({
  loader: async ({ params, search }) => {
    const queryClient = getQueryClient()
    
    // Prefetch sessions data
    await queryClient.prefetchQuery({
      queryKey: queryKeys.sessions.filtered(params.slug, search),
      queryFn: () => getSpaceSessions(params.slug, search),
      staleTime: 1000 * 60 * 5
    })
    
    return { prefetched: true }
  }
})
```

### Component-level Query Coordination
```typescript
function SessionsPage() {
  const { slug } = useParams()
  const search = useSearch()
  
  // Primary data query
  const { data: sessions, isLoading } = useSessions(slug, search)
  
  // Related data queries
  const { data: activeCount } = useActiveSessionsCount(slug)
  const { data: spaceMembers } = useSpaceMembers(slug)
  
  // Coordinate loading states
  const { isReady } = useLoadingStates().getFeatureLoadingState([
    { isLoading, error: null, data: sessions }
  ])
  
  if (!isReady) {
    return <SessionsPageSkeleton />
  }
  
  return (
    <div>
      <SessionsHeader activeCount={activeCount} />
      <SessionsFilters members={spaceMembers} />
      <SessionsList sessions={sessions} />
    </div>
  )
}
```