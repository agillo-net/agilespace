# TanStack Router Agent

This agent specializes in file-based routing, navigation, route management, and type-safe routing patterns using TanStack Router v1.120.5.

## Expertise Areas

- File-based routing with auto-generated route tree
- Type-safe navigation and parameter handling
- Route loaders and validation
- Search parameter management
- Nested routing and layouts
- Route guards and authentication
- Dynamic route generation

## Key Directories and Files

- `src/routes/` - File-based route definitions
- `src/routeTree.gen.ts` - Auto-generated route tree (DO NOT EDIT)
- `src/lib/routes.ts` - Route utilities and path constants
- `src/routes/__root.tsx` - Root layout component
- Route files follow pattern: `src/routes/path/route.tsx` or `src/routes/path/index.tsx`

## Route Structure Overview

### Current Route Tree
```
/                           # Home page (index.tsx)
├── /login                  # Authentication (login.tsx)
├── /spaces                 # Spaces overview (spaces/route.tsx)
└── /space/$slug/           # Dynamic space routes (space/$slug/route.tsx)
    ├── /                   # Space dashboard (index.tsx)
    ├── /sessions           # Sessions page (sessions/index.tsx)
    ├── /tracks             # Tracks page (tracks/index.tsx)
    ├── /tags               # Tags page (tags/index.tsx)
    ├── /members            # Members page (members/index.tsx)
    └── /change-requests    # Change requests (change-requests/index.tsx)
```

## File-based Routing Patterns

### Route Definition Structure
```typescript
// src/routes/example/route.tsx or index.tsx
import { createFileRoute } from '@tanstack/react-router'

// For layout routes (route.tsx)
export const Route = createFileRoute('/example')({
  component: ExampleLayout,
  beforeLoad: ({ context, location }) => {
    // Authentication checks, redirects, etc.
  },
  loader: async ({ params, search, context }) => {
    // Data loading
    return await fetchData(params.id)
  },
  validateSearch: (search: Record<string, unknown>) => ({
    // Type-safe search parameter validation
    page: (search.page as number) || 1,
    filter: (search.filter as string) || null
  })
})

function ExampleLayout() {
  return (
    <div>
      <h1>Example Layout</h1>
      <Outlet />
    </div>
  )
}

// For page routes (index.tsx)
export const Route = createFileRoute('/example/')({
  component: ExamplePage
})

function ExamplePage() {
  const params = Route.useParams()
  const search = Route.useSearch()
  const data = Route.useLoaderData()
  
  return <div>Example Page</div>
}
```

### Dynamic Routes with Parameters
```typescript
// src/routes/space/$slug/route.tsx
export const Route = createFileRoute('/space/$slug')({
  component: SpaceLayout,
  beforeLoad: async ({ params, context }) => {
    // Validate space access
    const space = await getSpaceBySlug(params.slug)
    if (!space) {
      throw new Error('Space not found')
    }
    
    // Check membership
    const membership = await getSpaceMembership(space.id)
    if (!membership) {
      throw redirect({ to: '/spaces' })
    }
    
    return { space, membership }
  },
  loader: async ({ params }) => {
    return await getSpaceAndTracks(params.slug)
  }
})

// Access parameters and data in component
function SpaceLayout() {
  const { space, membership } = Route.useRouteContext()
  const data = Route.useLoaderData()
  const { slug } = Route.useParams()
  
  return (
    <div className="space-layout">
      <SpaceSidebar space={space} membership={membership} />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
```

