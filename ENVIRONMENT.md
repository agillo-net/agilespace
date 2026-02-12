# Environment Setup Guide

This guide provides detailed instructions for setting up your AgileSpace development environment.

## Prerequisites

### Required Software
- **Node.js**: v20.x or higher
- **pnpm**: v9.x or higher
- **Git**: Latest version
- **Code Editor**: VS Code recommended (with TypeScript, ESLint extensions)

### Optional but Recommended
- **Supabase CLI**: For local database development
- **Docker**: Required for local Supabase instance
- **GitHub CLI** (`gh`): For easier GitHub operations

### Installation Commands

```bash
# Install Node.js (using nvm)
nvm install 20
nvm use 20

# Install pnpm
npm install -g pnpm

# Install Supabase CLI
brew install supabase/tap/supabase

# Install GitHub CLI
brew install gh
```

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/agillo-net/agilespace.git
cd agilespace
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all dependencies listed in `package.json`, including:
- React 19 and React DOM
- TanStack Router and Query
- Supabase client
- shadcn/ui components
- Development tools

### 3. Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Local development overrides
# VITE_SUPABASE_URL=http://localhost:54321
# VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

### 4. Supabase Setup

#### Option A: Use Existing Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project or select existing one
3. Navigate to Settings → API
4. Copy the following values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
5. Add these to your `.env.local` file

#### Option B: Local Development with Supabase CLI

```bash
# Start local Supabase instance
pnpm supabase:start

# This will output:
# - API URL: http://localhost:54321
# - GraphQL URL: http://localhost:54321/graphql/v1
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio URL: http://localhost:54323
# - Inbucket URL: http://localhost:54324
# - JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
# - anon key: <your-anon-key>
# - service_role key: <your-service-role-key>

# Add the local URLs to .env.local
```

**Benefits of Local Development:**
- No internet required
- Faster development cycle
- Free and unlimited
- Easy database reset
- Local email testing with Inbucket

### 5. GitHub OAuth Configuration

#### Create GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in details:
   ```
   Application name: AgileSpace (Development)
   Homepage URL: http://localhost:5173
   Authorization callback URL: http://localhost:5173/auth/callback
   ```
4. Click "Register application"
5. Note the **Client ID**
6. Generate a **Client Secret**

#### Configure in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable GitHub provider
3. Enter your GitHub OAuth credentials:
   - **Client ID**: From GitHub OAuth App
   - **Client Secret**: From GitHub OAuth App
4. Add these scopes:
   ```
   read:user user:email read:org repo
   ```
5. Verify redirect URLs include:
   ```
   http://localhost:5173/auth/callback
   https://your-project.supabase.co/auth/v1/callback
   ```

#### For Organization Access

Your GitHub OAuth app must be approved by organization admins:

1. Go to GitHub Organization Settings → OAuth Apps
2. Find your app under "Third-party access"
3. Admin must approve the app
4. Alternatively, request organization admin to install the app

### 6. Database Setup

#### Generate TypeScript Types

```bash
# Generate types from your database schema
pnpm supabase:db:generate
```

This creates `src/types/database.types.ts` with all your database types.

#### Run Migrations (If Using Local Supabase)

```bash
# Apply migrations
supabase db reset

# Create a new migration
supabase migration new migration_name

# Push migrations to remote (when ready)
supabase db push
```

### 7. Verify Setup

```bash
# Start development server
pnpm dev
```

Open http://localhost:5173 and verify:
- [ ] App loads without errors
- [ ] "Sign in with GitHub" button appears
- [ ] No console errors in browser DevTools

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth Client ID (if not using Supabase Auth) | N/A |
| `VITE_ENABLE_DEVTOOLS` | Enable React Query DevTools | `true` in dev |
| `VITE_LOG_LEVEL` | Logging level | `info` |

## IDE Configuration

### VS Code Recommended Extensions

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "supabase.supabase-vscode"
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^\"'`]*)(?:'|\"|`)"]
  ]
}
```

## Troubleshooting

### Common Issues

#### 1. Supabase Connection Fails

**Symptoms:**
- "Failed to fetch" errors
- Authentication doesn't work
- Database queries fail

**Solutions:**
```bash
# Check environment variables
cat .env.local

