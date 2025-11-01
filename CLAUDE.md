# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
pnpm dev                    # Start development server (Vite on port 5173)
pnpm build                  # Build for production (tsc + vite build)
pnpm lint                   # Run ESLint
pnpm preview                # Preview production build

# Supabase
pnpm supabase:start         # Start local Supabase services
pnpm supabase:db:generate   # Generate TypeScript types from database schema
```

## Architecture Overview

AgileSpace is a React 19 + TypeScript application that integrates GitHub organizations with Supabase for workspace management. The app follows these architectural patterns:

### Core Stack
- **Frontend**: React 19, TypeScript, Vite
- **Routing**: TanStack Router v1.120.5 (file-based routing)
- **State Management**: TanStack Query v5.76.1 for server state
- **Database**: Supabase (PostgreSQL) with typed client
- **Authentication**: Supabase Auth with GitHub OAuth
- **Styling**: Tailwind CSS v4.1.6, shadcn/ui components
- **Package Manager**: pnpm

### Data Flow Architecture
1. **Authentication Flow**: GitHub OAuth → Supabase Auth → Profile Creation → Space Access
2. **Data Layer**: Supabase client with typed queries/mutations in `src/lib/supabase/`
3. **State Management**: TanStack Query handles all server state, caching, and synchronization
4. **Routing**: File-based routes auto-generate type-safe navigation

### Key Directories Structure
```
src/
├── components/
│   ├── ui/                    # shadcn/ui components (Button, Card, etc.)
│   ├── sidebars/              # Navigation sidebars
│   ├── skeleton/              # Loading skeletons
│   └── [feature-components]   # Business logic components
├── hooks/
│   ├── api/                   # TanStack Query hooks (use-auth, use-sessions, etc.)
│   └── [utility-hooks]        # React hooks utilities
├── lib/
│   ├── supabase/              # Database client, queries, mutations
│   ├── github/                # GitHub API integration
│   ├── notifications/         # Notification utilities
│   └── routes.ts              # Route path constants
├── routes/                    # TanStack Router file-based routes
├── types/                     # TypeScript type definitions
└── constants/                 # Application constants
```

### Database Schema (Core Tables)
- `profiles` - User profiles linked to GitHub
- `spaces` - GitHub organization workspaces
- `space_members` - Space membership with roles (admin, member, observer)
- `sessions` - Work sessions tracking
- `tracks` - Issue/task tracking
- `tags` - Session categorization
- `session_duration_change_requests` - Session duration change workflow

### Component Patterns
1. **UI Components**: Use shadcn/ui from `@/components/ui/` for all base components
2. **Business Components**: Feature-specific components in `@/components/`
3. **Data Fetching**: Always use TanStack Query hooks from `@/hooks/api/`
4. **Routing**: Use `createFileRoute` for route definitions
5. **Styling**: Tailwind classes with CSS variables for theming

### Authentication States
1. **Unauthenticated** → `LoginForm` component
2. **Authenticated but no profile** → Profile creation flow
3. **Profile exists** → Space access based on membership

### Import Patterns
- Use `@/` alias for all src imports (configured in tsconfig.app.json)
- Import paths: `@/components/ui/button`, `@/hooks/api/use-auth`, etc.
- Route imports: Use `generatePath.space(slug)` for dynamic routes

### Database Operations
- **Read Operations**: Use query functions in `src/lib/supabase/queries.ts`
- **Write Operations**: Use mutation functions in `src/lib/supabase/mutations.ts`
- **GitHub API**: Use functions in `src/lib/github/queries.ts`
- **Type Safety**: All operations use generated types from `src/types/database.types.ts`

### Error Handling & UX
- TanStack Query provides loading/error states
- Toast notifications via Sonner library
- Skeleton components for loading states
- Graceful error boundaries and fallbacks

### Key Development Notes
- Run `pnpm supabase:db:generate` after database schema changes
- Route tree auto-generates - don't edit `routeTree.gen.ts`
- Use existing query/mutation patterns for consistency
- Follow shadcn/ui patterns for new components
- Maintain type safety throughout all database operations

## Notifications System

AgileSpace uses Sonner for toast notifications with a centralized notification system.

### Notification Utilities
```typescript
// src/lib/notifications/utils.ts
import { toast } from "sonner"

