# Get Your Correct DATABASE_URL

The `DATABASE_URL` in `.env.local` has the wrong region. Follow these steps to get the correct one:

## Steps:

### 1. Go to Supabase Dashboard
Open your Supabase project:
```
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/database
```

### 2. Find Connection String Section
Scroll down to the **"Connection String"** section

### 3. Select Transaction Mode
Click on **"Transaction"** tab (uses connection pooler, port 6543)

### 4. Copy the Full URI
You'll see something like:
```
postgresql://postgres.YOUR_PROJECT_REF:[YOUR-PASSWORD]@aws-0-[ACTUAL-REGION].pooler.supabase.com:6543/postgres
```

The `[ACTUAL-REGION]` might be:
- `us-east-1`
- `us-west-1`
- `us-west-2`
- `eu-west-1`
- `eu-central-1`
- `ap-southeast-1`
- `ap-northeast-1`

### 5. Replace PASSWORD placeholder
Replace `[YOUR-PASSWORD]` with your actual database password.

**Note:** If the password has special characters like `?`, `@`, `#`, etc., you need to URL-encode them:
- `?` becomes `%3F`
- `@` becomes `%40`
- `#` becomes `%23`
- Or use an online URL encoder

### 6. Update .env.local
Open `.env.local` and update the `DATABASE_URL` line with the exact URL from Supabase.

## Example:

If Supabase shows:
```
postgresql://postgres.YOUR_PROJECT_REF:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

And your password is `MyPass@123?`, after URL encoding it becomes `MyPass%40123%3F`

Your `.env.local` should have:
```bash
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:MyPass%40123%3F@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

## Then Test:

```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT version();"

# If it works, create backup
pnpm db:backup:remote
```

## Common Issues:

- **Wrong region**: Make sure the region matches what's shown in Supabase Dashboard
- **Password encoding**: Special characters must be URL-encoded
- **Wrong port**: Use port `6543` for Transaction mode (connection pooler)

You need to use the **exact** URL from your Supabase dashboard.
