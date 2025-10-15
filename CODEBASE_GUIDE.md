# AgileSpace - Deep Dive Documentation

## Table of Contents

1. [Project Overview and Architecture](#project-overview-and-architecture)
2. [Core Components and Functionalities](#core-components-and-functionalities)
3. [Key Algorithms and Data Structures](#key-algorithms-and-data-structures)
4. [API Specifications and Integration Points](#api-specifications-and-integration-points)
5. [Development Environment Setup](#development-environment-setup)
6. [Testing Methodology and Coverage](#testing-methodology-and-coverage)
7. [Deployment Process and Infrastructure](#deployment-process-and-infrastructure)
8. [Known Issues and Future Roadmap](#known-issues-and-future-roadmap)

---

## Project Overview and Architecture

### Project Description
AgileSpace is a modern web application that integrates with GitHub to provide comprehensive team effort tracking and visualization. It helps organizations monitor team performance, track issues, and generate insightful charts for better project management and resource allocation.

### Technology Stack
- **Frontend Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Routing**: TanStack Router 1.120.5 (file-based routing)
- **State Management**: TanStack Query 5.76.1 (server state)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with GitHub OAuth
- **Styling**: Tailwind CSS 4.1.6 with shadcn/ui components
- **Package Manager**: pnpm
- **Development Environment**: Node.js 18+

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Routes    │  │ Components  │  │    Hooks/API        │  │
│  │ (TanStack)  │  │ (shadcn/ui) │  │  (TanStack Query)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    API Layer (Supabase)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Auth (OAuth)│  │ Real-time   │  │    Database         │  │
│  │   GitHub    │  │ Subscriptions│  │   (PostgreSQL)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                External Integrations                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ GitHub API  │  │   Octokit   │                          │
│  │ (Issues,    │  │   Client    │                          │
│  │ Orgs, Repos)│  │             │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Core Concepts
- **Spaces**: Workspaces that correspond to GitHub organizations
- **Tracks**: Individual GitHub issues being worked on
- **Sessions**: Time tracking periods for work on specific tracks
- **Members**: Users who belong to a space with different roles (admin, member, observer)
- **Tags**: Categorization system for sessions

---

## Core Components and Functionalities

### 1. Authentication System
**Location**: `src/hooks/api/use-auth.tsx`, `src/lib/supabase/client.ts`

```typescript
interface AuthContextType {
  user: User | null;
  githubToken: string | null;
  loginWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  getValidGithubToken: () => Promise<string | null>;
}
```

**Functionality**:
- GitHub OAuth integration via Supabase Auth
- Automatic token refresh and validation
- Session persistence across browser sessions
- Provider token management for GitHub API access

### 2. Space Management
**Location**: `src/hooks/api/use-spaces.ts`, `src/components/organization-card.tsx`

**Key Features**:
- Create spaces from GitHub organizations
- Join existing spaces
- Role-based access control (admin, member, observer)
- Space membership status tracking

### 3. Time Tracking System
**Location**: `src/components/timer.tsx`, `src/hooks/api/use-sessions.ts`

**Core Functionality**:
```typescript
interface Session {
  id: string;
  track_id: string;
  space_member_id: string;
  started_at: string;
  ended_at?: string;
  comment_url?: string;
  skipped_summary?: boolean;
}
```

**Features**:
- Real-time timer with start/stop functionality
- Session persistence across browser refreshes
- Automatic session ending with optional comments
- Session discard capability
- Duration change requests with approval workflow

### 4. Track Management
**Location**: `src/hooks/api/use-tracks.ts`, `src/routes/space/$slug/tracks/index.tsx`

**Functionality**:
- GitHub issue integration and synchronization
- Track creation from GitHub issues
- Session statistics per track
- Participant tracking and visualization

### 5. Dashboard and Analytics
**Location**: `src/components/dashboard-stats.tsx`, `src/hooks/api/use-space-dashboard.ts`

**Components**:
- Session activity charts (line charts for trends)
- Track statistics (bar charts for distribution)
- Real-time active sessions display
- Team member status and location tracking

### 6. Navigation and Routing
**Location**: `src/routes/`, `src/routeTree.gen.ts`

**Route Structure**:
```
/                           # Landing page
/login                      # Authentication
/spaces                     # Organization selection
/space/$slug/               # Space dashboard
/space/$slug/tracks         # Track management
/space/$slug/sessions       # Session history
/space/$slug/members        # Member management
/space/$slug/tags           # Tag management
/space/$slug/change-requests # Duration change requests
```

---

## Key Algorithms and Data Structures

### 1. Session Duration Calculation
**Location**: `src/lib/utils.ts`

```typescript
export const getSessionDuration = (startedAt: string, endedAt?: string): number => {
  const start = new Date(startedAt);
  const end = endedAt ? new Date(endedAt) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / 1000);
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};
```

### 2. Real-time Timer State Management
**Location**: `src/components/timer.tsx`

```typescript
const [time, setTime] = useState(0);
const [isRunning, setIsRunning] = useState(false);
const intervalRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (isRunning) {
    intervalRef.current = setInterval(() => {
      setTime(prevTime => prevTime + 1);
    }, 1000);
  } else {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }
  
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, [isRunning]);
```

### 3. Data Aggregation for Analytics
**Location**: `src/hooks/api/use-space-dashboard.ts`

```typescript
// Session activity data preparation
const sessionActivityData = React.useMemo(() => {
  if (!closedSessions) return [];

  const sessionsByDate = closedSessions.reduce((acc, session) => {
    const date = new Date(session.ended_at!).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(sessionsByDate)
    .map(([date, count]) => ({ date, sessions: count }))
    .slice(-7); // Last 7 days
}, [closedSessions]);
```

### 4. Search and Filtering Algorithms
**Location**: `src/hooks/api/use-sessions.ts`, `src/hooks/api/use-tracks.ts`

**GitHub Issue Search**:
```typescript
const handleSearch = async (query: string) => {
  if (!query.trim()) return;
  
  setIsSearching(true);
  try {
    const results = await searchGitHubIssues(query, userOrgs);
    setSearchResults(results);
  } catch (error) {
    setSearchError(error as Error);
  } finally {
    setIsSearching(false);
  }
};
```

---

## API Specifications and Integration Points

### 1. Supabase Database Schema

#### Core Tables:
```sql
-- User profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  github_username TEXT,
  github_id BIGINT UNIQUE,
  avatar_url TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spaces (Organizations)
CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  github_org_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Space membership
CREATE TABLE space_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member', 'observer')) NOT NULL,
  nickname TEXT,
  status TEXT CHECK (status IN ('online', 'offline')) DEFAULT 'offline',
  location TEXT CHECK (location IN ('office', 'remote')) DEFAULT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  last_status_update_at TIMESTAMPTZ DEFAULT NOW()
);

-- GitHub issue tracking
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  issue_number INTEGER NOT NULL,
  title TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (space_id, repo_owner, repo_name, issue_number)
);

-- Work sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  space_member_id UUID REFERENCES space_members(id) ON DELETE CASCADE,
  comment_url TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  skipped_summary BOOLEAN DEFAULT FALSE
);

-- Session categorization
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (space_id, name)
);

CREATE TABLE session_tags (
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, tag_id)
);
```

### 2. GitHub API Integration
**Location**: `src/lib/github/client.ts`, `src/lib/github/queries.ts`

**Authentication**:
```typescript
export async function getOctokitClient() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  
  if (!data?.session?.provider_token) {
    await supabase.auth.signOut();
    window.location.href = '/login';
    return null;
  }
  
  return new Octokit({ auth: data.session.provider_token });
}
```

**Key API Endpoints Used**:
- `GET /user/orgs` - Fetch user organizations
- `GET /search/issues` - Search GitHub issues
- `GET /repos/{owner}/{repo}/issues/{issue_number}` - Get specific issue details

### 3. Supabase Query Patterns
**Location**: `src/lib/supabase/queries.ts`

**Complex Joins Example**:
```typescript
export async function getClosedSessions(spaceId: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      space_member:space_members!inner(
        *,
        profile:profiles(*)
      ),
      track:tracks!inner(*),
      session_tags(
        tag:tags(*)
      )
    `)
    .eq("tracks.space_id", spaceId)
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false });
    
  if (error) throw new Error(error.message);
  return data || [];
}
```

### 4. Real-time Subscriptions
**Location**: Various hooks in `src/hooks/api/`

```typescript
// Real-time session updates
useEffect(() => {
  const subscription = supabase
    .channel('sessions')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'sessions' },
      (payload) => {
        queryClient.invalidateQueries(['sessions']);
      }
    )
    .subscribe();
    
  return () => subscription.unsubscribe();
}, []);
```

---

## Development Environment Setup

### Prerequisites
- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Docker (for local Supabase development)
- Supabase CLI

### Installation Steps

1. **Clone and Install Dependencies**:
```bash
git clone https://github.com/agillo-net/agilespace.git
cd agilespace
pnpm install
```

2. **Environment Configuration**:
Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Local Supabase Setup**:
```bash
# Initialize Supabase (first time only)
pnpm supabase init

# Start Supabase services
pnpm supabase:start

# Generate TypeScript types
pnpm supabase:db:generate
```

4. **Development Server**:
```bash
pnpm dev
```

### Build Configuration

**Vite Configuration** (`vite.config.ts`):
```typescript
export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react" }),
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**TypeScript Configuration**:
- `tsconfig.json` - Root configuration with path mapping
- `tsconfig.app.json` - Application-specific settings
- `tsconfig.node.json` - Node.js environment settings

**ESLint Configuration** (`eslint.config.js`):
```javascript
export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...pluginQuery.configs["flat/recommended"],
    ],
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
  }
);
```

### Available Scripts
```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "supabase": "supabase",
  "supabase:start": "supabase start",
  "supabase:db:generate": "supabase gen types typescript --local > src/types/database.types.ts"
}
```

---

## Testing Methodology and Coverage

### Current Testing Status
⚠️ **Note**: The project currently lacks comprehensive testing infrastructure. This is a known technical debt that should be addressed.

### Recommended Testing Strategy

#### 1. Unit Testing
**Framework**: Vitest (recommended for Vite projects)
**Target Coverage**: 
- Utility functions (`src/lib/utils.ts`)
- Custom hooks (`src/hooks/`)
- Component logic

**Example Test Structure**:
```typescript
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatTime, getSessionDuration } from '../utils';

describe('formatTime', () => {
  it('should format seconds correctly', () => {
    expect(formatTime(3661)).toBe('1h 1m 1s');
    expect(formatTime(61)).toBe('1m 1s');
    expect(formatTime(30)).toBe('30s');
  });
});
```

#### 2. Integration Testing
**Framework**: React Testing Library
**Focus Areas**:
- Component interactions
- Form submissions
- API integration points

#### 3. E2E Testing
**Framework**: Playwright (recommended)
**Critical Paths**:
- Authentication flow
- Session creation and management
- Space navigation
- Timer functionality

### Quality Assurance Tools

#### Current Tools:
- **ESLint**: Code quality and consistency
- **TypeScript**: Type safety
- **TanStack Query DevTools**: API state debugging

#### Recommended Additions:
- **Vitest**: Unit testing framework
- **React Testing Library**: Component testing
- **Playwright**: End-to-end testing
- **Storybook**: Component documentation and testing

---

## Deployment Process and Infrastructure

### Current Deployment Status
The project is configured for modern web deployment with the following characteristics:

#### Build Process
```bash
# Production build
pnpm build

# Preview build locally
pnpm preview
```

#### Build Output
- **Static Assets**: Generated in `dist/` directory
- **Service Worker**: PWA support with `public/sw.js`
- **Manifest**: Web app manifest for PWA installation

#### Deployment Targets

**Recommended Platforms**:
1. **Vercel** (Primary recommendation)
   - Automatic deployments from Git
   - Edge functions support
   - Built-in analytics

2. **Netlify**
   - Static site hosting
   - Form handling
   - Edge functions

3. **Supabase Hosting**
   - Integrated with Supabase backend
   - Global CDN

#### Environment Variables for Production
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### Database Deployment
**Supabase Production Setup**:
1. Create Supabase project
2. Run migrations: `supabase db push`
3. Configure GitHub OAuth in Supabase Auth settings
4. Set up RLS (Row Level Security) policies

#### CI/CD Pipeline (Recommended)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm lint
      # Add deployment step based on platform
```

---

## Known Issues and Future Roadmap

### Known Issues

#### 1. Testing Infrastructure
**Status**: Missing
**Priority**: High
**Description**: No testing framework currently implemented
**Impact**: Potential for regressions and bugs in production

#### 2. Error Handling
**Status**: Partial
**Priority**: Medium
**Description**: Inconsistent error handling across components
**Impact**: Poor user experience during failures

#### 3. Performance Optimization
**Status**: Not optimized
**Priority**: Medium
**Description**: No code splitting or lazy loading implemented
**Impact**: Larger initial bundle size

#### 4. Accessibility
**Status**: Basic
**Priority**: Medium
**Description**: Limited accessibility features implemented
**Impact**: Reduced usability for users with disabilities

### Future Roadmap

#### Phase 1: Foundation (Q1 2024)
- [ ] Implement comprehensive testing suite
- [ ] Add error boundaries and improved error handling
- [ ] Implement code splitting and lazy loading
- [ ] Add accessibility improvements (ARIA labels, keyboard navigation)

#### Phase 2: Features (Q2 2024)
- [ ] Advanced analytics and reporting
- [ ] Team productivity insights
- [ ] Integration with additional project management tools
- [ ] Mobile application development

#### Phase 3: Scale (Q3 2024)
- [ ] Multi-organization support
- [ ] Advanced role-based permissions
- [ ] API rate limiting and caching
- [ ] Performance monitoring and optimization

#### Phase 4: Enterprise (Q4 2024)
- [ ] SSO integration
- [ ] Advanced security features
- [ ] Custom branding options
- [ ] Enterprise-grade SLA and support

### Technical Debt

#### High Priority
1. **Testing Infrastructure**: Critical for maintainability
2. **Error Handling**: Improve user experience
3. **Type Safety**: Strengthen TypeScript usage
4. **Performance**: Bundle optimization and caching

#### Medium Priority
1. **Documentation**: API documentation and component docs
2. **Monitoring**: Application performance monitoring
3. **Security**: Security audit and improvements
4. **Accessibility**: WCAG compliance

#### Low Priority
1. **Internationalization**: Multi-language support
2. **Theming**: Advanced customization options
3. **Offline Support**: PWA offline capabilities

### Contributing Guidelines

#### Code Standards
- Follow existing TypeScript and React patterns
- Use shadcn/ui components for consistency
- Implement proper error handling
- Add JSDoc comments for complex functions

#### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests (when testing is available)
3. Update documentation if needed
4. Submit PR with clear description
5. Address review feedback

#### Branch Naming Convention
```
<type>/<ticket-number>-<short-description>

Examples:
feat/AS-123-add-user-profile
fix/AS-456-fix-login-error
docs/AS-789-update-readme
```

---

## Conclusion

AgileSpace is a modern, well-architected application that provides comprehensive team effort tracking through GitHub integration. The codebase demonstrates good practices in React development, TypeScript usage, and modern tooling. However, there are opportunities for improvement in testing, error handling, and performance optimization.

The application's modular architecture makes it well-suited for future enhancements and scaling. The use of established libraries and frameworks (React, TanStack Router, Supabase) provides a solid foundation for continued development.

For AI agents working with this codebase, the key areas to understand are:
1. The session-based time tracking system
2. GitHub API integration patterns
3. Supabase query and mutation patterns
4. TanStack Router file-based routing
5. Component composition using shadcn/ui

This documentation should serve as a comprehensive guide for understanding, maintaining, and extending the AgileSpace application.