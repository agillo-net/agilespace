# Documentation Index

Quick reference for all AgileSpace documentation.

## 🎯 Start Here

| Document | Purpose | Time to Read |
|----------|---------|--------------|
| [Quick Start Guide](guides/QUICK_START.md) | Complete setup for new developers | 15 min |
| [Migration Guide](MIGRATION_GUIDE.md) | Database migration instructions | 30 min |
| [README](README.md) | Documentation overview and navigation | 5 min |

---

## 📂 Documentation Structure

```
docs/
├── README.md                          # Main documentation hub
├── MIGRATION_GUIDE.md                 # Database migration guide
├── DOCUMENTATION_INDEX.md             # This file - quick reference
├── IMPLEMENTATION_COMPLETE.md         # Feature completion status
├── IMPLEMENTATION_SUMMARY.md          # Implementation overview
│
├── archive/                           # Old/redundant files
│   ├── fix_spaces_rls.sql
│   └── time_off_migration_consolidated.sql
│
├── database/                          # Database documentation
│   ├── DATABASE_SCRIPTS_GUIDE.md      # Complete DB scripts guide
│   └── DATABASE_MANAGEMENT_SUMMARY.md # Quick DB reference
│
├── features/                          # Feature-specific guides
│   ├── GITHUB_PROFILE_SYNC_GUIDE.md
│   ├── GITHUB_REPO_PERMISSIONS_GUIDE.md
│   ├── NOTIFICATION_SYSTEM.md
│   ├── PERMISSIONS_APPLIED_SUCCESS.md
│   ├── PERMISSIONS_SETUP.md
│   ├── SETUP_PERMISSIONS.md
│   ├── TESTING_REPO_PERMISSIONS.md
│   └── TIME_OFF_SETUP_GUIDE.md
│
├── guides/                            # Setup & deployment guides
│   ├── QUICK_START.md
│   ├── AUTH_FIX_GUIDE.md
│   └── DEPLOYMENT_GUIDE.md
│
└── setup/                             # (Reserved for future)
```

---

## 🗄️ Database Documentation

### Essential Database Docs

| Document | What's Inside |
|----------|---------------|
| [Migration Guide](MIGRATION_GUIDE.md) | Step-by-step migration for schemas 06-10 |
| [Database Scripts Guide](database/DATABASE_SCRIPTS_GUIDE.md) | Complete guide to all DB management scripts |
| [Database Management Summary](database/DATABASE_MANAGEMENT_SUMMARY.md) | Quick command reference |
| [Roles & Permissions Design](ROLES_AND_PERMISSIONS_DESIGN.md) | Permission system architecture |

### Database Scripts Quick Reference

```bash
# Apply schemas
pnpm db:apply              # Apply all schemas
pnpm db:apply 06 07 08     # Apply specific schemas

# Reset database (⚠️ DESTRUCTIVE)
pnpm db:reset              # Interactive confirmation
pnpm db:reset -- --force   # No confirmation

# Seed & setup
pnpm db:seed               # Add sample data
pnpm db:setup              # Reset + Apply + Seed

# Type generation
pnpm db:types              # Generate TypeScript types

# Utilities
pnpm db:combine            # Combine schemas to one file
pnpm db:combine 06 07      # Combine specific schemas
```

### Schema Files (supabase/schemas/)

| File | Description | Status |
|------|-------------|--------|
| `01_profiles_trigger.sql` | Auto-create profiles on signup | ✅ Applied |
| `01_profiles.sql` | User profiles table | ✅ Applied |
| `02_spaces.sql` | Workspace/teams | ✅ Applied |
| `03_tracks.sql` | Issue tracking | ✅ Applied |
| `04_sessions.sql` | Work sessions | ✅ Applied |
| `05_tags.sql` | Tags and labels | ✅ Applied |
| `06_permissions.sql` | Permission system | ⭐ **NEW** |
| `07_rls_policies.sql` | Row Level Security | ⭐ **NEW** |
| `08_time_off.sql` | Time off management | ⭐ **NEW** |
| `09_github_repo_permissions.sql` | GitHub repo access | ⭐ **NEW** |
| `10_notifications.sql` | Notification system | ⭐ **NEW** |

⭐ = Requires migration (see [Migration Guide](MIGRATION_GUIDE.md))

---

## ✨ Feature Documentation

### Permissions System

| Document | Description |
|----------|-------------|
| [Permissions Setup](features/PERMISSIONS_SETUP.md) | Initial setup guide |
| [Setup Permissions](features/SETUP_PERMISSIONS.md) | Configuration steps |
| [Permissions Applied Success](features/PERMISSIONS_APPLIED_SUCCESS.md) | Verification checklist |
| [Roles & Permissions Design](ROLES_AND_PERMISSIONS_DESIGN.md) | Architecture & design |

