# GitHub Repository Permissions System

## Overview

This guide covers the GitHub repository permissions system that tracks which users have access to which repositories within your spaces. This prevents unauthorized session tracking and filters issues based on user permissions.

---

## What Was Implemented

### 1. **Database Schema**
- **File**: `supabase/schemas/09_github_repo_permissions.sql`
- **Table**: `github_repo_permissions`

**Schema:**
```sql
github_repo_permissions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  space_id uuid REFERENCES spaces(id),
  repo_owner text NOT NULL,
  repo_name text NOT NULL,
  permission_level text CHECK (permission_level IN ('none', 'read', 'triage', 'write', 'maintain', 'admin')),
  last_synced_at timestamp,
  created_at timestamp,
  UNIQUE(user_id, space_id, repo_owner, repo_name)
)
```

**Indexes:**
- `idx_github_repo_permissions_user_id` - Fast lookups by user
- `idx_github_repo_permissions_space_id` - Fast lookups by space
- `idx_github_repo_permissions_repo` - Fast lookups by repo
- `idx_github_repo_permissions_lookup` - Composite index for permission checks

**Helper Functions:**
1. `user_has_repo_access(user_id, space_id, repo_owner, repo_name, min_permission)` - Returns boolean
2. `get_user_accessible_repos(user_id, space_id, min_permission)` - Returns list of accessible repos

### 2. **GitHub API Integration**
- **File**: `src/lib/github/queries.ts`

**New Functions:**
- `getUserRepoPermission(owner, repo)` - Get user's permission for a specific repo
- `getOrgReposWithPermissions(org)` - Get all org repos with user's permission levels

### 3. **Supabase Mutations**
- **File**: `src/lib/supabase/mutations.ts`

**Functions:**
- `syncRepoPermissions(spaceId, repos)` - Sync permissions from GitHub to database
- `checkUserRepoAccess(spaceId, repoOwner, repoName, minPermission)` - Check if user has access
- `getUserAccessibleRepos(spaceId, minPermission)` - Get all accessible repos for user

### 4. **Supabase Queries**
- **File**: `src/lib/supabase/queries.ts`

**Functions:**
- `getRepoPermissions(spaceId)` - Get all permissions for user in a space
- `getRepoPermission(spaceId, repoOwner, repoName)` - Get permission for specific repo

### 5. **React Hooks**
- **File**: `src/hooks/api/use-repo-permissions.ts`

**Hooks:**
- `useRepoPermissions(spaceId)` - Fetch all permissions
- `useRepoPermission(spaceId, repoOwner, repoName)` - Fetch single permission
- `useCheckRepoAccess(spaceId, repoOwner, repoName, minPermission)` - Check access (RPC)
- `useAccessibleRepos(spaceId, minPermission)` - Get accessible repos (RPC)
- `useSyncRepoPermissions(spaceId)` - Sync permissions from GitHub

---

## How It Works

### Permission Flow

```
1. User joins a space
   ↓
2. Admin triggers permission sync
   ↓
3. System fetches repos from GitHub API
   ↓
4. For each repo, fetch user's permission level
   ↓
5. Store permissions in github_repo_permissions table
   ↓
6. User can only track sessions on repos they have access to
```

### Permission Levels

GitHub has 6 permission levels (ranked from lowest to highest):

| Level | Description | Can Track Issues? |
|-------|-------------|-------------------|
| `none` | No access | ❌ No |
| `read` | Read-only | ✅ Yes |
| `triage` | Can manage issues | ✅ Yes |
| `write` | Can push code | ✅ Yes |
| `maintain` | Can manage repo | ✅ Yes |
| `admin` | Full control | ✅ Yes |

---

## Usage Examples

### 1. Sync Permissions When User Joins Space

```tsx
import { useSyncRepoPermissions } from "@/hooks/api/use-repo-permissions";

function SpaceMemberOnboarding({ space }) {
  const syncPermissions = useSyncRepoPermissions(space.id);

  const handleSyncPermissions = async () => {
    try {
      await syncPermissions.mutateAsync(space.github_org_id);
      toast.success("Permissions synced successfully!");
    } catch (error) {
      toast.error("Failed to sync permissions");
    }
  };

  return (
    <button onClick={handleSyncPermissions} disabled={syncPermissions.isPending}>
      {syncPermissions.isPending ? "Syncing..." : "Sync GitHub Permissions"}
    </button>
  );
}
```

