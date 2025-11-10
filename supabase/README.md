# Supabase Database Schemas

This directory contains SQL schema files for the AgilSpace application.

## Schema Files

The schema files are numbered and should be executed in order:

1. **01_profiles.sql** - User profiles table
2. **02_spaces.sql** - Spaces and space members tables
3. **03_tracks.sql** - Issue tracking table
4. **04_sessions.sql** - Time tracking sessions table
5. **05_tags.sql** - Tags and session tags tables
6. **06_permissions.sql** - Permissions system (roles, permissions, overrides)
7. **07_rls_policies.sql** - Row Level Security policies for all tables

## Applying the Schemas

### Initial Setup

To apply all schemas to a new Supabase project:

```bash
# Set your Supabase credentials
export SUPABASE_URL="your-project-url"
export SUPABASE_SERVICE_KEY="your-service-key"

# Apply all schemas in order
for file in supabase/schemas/*.sql; do
  psql "$SUPABASE_URL" -f "$file"
done
```

### Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Manual Application

You can also apply the schemas manually through the Supabase Dashboard:

1. Go to your project in the Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of each schema file in order
4. Execute each file

## Important Notes

### Permissions System

The permissions system (06_permissions.sql) includes:
- Default permissions for all categories (space, members, issues, prs, change_requests, repos, analytics)
- Role-to-permission mappings for admin, member, and observer roles
- Support for space-specific permission overrides
- Helper functions for checking permissions

### RLS Policies

The RLS policies (07_rls_policies.sql) enforce permissions at the database level:
- All tables have RLS enabled
- Policies check space membership and permissions
- Admins have elevated permissions
- Members can manage their own content
- Observers have read-only access

### Testing the Setup

After applying the schemas, test the permissions system:

```sql
-- Check if permissions were created
SELECT * FROM permissions;

-- Check role permissions
SELECT rp.role, p.name as permission
FROM role_permissions rp
JOIN permissions p ON p.id = rp.permission_id
WHERE rp.role = 'admin';

-- Test the permission check function
SELECT user_has_permission(
  'user-uuid'::uuid,
  'space-uuid'::uuid,
  'issues:create'
);
```

## Schema Modifications

When modifying schemas:

1. **Never modify existing schema files** - Create a new migration file instead
2. **Use migrations** - Create numbered migration files (e.g., 08_add_new_feature.sql)
3. **Test locally first** - Use Supabase CLI to test migrations locally before applying to production
4. **Document changes** - Add comments to your SQL and update this README

## Troubleshooting

### RLS Policies Not Working

If RLS policies aren't working as expected:

1. Check if RLS is enabled: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;`
2. Verify policies exist: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
3. Test with service role key (bypasses RLS) vs anon key
4. Check the helper functions are working: `SELECT user_has_permission(...)`

### Permission Checks Failing

If permission checks are failing:

1. Verify the user is a member of the space
2. Check the user's role in the space
3. Verify permissions are seeded: `SELECT COUNT(*) FROM permissions;` (should be 33)
4. Check role_permissions mappings: `SELECT COUNT(*) FROM role_permissions;`
5. Look for permission overrides: `SELECT * FROM space_member_permissions WHERE space_member_id = 'your-space-member-id';`

## Reference

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [AgilSpace Permissions Design](/docs/ROLES_AND_PERMISSIONS_DESIGN.md)
