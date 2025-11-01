# Deployment Guide

This guide covers deploying AgileSpace to production environments.

## Deployment Options

AgileSpace can be deployed to various platforms:

1. **Vercel** (Recommended) - Zero-config deployments
2. **Netlify** - Good alternative with similar features
3. **Cloudflare Pages** - Edge network deployment
4. **Self-hosted** - Full control, more setup required

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Production Supabase project created
- [ ] GitHub OAuth configured for production
- [ ] Database migrations applied
- [ ] Row Level Security (RLS) policies enabled
- [ ] Build passes locally (`pnpm build`)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Critical features tested manually

## Vercel Deployment (Recommended)

### Initial Setup

1. **Install Vercel CLI**
   ```bash
   pnpm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Link Project**
   ```bash
   vercel link
   ```

4. **Configure Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   ```

   Or via Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add required variables (see Environment Variables section)

### Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Automatic Deployments

1. **Connect GitHub Repository**
   - Go to Vercel Dashboard
   - Import Git Repository
   - Select your repository

2. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Build Command: pnpm build
   Output Directory: dist
   Install Command: pnpm install
   ```

3. **Branch Deployments**
   - `main` branch → Production
   - Other branches → Preview deployments
   - Pull requests → Preview deployments

### Vercel Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Netlify Deployment

### Initial Setup

1. **Install Netlify CLI**
   ```bash
   pnpm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Initialize Site**
   ```bash
   netlify init
   ```

### Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Deploy

```bash
# Deploy to preview
netlify deploy

# Deploy to production
netlify deploy --prod
```

## Cloudflare Pages

### Setup

1. Go to Cloudflare Dashboard
2. Select Pages → Create a project
3. Connect your Git repository
4. Configure build settings:
   ```
   Build command: pnpm build
   Build output directory: dist
   ```

### Configuration

Create `_headers` in `public/`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

Create `_redirects` in `public/`:

```
/* /index.html 200
```

## Environment Variables

### Required Variables (Production)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Optional: Analytics
VITE_ANALYTICS_ID=your-analytics-id
```

### Setting Environment Variables

**Vercel:**
```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

**Netlify:**
```bash
netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
```

**Cloudflare:**
- Dashboard → Pages → Settings → Environment Variables

## Production Supabase Setup

### 1. Create Production Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Choose region closest to your users
4. Set strong database password

### 2. Configure GitHub OAuth

1. Create new GitHub OAuth App for production:
   ```
   Application name: AgileSpace (Production)
   Homepage URL: https://your-domain.com
   Authorization callback URL: https://your-domain.com/auth/callback
   ```

2. In Supabase Dashboard:
   - Authentication → Providers → GitHub
   - Add production OAuth credentials
   - Set redirect URLs:
     ```
     https://your-domain.com/auth/callback
     https://your-project.supabase.co/auth/v1/callback
     ```

### 3. Apply Database Migrations

```bash
# Link to production project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Or manually apply via Supabase Studio
```

### 4. Enable Row Level Security

Verify RLS is enabled for all tables:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Enable RLS on table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### 5. Review Security Policies

Ensure appropriate policies are in place:

```sql
-- Example: Users can only read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Example: Space members can read sessions in their space
CREATE POLICY "Members can read space sessions"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = sessions.space_id
      AND space_members.user_id = auth.uid()
    )
  );
```

## Build Optimization

### Production Build

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

### Build Configuration

Optimize `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
      },
    },
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['@tanstack/react-router'],
          query: ['@tanstack/react-query'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-popover'],
        },
      },
    },
    // Source maps for production debugging
    sourcemap: true,
  },
})
```

### Performance Optimizations

1. **Lazy Loading Routes**
   ```typescript
   // Already configured with TanStack Router
   // Routes are automatically code-split
   ```

2. **Image Optimization**
   - Use WebP format
   - Serve appropriate sizes
   - Lazy load images below fold

3. **Font Optimization**
   - Use `font-display: swap`
   - Preload critical fonts
   - Subset fonts if needed

## Monitoring and Analytics

### Error Tracking

Add error tracking service (Sentry example):

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react"

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}
```

### Performance Monitoring

```typescript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric)
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

## Domain Configuration

### Custom Domain Setup

**Vercel:**
1. Domains → Add Domain
2. Enter your domain
3. Configure DNS:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

**Netlify:**
1. Domain Settings → Add custom domain
2. Configure DNS:
   ```
   Type: CNAME
   Name: www
   Value: your-site.netlify.app
   ```

### SSL Certificates

All platforms provide automatic SSL:
- Vercel: Auto-provisioned Let's Encrypt
- Netlify: Auto-provisioned Let's Encrypt
- Cloudflare: Includes SSL

## Rollback Procedures

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Or via dashboard: Deployments → Click deployment → Promote to Production
```

### Netlify

```bash
# List deployments
netlify deploy:list

# Rollback via dashboard
# Deploys → Click deployment → Publish deploy
```

### Database Rollback

```bash
# Revert last migration
supabase migration repair --status reverted

# Apply previous migration state
supabase db reset --version <migration-timestamp>
```

## Health Checks

### Monitoring Endpoints

Create health check endpoint:

```typescript
// src/routes/api/health.ts
export const loader = async () => {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: import.meta.env.VITE_APP_VERSION
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### Uptime Monitoring

Configure with services like:
- UptimeRobot
- Pingdom
- Better Uptime

Monitor:
- Application availability
- Response times
- SSL certificate expiration
- Database connectivity

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass
- [ ] Build succeeds locally
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Security headers configured

### Deployment
- [ ] Deploy to staging first
- [ ] Verify staging deployment
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Monitor deployment logs

### Post-Deployment
- [ ] Verify production site loads
- [ ] Test authentication flow
- [ ] Test critical user paths
- [ ] Check error tracking service
- [ ] Monitor performance metrics
- [ ] Verify real-time features work
- [ ] Test on multiple devices/browsers

## Troubleshooting

### Build Fails

```bash
# Clear build cache
rm -rf node_modules/.vite
rm -rf dist

# Rebuild
pnpm install
pnpm build
```

### Environment Variables Not Working

- Ensure variables start with `VITE_`
- Restart dev server after changes
- Check deployment platform shows variables
- Verify no typos in variable names

### Database Connection Issues

- Verify Supabase URL is correct
- Check anon key is for correct project
- Ensure RLS policies allow access
- Check Supabase project is not paused

### OAuth Redirect Fails

- Verify callback URL matches exactly
- Check GitHub OAuth app settings
- Ensure production domain is whitelisted
- Clear browser cookies and retry

## Maintenance

### Regular Tasks

**Weekly:**
- Review error logs
- Check performance metrics
- Monitor disk/bandwidth usage

**Monthly:**
- Update dependencies
- Review security policies
- Check SSL certificate status
- Database performance review

**Quarterly:**
- Security audit
- Load testing
- Backup verification
- Disaster recovery drill

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- [Supabase Production Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