**Quick Example:**
```typescript
import { PermissionGate } from '@/components/permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

<PermissionGate permission={PERMISSIONS.MEMBERS_INVITE} spaceId={spaceId}>
  <InviteButton />
</PermissionGate>
```

### GitHub Integration

| Document | Description |
|----------|-------------|
| [GitHub Profile Sync](features/GITHUB_PROFILE_SYNC_GUIDE.md) | Auto-sync user profiles |
| [GitHub Repo Permissions](features/GITHUB_REPO_PERMISSIONS_GUIDE.md) | Track repo access |
| [Testing Repo Permissions](features/TESTING_REPO_PERMISSIONS.md) | Test permission sync |

**Features:**
- OAuth authentication
- Automatic profile creation
- Repository permission tracking
- Organization membership sync

### Time Off Management

| Document | Description |
|----------|-------------|
| [Time Off Setup](features/TIME_OFF_SETUP_GUIDE.md) | Complete setup guide |

**Features:**
- Request time off (vacation, sick, personal, etc.)
- Admin approval workflow
- Team calendar view
- Conflict detection
- Business day calculations

**Quick Example:**
```typescript
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
| [Notification System](features/NOTIFICATION_SYSTEM.md) | Setup & usage guide |

**Features:**
- Real-time notifications
- User preferences
- Auto-notifications for events
- Mark as read/unread
- Notification bell component

**Quick Example:**
```typescript
import { NotificationBell } from '@/components/notifications';
import { useNotifications } from '@/hooks/api/use-notifications';

<NotificationBell />
```

---

## 📖 Setup & Deployment Guides

### Getting Started

| Document | Purpose | Target Audience |
|----------|---------|-----------------|
| [Quick Start](guides/QUICK_START.md) | Complete setup guide | New developers |
| [Auth Fix Guide](guides/AUTH_FIX_GUIDE.md) | Fix auth issues | Troubleshooting |
| [Deployment Guide](guides/DEPLOYMENT_GUIDE.md) | Production deployment | DevOps/Admins |

### Quick Start Summary

```bash
# 1. Clone & install
git clone <repo>
pnpm install

# 2. Environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Database
pnpm db:apply
pnpm db:types

# 4. Run
pnpm dev
```

---

## 🔍 Find Documentation By...

### By Task

| I want to... | Read this |
|--------------|-----------|
| Set up the project | [Quick Start](guides/QUICK_START.md) |
| Migrate database | [Migration Guide](MIGRATION_GUIDE.md) |
| Deploy to production | [Deployment Guide](guides/DEPLOYMENT_GUIDE.md) |
| Add permissions to UI | [Permissions Setup](features/PERMISSIONS_SETUP.md) |
| Create time off feature | [Time Off Setup](features/TIME_OFF_SETUP_GUIDE.md) |
| Add notifications | [Notification System](features/NOTIFICATION_SYSTEM.md) |
| Sync GitHub data | [GitHub Profile Sync](features/GITHUB_PROFILE_SYNC_GUIDE.md) |
| Fix auth issues | [Auth Fix Guide](guides/AUTH_FIX_GUIDE.md) |
| Manage database | [DB Scripts Guide](database/DATABASE_SCRIPTS_GUIDE.md) |

### By Technology

| Technology | Related Docs |
|------------|--------------|
| **Supabase** | [Migration Guide](MIGRATION_GUIDE.md), [DB Scripts](database/DATABASE_SCRIPTS_GUIDE.md) |
| **PostgreSQL** | [DB Scripts](database/DATABASE_SCRIPTS_GUIDE.md), [Migration Guide](MIGRATION_GUIDE.md) |
| **GitHub API** | [Profile Sync](features/GITHUB_PROFILE_SYNC_GUIDE.md), [Repo Permissions](features/GITHUB_REPO_PERMISSIONS_GUIDE.md) |
| **TypeScript** | [Quick Start](guides/QUICK_START.md) |
| **React** | [Quick Start](guides/QUICK_START.md), Feature guides |
| **TanStack Router** | [Quick Start](guides/QUICK_START.md), [Auth Fix](guides/AUTH_FIX_GUIDE.md) |

### By Role

| Role | Start Here |
|------|------------|
| **New Developer** | [Quick Start](guides/QUICK_START.md) → [README](README.md) |
| **Frontend Developer** | [Quick Start](guides/QUICK_START.md) → [Permissions](features/PERMISSIONS_SETUP.md) |
| **Backend Developer** | [DB Scripts](database/DATABASE_SCRIPTS_GUIDE.md) → [Migration Guide](MIGRATION_GUIDE.md) |
| **DevOps** | [Deployment Guide](guides/DEPLOYMENT_GUIDE.md) → [DB Scripts](database/DATABASE_SCRIPTS_GUIDE.md) |
| **DBA** | [Migration Guide](MIGRATION_GUIDE.md) → [DB Scripts](database/DATABASE_SCRIPTS_GUIDE.md) |
| **Product Manager** | [Implementation Summary](IMPLEMENTATION_SUMMARY.md) → Feature guides |

---

## 📊 Implementation Status

See [Implementation Complete](IMPLEMENTATION_COMPLETE.md) for detailed checklist.

### Features Status

| Feature | Status | Documentation |
|---------|--------|---------------|
| Permissions System | ✅ Complete | [Permissions Setup](features/PERMISSIONS_SETUP.md) |
| Time Off Management | ✅ Complete | [Time Off Setup](features/TIME_OFF_SETUP_GUIDE.md) |
| Notifications | ✅ Complete | [Notification System](features/NOTIFICATION_SYSTEM.md) |
| GitHub Integration | ✅ Complete | [Profile Sync](features/GITHUB_PROFILE_SYNC_GUIDE.md) |
| Repo Permissions | ✅ Complete | [Repo Permissions](features/GITHUB_REPO_PERMISSIONS_GUIDE.md) |
| Analytics Dashboard | ✅ Complete | [Implementation Summary](IMPLEMENTATION_SUMMARY.md) |

---

## 🚀 Common Workflows

### First Time Setup

```bash
# 1. Install
git clone <repo> && cd agilespace
pnpm install

