# Testing GitHub Repository Permissions

## Overview
This guide walks you through testing the newly implemented GitHub repository permissions system.

---

## Prerequisites

1. ✅ Profile table is set up and populated
2. ✅ GitHub OAuth is configured
3. ✅ At least one space with a GitHub organization linked
4. ✅ Local Supabase is running

---

## Test Scenario 1: Sync Permissions

### Steps:
1. **Navigate to Members Page**
   - Go to `http://localhost:5174/space/{your-space-slug}/members`

2. **Click "Sync GitHub Permissions" Button**
   - Look for the button in the top-right corner next to the time filter
   - Button should show a loading spinner while syncing

3. **Verify Success Toast**
   - Should see: "Successfully synced X repositories!"

4. **Check Database**
   ```bash
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
     -c "SELECT repo_owner, repo_name, permission_level FROM github_repo_permissions WHERE user_id = 'your-user-id';"
   ```

   You should see rows for each repository you have access to.

### Expected Results:
- ✅ Toast notification appears
- ✅ Database has permission records
- ✅ Each repo has a permission level (read, write, admin, etc.)

---

## Test Scenario 2: Filter Issues in Command Palette

### Steps:
1. **Sync Permissions First** (if not already done)

2. **Open Command Palette**
   - Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)

3. **Search for Issues**
   - Type any keyword to search for issues
   - Wait for results to load

4. **Verify Filtered Results**
   - Only issues from repos you have access to should appear
   - Issues from repos you don't have access to should be hidden

### Test with Limited Access:
To test filtering, you can:
1. Create a test GitHub user with limited repo access
2. Sync permissions
3. Search for issues - should only see accessible ones

### Expected Results:
- ✅ Command palette shows only accessible issues
- ✅ Issues from restricted repos are filtered out
- ✅ No errors in console

---

## Test Scenario 3: Track Creation with Permission Check

### Steps:
1. **Try Creating Track for Accessible Repo**
   - Open command palette (`Cmd+K`)
   - Search for an issue from a repo you have access to
   - Click to start tracking
   - Should succeed ✅

2. **Try Creating Track for Inaccessible Repo** (Manual Test)
   ```bash
   # In browser console, try to create a track for a repo you don't have access to
   # This simulates attempting to bypass the UI
   ```

### Expected Results:
- ✅ Track creation succeeds for accessible repos
- ✅ Track creation fails for inaccessible repos with error message
- ✅ Error message: "You don't have access to repository..."

---

## Test Scenario 4: Verify Database Functions

### Test `user_has_repo_access` Function:
```sql
-- Check if you have access to a specific repo
SELECT user_has_repo_access(
  'your-user-id'::uuid,
  'your-space-id'::uuid,
  'repo-owner',
  'repo-name',
  'read'
);
```

Should return `true` if you have access, `false` otherwise.

### Test `get_user_accessible_repos` Function:
```sql
-- Get all repos you can access
SELECT * FROM get_user_accessible_repos(
  'your-user-id'::uuid,
  'your-space-id'::uuid,
  'read'
);
```

Should return a list of accessible repositories.

---

## Test Scenario 5: Profile Data Display

### Steps:
1. **Navigate to Any Space**
   - Go to any space you're a member of

2. **Check Sidebar**
   - Look at the bottom-left user profile section
   - Should show:
     - ✅ Your full name (from GitHub)
     - ✅ Your avatar (from GitHub)
     - ✅ Your email

3. **Verify Profile Data**
   ```sql
   SELECT * FROM profiles WHERE id = 'your-user-id';
   ```

   Should show:
   - `full_name`: Your GitHub name
   - `github_username`: Your GitHub username
   - `avatar_url`: Your GitHub avatar URL
   - `github_id`: Your GitHub user ID

---

## Common Issues & Solutions

### Issue: No Permissions Synced

**Symptoms:**
- Sync button completes but no repositories appear
- Database table is empty

**Solutions:**
1. Check GitHub token has correct scopes:
   ```
   Required scopes: repo, read:user, user:email, read:org
   ```

2. Verify space has `github_org_id` set:
   ```sql
   SELECT id, name, github_org_id FROM spaces;
   ```

3. Check browser console for errors

### Issue: All Issues Hidden in Command Palette

**Symptoms:**
- No issues appear when searching
- Previously worked before permission system