### 2. Check If User Can Access a Repo

```tsx
import { useCheckRepoAccess } from "@/hooks/api/use-repo-permissions";

function TrackIssueButton({ spaceId, repoOwner, repoName }) {
  const { data: hasAccess, isLoading } = useCheckRepoAccess(
    spaceId,
    repoOwner,
    repoName,
    "read" // minimum permission required
  );

  if (isLoading) return <span>Checking access...</span>;

  if (!hasAccess) {
    return <span>You don't have access to this repo</span>;
  }

  return <button>Start Tracking</button>;
}
```

### 3. Filter Issues by User's Accessible Repos

```tsx
import { useAccessibleRepos } from "@/hooks/api/use-repo-permissions";

function IssuesList({ spaceId, allIssues }) {
  const { data: accessibleRepos, isLoading } = useAccessibleRepos(spaceId, "read");

  if (isLoading) return <div>Loading permissions...</div>;

  // Filter issues to only show ones from repos user can access
  const filteredIssues = allIssues.filter((issue) => {
    return accessibleRepos?.some(
      (repo) =>
        repo.repo_owner === issue.repository.owner &&
        repo.repo_name === issue.repository.name
    );
  });

  return (
    <div>
      {filteredIssues.map((issue) => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}
```

### 4. Display User's Permissions

```tsx
import { useRepoPermissions } from "@/hooks/api/use-repo-permissions";

function UserPermissionsPage({ spaceId }) {
  const { data: permissions, isLoading } = useRepoPermissions(spaceId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Your Repository Permissions</h2>
      <table>
        <thead>
          <tr>
            <th>Repository</th>
            <th>Permission Level</th>
            <th>Last Synced</th>
          </tr>
        </thead>
        <tbody>
          {permissions?.map((perm) => (
            <tr key={perm.id}>
              <td>{perm.repo_owner}/{perm.repo_name}</td>
              <td>{perm.permission_level}</td>
              <td>{new Date(perm.last_synced_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 5. Prevent Unauthorized Session Creation

```tsx
import { checkUserRepoAccess } from "@/lib/supabase/mutations";

async function createTrack(spaceId, repoOwner, repoName, issueNumber) {
  // Check if user has access before creating track
  const hasAccess = await checkUserRepoAccess(spaceId, repoOwner, repoName, "read");

  if (!hasAccess) {
    throw new Error("You don't have access to this repository");
  }

  // Create the track
  // ... rest of track creation logic
}
```

---

## Database Functions Usage

### Check User Access (SQL)

```sql
-- Check if user has at least read access
SELECT user_has_repo_access(
  'user-uuid',
  'space-uuid',
  'github-username',
  'repo-name',
  'read'
);
```

### Get Accessible Repos (SQL)

```sql
-- Get all repos user can read
SELECT * FROM get_user_accessible_repos(
  'user-uuid',
  'space-uuid',
  'read'
);
```

---

## Best Practices

### 1. Sync Permissions Regularly

Permissions should be synced:
- ✅ When a user first joins a space
- ✅ Periodically (e.g., daily) via cron job
- ✅ When a user reports access issues
- ✅ After org membership changes

### 2. Cache Permission Checks

The hooks use React Query with 5-minute stale time:
```typescript
staleTime: 1000 * 60 * 5 // 5 minutes
```

This reduces API calls while keeping data relatively fresh.

### 3. Handle Permission Errors Gracefully

```tsx
try {
  await createTrack(...);
} catch (error) {
  if (error.message.includes("don't have access")) {
    toast.error("You need access to this repo. Contact your admin.");
  } else {
    toast.error("Failed to create track");
  }
}
```

### 4. Show Permission Badges

```tsx
function RepoPermissionBadge({ permission }) {
  const colors = {
    none: "gray",
    read: "blue",
    triage: "green",
    write: "yellow",
    maintain: "orange",
    admin: "red",
  };

  return <Badge color={colors[permission]}>{permission}</Badge>;
}
```

---

## Integration Points

### Where to Add Permission Checks

1. **Issue Search Results** - Filter by accessible repos
2. **Track Creation** - Validate before creating
3. **Session Creation** - Validate before starting timer
4. **Command Palette** - Only show accessible issues
5. **Issue Details** - Show access level badge
6. **Space Members Page** - Show sync permissions button

---

## Testing

### Manual Testing Steps

1. **Setup Test User with Limited Access**
   ```bash
   # In GitHub, create a user with read access to only some repos
   ```

2. **Sync Permissions**
   ```tsx
   // In your app, trigger sync
   await syncPermissions.mutateAsync(space.github_org_id);
   ```

3. **Verify Database**
   ```sql
   SELECT * FROM github_repo_permissions
   WHERE user_id = 'test-user-uuid';
   ```

4. **Test Permission Checks**
   ```tsx
   // Try to access a repo user doesn't have permission for
   const hasAccess = await checkUserRepoAccess(...);
   // Should return false
   ```

5. **Test Issue Filtering**
   - Search for issues
   - Verify only issues from accessible repos are shown

---

## Troubleshooting

### Issue: Permissions not syncing

**Check:**
```sql
-- Check if permissions exist
SELECT * FROM github_repo_permissions WHERE space_id = 'your-space-id';

