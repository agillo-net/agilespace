# Testing Guide

This document outlines the testing strategy, guidelines, and best practices for AgileSpace.

## Testing Philosophy

AgileSpace prioritizes:
1. **User-facing behavior** over implementation details
2. **Integration tests** over unit tests
3. **Type safety** as first line of defense
4. **Manual testing** for complex user flows
5. **Real-time features** with careful testing

## Testing Stack (Planned)

```json
{
  "test-runner": "vitest",
  "ui-testing": "@testing-library/react",
  "e2e-testing": "playwright",
  "mocking": "msw"
}
```

## Current Testing Approach

### TypeScript as Testing

The project currently relies on TypeScript's type system as a form of testing:

- ✅ Generated database types ensure type safety
- ✅ Strict TypeScript configuration catches errors
- ✅ Type-safe query and mutation hooks
- ✅ Props validation at compile time

### Manual Testing Checklist

Before submitting features, manually verify:

#### Authentication Flow
- [ ] GitHub OAuth login works
- [ ] Profile creation succeeds
- [ ] Token refresh works automatically
- [ ] Logout clears session properly
- [ ] Protected routes redirect correctly

#### Session Management
- [ ] Can create new session
- [ ] Timer counts accurately
- [ ] Can end session with correct duration
- [ ] Can discard session
- [ ] Duration change requests work
- [ ] Notifications show for session events

#### Real-time Features
- [ ] Active sessions update in real-time
- [ ] Team member sessions show correctly
- [ ] Session changes reflect immediately
- [ ] Subscriptions clean up on unmount

#### GitHub Integration
- [ ] Can search issues across orgs
- [ ] Issue details display correctly
- [ ] Track creation from issues works
- [ ] Command palette (⌘K) functions

#### UI/UX
- [ ] Loading states show appropriately
- [ ] Error states handled gracefully
- [ ] Toast notifications appear
- [ ] Forms validate inputs
- [ ] Mobile responsive layout works

## Testing Guidelines (For Future Implementation)

### Unit Tests

Test pure functions and utilities:

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { formatDuration, calculateElapsedTime } from './utils'

describe('formatDuration', () => {
  it('formats seconds correctly', () => {
    expect(formatDuration(65)).toBe('1:05')
  })

  it('formats hours correctly', () => {
    expect(formatDuration(3665)).toBe('1:01:05')
  })

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0:00')
  })
})
```

### Integration Tests

Test component interactions with data:

```typescript
// src/components/session-card.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { SessionCard } from './session-card'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)

