# Supabase Database Agent

This agent specializes in all Supabase database operations, schema management, and type-safe data access patterns.

## Expertise Areas
- Supabase client configuration and usage
- Database schema design and migrations
- Row Level Security (RLS) policies
- Type-safe queries and mutations
- Real-time subscriptions
- Database type generation

## Key Directories and Files
- `src/lib/supabase/client.ts` - Supabase client configuration
- `src/lib/supabase/queries.ts` - Read operations
- `src/lib/supabase/mutations.ts` - Write operations
- `src/types/database.types.ts` - Generated database types
- `supabase/` - Local Supabase configuration (if exists)

## Database Schema Overview

### Core Tables
```sql
-- User profiles linked to auth.users
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  full_name TEXT NOT NULL,
  github_username TEXT UNIQUE NOT NULL,
  github_id BIGINT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- GitHub organization workspaces
spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  github_org_id BIGINT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Space membership with roles
space_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member', 'observer')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_id, user_id)
)

-- Work sessions tracking
sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'discarded')) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  original_duration INTEGER, -- in seconds
  actual_duration INTEGER,   -- in seconds
  tags TEXT[] DEFAULT '{}'
)

-- Issue/task tracking
tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  github_issue_number INTEGER,
  github_repo_owner TEXT,
  github_repo_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Session categorization
tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_id, name)
)

-- Session duration change requests
session_duration_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id),
  old_duration INTEGER NOT NULL,
  new_duration INTEGER NOT NULL,
  reason TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

## Client Configuration

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const getSupabaseClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}
```

## Query Patterns

### Basic Query Structure
```typescript
// src/lib/supabase/queries.ts
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Profile, Space } from "@/types"

const supabase = getSupabaseClient()

export const getUser = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session?.user
}

// Single record with error handling
export const getProfile = async () => {
  const user = await getUser()
  if (!user?.id) throw new Error("User ID is required")

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error) {
    throw new Error("Failed to fetch profile")
  }
  return data
}

// Multiple records with joins
export const getUserSpaces = async () => {
  const user = await getUser()
  if (!user?.id) throw new Error("User ID is required")

  const { data, error } = await supabase
    .from("space_members")
    .select(`
      space:spaces(*), 
      role
    `)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)
  
  return data?.map((row: any) => ({
    ...row.space,
    member_role: row.role,
  })) || []
}
```

### Advanced Query Patterns
```typescript
// Complex queries with filters and joins
export const getSpaceSessions = async (
  spaceId: string,
  filters: {
    userId?: string
    status?: string
    trackId?: string
    startDate?: string
    endDate?: string
  } = {}
) => {
  let query = supabase
    .from("sessions")
    .select(`
      *,
      user:profiles!sessions_user_id_fkey(full_name, avatar_url, github_username),
      track:tracks(title, github_issue_number, github_repo_owner, github_repo_name)
    `)
    .eq("space_id", spaceId)
    .order("started_at", { ascending: false })

  // Apply filters conditionally
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

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

// Real-time subscriptions
export const subscribeToSpaceSessions = (
  spaceId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`space-${spaceId}-sessions`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `space_id=eq.${spaceId}`
      },
      callback
    )
    .subscribe()
}
```

## Mutation Patterns

### Basic Mutations
```typescript
// src/lib/supabase/mutations.ts
import { getSupabaseClient } from "@/lib/supabase/client"
import { getUser } from "./queries"

const supabase = getSupabaseClient()

// Create with auto-generated UUID
export async function createSpace({
  name,
  slug,
  avatar_url,
  github_org_id,
}: {
  name: string
  slug: string
  avatar_url: string
  github_org_id: number
}) {
  const { data, error } = await supabase
    .from("spaces")
    .insert({
      name,
      slug,
      avatar_url,
      github_org_id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Update with optimistic concurrency
export async function updateSession(
  id: string,
  updates: Partial<{
    title: string
    description: string
    status: 'active' | 'completed' | 'discarded'
    ended_at: string
    actual_duration: number
  }>
) {
  const { data, error } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Upsert pattern
export async function upsertTag(
  spaceId: string,
  tag: { name: string; color?: string }
) {
  const { data, error } = await supabase
    .from("tags")
    .upsert(
      {
        space_id: spaceId,
        name: tag.name,
        color: tag.color || '#6b7280'
      },
      {
        onConflict: 'space_id,name'
      }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
```