**Solutions:**
1. Sync permissions using the "Sync GitHub Permissions" button
2. Check if you have any accessible repos:
   ```sql
   SELECT COUNT(*) FROM github_repo_permissions
   WHERE user_id = 'your-user-id' AND permission_level != 'none';
   ```

3. If count is 0, you may need to request access to repos in GitHub

### Issue: Profile Shows "Unknown User"

**Symptoms:**
- Sidebar shows "Unknown User" or "Loading..."
- Avatar is missing

**Solutions:**
1. Check if profile exists:
   ```sql
   SELECT * FROM profiles WHERE id = 'your-user-id';
   ```

2. If no profile, manually trigger sync:
   - Log out and log back in
   - Profile should be auto-created

3. Check if triggers are enabled:
   ```sql
   SELECT tgname, tgenabled FROM pg_trigger
   WHERE tgname IN ('on_auth_user_created', 'on_auth_user_updated');
   ```

---

## Manual Testing Checklist

Use this checklist to ensure everything works:

### Database Setup
- [ ] `github_repo_permissions` table exists
- [ ] `user_has_repo_access` function exists
- [ ] `get_user_accessible_repos` function exists
- [ ] Indexes are created
- [ ] Triggers are enabled

### UI Integration
- [ ] "Sync GitHub Permissions" button appears on Members page
- [ ] Button shows loading state when syncing
- [ ] Success/error toasts appear after sync
- [ ] Profile data displays correctly in sidebar

### Permissions Filtering
- [ ] Command palette filters issues by accessible repos
- [ ] Only accessible issues appear in search results
- [ ] Track creation fails for inaccessible repos
- [ ] Error message is clear and helpful

### Data Integrity
- [ ] Permissions are stored in database after sync
- [ ] Permission levels are correct (read, write, admin, etc.)
- [ ] `last_synced_at` timestamp is updated
- [ ] Unique constraint prevents duplicates

---

## Performance Testing

### Test Large Organizations

1. **Sync large org** (100+ repos)
   - Should complete within 30 seconds
   - No timeout errors
   - All repos synced

2. **Filter large issue list**
   - Command palette should filter quickly
   - No noticeable lag

3. **Check query performance**
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM github_repo_permissions
   WHERE user_id = 'your-user-id' AND space_id = 'space-id';
   ```

   Should use indexes (not seq scan).

---

## Security Testing

### Test Permission Boundaries

1. **Attempt to access restricted repo**
   - Try to create track for repo you don't have access to
   - Should be blocked with clear error message

2. **Verify RLS policies** (if applicable)
   ```sql
   -- Check RLS is enabled
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE tablename = 'github_repo_permissions';
   ```

3. **Test different permission levels**
   - User with `read` access can track issues
   - User with `none` access cannot track issues

---

## Integration Testing

### End-to-End Flow

1. **New User Joins Space**
   - User signs up with GitHub
   - Profile is auto-created ✅
   - User joins a space

2. **Admin Syncs Permissions**
   - Admin clicks "Sync GitHub Permissions"
   - All members' permissions are synced ✅

3. **User Searches for Issues**
   - User opens command palette
   - Searches for issues
   - Only sees accessible issues ✅

4. **User Starts Tracking**
   - User clicks on an issue
   - Track is created successfully ✅
   - Session starts

---

## Automated Testing (Optional)

You can add these tests to your test suite:

```typescript
describe('GitHub Repo Permissions', () => {
  it('should sync permissions from GitHub', async () => {
    // Test syncRepoPermissions function
  });

  it('should filter issues by accessible repos', async () => {
    // Test filtering logic
  });

  it('should prevent track creation for inaccessible repos', async () => {
    // Test permission check in createTrack
  });

  it('should check repo access correctly', async () => {
    // Test checkUserRepoAccess function
  });
});
```

---

## Summary

After completing all tests, you should have:

✅ **Database Layer**
- Permissions stored correctly
- Helper functions working
- Indexes optimized

✅ **UI Layer**
- Sync button functional
- Profile data displayed
- Issues filtered correctly

✅ **Security Layer**
- Permission checks enforced
- Unauthorized access blocked
- Clear error messages

✅ **Performance**
- Fast permission checks
- Efficient filtering
- No UI lag

Your GitHub repository permissions system is now fully integrated and tested! 🎉
