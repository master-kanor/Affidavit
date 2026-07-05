# Master Kanor Case - Complete Setup & Deployment Guide

Complete end-to-end guide for setting up and deploying the Master Kanor Case evidence website.

## Project Overview

**Project Name**: Master Kanor Case - Official Affidavit & Evidence

**Description**: Comprehensive legal documentation system for Charles Tanauan (a.k.a. Master Kanor) featuring:
- 12 affidavit sections with complete narrative
- 2,022 evidence files (images, videos, documents, PDFs)
- Professional admin dashboard with content management
- Multi-format export (JSON, CSV, Markdown, HTML)
- User authentication and role-based access
- Supabase PostgreSQL database
- GitHub version control
- Vercel deployment

## Technology Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Express 4 + tRPC 11 + Node.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Manus OAuth
- **Deployment**: Vercel
- **Version Control**: GitHub
- **Storage**: Cloud-based file storage

## Pre-Deployment Checklist

- [ ] All 2,022 evidence files extracted and verified
- [ ] Supabase account created
- [ ] GitHub account and repository created
- [ ] Vercel account created
- [ ] Environment variables prepared
- [ ] Domain configured (optional)

## Quick Start (5 Steps)

### 1. Set Up Supabase Database

```bash
# Follow SUPABASE_SETUP.md for detailed instructions
# Key steps:
# 1. Create Supabase project at https://supabase.com
# 2. Get connection string
# 3. Update DATABASE_URL in environment variables
# 4. Run migrations: pnpm db:push
```

### 2. Create GitHub Repository

```bash
# Follow GITHUB_SETUP.md for detailed instructions
# Key steps:
# 1. Create repo at https://github.com/new
# 2. Name: master-kanor-case
# 3. Push code: git push -u origin main
```

### 3. Deploy to Vercel

```bash
# Follow VERCEL_DEPLOYMENT.md for detailed instructions
# Key steps:
# 1. Go to https://vercel.com/new
# 2. Import GitHub repository
# 3. Add environment variables
# 4. Deploy
```

### 4. Configure Environment Variables

Required environment variables for production:

```env
# Database (from Supabase)
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]

# Authentication
JWT_SECRET=[generate-strong-secret]
VITE_APP_ID=[your-app-id]
OAUTH_SERVER_URL=[oauth-server-url]
VITE_OAUTH_PORTAL_URL=[oauth-portal-url]

# APIs
BUILT_IN_FORGE_API_URL=[forge-api-url]
BUILT_IN_FORGE_API_KEY=[forge-api-key]
VITE_FRONTEND_FORGE_API_KEY=[frontend-forge-key]
VITE_FRONTEND_FORGE_API_URL=[frontend-forge-url]

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=[analytics-endpoint]
VITE_ANALYTICS_WEBSITE_ID=[analytics-id]
```

### 5. Verify Deployment

```bash
# Visit your live URL
https://master-kanor-case.vercel.app

# Test:
- [ ] Homepage loads
- [ ] Evidence dossier displays
- [ ] Admin dashboard accessible
- [ ] Database connection working
- [ ] Export functionality works
```

## Detailed Setup Guides

### Database Setup
See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for:
- Creating Supabase project
- Configuring connection
- Running migrations
- Setting up security

### GitHub Setup
See [GITHUB_SETUP.md](./GITHUB_SETUP.md) for:
- Creating repository
- Pushing code
- Configuring secrets
- Setting up CI/CD

### Vercel Deployment
See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for:
- Importing project
- Configuring environment
- Custom domain setup
- Monitoring deployment

## Project Structure

```
master-kanor-case/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities
│   │   └── App.tsx           # Main app component
│   ├── public/
│   │   └── evidence/         # 2,022 evidence files
│   └── index.html
├── server/                    # Express backend
│   ├── routers.ts            # tRPC procedures
│   ├── db.ts                 # Database queries
│   └── _core/                # Framework core
├── drizzle/                   # Database schema
│   ├── schema.ts             # Table definitions
│   └── migrations/           # Migration files
├── shared/                    # Shared types
├── README.md                  # Project documentation
├── SUPABASE_SETUP.md         # Database setup guide
├── GITHUB_SETUP.md           # GitHub setup guide
├── VERCEL_DEPLOYMENT.md      # Deployment guide
└── package.json              # Dependencies

```

