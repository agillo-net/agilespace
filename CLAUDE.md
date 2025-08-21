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