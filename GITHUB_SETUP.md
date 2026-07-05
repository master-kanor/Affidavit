# GitHub Setup Guide

Complete instructions for setting up GitHub repository and deployment for the Master Kanor Case project.

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Fill in repository details:
   - **Repository name**: `master-kanor-case`
   - **Description**: `Official Affidavit and Evidence Documentation System for Charles Tanauan (Master Kanor)`
   - **Visibility**: Public or Private (your choice)
   - **Initialize with README**: No (we have our own)
3. Click "Create repository"

## Step 2: Push Code to GitHub

```bash
cd /home/ubuntu/evidence-website

# Initialize git if not already done
git init

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/master-kanor-case.git

# Create main branch
git branch -M main

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Master Kanor Case - Official Affidavit & Evidence System"

# Push to GitHub
git push -u origin main
```

## Step 3: Configure GitHub Secrets

For Vercel deployment, add these secrets to your GitHub repository:

1. Go to Repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add the following secrets:

```
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_PROJECT_ID=<your-vercel-project-id>
```

## Step 4: Set Up GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Step 5: Protect Main Branch

1. Go to Repository Settings → Branches
2. Click "Add rule"
3. Configure:
   - **Branch name pattern**: `main`
   - **Require pull request reviews before merging**: Yes
   - **Require status checks to pass**: Yes
   - **Require branches to be up to date**: Yes

## Step 6: Add Branch Protection Rules

1. Require at least 1 approval before merging
2. Dismiss stale pull request approvals
3. Require code owner reviews
4. Require status checks to pass

## Workflow: Making Changes

### For Development
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add your feature description"

# Push to GitHub
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# - Go to repository
# - Click "Compare & pull request"
# - Add description
# - Request reviewers
# - Click "Create pull request"
```

### For Production Deployment
```bash
# After PR is approved and merged to main
# Vercel automatically deploys to production

# Or manually trigger deployment:
git push origin main
```

## Monitoring Deployments

1. Go to Repository → Actions
2. View workflow runs
3. Check deployment status
4. View logs if deployment fails

## Troubleshooting

### Push Rejected
```bash
# Pull latest changes first
git pull origin main

# Then push again
git push origin main
```

### Merge Conflicts
```bash
# Update your branch
git fetch origin
git merge origin/main

# Resolve conflicts in your editor
# Then commit and push
git add .
git commit -m "Resolve merge conflicts"
git push origin your-branch-name
```

## Best Practices

- [ ] Always create feature branches for changes
- [ ] Write descriptive commit messages
- [ ] Create pull requests for code review
- [ ] Require approvals before merging
- [ ] Keep main branch stable
- [ ] Tag releases with version numbers
- [ ] Document breaking changes in PR description

## Next Steps

1. Push code to GitHub
2. Set up Vercel deployment
3. Configure environment variables
4. Enable branch protection
5. Set up GitHub Actions for CI/CD

## Resources

- GitHub Docs: https://docs.github.com
- Git Documentation: https://git-scm.com/doc
- GitHub Actions: https://github.com/features/actions
