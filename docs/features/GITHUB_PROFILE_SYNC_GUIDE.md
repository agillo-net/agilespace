# GitHub Profile Auto-Sync Setup Guide

## Overview

This guide covers the automatic synchronization of GitHub user data to your application's profiles table when users log in with GitHub OAuth.

## What Was Implemented

### 1. **Enhanced Profile Creation/Update Function**
- **File**: `src/lib/supabase/mutations.ts`
- **Function**: `getOrCreateProfile()`

**Features:**
- ✅ Creates profile on first login
- ✅ Updates existing profile with latest GitHub data on each login
- ✅ Syncs: full name, avatar, GitHub username, GitHub ID
- ✅ Fallback handling for missing data
- ✅ Error handling with console logging

### 2. **Auth Provider Integration**
- **File**: `src/hooks/api/use-auth.tsx`

**Auto-sync triggers:**
- ✅ On initial session load (when app starts)
- ✅ On every GitHub sign-in
- ✅ Silent background sync (doesn't block UI)

### 3. **Database Triggers (Safety Net)**
- **File**: `supabase/schemas/01_profiles_trigger.sql`

**Triggers:**
1. **on_auth_user_created** - Creates profile automatically when user signs up
2. **on_auth_user_updated** - Updates profile when GitHub metadata changes

**Benefits:**
- Works even if frontend code fails
- Handles edge cases
- Server-side validation

---

## How It Works

### User Login Flow

```
1. User clicks "Login with GitHub"
   ↓
2. GitHub OAuth redirects back with user data
   ↓
3. Supabase creates/updates auth.users record
   ↓
4. Database trigger fires → Creates/updates profiles table
   ↓
5. Frontend AuthProvider loads session
   ↓
6. getOrCreateProfile() syncs latest GitHub data
   ↓
7. Profile is ready for use across the app
```

### Data Synced from GitHub

| Field | Source | Fallback |
|-------|--------|----------|
| `id` | `user.id` | (required) |
| `full_name` | `user_metadata.full_name` | GitHub username |
| `github_username` | `user_metadata.preferred_username` | (required) |
| `github_id` | `user_metadata.provider_id` | (required) |
| `avatar_url` | `user_metadata.avatar_url` | null |

---

## Setup Instructions

### Step 1: Apply Database Trigger

Run this SQL in your Supabase Dashboard (SQL Editor):

```bash
# Copy the trigger file to clipboard
cat supabase/schemas/01_profiles_trigger.sql | pbcopy
```

Then:
1. Go to Supabase Dashboard → **SQL Editor**
2. Paste and **Run** the SQL

Or via CLI:
```bash
psql YOUR_DATABASE_URL -f supabase/schemas/01_profiles_trigger.sql
```

### Step 2: Verify Setup

Check that triggers were created:

```sql
-- In Supabase SQL Editor
SELECT
  tgname as trigger_name,
  tgtype,
  proname as function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgname IN ('on_auth_user_created', 'on_auth_user_updated');
```

Expected result: 2 triggers should be listed.

### Step 3: Test the Integration

1. **Sign out** of your application (if logged in)
2. **Clear browser data** (optional, for clean test)
3. **Sign in with GitHub**
4. **Check the profiles table**:

```sql
SELECT
  id,
  full_name,
  github_username,
  avatar_url,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;
```

You should see your profile with:
- ✅ Full name from GitHub
- ✅ GitHub username
- ✅ Avatar URL
- ✅ GitHub ID

### Step 4: Test Profile Updates

1. **Update your GitHub profile** (change name or avatar)
2. **Sign out** and **sign in** again to the app
3. **Check the profiles table** - your data should be updated!

---

## Verification Checklist

Use this checklist to verify everything is working:

### Database Level
- [ ] `handle_new_user()` function exists
- [ ] `handle_user_metadata_update()` function exists
- [ ] `on_auth_user_created` trigger exists
- [ ] `on_auth_user_updated` trigger exists
- [ ] Triggers are enabled (not disabled)

### Frontend Level
- [ ] `getOrCreateProfile()` function updated in mutations.ts
- [ ] Auth provider imports `getOrCreateProfile`
- [ ] Profile sync on SIGNED_IN event
- [ ] Profile sync on initial session load
- [ ] No console errors during login

### Integration Test
- [ ] New user sign-up creates profile automatically
- [ ] Existing user sign-in updates profile
- [ ] Full name synced correctly
- [ ] Avatar URL synced correctly
- [ ] GitHub username synced correctly
- [ ] Profile appears in time off requests
- [ ] Profile appears in space members

---

## Troubleshooting

### Issue: Profile not created on signup

**Check:**
```sql
-- Check if trigger exists and is enabled
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check recent auth.users entries
SELECT id, email, raw_user_meta_data FROM auth.users ORDER BY created_at DESC LIMIT 5;
```

**Solution:**
- Ensure trigger SQL was run successfully
- Check Supabase logs for errors
- Verify GitHub OAuth scopes include user data

### Issue: Profile not updating on login

**Check browser console for errors:**
```
Failed to sync profile: [error details]
```

**Common causes:**
1. GitHub metadata missing/incomplete
2. Database permissions issue
3. Network error

**Solution:**
```sql
-- Manually trigger profile update
SELECT handle_user_metadata_update() FROM auth.users WHERE email = 'your@email.com';
```

### Issue: Avatar or name still showing old data

**Possible causes:**
1. Browser cache
2. Database cache
3. GitHub data hasn't refreshed

**Solution:**
1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Clear browser cache
3. Manually update:
```sql
UPDATE profiles SET
  full_name = 'New Name',
  avatar_url = 'https://avatars.githubusercontent.com/...'
WHERE github_username = 'your_username';
```

### Issue: "User metadata is incomplete" error

**This means GitHub didn't provide required data.**

**Check what GitHub sent:**
```sql
SELECT raw_user_meta_data FROM auth.users WHERE email = 'your@email.com';
```

**Ensure OAuth scopes are correct:**
```typescript
// In use-auth.tsx, verify scopes:
scopes: "repo,read:user,user:email,read:org"
```

---

## How Space Members Use Profiles

When a user joins a space, the `space_members` table references the `profiles` table:

```
space_members.user_id → auth.users.id → profiles.id
```

This means:
1. Profile is created/updated on login
2. When user joins a space, `space_members` references their profile
3. Time off requests and other features automatically show correct name/avatar

### Example Query

```sql
-- Get space members with their profile data
SELECT
  sm.id,
  sm.role,
  sm.nickname,
  p.full_name,
  p.avatar_url,
  p.github_username
FROM space_members sm
JOIN profiles p ON p.id = sm.user_id
WHERE sm.space_id = 'your-space-id';
```

---

## Benefits

### For Users
- ✅ Automatic profile setup - no manual data entry
- ✅ Always up-to-date info from GitHub
- ✅ Consistent identity across the app
- ✅ Profile updates automatically when they update GitHub

### For Developers
- ✅ No manual profile management code needed
- ✅ Single source of truth (GitHub)
- ✅ Automatic data sync
- ✅ Reliable fallbacks for missing data
- ✅ Database-level safety with triggers

### For Admins
- ✅ Accurate team member information
- ✅ Easy to identify users
- ✅ No orphaned or incomplete profiles
- ✅ Audit trail via created_at/updated_at

---

## Advanced: Debugging Profile Sync

### Enable Detailed Logging

Add to `use-auth.tsx`:

```typescript
if (event === "SIGNED_IN") {
  try {
    console.log("User metadata:", session.user.user_metadata);
    const profile = await getOrCreateProfile(session.user);
    console.log("Profile synced:", profile);
  } catch (error) {
    console.error("Failed to sync profile:", error);
  }
}
```

### Monitor Trigger Execution

```sql
-- Create a log table (optional)
CREATE TABLE profile_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add logging to trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profile_sync_log (user_id, action, metadata)
  VALUES (NEW.id, 'user_created', NEW.raw_user_meta_data);

  -- ... rest of function
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Related Files

- `src/hooks/api/use-auth.tsx` - Auth provider with profile sync
- `src/lib/supabase/mutations.ts` - getOrCreateProfile function
- `supabase/schemas/01_profiles.sql` - Profiles table schema
- `supabase/schemas/01_profiles_trigger.sql` - Auto-sync triggers
- `supabase/schemas/02_spaces.sql` - Space members table (references profiles)

---

## Future Enhancements

Potential improvements:

1. **Batch Profile Updates** - Update multiple profiles at once
2. **Profile Change History** - Track profile changes over time
3. **Email Verification** - Sync verified email status
4. **Custom Fields** - Allow users to add custom profile fields
5. **Profile Completion Score** - Show how complete a profile is
6. **Admin Profile Override** - Allow admins to manually edit profiles
7. **Webhook Notifications** - Notify when profile is created/updated

---

## Summary

✅ **Automatic profile creation** on GitHub sign-up
✅ **Automatic profile updates** on every login
✅ **Database triggers** as a safety net
✅ **Full GitHub data sync** (name, avatar, username)
✅ **Zero manual profile management** needed

Your users' profiles will always be up-to-date with their GitHub information!