describe('SessionCard', () => {
  it('displays session information', () => {
    const session = {
      id: '1',
      title: 'Test Session',
      started_at: new Date().toISOString(),
      status: 'active'
    }

    render(<SessionCard session={session} />, { wrapper })

    expect(screen.getByText('Test Session')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('calls end session when button clicked', async () => {
    const onEnd = vi.fn()
    const session = {
      id: '1',
      title: 'Test Session',
      started_at: new Date().toISOString(),
      status: 'active'
    }

    render(<SessionCard session={session} onEnd={onEnd} />, { wrapper })

    await userEvent.click(screen.getByRole('button', { name: /end/i }))

    await waitFor(() => {
      expect(onEnd).toHaveBeenCalledWith(session.id)
    })
  })
})
```

### API Mocking

Use MSW for mocking Supabase and GitHub APIs:

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock Supabase session endpoint
  http.get('*/auth/v1/session', () => {
    return HttpResponse.json({
      user: {
        id: '123',
        email: 'test@example.com'
      },
      session: {
        access_token: 'test-token',
        provider_token: 'github-token'
      }
    })
  }),

  // Mock Supabase queries
  http.get('*/rest/v1/sessions*', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Test Session',
        status: 'active',
        started_at: new Date().toISOString()
      }
    ])
  }),

  // Mock GitHub API
  http.get('https://api.github.com/search/issues', () => {
    return HttpResponse.json({
      items: [
        {
          id: 1,
          number: 123,
          title: 'Test Issue',
          state: 'open',
          repository_url: 'https://api.github.com/repos/test/repo'
        }
      ]
    })
  })
]
```

### E2E Tests

Test complete user workflows with Playwright:

```typescript
// tests/e2e/session-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Session Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to space
    await page.goto('http://localhost:5173')
    await page.click('text=Sign in with GitHub')
    // Mock GitHub OAuth for testing
    await page.waitForURL('**/space/**')
  })

  test('complete session workflow', async ({ page }) => {
    // Start session
    await page.click('text=Start Session')
    await page.fill('[placeholder="Session title"]', 'E2E Test Session')
    await page.click('button:has-text("Start")')

    // Verify session started
    await expect(page.locator('text=E2E Test Session')).toBeVisible()
    await expect(page.locator('text=Active')).toBeVisible()

    // Wait for timer to tick
    await page.waitForTimeout(2000)

    // End session
    await page.click('button:has-text("End Session")')
    await page.click('button:has-text("Confirm")')

    // Verify completion notification
    await expect(page.locator('text=Session completed')).toBeVisible()
  })

  test('command palette issue search', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+K')

    // Search for issue
    await page.fill('[placeholder*="Search"]', 'bug fix')

    // Wait for results
    await expect(page.locator('[role="option"]')).toBeVisible()

    // Select issue
    await page.click('[role="option"]:first-child')

    // Verify session started with issue
    await expect(page.locator('text=Session started')).toBeVisible()
  })
})
```

## Testing Real-time Features

Real-time Supabase subscriptions require special testing:

```typescript
// src/hooks/api/use-sessions.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSessions } from './use-sessions'
import { getSupabaseClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client')

describe('useSessions with real-time updates', () => {
  let mockChannel: any
  let subscribeCallback: any

  beforeEach(() => {
    mockChannel = {
      on: vi.fn((event, config, callback) => {
        subscribeCallback = callback
        return mockChannel
      }),
      subscribe: vi.fn(() => mockChannel),
      unsubscribe: vi.fn()
    }

    vi.mocked(getSupabaseClient).mockReturnValue({
      channel: vi.fn(() => mockChannel),
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('updates when new session is inserted', async () => {
    const { result } = renderHook(() => useSessions('space-123'))

    // Simulate real-time insert
    await waitFor(() => {
      subscribeCallback({
        eventType: 'INSERT',
        new: {
          id: 'new-session',
          title: 'New Session',
          status: 'active'
        }
      })
    })

    // Verify query was invalidated
    await waitFor(() => {
      expect(result.current.data).toContainEqual(
        expect.objectContaining({ id: 'new-session' })
      )
    })
  })

  it('cleans up subscription on unmount', () => {
    const { unmount } = renderHook(() => useSessions('space-123'))

    unmount()

    expect(mockChannel.unsubscribe).toHaveBeenCalled()
  })
})
```

## Test Data Management

### Factories for Test Data

```typescript
// src/test/factories.ts
import { faker } from '@faker-js/faker'

export const sessionFactory = (overrides = {}) => ({
  id: faker.string.uuid(),
  title: faker.lorem.words(3),
  status: 'active',
  started_at: faker.date.recent().toISOString(),
  ended_at: null,
  user_id: faker.string.uuid(),
  space_id: faker.string.uuid(),
  ...overrides
})

export const userFactory = (overrides = {}) => ({
  id: faker.string.uuid(),
  full_name: faker.person.fullName(),
  github_username: faker.internet.userName(),
  avatar_url: faker.image.avatar(),
  ...overrides
})

export const spaceFactory = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  slug: faker.helpers.slugify(faker.company.name()),
  github_org_id: faker.number.int(),
  ...overrides
})
```

### Database Seeding

```typescript
// src/test/seed.ts
import { getSupabaseClient } from '@/lib/supabase/client'
import { sessionFactory, userFactory, spaceFactory } from './factories'

export async function seedTestData() {
  const supabase = getSupabaseClient()

  // Create test user
  const user = userFactory()
  await supabase.from('profiles').insert(user)

  // Create test space
  const space = spaceFactory()
  await supabase.from('spaces').insert(space)

  // Add user to space
  await supabase.from('space_members').insert({
    space_id: space.id,
    user_id: user.id,
    role: 'admin'
  })

  // Create test sessions
  const sessions = Array.from({ length: 5 }, () =>
    sessionFactory({ space_id: space.id, user_id: user.id })
  )
  await supabase.from('sessions').insert(sessions)

  return { user, space, sessions }
}

export async function cleanupTestData() {
  const supabase = getSupabaseClient()

  // Clean up in reverse order of dependencies
  await supabase.from('sessions').delete().neq('id', '')
  await supabase.from('space_members').delete().neq('id', '')
  await supabase.from('spaces').delete().neq('id', '')
  await supabase.from('profiles').delete().neq('id', '')
}
```

## Performance Testing

### Query Performance

Monitor TanStack Query performance:

```typescript
// Check query execution time
const { data, dataUpdatedAt, isSuccess } = useQuery({
  queryKey: ['sessions'],
  queryFn: getSession,
  meta: {
    onSuccess: () => {
      console.log(`Query completed in ${Date.now() - startTime}ms`)
    }
  }
})
```

### Bundle Size

```bash
# Analyze bundle size
pnpm build
pnpm run analyze  # If bundler analyzer is configured

# Check for large dependencies
npx vite-bundle-visualizer
```

## Continuous Testing

### Pre-commit Checks

```bash
# Add to .husky/pre-commit
#!/bin/sh
pnpm lint
pnpm type-check
```

### CI Pipeline (Planned)

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test
      - run: pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Testing Checklist

### For New Features

- [ ] Types are correct and generated if DB schema changed
- [ ] Component renders without errors
- [ ] Loading states display correctly
- [ ] Error states handled gracefully
- [ ] Success states show appropriate feedback
- [ ] Real-time updates work (if applicable)
- [ ] Subscriptions clean up properly
- [ ] No memory leaks
- [ ] Optimistic updates work (if applicable)
- [ ] Accessibility attributes present
- [ ] Keyboard navigation works
- [ ] Mobile responsive
- [ ] Works in Chrome, Firefox, Safari
- [ ] No console errors or warnings

### For Bug Fixes

- [ ] Bug is reproducible
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Regression test added (if possible)
- [ ] Related features still work
- [ ] No new console errors

## Future Testing Improvements

### Short-term
1. Set up Vitest with React Testing Library
2. Add unit tests for utility functions
3. Add integration tests for critical components
4. Configure MSW for API mocking

### Medium-term
1. Set up Playwright for E2E tests
2. Add visual regression testing
3. Implement test coverage reporting
4. Create CI/CD pipeline with tests

### Long-term
1. Performance testing automation
2. Load testing for real-time features
3. Security testing integration
4. Accessibility testing automation

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [Testing TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
- [Testing Supabase](https://supabase.com/docs/guides/getting-started/testing)
