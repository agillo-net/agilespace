# Query Keys Management

This document explains how query keys are managed in the AgilSpace project to prevent cache collisions and maintain consistency.

## Overview

All React Query cache keys are centrally defined in `/src/lib/query-keys.ts`. This prevents:
- Query key collisions (different queries using the same key)
- Inconsistent key naming across the codebase
- Hard-to-track cache invalidation issues

## Usage

### Basic Query

```typescript
import { queryKeys } from '@/lib/query-keys'

// ✅ Good - Using centralized query keys
const { data: space } = useQuery({
  queryKey: queryKeys.spaces.bySlug(slug),
  queryFn: () => getSpaceBySlug(slug),
})

// ❌ Bad - Hard-coded query keys
const { data: space } = useQuery({
  queryKey: ['space', slug],
  queryFn: () => getSpaceBySlug(slug),
})
```

### Query Invalidation

```typescript
import { queryKeys } from '@/lib/query-keys'

// Invalidate specific query
queryClient.invalidateQueries({
  queryKey: queryKeys.spaces.bySlug(slug)
})

// Invalidate all space-related queries
queryClient.invalidateQueries({
  queryKey: queryKeys.spaces.all
})
```

### Adding New Query Keys

When adding a new query, follow these steps:

1. **Add the key to `/src/lib/query-keys.ts`:**

```typescript
export const queryKeys = {
  // ... existing keys

  myNewFeature: {
    all: ['myNewFeature'] as const,
    list: () => [...queryKeys.myNewFeature.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.myNewFeature.all, 'detail', id] as const,
  },
}
```

2. **Use it in your component/hook:**

```typescript
import { queryKeys } from '@/lib/query-keys'

const { data } = useQuery({
  queryKey: queryKeys.myNewFeature.detail(id),
  queryFn: () => getMyFeature(id),
})
```

## Query Key Structure

Query keys follow a hierarchical structure:

```
['resource'] - Base key for all queries of this resource
['resource', 'list'] - List queries
['resource', 'list', filters] - List queries with filters
['resource', 'detail'] - Detail queries
['resource', 'detail', id] - Specific detail query
```

Example:
```typescript
queryKeys.spaces.all           // ['spaces']
queryKeys.spaces.lists()       // ['spaces', 'list']
queryKeys.spaces.bySlug(slug)  // ['spaces', 'slug', 'my-space']
```

## Common Patterns

### Query with Multiple Parameters

```typescript
tracks: {
  byIssue: (spaceId: string, repoOwner: string, repoName: string, issueNumber: number) =>
    [...queryKeys.tracks.all, 'issue', spaceId, repoOwner, repoName, issueNumber] as const,
}
```

### Query with Optional Filters

```typescript
spaces: {
  list: (filters?: Record<string, unknown>) =>
    [...queryKeys.spaces.lists(), filters] as const,
}
```

### Dependent Queries

```typescript
// Query depends on space being loaded first
const { data: space } = useQuery({
  queryKey: queryKeys.spaces.bySlug(slug),
  queryFn: () => getSpaceBySlug(slug),
})

const { data: members } = useQuery({
  queryKey: queryKeys.spaceMembers.bySpace(slug),
  queryFn: () => getSpaceMembers(space.id),
  enabled: !!space, // Wait for space to load
})
```

## Helper Functions

### Invalidate All Space-Related Queries

```typescript
import { getSpaceRelatedQueryKeys } from '@/lib/query-keys'

// Invalidate all queries related to a space
getSpaceRelatedQueryKeys(spaceId).forEach(key => {
  queryClient.invalidateQueries({ queryKey: key })
})
```

## Migration Guide

If you find existing queries using hard-coded keys:

1. Import the query keys:
   ```typescript
   import { queryKeys } from '@/lib/query-keys'
   ```

2. Replace the hard-coded key:
   ```typescript
   // Before
   queryKey: ['space', slug]

   // After
   queryKey: queryKeys.spaces.bySlug(slug)
   ```

3. Update any related invalidation calls:
   ```typescript
   // Before
   queryClient.invalidateQueries({ queryKey: ['space', slug] })

   // After
   queryClient.invalidateQueries({ queryKey: queryKeys.spaces.bySlug(slug) })
   ```

## Best Practices

1. **Always use centralized query keys** - Never hard-code query keys in components or hooks
2. **Use descriptive names** - Query key functions should clearly describe what data they fetch
3. **Include all parameters** - All parameters that affect the query result should be in the key
4. **Use `as const`** - This provides better TypeScript inference
5. **Follow the hierarchy** - Use the `.all` pattern for base keys to enable partial invalidation

## Example: Complete Feature Implementation

```typescript
// 1. Define keys in query-keys.ts
export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.projects.lists(), filters] as const,
    detail: (id: string) =>
      [...queryKeys.projects.all, 'detail', id] as const,
  },
}

// 2. Use in hook
import { queryKeys } from '@/lib/query-keys'

export function useProjects(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: () => getProjects(filters),
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => getProject(id),
  })
}

// 3. Invalidate after mutation
const mutation = useMutation({
  mutationFn: updateProject,
  onSuccess: (data) => {
    // Invalidate specific project
    queryClient.invalidateQueries({
      queryKey: queryKeys.projects.detail(data.id)
    })

    // Invalidate all project lists
    queryClient.invalidateQueries({
      queryKey: queryKeys.projects.lists()
    })
  },
})
```

## Troubleshooting

### Cache Not Updating

If your cache isn't updating after a mutation:
1. Check that you're using the same query key for fetching and invalidation
2. Verify the query key includes all relevant parameters
3. Use React Query DevTools to inspect the cache keys

### Stale Data

If you're seeing stale data:
1. Check `staleTime` configuration
2. Verify cache invalidation is being called
3. Consider using `refetchOnMount` or `refetchOnWindowFocus`

### TypeScript Errors

If you get TypeScript errors with query keys:
1. Ensure you're using `as const` in the query key definitions
2. Check that all parameters are properly typed
3. Verify imports are correct
