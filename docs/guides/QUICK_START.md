# Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Step 1: Verify Profile System (30 seconds)

1. Log in to your app
2. Look at the bottom-left sidebar
3. ✅ You should see your GitHub name and avatar

**If you see "Unknown User":**
```bash
# Check database
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT * FROM profiles WHERE id = (SELECT id FROM auth.users LIMIT 1);"

# If empty, run triggers
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -f supabase/schemas/01_profiles_trigger.sql

# Log out and log back in
```

---

### Step 2: Sync GitHub Permissions (1 minute)

1. Navigate to: `/space/{your-space-slug}/members`
2. Click **"Sync GitHub Permissions"** button (top-right)
3. Wait for success toast: "Successfully synced X repositories!"

**Verify it worked:**
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT COUNT(*) FROM github_repo_permissions;"
```

Should return a count > 0.

---

### Step 3: Test Issue Filtering (1 minute)

1. Press `Cmd+K` (or `Ctrl+K`) to open command palette
2. Type any search term (e.g., "bug")
3. ✅ You should only see issues from repos you have access to

**Test permission check:**
Try to track an issue. It should:
- ✅ Succeed if you have access
- ❌ Fail with error message if you don't have access

---

## 📖 Where to Go Next

### Learn More:
- **IMPLEMENTATION_COMPLETE.md** - Full overview
- **GITHUB_REPO_PERMISSIONS_GUIDE.md** - Detailed guide with examples
- **TESTING_REPO_PERMISSIONS.md** - Comprehensive testing guide

### Integration Examples:
- **src/examples/repo-permissions-example.tsx** - 7 ready-to-use components

### Troubleshooting:
See **TESTING_REPO_PERMISSIONS.md** → "Common Issues & Solutions"

---

## 🎯 Quick Commands

### Database Queries

```bash
# Check profiles
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT id, full_name, github_username, avatar_url FROM profiles;"

# Check permissions
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT repo_owner, repo_name, permission_level FROM github_repo_permissions LIMIT 10;"

# Check your accessible repos
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT * FROM get_user_accessible_repos(
    (SELECT id FROM auth.users LIMIT 1)::uuid,
    (SELECT id FROM spaces LIMIT 1)::uuid,
    'read'
  );"

# Check if you have access to specific repo
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT user_has_repo_access(
    (SELECT id FROM auth.users LIMIT 1)::uuid,
    (SELECT id FROM spaces LIMIT 1)::uuid,
    'owner-name',
    'repo-name',
    'read'
  );"
```

---

## ✅ Verification Checklist

Quick checklist to ensure everything works:

- [ ] Profile shows correct name in sidebar
- [ ] Avatar displays from GitHub
- [ ] "Sync GitHub Permissions" button exists on Members page
- [ ] Clicking sync button shows loading state
- [ ] Success toast appears after sync
- [ ] Database has permission records
- [ ] Command palette filters issues by accessible repos
- [ ] Track creation fails for inaccessible repos with error message

---

## 🆘 Quick Fixes

### Profile not showing?
```bash
# Re-apply triggers
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -f supabase/schemas/01_profiles_trigger.sql

# Log out and log back in
```

### Permissions not syncing?
1. Check space has `github_org_id` set
2. Verify GitHub token has correct scopes: `repo, read:user, user:email, read:org`
3. Check browser console for errors

### All issues hidden?
```bash
# Check if you have any permissions
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT COUNT(*) FROM github_repo_permissions WHERE permission_level != 'none';"
```

If count is 0, sync permissions again.

---

That's it! You're ready to use the new system. 🎉

For detailed information, see **IMPLEMENTATION_COMPLETE.md**.
