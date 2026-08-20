# Supabase Setup Guide

Complete instructions for setting up Supabase database for the Master Kanor Case project.

## Prerequisites

- Supabase account (free tier available at https://supabase.com)
- Project created in Supabase
- Access to project credentials

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in project details:
   - **Name**: `master-kanor-case`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your location
4. Click "Create new project"
5. Wait for project to initialize (2-3 minutes)

## Step 2: Get Connection Credentials

1. Go to Project Settings → Database
2. Copy the following:
   - **Connection String** (PostgreSQL)
   - **Host**
   - **Port** (usually 5432)
   - **Database** (usually `postgres`)
   - **User** (usually `postgres`)
   - **Password** (the one you created)

## Step 3: Update Environment Variables

Add these to your `.env.local` or Vercel environment variables:

```env
# Supabase Connection
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Keep existing Manus variables
JWT_SECRET=[your-jwt-secret]
VITE_APP_ID=[your-app-id]
OAUTH_SERVER_URL=[oauth-server-url]
VITE_OAUTH_PORTAL_URL=[oauth-portal-url]
```

## Step 4: Migrate Database Schema

1. Update `drizzle.config.ts` to use Supabase:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

2. Run migrations:

```bash
pnpm db:push
```

3. Verify tables in Supabase:
   - Go to Supabase Dashboard → SQL Editor
   - Run: `SELECT * FROM information_schema.tables WHERE table_schema = 'public';`

## Step 5: Enable Row Level Security (RLS)

For security, enable RLS on all tables:

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid()::text = open_id);
```

## Step 6: Set Up Authentication

1. Go to Supabase Dashboard → Authentication
2. Configure OAuth providers if needed
3. Add redirect URLs:
   - Development: `http://localhost:3000/api/oauth/callback`
   - Production: `https://your-domain.com/api/oauth/callback`

## Step 7: Test Connection

```bash
# In your project root
npm run db:push

# You should see output like:
# ✓ Migrations applied successfully
```

## Troubleshooting

### Connection Refused
- Check DATABASE_URL is correct
- Verify Supabase project is running
- Check firewall/network settings

### Authentication Failed
- Verify password is correct
- Check user has database creation permissions
- Reset password in Supabase if needed

### Migration Errors
- Ensure schema.ts is valid
- Check for SQL syntax errors
- Review migration files in drizzle/migrations

## Backing Up Data

### Manual Backup
1. Go to Supabase Dashboard → Backups
2. Click "Create backup"
3. Download backup file

### Automated Backups
Supabase provides daily backups on Pro plan. Free tier has 7-day retention.

## Monitoring

1. Go to Supabase Dashboard → Logs
2. Monitor:
   - Database connections
   - Query performance
   - Error rates
   - Storage usage

## Security Best Practices

- [ ] Enable Row Level Security (RLS)
- [ ] Use strong database passwords
- [ ] Rotate credentials regularly
- [ ] Enable database backups
- [ ] Monitor access logs
- [ ] Use environment variables for secrets
- [ ] Enable SSL connections

## Next Steps

After Supabase is set up:
1. Update DATABASE_URL in Vercel environment variables
2. Deploy to Vercel
3. Verify database connection in production
4. Set up monitoring and alerts

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.io
- Project Support: https://supabase.com/support
