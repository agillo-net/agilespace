# Authentication Flow Fix - White Screen on Refresh

## Problem

When refreshing any authenticated page (like `/spaces` or `/space/{slug}`), the app showed a white screen instead of either loading the page or redirecting to login.

## Root Cause

The authentication check was happening **after** the route started loading, causing a race condition:

1. User refreshes page
2. Router starts loading (loader runs)
3. Loader tries to fetch data (requires GitHub token)
4. GitHub client finds no token → tries to redirect
5. **White screen appears during the redirect race**

## Solution

Implemented proper route guards using TanStack Router's `beforeLoad` lifecycle:

### 1. Created Auth Guard Helper

**File**: `src/lib/auth/guards.ts`

```typescript
export async function requireAuth() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data?.session || !data.session.provider_token) {
    throw redirect({ to: '/login', replace: true });
  }

  return { session: data.session, user: data.session.user };
}
```

### 2. Updated Routes with beforeLoad

**Files Updated:**
- `src/routes/spaces/route.tsx`
- `src/routes/space/$slug/route.tsx`

**Before:**
```typescript
export const Route = createFileRoute("/spaces")({
  loader: async () => {
    // Auth check happens HERE (too late!)
    const userOrgs = await getUserOrgs(); // Might fail
  }
});
```

**After:**
```typescript
export const Route = createFileRoute("/spaces")({
  beforeLoad: requireAuth, // ✅ Auth check happens FIRST
  loader: async () => {
    const userOrgs = await getUserOrgs(); // Safe now
  }
});
```

### 3. Fixed GitHub Client Error Handling

**File**: `src/lib/github/client.ts`

**Before:**
- Returned `null` when no token
- Tried to redirect from within the client
- Caused race conditions

**After:**
- Throws clear error messages
- Lets route guards handle redirects
- No race conditions

### 4. Added Root Error Boundary

**File**: `src/routes/__root.tsx`

Added a user-friendly error boundary that catches any unhandled errors and shows:
- Error message
- Technical details (expandable)
- "Refresh Page" button
- "Go to Login" button

---

## Flow Diagram

### Before (Broken):
```
Page Refresh
  ↓
Router starts
  ↓
Loader runs
  ↓
Fetch GitHub data → No token!
  ↓
Try to redirect...
  ↓
WHITE SCREEN (race condition)
```

### After (Fixed):
```
Page Refresh
  ↓
Router starts
  ↓
beforeLoad: Check auth ← THIS RUNS FIRST
  ↓
  ├─ Has token? → Continue to loader
  └─ No token? → Redirect to /login ✅
```

---

## Testing Checklist

### ✅ Scenarios That Now Work

1. **Fresh login**
   - Go to `/login`
   - Sign in with GitHub
   - Redirects to `/spaces` ✅

2. **Navigate while logged in**
   - Click between pages
   - Everything works ✅

3. **Refresh authenticated page**
   - On `/spaces` → refresh
   - On `/space/my-space` → refresh
   - On `/space/my-space/time-off` → refresh
   - All work or redirect to login ✅

4. **Session expired**
   - Token expires
   - Refresh any page
   - Redirects to `/login` ✅

5. **No session**
   - Clear cookies
   - Try to access `/spaces`
   - Redirects to `/login` ✅

---

## Files Changed

### New Files
- `src/lib/auth/guards.ts` - Authentication guards

### Modified Files
- `src/lib/github/client.ts` - Better error handling
- `src/routes/__root.tsx` - Error boundary
- `src/routes/spaces/route.tsx` - Added beforeLoad guard
- `src/routes/space/$slug/route.tsx` - Added beforeLoad guard

---

## How beforeLoad Works

`beforeLoad` is a TanStack Router lifecycle hook that runs **before** the route loader:

```typescript
export const Route = createFileRoute("/my-route")({
  // 1️⃣ Runs FIRST
  beforeLoad: async () => {
    // Check auth, permissions, etc.
    // Can throw redirect() to change route
  },

  // 2️⃣ Runs SECOND (only if beforeLoad succeeds)
  loader: async () => {
    // Safe to fetch data here
  },

  // 3️⃣ Renders LAST (only if loader succeeds)
  component: MyComponent
});
```

**Benefits:**
- ✅ Guards run before any data fetching
- ✅ Clean separation of concerns
- ✅ No race conditions
- ✅ Reusable guards across routes

---

## Auth Guard Usage

### Protect a route:

```typescript
import { requireAuth } from "@/lib/auth/guards";

export const Route = createFileRoute("/protected-route")({
  beforeLoad: requireAuth,
  // ... rest of route
});
```

### Check auth without redirecting:

```typescript
import { checkAuth } from "@/lib/auth/guards";

const { isAuthenticated, user } = await checkAuth();

if (isAuthenticated) {
  // Show authenticated content
} else {
  // Show login prompt
}
```

---

## Future Improvements

1. **Add loading states** - Show spinner during auth check
2. **Remember intended route** - Redirect back after login
3. **Token refresh** - Auto-refresh expired tokens
4. **Offline detection** - Better handling of network issues
5. **Auth state caching** - Reduce auth checks

---

## Debugging Tips

### Check browser console for:
```
✅ "No active session found"
✅ "No GitHub provider token found"
✅ "Session error: ..."
```

### Check network tab:
- Look for `/auth/session` calls
- Check if redirects are happening
- Verify token is in session

### Force re-authentication:
```javascript
// In browser console
await (await import('@/lib/supabase/client')).getSupabaseClient().auth.signOut();
window.location.href = '/login';
```

---

## Summary

✅ **White screen on refresh** - FIXED
✅ **Clean redirects to login** - WORKING
✅ **Proper error handling** - IMPLEMENTED
✅ **Reusable auth guards** - CREATED
✅ **Better user experience** - ACHIEVED

The authentication flow now properly checks auth status **before** loading any route data, preventing white screens and race conditions.
