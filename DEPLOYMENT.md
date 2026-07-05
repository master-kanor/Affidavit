# Deployment Guide

Complete instructions for deploying the Evidence Website to production.

## Pre-Deployment Checklist

- [ ] All features implemented and tested
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Evidence assets uploaded
- [ ] Admin dashboard tested
- [ ] Export functionality verified
- [ ] Checkpoint created
- [ ] README and documentation updated

## Deployment Steps

### 1. Create a Checkpoint

Before deploying, save the current state:

```bash
cd /home/ubuntu/evidence-website
webdev_save_checkpoint
```

This creates a snapshot of your code that can be rolled back if needed.

### 2. Verify Build

Ensure the project builds without errors:

```bash
pnpm build
pnpm check
pnpm test
```

### 3. Review Environment Variables

Verify all required environment variables are set in Manus:

- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session signing secret
- `VITE_APP_ID` - OAuth application ID
- `OAUTH_SERVER_URL` - OAuth server URL
- `VITE_OAUTH_PORTAL_URL` - OAuth portal URL
- `BUILT_IN_FORGE_API_URL` - Manus API URL
- `BUILT_IN_FORGE_API_KEY` - Manus API key

### 4. Publish to Manus

1. Open the Management UI
2. Click the **Publish** button (top-right)
3. Review deployment settings:
   - **Hosting Mode**: Autoscale (recommended) or Reserved
   - **Domain**: Configure custom domain if needed
   - **SSL**: Automatically enabled
4. Click **Deploy**
5. Wait for deployment to complete (usually 2-5 minutes)

### 5. Verify Deployment

After deployment:

1. Visit your live URL
2. Test the evidence dossier display
3. Verify admin dashboard access
4. Test export functionality
5. Check all links and navigation

### 6. Configure Custom Domain (Optional)

1. Go to Management UI → Settings → Domains
2. Click "Add Domain"
3. Choose:
   - **Manus Subdomain**: `yourname.manus.space` (free)
   - **Custom Domain**: Your own domain (requires DNS setup)
4. Follow DNS configuration instructions
5. Verify domain is active

## Hosting Options

### Autoscale (Recommended)
- **Cost**: Pay-per-use, scales automatically
- **Best for**: Variable traffic, development/testing
- **Instances**: Scale from 0 to many
- **Startup**: ~5-10 seconds when cold
- **Ideal for**: This evidence website

### Reserved
- **Cost**: Fixed monthly fee
- **Best for**: High-traffic production sites
- **Instances**: Always running
- **Startup**: Immediate
- **Ideal for**: High-traffic public sites

## Post-Deployment

### Monitor Performance

1. Go to Management UI → Dashboard
2. Monitor metrics:
   - Page views (UV/PV)
   - Error rates
   - Response times
   - Database connections

### Set Up Alerts

1. Go to Settings → Notifications
2. Configure alerts for:
   - High error rates
   - Database connection issues
   - Deployment failures

### Enable Analytics

1. Analytics are automatically enabled
2. View traffic data in Dashboard
3. Track user behavior and page views

## Rollback Procedure

If deployment causes issues:

1. Go to Management UI → Version History
2. Find the previous working version
3. Click **Rollback**
4. Confirm rollback
5. Verify site is working

Or use the command line:

```bash
webdev_rollback_checkpoint <version_id>
```

## Updating After Deployment

### Making Changes

1. Make code changes locally
2. Test with `pnpm dev`
3. Create a new checkpoint: `webdev_save_checkpoint`
4. Click **Publish** in Management UI
5. Deploy to production

### Database Migrations

For schema changes:

1. Update `drizzle/schema.ts`
2. Run `pnpm db:push` locally
3. Test migrations
4. Commit and push to GitHub
5. Deploy with checkpoint

## Troubleshooting

### Site Not Loading

1. Check Management UI → Dashboard for errors
2. Review logs in `.manus-logs/`
3. Verify database connection
4. Check environment variables
5. Try rollback to previous version

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check MySQL credentials in Manus
3. Ensure database is running
4. Run `pnpm db:push` to verify schema

### Export Failures

1. Check cloud storage credentials
2. Verify S3 bucket access
3. Review server logs
4. Check file permissions

### Performance Issues

1. Monitor Dashboard metrics
2. Check database query performance
3. Review browser network tab
4. Consider upgrading to Reserved hosting

## Monitoring & Maintenance

### Daily Tasks
- Monitor error rates
- Check user feedback
- Review analytics

### Weekly Tasks
- Review performance metrics
- Check for security updates
- Test backup/restore procedures

### Monthly Tasks
- Review and optimize database queries
- Update dependencies
- Audit access logs
- Plan feature releases

## Scaling Considerations

### When to Upgrade to Reserved

- Consistent traffic > 1000 requests/minute
- Need for guaranteed uptime
- Real-time features requiring persistent connections
- High-traffic public site

### Database Optimization

For large datasets:
- Add database indexes
- Optimize query performance
- Consider read replicas
- Archive old data

### Caching Strategy

- Enable HTTP caching headers
- Use CDN for static assets
- Implement application-level caching
- Cache expensive database queries

## Security Checklist

- [ ] HTTPS enabled (automatic)
- [ ] Environment variables secured
- [ ] Database credentials protected
- [ ] API keys rotated regularly
- [ ] Admin access restricted
- [ ] Audit logging enabled
- [ ] Regular backups configured
- [ ] Security headers configured

## Support

For deployment issues:
1. Check logs in Management UI
2. Review this guide
3. Contact Manus support: https://help.manus.im

## Related Documentation

- [README.md](./README.md) - Project overview
- [GitHub Integration](./GITHUB_INTEGRATION.md) - GitHub setup
- [API Documentation](./API.md) - API reference

---

**Last Updated:** June 28, 2026

**Deployment Status:** Ready for Production ✓