## Key Features

### Evidence Dossier
- 12 affidavit sections with complete narrative
- Organized evidence galleries (26 folders)
- Professional legal styling
- Responsive design
- Full-text search capability

### Admin Dashboard
- Content management interface
- Multi-format export (JSON, CSV, Markdown, HTML)
- User management
- Audit logging
- Statistics and analytics

### Authentication
- Manus OAuth integration
- Role-based access control (admin/user)
- Secure session management
- User profile management

### Database
- PostgreSQL via Supabase
- Drizzle ORM for type-safe queries
- Automated migrations
- Row-level security (RLS)
- Backup and recovery

## Development Workflow

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Check types
pnpm check
```

### Making Changes

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
# Test locally
pnpm dev

# Commit changes
git add .
git commit -m "Add your feature"

# Push to GitHub
git push origin feature/your-feature

# Create Pull Request on GitHub
# After approval, merge to main
# Vercel automatically deploys
```

## Monitoring & Maintenance

### Daily
- Monitor error rates
- Check user activity
- Review analytics

### Weekly
- Review performance metrics
- Check for security updates
- Test critical flows

### Monthly
- Analyze usage patterns
- Update dependencies
- Review access logs
- Plan feature releases

## Troubleshooting

### Common Issues

**Build Fails**
```bash
# Check logs in Vercel Dashboard
# Verify all environment variables are set
pnpm build  # Test locally
pnpm check  # Check types
```

**Database Connection Issues**
```bash
# Verify DATABASE_URL is correct
# Check Supabase is running
# Verify network access
```

**Evidence Files Not Loading**
```bash
# Verify files are in client/public/evidence/
# Check file permissions
# Verify paths in code
```

## Security Best Practices

- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Use strong database passwords
- [ ] Rotate API keys regularly
- [ ] Enable Row Level Security (RLS)
- [ ] Require authentication for admin features
- [ ] Monitor access logs
- [ ] Regular backups
- [ ] Keep dependencies updated

## Performance Optimization

- Image optimization (Vercel automatic)
- Database query optimization
- Caching strategies
- CDN distribution (Vercel automatic)
- Code splitting
- Lazy loading

## Scaling Considerations

### Current Setup (Free Tier)
- Vercel: 100 GB bandwidth/month
- Supabase: Suitable for most projects
- Good for: Development, testing, small production

### When to Upgrade
- Traffic > 1000 requests/minute
- Need guaranteed uptime
- Real-time features required
- Large data volumes

## Backup & Recovery

### Database Backups
- Supabase: Daily automatic backups (Pro plan)
- Free tier: 7-day retention
- Manual backup: Export via Supabase dashboard

### Code Backups
- GitHub: Automatic version control
- Vercel: Deployment history
- Local: Regular git pulls

## Support & Resources

### Documentation
- [Project README](./README.md)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [GitHub Docs](https://docs.github.com)

### Getting Help
- GitHub Issues: Create issue in repository
- Supabase Support: https://supabase.com/support
- Vercel Support: https://vercel.com/support

## Next Steps

1. **Immediate** (Today)
   - [ ] Create Supabase project
   - [ ] Create GitHub repository
   - [ ] Create Vercel account

2. **Short-term** (This week)
   - [ ] Set up database
   - [ ] Push code to GitHub
   - [ ] Deploy to Vercel
   - [ ] Configure custom domain

3. **Medium-term** (This month)
   - [ ] Set up monitoring
   - [ ] Configure backups
   - [ ] Enable analytics
   - [ ] Set up error tracking

4. **Long-term** (Ongoing)
   - [ ] Monitor performance
   - [ ] Update dependencies
   - [ ] Add new features
   - [ ] Optimize based on usage

## Project Statistics

| Metric | Value |
|--------|-------|
| Evidence Files | 2,022 |
| Affidavit Sections | 12 |
| Evidence Folders | 26 |
| Database Tables | 7 |
| API Endpoints | 15+ |
| Frontend Components | 20+ |
| Code Lines | 5,000+ |

## Contact & Support

For questions or issues:
1. Check relevant setup guide
2. Review documentation
3. Check GitHub Issues
4. Contact project administrator

---

**Last Updated**: June 29, 2026

**Status**: Ready for Production Deployment ✓

**Next Action**: Follow Quick Start guide above