# Verify Supabase is running (local)
supabase status

# Test connection
curl $VITE_SUPABASE_URL/rest/v1/

# Check for trailing slashes
# Bad: https://project.supabase.co/
# Good: https://project.supabase.co
```

#### 2. GitHub OAuth Fails

**Symptoms:**
- Redirect loop after GitHub auth
- "OAuth app not approved" error
- No profile created after auth

**Solutions:**
- Verify callback URL matches exactly (including port)
- Check OAuth scopes include `read:org` and `repo`
- Ensure GitHub OAuth app is approved for organizations
- Clear browser cookies and try again
- Check Supabase Auth logs in dashboard

#### 3. Type Errors After Schema Changes

**Symptoms:**
- TypeScript errors about missing fields
- Type mismatches with database queries

**Solutions:**
```bash
# Regenerate types
pnpm supabase:db:generate

# Restart TypeScript server in VS Code
# Command Palette → TypeScript: Restart TS Server

# Clear cache and rebuild
rm -rf node_modules/.vite
pnpm dev
```

#### 4. pnpm Install Fails

**Symptoms:**
- Binary build errors
- Permission errors
- Network timeouts

**Solutions:**
```bash
# Clear pnpm cache
pnpm store prune

# Use different registry if needed
pnpm config set registry https://registry.npmjs.org/

# Install with legacy peer deps
pnpm install --legacy-peer-deps

# Check Node version
node --version  # Should be 20+
```

#### 5. Port Already in Use

**Symptoms:**
- "Port 5173 is already in use"
- "EADDRINUSE" error

**Solutions:**
```bash
# Find and kill process using port
lsof -ti:5173 | xargs kill -9

# Or use different port
pnpm dev -- --port 5174
```

#### 6. Local Supabase Issues

**Symptoms:**
- Docker errors
- Supabase services won't start
- Database connection refused

**Solutions:**
```bash
# Stop all Supabase services
supabase stop

# Remove volumes and restart
supabase stop --no-backup
supabase start

# Check Docker is running
docker ps

# View Supabase logs
supabase logs
```

## Development Workflow

### Daily Development

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
pnpm install

# Start development server
pnpm dev
```

### Working with Database

```bash
# Generate types after schema changes
pnpm supabase:db:generate

# View local database
supabase db dump --local

# Reset database to migrations
supabase db reset
```

### Code Quality Checks

```bash
# Run linter
pnpm lint

# Fix linting issues
pnpm lint --fix

# Type check
pnpm build  # Will fail on type errors
```

## Environment Management

### Multiple Environments

You can maintain multiple environment files:

```bash
.env.local          # Local development (gitignored)
.env.development    # Development environment
.env.staging        # Staging environment
.env.production     # Production environment
```

Switch between them:

```bash
# Copy environment
cp .env.staging .env.local

# Or use environment-specific scripts
"scripts": {
  "dev:staging": "vite --mode staging",
  "dev:prod": "vite --mode production"
}
```

### Environment Security

**Never commit:**
- `.env.local` - Personal local config
- `.env.*.local` - Local overrides
- Any file with real API keys or secrets

**Safe to commit:**
- `.env.example` - Template with dummy values
- Environment-specific configs without secrets

Create `.env.example`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Next Steps

After completing setup:

1. ✅ Read [CLAUDE.md](./CLAUDE.md) for development guidelines
2. ✅ Review [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution process
3. ✅ Check [TESTING.md](./TESTING.md) for testing approach
4. ✅ Explore the codebase starting with `src/routes/`
5. ✅ Join the team communication channel

## Getting Help

If you encounter issues not covered here:

1. Check [GitHub Issues](https://github.com/agillo-net/agilespace/issues)
2. Review [Supabase Docs](https://supabase.com/docs)
3. Ask in team chat/Slack
4. Create a new issue with:
   - Your environment details
   - Steps to reproduce
   - Error messages
   - What you've tried