### Transaction Patterns
```typescript
// Complex operations that need consistency
export async function endSessionWithDurationChange(
  sessionId: string,
  newDuration: number,
  endMessage?: string
) {
  const user = await getUser()
  if (!user?.id) throw new Error("User ID is required")

  // Start transaction-like operation using RPC or multiple calls
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      actual_duration: newDuration
    })
    .eq("id", sessionId)
    .eq("user_id", user.id) // RLS check
    .select()
    .single()

  if (sessionError) throw new Error(sessionError.message)

  // Log the change if duration differs
  if (session.original_duration !== newDuration) {
    const { error: changeError } = await supabase
      .from("session_duration_change_requests")
      .insert({
        session_id: sessionId,
        requester_id: user.id,
        old_duration: session.original_duration,
        new_duration: newDuration,
        reason: endMessage,
        status: 'approved' // Auto-approve self changes
      })

    if (changeError) {
      console.error("Failed to log duration change:", changeError)
    }
  }

  return session
}
```

## Type Safety Best Practices

### Using Generated Types
```typescript
import type { Database } from '@/types/database.types'

// Table row types
type Profile = Database['public']['Tables']['profiles']['Row']
type Space = Database['public']['Tables']['spaces']['Row']
type Session = Database['public']['Tables']['sessions']['Row']

// Insert types (omits auto-generated fields)
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type SpaceInsert = Database['public']['Tables']['spaces']['Insert']

// Update types (all fields optional)
type SessionUpdate = Database['public']['Tables']['sessions']['Update']

// Custom composite types for joins
type SessionWithUser = Session & {
  user: Pick<Profile, 'full_name' | 'avatar_url' | 'github_username'>
}

type SpaceWithMembership = Space & {
  member_role: 'admin' | 'member' | 'observer'
}
```

### Query Builder Type Safety
```typescript
// Type-safe query building
const getSpaceMembers = async (spaceId: string) => {
  const { data, error } = await supabase
    .from("space_members")
    .select(`
      id,
      role,
      created_at,
      user:profiles!space_members_user_id_fkey(
        id,
        full_name,
        github_username,
        avatar_url
      )
    `)
    .eq("space_id", spaceId)

  if (error) throw new Error(error.message)
  
  // TypeScript knows the exact shape of data
  return data as Array<{
    id: string
    role: 'admin' | 'member' | 'observer'
    created_at: string
    user: {
      id: string
      full_name: string
      github_username: string
      avatar_url: string | null
    }
  }>
}
```

## RLS (Row Level Security) Guidelines

### Policy Patterns
```sql
-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Space members can view space data
CREATE POLICY "Space members can view space" ON spaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM space_members 
      WHERE space_id = spaces.id 
      AND user_id = auth.uid()
    )
  );

-- Session access based on space membership
CREATE POLICY "Space members can view sessions" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM space_members 
      WHERE space_id = sessions.space_id 
      AND user_id = auth.uid()
    )
  );

-- Users can only modify their own sessions
CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (user_id = auth.uid());
```

## Development Commands

```bash
# Start local Supabase
pnpm supabase:start

# Generate TypeScript types from schema
pnpm supabase:db:generate

# Reset local database
supabase db reset

# Create migration
supabase migration new migration_name

# Apply migrations
supabase db push
```

## Error Handling Patterns

```typescript
// Standardized error handling
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Query wrapper with consistent error handling
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  try {
    const { data, error } = await queryFn()
    
    if (error) {
      throw new DatabaseError(
        error.message || 'Database query failed',
        error.code,
        error.details
      )
    }
    
    if (data === null) {
      throw new DatabaseError('No data returned from query')
    }
    
    return data
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error
    }
    throw new DatabaseError('Unexpected database error', undefined, error)
  }
}
```

## Performance Optimization

### Query Optimization
- Use specific column selection instead of `SELECT *`
- Implement pagination with `range()`
- Use indexes for frequently queried columns
- Minimize join depth and complexity

### Caching Strategy
- Leverage TanStack Query for client-side caching
- Use Supabase real-time for live updates
- Implement optimistic updates for better UX

### Connection Management
- Reuse the same client instance
- Configure appropriate connection pooling
- Handle connection errors gracefully

## Integration with TanStack Query

```typescript
// Custom hook pattern
export function useSpaceSessions(spaceId: string, filters: SessionFilters) {
  return useQuery({
    queryKey: ['sessions', spaceId, filters],
    queryFn: () => getSpaceSessions(spaceId, filters),
    enabled: !!spaceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Mutation pattern
export function useCreateSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createSession,
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.setQueryData(['session', data.id], data)
    },
  })
}
```