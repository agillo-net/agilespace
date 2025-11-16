# Changelog

## ⚠️ ACTION REQUIRED

**All team members must sync their GitHub permissions:**

1. Visit the members page: `/space/agillo-net/members`
2. Click on "Sync GitHub Permissions"
3. This ensures your account has the correct permissions to access issues and repositories

**Why this is important:** Without syncing, you may not be able to access certain issues or repositories that you should have access to. This is a quick one-time action that ensures everything works smoothly.

---

## Recent Updates (Latest Changes)

**Last Updated:** November 11, 2025
**Commit:** `c9a75a4dbb2d891c1faa0083e6cf7c7e14999cf3`

### Bug Fixes

#### Session Statistics Display Fixed
**What was wrong:** Dashboard and search results were showing 0 sessions and 0 hours even when sessions existed.

**What's fixed:**
- Dashboard statistics now correctly display total active and closed sessions
- Search results now show accurate session counts and time duration for tracked issues
- Command palette search results now display correct session information

**Impact:** You can now trust the session statistics shown throughout the application.

---

#### Track Search Issues for Large Spaces (>1000 Tracks)
**What was wrong:** In spaces with more than 1000 tracks, the system would:
- Show a "+" button to create a new track even when the track already existed
- Display 0 sessions and 0 hours for existing tracks
- Fail with errors when trying to start sessions on already-tracked issues

**What's fixed:**
- Search results now correctly show existing tracks even when there are thousands of tracks
- Session counts and durations display accurately for all tracks
- The system properly finds existing tracks before creating new ones

**Impact:** Spaces with large numbers of tracks now work reliably. No more duplicate track errors or incorrect statistics.

---

#### Duplicate Track Creation Error Fixed
**What was wrong:** When trying to create a track or start a session on an issue that already had a track beyond the first 1000 rows, the system would crash with a "duplicate key error".

**What's fixed:**
- The system now searches the entire database before creating new tracks
- Existing tracks are properly detected regardless of how many tracks exist
- No more duplicate key errors when starting sessions

**Impact:** You can now reliably start sessions on any issue without worrying about errors.

---

### New Features

#### Database Backup and Migration Tools
**What's new:**
- Added automated database backup script for safe migrations
- New command available: `npm run db:backup:remote`
- Created comprehensive migration guides and documentation
- Added support for new database tables (notifications, time-off, etc.)

**Impact:** Development team has better tools for managing database changes safely. Production deployments are now more reliable.

---

## Summary

These updates focus on reliability and data accuracy:

- **Better Statistics**: All session counts and time tracking now display correctly
- **Improved Scalability**: The app now handles spaces with thousands of tracks without issues
- **No More Errors**: Fixed duplicate track creation errors that were blocking workflows
- **Better DevOps**: Enhanced database management tools for safer deployments

All changes are live in the vite branch and ready for testing.
