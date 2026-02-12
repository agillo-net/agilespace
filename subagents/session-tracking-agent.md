# Session Tracking Agent

This agent specializes in work session functionality, time tracking, session management, and duration change workflows within AgileSpace.

## Expertise Areas

- Session creation and lifecycle management
- Real-time timer functionality and accuracy
- Session duration tracking and modifications
- Session state management (active, completed, discarded)
- Time tracking analytics and reporting
- Session-related user interactions and dialogs

## Key Directories and Files

- `src/components/timer.tsx` - Real-time session timer component
- `src/components/session-card.tsx` - Session display and management
- `src/components/end-session-dialog.tsx` - Session completion flow
- `src/components/discard-session-dialog.tsx` - Session cancellation
- `src/components/request-duration-change-dialog.tsx` - Duration change requests
- `src/components/active-sessions-list.tsx` - Active sessions display
- `src/hooks/api/use-sessions.ts` - Session data management
- `src/hooks/api/use-session-change-requests.ts` - Duration change workflow

## Session Data Model

### Session Entity Structure
```typescript
interface Session {
  id: string
  space_id: string
  user_id: string
  track_id?: string
  title: string
  description?: string
  status: 'active' | 'completed' | 'discarded'
  started_at: string
  ended_at?: string
  original_duration?: number // in seconds
  actual_duration?: number   // in seconds
  tags: string[]
}

interface SessionWithRelations extends Session {
  user: {
    full_name: string
    avatar_url: string
    github_username: string
  }
  track?: {
    title: string
    github_issue_number?: number
    github_repo_owner?: string
    github_repo_name?: string
  }
}
```

### Duration Change Request Model
```typescript
interface SessionDurationChangeRequest {
  id: string
  session_id: string
  requester_id: string
  reviewer_id?: string
  old_duration: number
  new_duration: number
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at?: string
  created_at: string
}
```

## Timer Component Implementation

### Real-time Timer with Drift Correction
```typescript
// src/components/timer.tsx
export function Timer({ session, onTimeUpdate }: TimerProps) {
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (session.status !== 'active') return

    const startTimer = () => {
      const interval = setInterval(() => {
        const now = Date.now()
        const expectedTime = lastUpdateTime + 1000
        const drift = now - expectedTime
        
        // Adjust interval to compensate for drift
        const nextInterval = Math.max(100, 1000 - drift)
        
        setCurrentTime(now)
        setLastUpdateTime(now)
        
        // Restart interval with drift correction
        clearInterval(interval)
        setTimeout(startTimer, nextInterval)
      }, 1000)
      
      intervalRef.current = interval
    }

    startTimer()
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [session.status, lastUpdateTime])

  const elapsedSeconds = Math.floor(
    (currentTime - new Date(session.started_at).getTime()) / 1000
  )

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="font-mono text-lg font-medium">
      {formatTime(elapsedSeconds)}
    </div>
  )
}
```

## Session Management Operations

### Session Creation
```typescript
// Create new session with optional track linking
export async function createSession({
  space_id,
  title,
  description,
  track_id,
  tags = []
}: {
  space_id: string
  title: string
  description?: string
  track_id?: string
  tags?: string[]
}) {
  const user = await getUser()
  if (!user?.id) throw new Error("User ID is required")

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      space_id,
      user_id: user.id,
      track_id,
      title,
      description,
      status: 'active',
      started_at: new Date().toISOString(),
      tags
    })
    .select(`
      *,
      user:profiles!sessions_user_id_fkey(full_name, avatar_url, github_username),
      track:tracks(title, github_issue_number, github_repo_owner, github_repo_name)
    `)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// End session with actual duration tracking
export async function endSession(
  sessionId: string,
  actualDuration?: number,
  endMessage?: string
) {
  const user = await getUser()
  if (!user?.id) throw new Error("User ID is required")

  const endedAt = new Date().toISOString()
  
  // Calculate actual duration if not provided
  if (!actualDuration) {
    const { data: session } = await supabase
      .from("sessions")
      .select("started_at")
      .eq("id", sessionId)
      .single()
    
    if (session) {
      const startTime = new Date(session.started_at).getTime()
      const endTime = new Date(endedAt).getTime()
      actualDuration = Math.floor((endTime - startTime) / 1000)
    }
  }

  const { data, error } = await supabase
    .from("sessions")
    .update({
      status: 'completed',
      ended_at: endedAt,
      actual_duration: actualDuration,
      original_duration: actualDuration // Set original if not already set
    })
    .eq("id", sessionId)
    .eq("user_id", user.id) // Ensure user can only end their own sessions
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Discard active session
export async function discardSession(sessionId: string, reason?: string) {
  const user = await getUser()
  if (!user?.id) throw new Error("User ID is required")

  const { data, error } = await supabase
    .from("sessions")
    .update({
      status: 'discarded',
      ended_at: new Date().toISOString(),
      description: reason ? `${data?.description || ''}\n\nDiscarded: ${reason}` : data?.description
    })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .eq("status", "active") // Only allow discarding active sessions
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
```