### Search Parameter Validation
```typescript
// Type-safe search parameter handling
export const Route = createFileRoute('/space/$slug/sessions/')({
  component: SessionsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    // Required parameters
    track: (search.track as string) || null,
    
    // Optional parameters with defaults
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 20,
    
    // Array parameters
    tags: Array.isArray(search.tags) 
      ? (search.tags as string[]) 
      : search.tags 
        ? [search.tags as string] 
        : [],
    
    // Date parameters
    startDate: search.startDate as string || null,
    endDate: search.endDate as string || null,
    
    // Enum validation
    status: ['active', 'completed', 'discarded'].includes(search.status as string)
      ? (search.status as 'active' | 'completed' | 'discarded')
      : null
  }),
  loader: async ({ params, search }) => {
    return await getSpaceSessions(params.slug, search)
  }
})

function SessionsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  
  // Update search parameters
  const updateFilters = (newFilters: Partial<typeof search>) => {
    navigate({
      search: (prev) => ({ ...prev, ...newFilters }),
      replace: true
    })
  }
  
  return (
    <div>
      <SessionFilters filters={search} onChange={updateFilters} />
      <SessionsList />
    </div>
  )
}
```

## Navigation Patterns

### Type-safe Navigation
```typescript
import { Link, useNavigate } from '@tanstack/react-router'

// Link component with type safety
function NavigationExample() {
  return (
    <nav>
      {/* Simple navigation */}
      <Link to="/">Home</Link>
      
      {/* With parameters */}
      <Link 
        to="/space/$slug" 
        params={{ slug: 'my-space' }}
      >
        My Space
      </Link>
      
      {/* With search parameters */}
      <Link 
        to="/space/$slug/sessions" 
        params={{ slug: 'my-space' }}
        search={{ track: 'issue-123', status: 'active' }}
      >
        Active Sessions
      </Link>
      
      {/* Conditional styling */}
      <Link 
        to="/space/$slug/members" 
        params={{ slug }}
        activeProps={{ className: 'active' }}
        inactiveProps={{ className: 'inactive' }}
      >
        Members
      </Link>
    </nav>
  )
}

// Programmatic navigation
function NavigationHooks() {
  const navigate = useNavigate()
  
  const goToSessions = () => {
    navigate({
      to: '/space/$slug/sessions',
      params: { slug: 'my-space' },
      search: { track: null }, // Clear track filter
      replace: false
    })
  }
  
  const updateSearch = (newFilters: any) => {
    navigate({
      search: (prev) => ({ ...prev, ...newFilters }),
      replace: true // Don't add to history for filter changes
    })
  }
  
  return (
    <div>
      <Button onClick={goToSessions}>View Sessions</Button>
    </div>
  )
}
```

### Route Path Utilities
```typescript
// src/lib/routes.ts
export const routes = {
  home: '/',
  login: '/login',
  spaces: '/spaces',
  space: {
    root: '/space/$slug',
    dashboard: '/space/$slug',
    sessions: '/space/$slug/sessions',
    tracks: '/space/$slug/tracks',
    tags: '/space/$slug/tags',
    members: '/space/$slug/members',
    changeRequests: '/space/$slug/change-requests'
  }
} as const

// Type-safe route generation
export const generatePath = {
  space: (slug: string) => `/space/${slug}`,
  spaceSessions: (slug: string, search?: any) => ({
    to: '/space/$slug/sessions' as const,
    params: { slug },
    search
  }),
  spaceTrack: (slug: string, trackId: string) => ({
    to: '/space/$slug/sessions' as const,
    params: { slug },
    search: { track: trackId }
  })
}

// Usage in components
function SpaceNavigation({ slug }: { slug: string }) {
  return (
    <nav>
      <Link {...generatePath.spaceSessions(slug)}>
        Sessions
      </Link>
      <Link to={generatePath.space(slug)}>
        Dashboard
      </Link>
    </nav>
  )
}
```

## Authentication and Route Guards

### Protected Routes
```typescript
// src/routes/__root.tsx
import { createRootRouteWithContext } from '@tanstack/react-router'

interface RouteContext {
  auth: {
    user: User | null
    profile: Profile | null
    isLoading: boolean
  }
}

export const Route = createRootRouteWithContext<RouteContext>()({
  component: RootLayout,
  beforeLoad: async ({ context, location }) => {
    // Global authentication check
    if (!context.auth.user && location.pathname !== '/login') {
      throw redirect({ to: '/login' })
    }
  }
})

// Space-specific authentication
// src/routes/space/$slug/route.tsx
export const Route = createFileRoute('/space/$slug')({
  beforeLoad: async ({ params, context }) => {
    const { user } = context.auth
    if (!user) {
      throw redirect({ to: '/login' })
    }
    
    // Check space membership
    const membership = await getSpaceMembership(params.slug, user.id)
    if (!membership) {
      throw notFound()
    }
    
    // Role-based access
    return { membership }
  },
  loader: async ({ params, context }) => {
    const { membership } = context
    
    // Load data based on role
    if (membership.role === 'admin') {
      return await getSpaceAdminData(params.slug)
    } else {
      return await getSpaceMemberData(params.slug)
    }
  }
})
```

