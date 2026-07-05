# GitHub Integration Guide

This document explains how to set up GitHub integration for the Evidence Website project.

## Overview

The Evidence Website is configured for seamless GitHub integration, allowing you to:
- Export the entire codebase to a GitHub repository
- Maintain version control and commit history
- Enable CI/CD pipelines for automated testing and deployment
- Collaborate with team members
- Track changes and manage releases

## Setup Instructions

### Step 1: Connect GitHub Account

1. Go to the Management UI → Settings → Integrations
2. Click "GitHub" integration
3. Authorize Manus to access your GitHub account
4. Grant necessary permissions (repo, workflow, etc.)

### Step 2: Export to GitHub

1. In the Management UI, click the "⋯" menu (top-right)
2. Select "Export to GitHub"
3. Choose or create a repository:
   - **New Repository**: Enter repository name (e.g., `evidence-website`)
   - **Existing Repository**: Select from your existing repos
4. Choose the owner (personal account or organization)
5. Click "Export"

### Step 3: Repository Structure

After export, your GitHub repository will contain:

```
evidence-website/
├── client/                    # React frontend
├── server/                    # Express backend
├── drizzle/                   # Database schema
├── public/                    # Static assets
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite configuration
├── vitest.config.ts           # Test configuration
├── README.md                  # Project documentation
├── .github/
│   └── workflows/             # CI/CD workflows (if enabled)
└── .gitignore                 # Git ignore rules
```

## Continuous Integration

### Recommended GitHub Actions

Create `.github/workflows/test.yml` for automated testing:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm check
```

### Deployment Workflow

Create `.github/workflows/deploy.yml` for automatic deployment:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Manus
        run: |
          # Deployment script here
          echo "Deploying to Manus..."
```

## Syncing Changes

### From GitHub to Manus

1. Make changes in your GitHub repository
2. Create a pull request and merge to main
3. Manus will automatically detect the changes
4. Review and approve the deployment in Management UI
5. Changes will be deployed to your live site

### From Manus to GitHub

1. Make changes in the Manus Management UI
2. Save a checkpoint with `webdev_save_checkpoint`
3. Go to Settings → Integrations → GitHub
4. Click "Sync to GitHub"
5. Review and merge the pull request in GitHub

## Best Practices

### Commit Messages
Use clear, descriptive commit messages:
- `feat: Add PDF export functionality`
- `fix: Correct evidence gallery layout`
- `docs: Update README with API docs`
- `refactor: Simplify export procedures`

### Branch Strategy
- **main** - Production-ready code
- **develop** - Development branch
- **feature/*** - Feature branches
- **bugfix/*** - Bug fix branches

### Pull Request Process
1. Create a feature branch from develop
2. Make changes and commit with clear messages
3. Create a pull request with description
4. Request review from team members
5. Merge after approval
6. Delete feature branch

## Environment Variables

GitHub Actions can access Manus secrets:

1. Go to GitHub repository → Settings → Secrets and variables
2. Add secrets needed for deployment:
   - `MANUS_API_KEY` - Manus API key
   - `DATABASE_URL` - Database connection string
   - `JWT_SECRET` - Session secret

Reference in workflows:
```yaml
- name: Deploy
  env:
    MANUS_API_KEY: ${{ secrets.MANUS_API_KEY }}
  run: pnpm build
```

## Troubleshooting

### Authorization Issues
- Verify GitHub account is connected in Manus
- Check GitHub token has necessary permissions
- Regenerate token if expired

### Sync Conflicts
- Pull latest changes from GitHub
- Resolve conflicts locally
- Push resolved changes back to GitHub
- Sync again in Manus

### Deployment Failures
- Check GitHub Actions logs for errors
- Verify environment variables are set
- Review deployment logs in Manus dashboard
- Contact support if issues persist

## Advanced Configuration

### Custom Domain
1. Add custom domain in Manus Settings → Domains
2. Update GitHub repository description
3. Add website URL to repository settings

### Webhooks
Set up webhooks for automated notifications:
- Slack integration for deployment status
- Email notifications for failed builds
- Custom webhook endpoints

### Releases
Create releases in GitHub:
1. Tag commits with version numbers (v1.0.0)
2. Create release notes
3. Manus will automatically deploy tagged releases

## Support

For GitHub integration issues:
1. Check GitHub documentation: https://docs.github.com
2. Review Manus documentation: https://docs.manus.im
3. Contact support: https://help.manus.im

## Related Documentation

- [README.md](./README.md) - Project overview
- [Deployment Guide](./DEPLOYMENT.md) - Deployment instructions
- [API Documentation](./API.md) - API reference

---

**Last Updated:** June 28, 2026
