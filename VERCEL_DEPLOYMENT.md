# Vercel Deployment Guide

Complete instructions for deploying the Master Kanor Case project to Vercel.

## Prerequisites

- GitHub repository created and code pushed
- Vercel account (free tier available at https://vercel.com)
- GitHub account with repository access

## Step 1: Create Vercel Account

1. Go to https://vercel.com/signup
2. Sign up with GitHub account
3. Authorize Vercel to access your GitHub repositories
4. Complete onboarding

## Step 2: Import Project to Vercel

1. Go to Vercel Dashboard
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Find and select `master-kanor-case` repository
5. Click "Import"

## Step 3: Configure Project Settings

### Build Settings
- **Framework**: Next.js (or Vite if using Vite)
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`

### Environment Variables

Add these environment variables in Vercel:

```env
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]

# Authentication
JWT_SECRET=[your-jwt-secret]
VITE_APP_ID=[your-app-id]
OAUTH_SERVER_URL=[oauth-server-url]
VITE_OAUTH_PORTAL_URL=[oauth-portal-url]

# Manus APIs
BUILT_IN_FORGE_API_URL=[forge-api-url]
BUILT_IN_FORGE_API_KEY=[forge-api-key]
VITE_FRONTEND_FORGE_API_KEY=[frontend-forge-key]
VITE_FRONTEND_FORGE_API_URL=[frontend-forge-url]

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=[analytics-endpoint]
VITE_ANALYTICS_WEBSITE_ID=[analytics-id]
```

## Step 4: Configure Custom Domain

### Option 1: Vercel Domain
1. Go to Project Settings → Domains
2. Add domain: `master-kanor-case.vercel.app`
3. Automatically configured

### Option 2: Custom Domain
1. Go to Project Settings → Domains
2. Click "Add" → "Add Custom Domain"
3. Enter your domain (e.g., `masterkanorcase.com`)
4. Update DNS records:
   - Add CNAME record pointing to `cname.vercel.com`
   - Or update A records as instructed by Vercel
5. Verify domain ownership
6. SSL certificate automatically provisioned

## Step 5: Deploy

1. Click "Deploy" button
2. Wait for build to complete (usually 2-5 minutes)
3. Verify deployment succeeded
4. Visit your live URL

## Step 6: Post-Deployment Verification

### Check Deployment
```bash
# Visit your Vercel URL
https://master-kanor-case.vercel.app

# Verify:
- [ ] Homepage loads correctly
- [ ] Evidence dossier displays
- [ ] Admin dashboard accessible
- [ ] Export functionality works
- [ ] Database connection working
```

### Monitor Performance
1. Go to Vercel Dashboard → Analytics
2. Monitor:
   - Page load times
   - Error rates
   - Bandwidth usage
   - Function execution time

## Continuous Deployment

### Automatic Deployments
- Every push to `main` branch triggers deployment
- Pull requests get preview deployments
- Merging PR to main triggers production deployment

### Manual Deployment
1. Go to Vercel Dashboard
2. Select project
3. Click "Deployments"
4. Click "Redeploy" on any previous deployment

## Rollback

If deployment has issues:

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "Promote to Production"
4. Verify site is working

## Environment Variables Management

### Update Variables
1. Go to Project Settings → Environment Variables
2. Edit or add variables
3. Redeploy project for changes to take effect

### Secrets
- Store sensitive data as environment variables
- Never commit `.env` files to GitHub
- Use Vercel's environment variable interface

## Monitoring & Logs

### View Logs
1. Go to Vercel Dashboard → Deployments
2. Click on deployment
3. View build logs and function logs

### Error Tracking
1. Go to Project Settings → Integrations
2. Connect to error tracking service (Sentry, etc.)
3. Monitor errors in real-time

## Performance Optimization

### Vercel Features
- Automatic image optimization
- Edge caching
- Serverless functions
- CDN distribution

### Recommendations
- Enable image optimization
- Use Vercel Analytics
- Monitor Core Web Vitals
- Optimize database queries

## Scaling

### Free Tier Limits
- 100 GB bandwidth/month
- 12 serverless function invocations/second
- Suitable for most projects

### Pro Tier Benefits
- Unlimited bandwidth
- 1000 serverless function invocations/second
- Priority support
- Advanced analytics

## Troubleshooting

### Build Fails
```bash
# Check build logs in Vercel Dashboard
# Common issues:
- Missing environment variables
- Dependency conflicts
- Syntax errors

# Solution:
- Verify all env vars are set
- Run locally: pnpm build
- Check for TypeScript errors: pnpm check
```

### Database Connection Issues
```bash
# Verify DATABASE_URL is correct
# Check Supabase is running
# Verify network access from Vercel IPs
```

### Slow Performance
- Check database query performance
- Monitor function execution time
- Review Vercel Analytics
- Consider upgrading to Pro

## Security Checklist

- [ ] HTTPS enabled (automatic)
- [ ] Environment variables secured
- [ ] Database credentials protected
- [ ] API keys rotated regularly
- [ ] Branch protection enabled
- [ ] Deployment approvals required
- [ ] Monitoring and alerts configured

## Maintenance

### Regular Tasks
- Monitor error rates
- Review performance metrics
- Update dependencies
- Test critical flows
- Review access logs

### Monthly
- Analyze usage patterns
- Review cost
- Update security patches
- Backup database

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- GitHub Issues: Create issues in your repository

## Next Steps

1. Deploy to Vercel
2. Configure custom domain
3. Set up monitoring
4. Configure backups
5. Enable analytics
6. Set up error tracking

---

**Deployment Status**: Ready for Production ✓

**Live URL**: https://master-kanor-case.vercel.app

**Custom Domain**: Configure in Vercel Settings