### Conditional Navigation
```typescript
function ConditionalNavigation({ membership }: { membership: SpaceMembership }) {
  const canViewMembers = ['admin', 'member'].includes(membership.role)
  const canViewChangeRequests = membership.role === 'admin'
  
  return (
    <nav>
      <Link to="/space/$slug" params={{ slug }}>
        Dashboard
      </Link>
      
      <Link to="/space/$slug/sessions" params={{ slug }}>
        Sessions
      </Link>
      
      {canViewMembers && (
        <Link to="/space/$slug/members" params={{ slug }}>
          Members
        </Link>
      )}
      
      {canViewChangeRequests && (
        <Link to="/space/$slug/change-requests" params={{ slug }}>
          Change Requests
        </Link>
      )}
    </nav>
  )
}
```

## Error Handling and Loading States

### Error Boundaries
```typescript
// src/routes/space/$slug/route.tsx
export const Route = createFileRoute('/space/$slug')({
  component: SpaceLayout,
  errorComponent: SpaceError,
  pendingComponent: SpaceLoading,
  loader: async ({ params }) => {
    try {
      return await getSpaceData(params.slug)
    } catch (error) {
      if (error.status === 404) {
        throw notFound()
      }
      throw error
    }
  }
})

function SpaceError({ error }: { error: Error }) {
  const navigate = useNavigate()
  
  return (
    <div className="error-container">
      <h1>Space Error</h1>
      <p>{error.message}</p>
      <Button onClick={() => navigate({ to: '/spaces' })}>
        Back to Spaces
      </Button>
    </div>
  )
}

function SpaceLoading() {
  return (
    <div className="loading-container">
      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}
```

### Not Found Handling
```typescript
// src/routes/space/$slug/sessions/index.tsx
export const Route = createFileRoute('/space/$slug/sessions/')({
  component: SessionsPage,
  notFoundComponent: SessionsNotFound,
  loader: async ({ params, search }) => {
    const sessions = await getSpaceSessions(params.slug, search)
    
    // Custom not found logic
    if (search.track) {
      const track = sessions.find(s => s.track_id === search.track)
      if (!track) {
        throw notFound()
      }
    }
    
    return sessions
  }
})

function SessionsNotFound() {
  const { slug } = Route.useParams()
  const search = Route.useSearch()
  
  return (
    <div className="not-found">
      <h2>Sessions Not Found</h2>
      {search.track && (
        <p>No sessions found for track: {search.track}</p>
      )}
      <Link 
        to="/space/$slug/sessions" 
        params={{ slug }}
        search={{}}
      >
        View All Sessions
      </Link>
    </div>
  )
}
```

## Advanced Routing Patterns

### Parallel Data Loading
```typescript
// Load multiple data sources in parallel
export const Route = createFileRoute('/space/$slug/')({
  component: SpaceDashboard,
  loader: async ({ params }) => {
    const [space, sessions, members, stats] = await Promise.all([
      getSpace(params.slug),
      getRecentSessions(params.slug),
      getSpaceMembers(params.slug),
      getSpaceStats(params.slug)
    ])
    
    return { space, sessions, members, stats }
  }
})
```

### Dependent Data Loading
```typescript
// Load data that depends on other data
export const Route = createFileRoute('/space/$slug/sessions/')({
  loader: async ({ params, search }) => {
    // First load space to validate access
    const space = await getSpace(params.slug)
    
    // Then load sessions based on space permissions
    const sessionFilters = {
      ...search,
      // Add permission-based filters
      includePrivate: await canViewPrivateSessions(space.id)
    }
    
    const sessions = await getSpaceSessions(space.id, sessionFilters)
    
    return { space, sessions }
  }
})
```