-- Check last sync time
SELECT
  repo_owner,
  repo_name,
  last_synced_at
FROM github_repo_permissions
WHERE space_id = 'your-space-id'
ORDER BY last_synced_at DESC;
```

**Solution:**
- Verify GitHub token has correct scopes (`repo`, `read:org`)
- Check GitHub API rate limits
- Manually trigger sync

### Issue: User can't access repo they should have access to

**Check:**
```sql
-- Check permission level
SELECT permission_level
FROM github_repo_permissions
WHERE user_id = 'user-uuid'
  AND space_id = 'space-uuid'
  AND repo_owner = 'owner'
  AND repo_name = 'repo';
```

**Solution:**
1. Verify GitHub membership
2. Re-sync permissions
3. Check if permission was recently changed in GitHub

### Issue: Performance issues with permission checks

**Solution:**
- Use the RPC functions (`user_has_repo_access`) instead of querying the table directly
- Ensure indexes are created (they should be from the schema)
- Consider caching frequently checked permissions

---

## Security Considerations

### 1. Permission Levels
- Always use `read` as minimum permission for tracking issues
- Use `write` for operations that modify code/issues

### 2. Data Privacy
- Permissions are user-scoped and space-scoped
- Users can only see their own permissions
- Admins can sync permissions but can't modify them directly

### 3. Sync Strategy
- Use authenticated GitHub API calls
- Store permission snapshots (don't real-time check on every request)
- Periodic re-sync to catch permission changes

---

## Future Enhancements

Potential improvements:

1. **Webhook Integration** - Auto-sync when GitHub permissions change
2. **Permission History** - Track permission changes over time
3. **Bulk Sync** - Sync permissions for all space members at once
4. **Permission Groups** - Group repos by permission level
5. **Access Requests** - Allow users to request access to repos
6. **Audit Logs** - Log all permission checks and changes
7. **Permission Alerts** - Notify users when their access changes

---

## Related Files

- `supabase/schemas/09_github_repo_permissions.sql` - Database schema
- `src/lib/github/queries.ts` - GitHub API integration
- `src/lib/supabase/mutations.ts` - Permission mutations
- `src/lib/supabase/queries.ts` - Permission queries
- `src/hooks/api/use-repo-permissions.ts` - React hooks

---

## Summary

✅ **Database table** for storing repo permissions
✅ **GitHub API integration** to fetch permissions
✅ **Helper functions** for checking access
✅ **React hooks** for easy integration
✅ **Permission filtering** for issues and tracks
✅ **Security** through database-level checks

Your users can now only track issues on repositories they have access to!