### Session Queries and Filtering
```typescript
// Get sessions with advanced filtering
export async function getSpaceSessions(
  spaceId: string,
  filters: {
    userId?: string
    status?: 'active' | 'completed' | 'discarded'
    trackId?: string
    startDate?: string
    endDate?: string
    tags?: string[]
    search?: string
  } = {}
) {
  let query = supabase
    .from("sessions")
    .select(`
      *,
      user:profiles!sessions_user_id_fkey(
        id, full_name, avatar_url, github_username
      ),
      track:tracks(
        id, title, github_issue_number, 
        github_repo_owner, github_repo_name
      )
    `)
    .eq("space_id", spaceId)

  // Apply filters
  if (filters.userId) {
    query = query.eq("user_id", filters.userId)
  }
  
  if (filters.status) {
    query = query.eq("status", filters.status)
  }
  
  if (filters.trackId) {
    query = query.eq("track_id", filters.trackId)
  }
  
  if (filters.startDate) {
    query = query.gte("started_at", filters.startDate)
  }
  
  if (filters.endDate) {
    query = query.lte("started_at", filters.endDate)
  }
  
  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags)
  }
  
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  query = query.order("started_at", { ascending: false })

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

// Get active sessions for a user across all spaces
export async function getUserActiveSessions() {
  const user = await getUser()
  if (!user?.id) throw new Error("User ID is required")

  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      space:spaces(name, slug),
      track:tracks(title, github_issue_number, github_repo_owner, github_repo_name)
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("started_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
```

## Duration Change Request System

### Request Creation and Management
```typescript
// Create duration change request
export async function createDurationChangeRequest({
  sessionId,
  newDuration,
  reason
}: {
  sessionId: string
  newDuration: number
  reason?: string
}) {
  const user = await getUser()
  if (!user?.id) throw new Error("User ID is required")

  // Get current session to validate and get old duration
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("actual_duration, original_duration, user_id")
    .eq("id", sessionId)
    .single()

  if (sessionError) throw new Error("Session not found")
  
  const oldDuration = session.actual_duration || session.original_duration || 0
  
  // Check if user can request changes (own session or admin)
  const canRequest = session.user_id === user.id // Add admin check here
  if (!canRequest) {
    throw new Error("Not authorized to request duration changes for this session")
  }

  const { data, error } = await supabase
    .from("session_duration_change_requests")
    .insert({
      session_id: sessionId,
      requester_id: user.id,
      old_duration: oldDuration,
      new_duration: newDuration,
      reason,
      status: 'pending'
    })
    .select(`
      *,
      session:sessions(title, user_id),
      requester:profiles!session_duration_change_requests_requester_id_fkey(
        full_name, github_username
      )
    `)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Review duration change request
export async function reviewDurationChangeRequest(
  requestId: string,
  decision: 'approved' | 'rejected',
  reviewNote?: string
) {
  const user = await getUser()
  if (!user?.id) throw new Error("User ID is required")

  // Update the request
  const { data: request, error } = await supabase
    .from("session_duration_change_requests")
    .update({
      status: decision,
      reviewer_id: user.id,
      reviewed_at: new Date().toISOString(),
      reason: reviewNote ? `${request?.reason || ''}\n\nReview: ${reviewNote}` : request?.reason
    })
    .eq("id", requestId)
    .eq("status", "pending") // Only allow reviewing pending requests
    .select(`
      *,
      session:sessions(id, title)
    `)
    .single()

  if (error) throw new Error(error.message)

  // If approved, update the session duration
  if (decision === 'approved') {
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        actual_duration: request.new_duration
      })
      .eq("id", request.session_id)

    if (updateError) {
      console.error("Failed to update session duration:", updateError)
    }
  }

  return request
}

// Get pending change requests for space admins
export async function getSpaceChangeRequests(spaceId: string) {
  const { data, error } = await supabase
    .from("session_duration_change_requests")
    .select(`
      *,
      session:sessions!inner(
        id, title, space_id,
        user:profiles!sessions_user_id_fkey(full_name, github_username, avatar_url)
      ),
      requester:profiles!session_duration_change_requests_requester_id_fkey(
        full_name, github_username, avatar_url
      ),
      reviewer:profiles!session_duration_change_requests_reviewer_id_fkey(
        full_name, github_username
      )
    `)
    .eq("session.space_id", spaceId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
```

## Session Analytics and Reporting

