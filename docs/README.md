# AgileSpace Documentation

Welcome to the AgileSpace documentation! This directory contains comprehensive guides for setup, development, deployment, and feature implementation.

## 📚 Table of Contents

- [Quick Start](#quick-start)
- [Guides](#guides)
- [Database](#database)
- [Features](#features)
- [Development](#development)

---

## 🚀 Quick Start

**New to AgileSpace?** Start here:

1. **[Quick Start Guide](guides/QUICK_START.md)** - Get up and running in minutes
2. **[Migration Guide](MIGRATION_GUIDE.md)** - Migrate existing database to latest version
3. **[Deployment Guide](guides/DEPLOYMENT_GUIDE.md)** - Deploy to production

---

## 📖 Guides

### Setup & Configuration

| Guide | Description |
|-------|-------------|
| [Quick Start](guides/QUICK_START.md) | Complete setup guide for new developers |
| [Deployment Guide](guides/DEPLOYMENT_GUIDE.md) | Production deployment instructions |
| [Auth Fix Guide](guides/AUTH_FIX_GUIDE.md) | Troubleshooting authentication issues |

### Development

| Guide | Description |
|-------|-------------|
| [Migration Guide](MIGRATION_GUIDE.md) | Database migration step-by-step guide |
| [Implementation Summary](IMPLEMENTATION_SUMMARY.md) | Overview of all implemented features |
| [Implementation Complete](IMPLEMENTATION_COMPLETE.md) | Feature completion checklist |

---

## 🗄️ Database

### Schema Documentation

| Document | Description |
|----------|-------------|
| [Database Scripts Guide](database/DATABASE_SCRIPTS_GUIDE.md) | Complete guide to database management scripts |
| [Database Management Summary](database/DATABASE_MANAGEMENT_SUMMARY.md) | Quick reference for DB operations |
| [Roles & Permissions Design](../docs/ROLES_AND_PERMISSIONS_DESIGN.md) | Permission system architecture |

### Available Scripts

```bash
pnpm db:apply       # Apply database schemas
pnpm db:reset       # Reset database (⚠️ deletes data!)
pnpm db:seed        # Seed sample data
pnpm db:setup       # Reset + Apply + Seed
pnpm db:types       # Generate TypeScript types
pnpm db:combine     # Combine schemas into one file
```

### Schema Files

Located in `supabase/schemas/`:

1. **`01_profiles_trigger.sql`** - Profile creation trigger
2. **`01_profiles.sql`** - User profiles
3. **`02_spaces.sql`** - Workspaces/organizations
4. **`03_tracks.sql`** - Issue tracking
5. **`04_sessions.sql`** - Work sessions
6. **`05_tags.sql`** - Tags for categorization
7. **`06_permissions.sql`** - ⭐ Permission system
8. **`07_rls_policies.sql`** - ⭐ Row Level Security
9. **`08_time_off.sql`** - ⭐ Time off management
10. **`09_github_repo_permissions.sql`** - ⭐ GitHub repo access
11. **`10_notifications.sql`** - ⭐ Notification system

⭐ = New features requiring migration

---

## ✨ Features

### Permissions System

| Document | Description |
|----------|-------------|
| [Permissions Setup](features/PERMISSIONS_SETUP.md) | Permission system setup guide |
| [Setup Permissions](features/SETUP_PERMISSIONS.md) | Step-by-step permission configuration |
| [Permissions Applied Success](features/PERMISSIONS_APPLIED_SUCCESS.md) | Verification checklist |

**Quick Reference:**

```typescript
// Check permissions in code
import { usePermissions } from '@/hooks/api/use-permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

const { hasPermission } = usePermissions(spaceId);
const canManageMembers = hasPermission(PERMISSIONS.MEMBERS_INVITE);

// Use permission gates in UI
import { PermissionGate } from '@/components/permissions';

<PermissionGate permission={PERMISSIONS.MEMBERS_INVITE} spaceId={spaceId}>
  <Button>Invite Member</Button>
</PermissionGate>
```

### GitHub Integration

| Document | Description |
|----------|-------------|
| [GitHub Profile Sync](features/GITHUB_PROFILE_SYNC_GUIDE.md) | Sync user profiles from GitHub |
| [GitHub Repo Permissions](features/GITHUB_REPO_PERMISSIONS_GUIDE.md) | Track repository access levels |
| [Testing Repo Permissions](features/TESTING_REPO_PERMISSIONS.md) | Test GitHub repo permission sync |

**Features:**
- ✅ Automatic profile sync on login
- ✅ Repository permission tracking
- ✅ OAuth integration
- ✅ Organization membership sync

### Time Off Management

| Document | Description |
|----------|-------------|
| [Time Off Setup Guide](features/TIME_OFF_SETUP_GUIDE.md) | Complete time off system setup |

**Features:**
- ✅ Request time off (vacation, sick leave, etc.)
- ✅ Approval workflow (admin review)
- ✅ Team calendar view
- ✅ Conflict detection
- ✅ Business day calculations
- ✅ Automatic notifications

**Quick Usage:**

```typescript
// Request time off
import { useTimeOffRequests } from '@/hooks/api/use-time-off-requests';

const { createRequest } = useTimeOffRequests(spaceId);

await createRequest({
  type: 'vacation',
  start_date: '2025-02-01',
  end_date: '2025-02-07',
  reason: 'Family vacation'
});
```

### Notification System

| Document | Description |
|----------|-------------|
| [Notification System](features/NOTIFICATION_SYSTEM.md) | In-app notification setup & usage |

**Features:**
- ✅ Real-time notifications
- ✅ Notification preferences
- ✅ Auto-notifications for time off events
- ✅ Mark as read/unread
- ✅ Notification bell UI component

**Quick Usage:**

```typescript
// Use notifications
import { useNotifications } from '@/hooks/api/use-notifications';

const { notifications, unreadCount, markAsRead } = useNotifications();

// Show notification bell
import { NotificationBell } from '@/components/notifications';

<NotificationBell />
```

---

## 🛠️ Development

### Project Structure

```
agilespace/
├── docs/                          # 📚 Documentation
│   ├── database/                  # Database docs
│   ├── features/                  # Feature guides
│   ├── guides/                    # Setup & deployment
│   └── MIGRATION_GUIDE.md         # Migration instructions
├── src/
│   ├── components/                # React components
│   │   ├── notifications/         # Notification UI
│   │   ├── permissions/           # Permission gates
│   │   ├── time-off/              # Time off UI
│   │   └── ...
│   ├── hooks/
│   │   └── api/                   # Data fetching hooks
│   ├── lib/
│   │   ├── github/                # GitHub API client
│   │   ├── permissions/           # Permission utilities
│   │   ├── notifications/         # Notification queries
│   │   └── supabase/              # Supabase client
│   ├── routes/                    # TanStack Router routes
│   └── types/
│       └── database.types.ts      # Generated DB types
├── supabase/
│   ├── schemas/                   # Database schemas
│   ├── scripts/                   # Management scripts
│   └── migrations/                # Migration history
└── package.json
```

### Common Tasks

#### Adding a New Feature

1. **Design database schema** (if needed)
   ```bash
   # Create new schema file
   touch supabase/schemas/11_new_feature.sql
   ```

2. **Apply schema**
   ```bash
   pnpm db:apply 11
   ```

3. **Generate types**
   ```bash
   pnpm db:types
   ```

4. **Create queries/mutations**
   ```typescript
   // src/lib/new-feature/queries.ts
   export const getFeatureData = async () => { ... }
   ```

5. **Create hook**
   ```typescript
   // src/hooks/api/use-new-feature.ts
   export const useNewFeature = () => { ... }
   ```

6. **Build UI components**
   ```typescript
   // src/components/new-feature/
   ```

7. **Add route**
   ```typescript
   // src/routes/space/$slug/new-feature/index.tsx
   ```

8. **Document it!**
   ```bash
   # Add guide to docs/features/
   ```

#### Updating Database Schema

```bash
# 1. Create migration file
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_description.sql

# 2. Write migration SQL
# Add your ALTER TABLE, CREATE TABLE, etc.

# 3. Test locally
pnpm db:reset -- --force
pnpm db:apply

# 4. Update types
pnpm db:types

# 5. Commit
git add supabase/migrations/ src/types/database.types.ts
git commit -m "feat: add new database feature"
```

#### Working with Permissions

```typescript
// Define new permission in schema
INSERT INTO permissions (name, description, category) VALUES
  ('feature:action', 'Description', 'category');

// Assign to roles
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions WHERE name = 'feature:action';

// Use in code
import { PERMISSIONS } from '@/lib/permissions/constants';
import { PermissionGate } from '@/components/permissions';

<PermissionGate permission={PERMISSIONS.FEATURE_ACTION}>
  <YourComponent />
</PermissionGate>
```

---

## 🔍 Finding Documentation

### By Topic

| Topic | Documents |
|-------|-----------|
| **Getting Started** | [Quick Start](guides/QUICK_START.md) |
| **Database** | [DB Scripts](database/DATABASE_SCRIPTS_GUIDE.md), [Migration Guide](MIGRATION_GUIDE.md) |
| **Permissions** | [Permissions Setup](features/PERMISSIONS_SETUP.md), [Design Doc](ROLES_AND_PERMISSIONS_DESIGN.md) |
| **Time Off** | [Time Off Setup](features/TIME_OFF_SETUP_GUIDE.md) |
| **Notifications** | [Notification System](features/NOTIFICATION_SYSTEM.md) |
| **GitHub** | [Profile Sync](features/GITHUB_PROFILE_SYNC_GUIDE.md), [Repo Permissions](features/GITHUB_REPO_PERMISSIONS_GUIDE.md) |
| **Authentication** | [Auth Fix Guide](guides/AUTH_FIX_GUIDE.md) |
| **Deployment** | [Deployment Guide](guides/DEPLOYMENT_GUIDE.md) |

### By Task

| I want to... | Read this |
|--------------|-----------|
| Set up the project for the first time | [Quick Start](guides/QUICK_START.md) |
| Migrate my database | [Migration Guide](MIGRATION_GUIDE.md) |
| Deploy to production | [Deployment Guide](guides/DEPLOYMENT_GUIDE.md) |
| Add new database tables | [DB Scripts Guide](database/DATABASE_SCRIPTS_GUIDE.md) |
| Implement permission checks | [Permissions Setup](features/PERMISSIONS_SETUP.md) |
| Add time off feature | [Time Off Setup](features/TIME_OFF_SETUP_GUIDE.md) |
| Add notifications | [Notification System](features/NOTIFICATION_SYSTEM.md) |
| Sync GitHub data | [GitHub Profile Sync](features/GITHUB_PROFILE_SYNC_GUIDE.md) |
| Fix auth issues | [Auth Fix Guide](guides/AUTH_FIX_GUIDE.md) |

---

## 📝 Documentation Standards

### When to Create Documentation

- ✅ New features that require setup
- ✅ Complex workflows or integrations
- ✅ Database schema changes
- ✅ Common troubleshooting scenarios
- ✅ Deployment or configuration changes

### Documentation Template

```markdown
# Feature Name

Brief description of what this document covers.

## Overview

What problem does this solve?

## Prerequisites

What do you need before starting?

## Setup Steps

1. Step one
2. Step two
3. ...

## Usage

How to use the feature

## Troubleshooting

Common issues and solutions

## Examples

Code examples

## Next Steps

What to do after setup
```

---

## 🤝 Contributing

### Adding Documentation

1. **Choose the right folder:**
   - `docs/database/` - Database-related docs
   - `docs/features/` - Feature implementation guides
   - `docs/guides/` - Setup, deployment, general guides

2. **Create the document:**
   ```bash
   touch docs/features/MY_FEATURE_GUIDE.md
   ```

3. **Update this README:**
   - Add link in appropriate section
   - Add to "By Topic" and "By Task" tables

4. **Commit:**
   ```bash
   git add docs/
   git commit -m "docs: add MY_FEATURE guide"
   ```

---

## 📞 Support

- **Questions?** Check the guides above
- **Found a bug?** Create an issue
- **Need help?** Ask in team chat

---

## 🎯 Quick Links

### Most Used Docs

- [Quick Start Guide](guides/QUICK_START.md) ⭐
- [Migration Guide](MIGRATION_GUIDE.md) ⭐
- [Database Scripts Guide](database/DATABASE_SCRIPTS_GUIDE.md) ⭐
- [Permissions Setup](features/PERMISSIONS_SETUP.md) ⭐

### Essential Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build for production
pnpm preview                # Preview production build

# Database
pnpm db:apply               # Apply database schemas
pnpm db:types               # Generate TypeScript types
pnpm db:setup               # Fresh setup (reset + apply + seed)

# Type checking
pnpm tsc --noEmit           # Check types
```

---

**Last Updated:** 2025-01-31

**Version:** 1.0.0