# 2. Configure
cp .env.example .env
# Edit .env with Supabase credentials

# 3. Database
pnpm db:apply
pnpm db:types

# 4. Run
pnpm dev
```

**Read:** [Quick Start Guide](guides/QUICK_START.md)

### Database Migration (Existing Project)

```bash
# 1. Backup (optional but recommended)
# Via Supabase Dashboard: Database → Backups

# 2. Apply new schemas
pnpm db:apply 06 07 08 09 10

# 3. Generate types
pnpm db:types

# 4. Verify
pnpm build
```

**Read:** [Migration Guide](MIGRATION_GUIDE.md)

### Adding a New Feature

```bash
# 1. Create schema (if needed)
touch supabase/schemas/11_new_feature.sql

# 2. Apply schema
pnpm db:apply 11

# 3. Generate types
pnpm db:types

# 4. Build feature
# - Create queries in src/lib/
# - Create hook in src/hooks/api/
# - Build UI in src/components/
# - Add route in src/routes/

# 5. Document
# Create guide in docs/features/
```

**Read:** [Quick Start Guide](guides/QUICK_START.md)

---

## 🆘 Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| White screen on refresh | [Auth Fix Guide](guides/AUTH_FIX_GUIDE.md) |
| Database connection fails | [DB Scripts Guide](database/DATABASE_SCRIPTS_GUIDE.md) |
| Type errors after migration | Run `pnpm db:types` |
| Permission denied errors | [Permissions Setup](features/PERMISSIONS_SETUP.md) |
| Migration fails | [Migration Guide](MIGRATION_GUIDE.md) → Troubleshooting |

---

## 📝 Contributing to Docs

### Adding New Documentation

1. **Choose folder:**
   - `docs/database/` - Database-related
   - `docs/features/` - Feature guides
   - `docs/guides/` - Setup/deployment

2. **Create document:**
   ```bash
   touch docs/features/MY_FEATURE.md
   ```

3. **Update indexes:**
   - Add to [README.md](README.md)
   - Add to this index
   - Add to root [README.md](../README.md)

4. **Commit:**
   ```bash
   git add docs/
   git commit -m "docs: add MY_FEATURE guide"
   ```

### Documentation Standards

- Use clear, descriptive titles
- Include table of contents for long docs
- Provide code examples
- Add troubleshooting section
- Include "Next Steps" or "Related Docs"
- Use emoji sparingly (✅ ⚠️ 📚 ⭐)

---

## 📞 Getting Help

1. **Check relevant guide** (see index above)
2. **Search documentation** (Cmd/Ctrl + F in this file)
3. **Check troubleshooting sections**
4. **Ask in team chat**
5. **Create GitHub issue**

---

## 🔗 External Resources

- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Router](https://tanstack.com/router)
- [React Documentation](https://react.dev)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated:** 2025-01-31

**Maintained by:** AgileSpace Team