### Time Tracking Analytics
```typescript
// Get session statistics for a time period
export async function getSessionStatistics(
  spaceId: string,
  dateRange: { start: string; end: string },
  userId?: string
) {
  let query = supabase
    .from("sessions")
    .select("actual_duration, status, started_at, user_id")
    .eq("space_id", spaceId)
    .gte("started_at", dateRange.start)
    .lte("started_at", dateRange.end)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const stats = data.reduce((acc, session) => {
    const duration = session.actual_duration || 0
    
    acc.totalSessions += 1
    acc.totalTime += duration
    
    if (session.status === 'completed') {
      acc.completedSessions += 1
      acc.completedTime += duration
    } else if (session.status === 'discarded') {
      acc.discardedSessions += 1
    }
    
    return acc
  }, {
    totalSessions: 0,
    completedSessions: 0,
    discardedSessions: 0,
    totalTime: 0,
    completedTime: 0,
    averageSessionTime: 0
  })

  stats.averageSessionTime = stats.completedSessions > 0 
    ? Math.round(stats.completedTime / stats.completedSessions)
    : 0

  return stats
}

// Get daily session activity
export async function getDailySessionActivity(
  spaceId: string,
  dateRange: { start: string; end: string }
) {
  const { data, error } = await supabase
    .from("sessions")
    .select("started_at, actual_duration, status")
    .eq("space_id", spaceId)
    .gte("started_at", dateRange.start)
    .lte("started_at", dateRange.end)
    .eq("status", "completed")

  if (error) throw new Error(error.message)

  // Group by date
  const dailyStats = data.reduce((acc, session) => {
    const date = new Date(session.started_at).toISOString().split('T')[0]
    
    if (!acc[date]) {
      acc[date] = {
        date,
        sessionCount: 0,
        totalTime: 0
      }
    }
    
    acc[date].sessionCount += 1
    acc[date].totalTime += session.actual_duration || 0
    
    return acc
  }, {} as Record<string, { date: string; sessionCount: number; totalTime: number }>)

  return Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date))
}
```

## Real-time Session Updates

### WebSocket Integration
```typescript
// Subscribe to session changes in a space
export function useSpaceSessionUpdates(spaceId: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
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
          // Invalidate and refetch session queries
          queryClient.invalidateQueries({ 
            queryKey: ['sessions', spaceId] 
          })
          
          // Update specific session in cache if available
          if (payload.new && payload.eventType !== 'DELETE') {
            queryClient.setQueryData(
              ['session', payload.new.id],
              payload.new
            )
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [spaceId, queryClient])
}

// Real-time active session count
export function useActiveSessionCount(spaceId: string) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from("sessions")
        .select("id", { count: 'exact', head: true })
        .eq("space_id", spaceId)
        .eq("status", "active")
      
      setCount(count || 0)
    }

    fetchCount()

    const channel = supabase
      .channel(`space-${spaceId}-active-sessions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `space_id=eq.${spaceId}`
        },
        () => {
          fetchCount() // Refetch count on any session change
        }
      )
      .subscribe()

    return () => channel.unsubscribe()
  }, [spaceId])

  return count
}
```

## Session UI Components Integration

### Session Dialog Components
```typescript
// End Session Dialog with duration adjustment
export function EndSessionDialog({ 
  session, 
  open, 
  onClose, 
  onConfirm 
}: EndSessionDialogProps) {
  const [message, setMessage] = useState('')
  const [adjustedDuration, setAdjustedDuration] = useState<number>()
  
  const currentDuration = useMemo(() => {
    if (!session) return 0
    const elapsed = Date.now() - new Date(session.started_at).getTime()
    return Math.floor(elapsed / 1000)
  }, [session])

  const handleSubmit = async () => {
    if (!session) return
    
    try {
      await onConfirm({
        sessionId: session.id,
        actualDuration: adjustedDuration || currentDuration,
        endMessage: message.trim() || undefined
      })
      onClose()
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End Session</DialogTitle>
          <DialogDescription>
            Ending session: {session?.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Session Duration</Label>
            <div className="text-sm text-muted-foreground">
              Current: {formatDuration(currentDuration)}
            </div>
            <Input
              type="number"
              placeholder="Adjust duration (minutes)"
              value={adjustedDuration ? Math.round(adjustedDuration / 60) : ''}
              onChange={(e) => {
                const minutes = parseInt(e.target.value)
                setAdjustedDuration(minutes > 0 ? minutes * 60 : undefined)
              }}
            />
          </div>
          
          <div>
            <Label>End Message (Optional)</Label>
            <Textarea
              placeholder="Add notes about this session..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            End Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## Performance Optimization

### Session Caching Strategy
```typescript
// Optimized session queries with stale-while-revalidate
export function useSessions(spaceId: string, filters: SessionFilters) {
  return useQuery({
    queryKey: ['sessions', spaceId, filters],
    queryFn: () => getSpaceSessions(spaceId, filters),
    enabled: !!spaceId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 30 // 30 seconds for active sessions
  })
}

// Optimistic updates for session operations
export function useEndSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: endSession,
    onMutate: async ({ sessionId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['sessions'] })
      
      // Optimistically update session in cache
      queryClient.setQueryData(['session', sessionId], (old: any) => ({
        ...old,
        status: 'completed',
        ended_at: new Date().toISOString()
      }))
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(['session', data.id], data)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    }
  })
}
```

## Integration Points

### With Space Management
- Session access controlled by space membership
- Session statistics feed into space dashboards
- Space-level session policies and settings

### With GitHub Integration  
- Sessions can be linked to GitHub issues via tracks
- Issue context enriches session data
- Session time can be reported back to GitHub

### With Notifications
- Session start/end notifications
- Duration change request notifications
- Session milestone achievements

### With TanStack Query
- Real-time session updates through subscriptions
- Optimistic updates for better UX
- Smart caching strategies for performance