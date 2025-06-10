# AgileSpace Development Guide for AI Agents

## Overview
AgileSpace is a React + TypeScript application built with Vite that integrates GitHub organizations with Supabase for space management. It uses TanStack Router for routing, TanStack Query for data fetching, and Tailwind CSS with shadcn/ui components for styling.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Routing**: TanStack Router v1.120.5
- **State Management**: TanStack Query v5.76.1
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with GitHub OAuth
- **Styling**: Tailwind CSS v4.1.6, shadcn/ui components
- **Package Manager**: pnpm

## Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── create-org-button.tsx  # GitHub org creation component
│   ├── create-profile.tsx     # User profile creation
│   └── login-form.tsx         # Authentication form
├── hooks/
│   ├── use-auth.tsx           # Authentication hook
│   └── use-mobile.ts          # Mobile detection
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Supabase client
│   │   ├── queries.ts         # Database queries
│   │   └── mutations.ts       # Database mutations
│   ├── github/
│   │   └── queries.ts         # GitHub API queries
│   └── utils.ts               # Utility functions
├── routes/
│   ├── __root.tsx             # Root layout
│   ├── index.tsx              # Home page
│   ├── login.tsx              # Login page
│   ├── spaces/
│   │   └── route.tsx          # Spaces listing
│   └── space/
│       ├── route.tsx          # Space layout
│       └── $slug.tsx          # Individual space
├── App.tsx                    # Main app component
├── main.tsx                   # App entry point
└── routeTree.gen.ts           # Auto-generated routes
```

## Key Configuration Files
- [`package.json`](../package.json) - Dependencies and scripts
- [`tsconfig.app.json`](../tsconfig.app.json) - TypeScript configuration with path aliases
- [`components.json`](../components.json) - shadcn/ui configuration
- [`supabase/config.toml`](../supabase/config.toml) - Supabase local development config
- [`.env.example`](../.env.example) - Environment variables template

## Development Workflow

### 1. Setting Up Development Environment

```bash
# Install dependencies
pnpm install

# Start Supabase locally
pnpm run supabase:start

# Start development server
pnpm run dev
```

### 2. Environment Variables Required
Copy .env.example to .env.local and configure:
- `SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID` - GitHub OAuth app client ID
- `SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET` - GitHub OAuth app secret
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Database Schema (Supabase)

### Core Tables
1. **profiles** - User profiles
   - `id` (uuid, references auth.users)
   - `full_name` (text)
   - `github_username` (text)

2. **spaces** - GitHub organization spaces
   - `id` (uuid, primary key)
   - `name` (text)
   - `slug` (text, unique)
   - `avatar_url` (text)
   - `github_org_id` (text)

3. **space_members** - Space membership
   - `space_id` (uuid, references spaces)
   - `user_id` (uuid, references profiles)
   - `role` (enum: admin, member, observer)

## Authentication Flow

### User States
1. **Unauthenticated** → Show `LoginForm`
2. **Authenticated but no profile** → Show `CreateProfile`
3. **Profile exists but no organizations** → Show GitHub org selection
4. **Has organizations** → Redirect to main app

### Authentication Hook
Use `useAuth` for authentication state:
```tsx
const { user, logout } = useAuth();
```

## Data Management

### Queries (Read Operations)
Located in queries.ts:
- `getProfile(userId)` - Get user profile
- `getUserSpaces()` - Get user's spaces
- `getUserOrganizations(userId)` - Get user's organizations

GitHub queries in queries.ts:
- `getUserOrgs()` - Get user's GitHub organizations

### Mutations (Write Operations)
Located in mutations.ts:
- `createProfile({ id, full_name, github_username })` - Create user profile
- `createSpace({ name, slug, avatar_url, github_org_id })` - Create space
- `createSpaceMember({ space_id, user_id, role })` - Add space member

### TanStack Query Integration
```tsx
// Example query usage
const { data, isLoading, error } = useQuery({
  queryKey: ["getUserSpaces"],
  queryFn: getUserSpaces,
});

// Example mutation usage
const createSpaceMutation = useMutation({
  mutationFn: createSpace,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["getUserSpaces"] });
    toast.success("Space created successfully");
  },
  onError: (error) => {
    toast.error(`Failed to create space: ${error.message}`);
  },
});
```

## Routing System (TanStack Router)

### Route Structure
- `/` - Home page (`src/routes/index.tsx`)
- `/login` - Login page (`src/routes/login.tsx`)
- `/spaces` - Spaces listing (`src/routes/spaces/route.tsx`)
- `/space` - Space layout (`src/routes/space/route.tsx`)
- `/space/$slug` - Individual space (`src/routes/space/$slug.tsx`)

### Creating New Routes
1. Create route file in routes
2. Use `createFileRoute` from `@tanstack/react-router`
3. Route tree auto-generates in routeTree.gen.ts

Example route structure:
```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/your-route')({
  component: RouteComponent,
  loader: async () => {
    // Optional: Load data before component renders
    return await fetchData();
  }
})

