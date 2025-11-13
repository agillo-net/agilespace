# Query Key Collision Fix

## Issue Summary

The "Sync GitHub Permissions" button on the members page was disabled even though the space had a valid `github_org_id` in the database.

## Root Cause

A **React Query cache key collision** was occurring:

1. The `useSessions` hook used query key `["space", slug]` with `getSpaceAndTracks()` which returns:
   ```typescript
   { space, tracks, space_member, tags }
   ```

2. The members page also used query key `["space", slug]` with `getSpaceBySlug()` which returns:
   ```typescript
   Space // just the space object
   ```

3. Since `useSessions` was called first, React Query cached the nested object structure

4. When the space query ran, it retrieved the cached nested object instead of the flat space object

5. This meant `space.github_org_id` was `undefined` because the actual data was at `space.space.github_org_id`

## Solution

### Immediate Fix
Changed the query key in `use-sessions.ts` from `["space", slug]` to `["spaceAndTracks", slug]` to eliminate the collision.

### Long-term Solution
Created a centralized query keys system to prevent future collisions:

1. **Created `/src/lib/query-keys.ts`**
   - Centralized all React Query cache keys
   - Provides type-safe, collision-free query keys
   - Enables better cache management

2. **Updated affected files**:
   - `/src/routes/space/$slug/members/index.tsx`
   - `/src/hooks/api/use-sessions.ts`
   - `/src/hooks/api/use-space-members.ts`

3. **Created documentation**:
   - `/docs/QUERY_KEYS.md` - Complete guide on using query keys
   - `/docs/fixes/QUERY_KEY_COLLISION_FIX.md` - This document

## Files Changed

### Core Changes
- `src/lib/query-keys.ts` - New centralized query keys system
- `src/hooks/api/use-sessions.ts` - Updated to use centralized keys
- `src/hooks/api/use-space-members.ts` - Updated to use centralized keys
- `src/routes/space/$slug/members/index.tsx` - Updated to use centralized keys

### Documentation
- `docs/QUERY_KEYS.md` - Query keys usage guide
- `docs/fixes/QUERY_KEY_COLLISION_FIX.md` - This fix summary

## Benefits

1. **No More Collisions**: Centralized keys prevent duplicate keys with different data shapes
2. **Type Safety**: TypeScript ensures query keys are used correctly
3. **Easier Maintenance**: All keys in one place makes refactoring easier
4. **Better Cache Control**: Hierarchical key structure enables partial invalidation
5. **Self-Documenting**: Key functions clearly describe what data they fetch

## Migration Path

For developers working on other parts of the codebase:

1. Import query keys: `import { queryKeys } from '@/lib/query-keys'`
2. Replace hard-coded keys with centralized ones
3. Update any related invalidation calls
4. See `/docs/QUERY_KEYS.md` for detailed examples

## Example Migration

### Before
```typescript
const { data: space } = useQuery({
  queryKey: ['space', slug],
  queryFn: () => getSpaceBySlug(slug),
})

queryClient.invalidateQueries({ queryKey: ['space', slug] })
```

### After
```typescript
import { queryKeys } from '@/lib/query-keys'

const { data: space } = useQuery({
  queryKey: queryKeys.spaces.bySlug(slug),
  queryFn: () => getSpaceBySlug(slug),
})

queryClient.invalidateQueries({
  queryKey: queryKeys.spaces.bySlug(slug)
})
```

## Testing

1. Navigate to `/space/{slug}/members`
2. Verify the "Sync GitHub Permissions" button is enabled (if space has `github_org_id`)
3. Click the button to test synchronization
4. Verify no TypeScript errors: `npm run build`
5. Check React Query DevTools to confirm unique cache keys

## Prevention

To prevent similar issues in the future:

1. **Always use centralized query keys** from `/src/lib/query-keys.ts`
2. **Never hard-code query keys** in components or hooks
3. **Add new keys to the central file** when creating new queries
4. **Review cache keys** during code reviews
5. **Use React Query DevTools** to inspect cache structure

## Related Issues

This fix resolves:
- Sync GitHub Permissions button being incorrectly disabled
- Potential cache inconsistencies across the application
- Difficulty tracking and managing query keys

## Additional Notes

The centralized query keys system follows React Query best practices and patterns from the [official documentation](https://tanstack.com/query/latest/docs/react/guides/query-keys).

The hierarchical structure allows for efficient cache invalidation:
- Invalidate all space queries: `queryKeys.spaces.all`
- Invalidate space lists: `queryKeys.spaces.lists()`
- Invalidate specific space: `queryKeys.spaces.bySlug(slug)`