export const notifications = {
  success: (message: string, description?: string) => {
    toast.success(message, { description })
  },
  error: (message: string, description?: string) => {
    toast.error(message, { description })
  },
  info: (message: string, description?: string) => {
    toast.info(message, { description })
  },
  loading: (message: string) => {
    return toast.loading(message)
  },
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId)
  }
}
```

### Common Notification Patterns

**Session Notifications**
```typescript
// Session start
notifications.success("Session started", `Tracking: ${sessionTitle}`)

// Session end
notifications.success("Session completed", `Duration: ${formatDuration(duration)}`)

// Session error
notifications.error("Failed to start session", "Please try again")
```

**Mutation Feedback**
```typescript
const mutation = useMutation({
  mutationFn: updateData,
  onSuccess: () => {
    notifications.success("Changes saved successfully")
  },
  onError: (error) => {
    notifications.error("Failed to save changes", error.message)
  }
})
```

**Loading States**
```typescript
const toastId = notifications.loading("Saving changes...")
try {
  await saveData()
  notifications.dismiss(toastId)
  notifications.success("Saved successfully")
} catch (error) {
  notifications.dismiss(toastId)
  notifications.error("Save failed")
}
```

### Real-time Notifications

Use Supabase subscriptions for real-time events:
```typescript
useEffect(() => {
  const channel = supabase
    .channel('session-updates')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sessions' },
      (payload) => {
        notifications.info("New session started", payload.new.title)
      }
    )
    .subscribe()

  return () => channel.unsubscribe()
}, [])
```

## Command Palette System

The command palette (⌘K / Ctrl+K) provides quick access to GitHub issues and session management.

### Architecture
- **Component**: `src/components/command-palette.tsx`
- **Hook**: `src/hooks/api/use-command-palette.ts`
- **Library**: `cmdk` (Command Menu)

### Key Features
1. **GitHub Issue Search** - Search across organization repositories
2. **Session Management** - Start sessions from issues
3. **Track Integration** - Create/link tracks automatically
4. **Keyboard Navigation** - Full keyboard support

### Usage Pattern
```typescript
import { CommandPalette } from "@/components/command-palette"

// In your layout/navbar
<CommandPalette />

// Keyboard shortcut is automatically registered
// ⌘K (Mac) or Ctrl+K (Windows/Linux)
```

### Extending Command Palette

To add new commands:
```typescript
// In use-command-palette.ts
const customCommands = [
  {
    id: 'custom-action',
    label: 'Custom Action',
    icon: <Icon />,
    action: () => handleCustomAction(),
    shortcut: '⌘⇧A'
  }
]
```

### GitHub Search Integration
- Searches across all organization repositories
- Debounced search (300ms)
- Shows issue title, repository, and status
- Displays existing session count for tracked issues
- Prevents starting duplicate sessions

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# GitHub OAuth (configured in Supabase Dashboard)
# No additional env vars needed - handled by Supabase Auth
```

### Initial Setup Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd agilespace
   pnpm install
   ```

2. **Supabase Setup**
   ```bash
   # Option A: Use existing Supabase project
   # Add credentials to .env.local

   # Option B: Local development with Supabase CLI
   pnpm supabase:start
   # Copy the URLs displayed to .env.local
   ```

3. **GitHub OAuth Configuration**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable GitHub provider
   - Add GitHub OAuth App credentials
   - Set redirect URL: `http://localhost:5173/auth/callback`
   - Required scopes: `read:user user:email read:org repo`

4. **Database Setup**
   ```bash
   # Generate types from database schema
   pnpm supabase:db:generate
   ```

5. **Start Development**
   ```bash
   pnpm dev
   # App runs at http://localhost:5173
   ```

### Troubleshooting Setup

**Issue: Supabase connection fails**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase project is active
- Ensure no trailing slashes in URL

**Issue: GitHub OAuth fails**
- Verify OAuth app callback URL matches exactly
- Check OAuth scopes include `read:org` and `repo`
- Ensure GitHub OAuth app is approved for organizations

**Issue: Type errors after schema changes**
- Run `pnpm supabase:db:generate` to regenerate types
- Restart TypeScript server in your editor