### Route Context Passing
```typescript
// Parent route provides context to children
export const Route = createFileRoute('/space/$slug')({
  component: SpaceLayout,
  loader: async ({ params }) => {
    const spaceData = await getSpaceWithPermissions(params.slug)
    return spaceData
  }
})

function SpaceLayout() {
  const spaceData = Route.useLoaderData()
  
  return (
    <SpaceProvider value={spaceData}>
      <div className="space-layout">
        <SpaceSidebar />
        <main>
          <Outlet />
        </main>
      </div>
    </SpaceProvider>
  )
}

// Child routes access parent context
function ChildComponent() {
  const spaceData = useContext(SpaceContext)
  // Use space data without reloading
}
```

## Performance Optimizations

### Preloading Routes
```typescript
import { useRouter } from '@tanstack/react-router'

function NavigationWithPreload() {
  const router = useRouter()
  
  const handleMouseEnter = (path: string, params: any) => {
    // Preload route data on hover
    router.preloadRoute({
      to: path,
      params,
      maxAge: 1000 * 60 * 5 // Cache for 5 minutes
    })
  }
  
  return (
    <Link 
      to="/space/$slug/sessions"
      params={{ slug }}
      onMouseEnter={() => handleMouseEnter('/space/$slug/sessions', { slug })}
    >
      Sessions
    </Link>
  )
}
```

### Route-level Code Splitting
```typescript
// Lazy load route components
import { lazy } from 'react'

const SessionsPage = lazy(() => import('./sessions-page'))

export const Route = createFileRoute('/space/$slug/sessions/')({
  component: SessionsPage,
  // Component will be loaded only when route is accessed
})
```

### Optimistic Navigation
```typescript
function OptimisticNavigation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const navigateWithOptimisticUpdate = async (to: string, optimisticData: any) => {
    // Set optimistic data
    queryClient.setQueryData(['sessions'], optimisticData)
    
    // Navigate
    await navigate({ to })
    
    // Real data will be loaded by route loader
  }
  
  return (
    <Button onClick={() => navigateWithOptimisticUpdate('/sessions', [])}>
      Quick Navigate
    </Button>
  )
}
```

## Integration with Other Systems

### TanStack Query Integration
```typescript
// Route loaders work with TanStack Query
export const Route = createFileRoute('/space/$slug/sessions/')({
  loader: async ({ params, search }) => {
    // Use the same query function as hooks
    return await getSpaceSessions(params.slug, search)
  }
})

function SessionsPage() {
  const initialData = Route.useLoaderData()
  
  // Use TanStack Query for real-time updates
  const { data: sessions } = useSessions(slug, search, {
    initialData,
    staleTime: 0 // Always refetch for real-time data
  })
  
  return <SessionsList sessions={sessions} />
}
```

### Form Integration
```typescript
import { useForm } from 'react-hook-form'

function SearchForm() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  
  const form = useForm({
    defaultValues: search
  })
  
  const onSubmit = (data: any) => {
    navigate({
      search: data,
      replace: true
    })
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

## Route Generation and Maintenance

### Auto-generated Route Tree
```typescript
// src/routeTree.gen.ts (DO NOT EDIT - auto-generated)
// This file is generated by TanStack Router's file-based routing
// Run `npm run build` to regenerate

export const routeTree = {
  // Generated route configuration
}
```

### Route Tree Updates
- Route tree is auto-generated during build process
- Never manually edit `routeTree.gen.ts`
- Add new routes by creating files in `src/routes/`
- Remove routes by deleting route files
- Route tree updates automatically during development

### Best Practices
- Use descriptive folder and file names
- Follow consistent naming patterns
- Keep route components focused and lightweight
- Use loaders for data that affects the entire route
- Implement proper error boundaries
- Use type-safe navigation patterns
- Cache route data appropriately
- Handle loading and error states gracefully