function RouteComponent() {
  const data = useLoaderData({ from: '/your-route' });
  return <div>Your component</div>
}
```

### Navigation
```tsx
import { useNavigate } from '@tanstack/react-router';

const navigate = useNavigate();
navigate({ to: `/space/${org.login}` });
```

## UI Components (shadcn/ui)

### Component Library Location
All UI components are in ui, including:
- `Button`
- `Card` 
- `Command`
- `Sidebar`
- And many more...

### Adding New Components
```bash
# Add shadcn/ui component
npx shadcn@latest add button
```

### Custom Components
Business logic components in components:
- `CreateOrgButton` - GitHub org creation
- `CreateProfile` - Profile creation form
- `LoginForm` - Authentication form

## Styling System

### Tailwind Configuration
- Uses Tailwind CSS v4 with `@tailwindcss/vite` plugin
- Custom design tokens in index.css
- Dark mode support with CSS variables
- Custom color palette for light/dark themes

### CSS Variables (Design Tokens)
Located in index.css:
```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.129 0.042 264.695);
  --primary: oklch(0.208 0.042 265.755);
  /* ... more variables */
}
```

### Utility Classes
```tsx
// Example styling patterns used in the app
<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
<Card className="cursor-pointer hover:shadow-md transition-shadow">
<Button variant="secondary" size="sm">
```

## Development Guidelines

### When Adding New Features

#### 1. Database Changes
- Update Supabase schema in local development
- Add corresponding TypeScript types
- Create query/mutation functions in appropriate files

#### 2. New Pages/Routes
- Create route file following TanStack Router patterns
- Add data loading in route loader if needed
- Use existing UI components when possible

#### 3. API Integration
- GitHub API calls go in github
- Supabase operations go in supabase
- Wrap with TanStack Query for caching and state management

#### 4. Component Creation
- Use shadcn/ui components as building blocks
- Create custom components in components for business logic
- Follow existing patterns for styling and props

### Code Patterns

#### Error Handling
```tsx
// Query error handling
if (query.isError) {
  return <div className="text-red-500">{query.error.message}</div>;
}

// Mutation error handling  
const mutation = useMutation({
  mutationFn: someFunction,
  onError: (error) => {
    toast.error(`Operation failed: ${error.message}`);
  },
});
```

#### Loading States
```tsx
// Query loading
if (query.isLoading) {
  return <div>Loading...</div>;
}

// Mutation loading
<Button disabled={mutation.isPending}>
  {mutation.isPending ? "Creating..." : "Create"}
</Button>
```

#### Toast Notifications
```tsx
import { toast } from "sonner";

// Success notification
toast.success("Operation completed successfully");

// Error notification  
toast.error("Operation failed");
```

## File Naming Conventions
- **Routes**: route.tsx for layout routes, specific names for pages
- **Components**: `kebab-case.tsx` (e.g., `create-org-button.tsx`)
- **Hooks**: `use-*.ts` (e.g., `use-auth.tsx`)
- **Utilities**: `*.ts` in appropriate lib directories

## Import Aliases
Configured in tsconfig.app.json:
- `@/*` maps to `./src/*`
- Use `@/components/ui/button` instead of relative paths

## Development Commands
```bash
# Development
pnpm run dev              # Start dev server
pnpm run build           # Build for production
pnpm run preview         # Preview production build
pnpm run lint            # Run ESLint

# Supabase
pnpm run supabase:start  # Start local Supabase
pnpm run supabase        # Run Supabase CLI commands
```

## Common Development Tasks

### Adding a New Space Feature
1. Add database schema changes if needed
2. Create query/mutation functions in supabase
3. Add route in space if needed
4. Create components in components
5. Use TanStack Query for data management

### Modifying the Spaces Listing
- Main component: route.tsx
- Data loading: Uses `getUserOrgs()` and `getUserSpaces()` 
- Mutations: `createSpace()` and `createSpaceMember()`

### Adding GitHub Integration
- Add functions to queries.ts
- Use existing GitHub OAuth flow
- Integrate with existing TanStack Query patterns

### Customizing UI Components
- Modify existing components in ui
- Follow shadcn/ui patterns for consistency
- Update CSS variables in index.css for design changes

## Important Notes for AI Agents

1. **Always use existing patterns** - Follow established conventions for consistency
2. **Database operations** - Use Supabase client and existing query/mutation patterns
3. **Routing** - Use TanStack Router's file-based routing system
4. **Styling** - Prefer existing Tailwind classes and CSS variables
5. **Data fetching** - Always wrap with TanStack Query for caching and state management
6. **Error handling** - Use toast notifications and proper error states
7. **TypeScript** - Maintain type safety throughout the application

## Extension Points

This codebase is designed to be extensible in several areas:
- **Space management**: Add more space features and permissions
- **GitHub integration**: Expand GitHub API usage beyond organizations
- **User management**: Add more user profile features
- **Real-time features**: Leverage Supabase real-time subscriptions
- **Analytics**: Add tracking and metrics
- **Collaboration tools**: Add team features within spaces