## Development Workflow

### Adding a New Feature

1. **Plan the Feature**
   - Identify database changes needed
   - Determine UI components required
   - Plan API endpoints/queries

2. **Database Changes**
   ```bash
   # If schema changes needed
   # 1. Update database in Supabase Dashboard or migration file
   # 2. Regenerate types
   pnpm supabase:db:generate
   ```

3. **Create Queries/Mutations**
   ```typescript
   // src/lib/supabase/queries.ts - for reads
   export async function getNewData() { ... }

   // src/lib/supabase/mutations.ts - for writes
   export async function createNewData() { ... }
   ```

4. **Create TanStack Query Hooks**
   ```typescript
   // src/hooks/api/use-new-feature.ts
   export function useNewData() {
     return useQuery({
       queryKey: ['new-data'],
       queryFn: getNewData
     })
   }
   ```

5. **Build UI Components**
   ```typescript
   // src/components/new-feature.tsx
   // Follow shadcn/ui patterns
   // Include loading and error states
   ```

6. **Add Routes (if needed)**
   ```typescript
   // src/routes/new-route.tsx
   export const Route = createFileRoute('/new-route')({
     component: NewFeatureComponent
   })
   ```

7. **Test Manually**
   - Test all user interactions
   - Verify loading states
   - Check error handling
   - Test real-time updates if applicable

### Code Review Checklist

Before submitting changes:
- [ ] TypeScript compiles without errors (`pnpm build`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] All imports use `@/` alias
- [ ] Loading states implemented
- [ ] Error states handled gracefully
- [ ] Toast notifications for user feedback
- [ ] Database types regenerated if schema changed
- [ ] No console.errors in production code
- [ ] Components follow existing patterns
- [ ] Real-time subscriptions cleaned up properly

### Common Patterns to Follow

**Always use optimistic updates for mutations:**
```typescript
const mutation = useMutation({
  mutationFn: updateData,
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: ['data'] })
    const previous = queryClient.getQueryData(['data'])
    queryClient.setQueryData(['data'], (old) => ({ ...old, ...variables }))
    return { previous }
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['data'], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['data'] })
  }
})
```

**Always clean up subscriptions:**
```typescript
useEffect(() => {
  const channel = supabase.channel('updates').subscribe()
  return () => channel.unsubscribe()
}, [])
```

**Always provide user feedback:**
```typescript
// Good
const handleAction = async () => {
  try {
    await performAction()
    notifications.success("Action completed")
  } catch (error) {
    notifications.error("Action failed", error.message)
  }
}

// Bad - no feedback
const handleAction = async () => {
  await performAction()
}
```

## Performance Considerations

### Query Optimization
- Use `staleTime` to prevent unnecessary refetches
- Implement pagination for large datasets
- Use `select` to transform data at query level
- Enable `refetchOnWindowFocus` only for critical data

### Component Optimization
- Use React.memo for expensive components
- Implement skeleton loading states
- Lazy load routes with TanStack Router
- Debounce search inputs (use `use-debounce.ts`)

### Real-time Optimization
- Limit subscription scopes with filters
- Unsubscribe when components unmount
- Batch updates to prevent excessive re-renders
- Use query invalidation sparingly

## Security Best Practices

### Row Level Security (RLS)
All tables have RLS enabled. Key policies:
- Users can only read/write their own profile
- Space members can only access data in their spaces
- Admins have elevated permissions within their spaces

### Client-Side Security
- Never expose sensitive tokens in client code
- Use Supabase RLS policies, not client-side checks
- Validate all user inputs
- Sanitize displayed content from external sources (GitHub)

### GitHub Token Handling
- Tokens stored securely in Supabase Auth session
- Auto-refresh configured
- Token validation before API calls
- Graceful re-authentication on expiry

## Additional Resources

- **Specialized Agents**: See `subagents/` directory for in-depth documentation on specific areas
- **Environment Setup**: See `ENVIRONMENT.md` for detailed setup instructions
- **Testing**: See `TESTING.md` for testing guidelines
- **Deployment**: See `DEPLOYMENT.md` for deployment procedures
- **Contributing**: See `CONTRIBUTING.md` for contribution guidelines