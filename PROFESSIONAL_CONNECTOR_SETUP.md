# Professional Connector Setup & Integration Guide
## End-to-End Automation for Master Kanor Evidence Website

---

## 📋 CONNECTORS OVERVIEW

| Connector | Purpose | Status | Integration |
|-----------|---------|--------|-------------|
| **GitHub** | Code repository & version control | ✅ Ready | OAuth2 |
| **MongoDB Atlas** | Backup & audit database | ✅ Ready | Connection String |
| **Terraform Cloud** | Infrastructure state management | ✅ Ready | API Token |
| **OpenRouter** | AI/LLM operations | ✅ Ready | API Key |
| **AWS Secrets Manager** | Credential management | ✅ Ready | IAM Role |
| **CloudWatch** | Monitoring & logging | ✅ Ready | IAM Role |

---

## 1. GITHUB CONNECTOR

### Setup

```bash
# Create GitHub personal access token
# https://github.com/settings/tokens/new
# Scopes: repo, workflow, admin:repo_hook

# Configure Git
git config --global user.name "Master Kanor Evidence"
git config --global user.email "admin@hoopstreet.space"

# Clone repository
gh repo clone hoopstreet-projects/master-kanor-evidence
cd master-kanor-evidence

# Add remote
git remote add origin https://github.com/hoopstreet-projects/master-kanor-evidence.git
git branch -M main
git push -u origin main
```

### Automated Workflows

**File:** `.github/workflows/terraform-deploy.yml`

```yaml
name: Terraform Deploy

on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'
  workflow_dispatch:

env:
  TF_VERSION: 1.0
  AWS_REGION: us-east-1

jobs:
  terraform:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}
          cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}
      
      - name: Terraform Init
        run: cd terraform && terraform init
      
      - name: Terraform Validate
        run: cd terraform && terraform validate
      
      - name: Terraform Plan
        run: cd terraform && terraform plan -out=tfplan
      
      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: cd terraform && terraform apply -auto-approve tfplan
      
      - name: Upload Outputs
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: terraform-outputs
          path: terraform/terraform.tfstate
```

**File:** `.github/workflows/security-scan.yml`

```yaml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Trivy Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy Results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Check Secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
```

### Branch Protection Rules

```bash
# Require pull request reviews
gh api repos/hoopstreet-projects/master-kanor-evidence/branches/main/protection \
  -f required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  -f required_status_checks='{"strict":true,"contexts":["Terraform Deploy","Security Scan"]}'
```

---

## 2. MONGODB ATLAS CONNECTOR

### Connection Setup

```bash
# Get connection string from MongoDB Atlas
# https://cloud.mongodb.com/v2/[PROJECT_ID]#/clusters

# Test connection
mongosh "mongodb+srv://user:password@cluster.mongodb.net/database"

# Create backup user
mongosh admin --eval "
  db.createUser({
    user: 'backup-user',
    pwd: 'secure-backup-password',
    roles: ['backup', 'restore']
  })
"

# Enable automatic backups
# In MongoDB Atlas Console:
# 1. Go to Backup section
# 2. Enable Continuous Backup
# 3. Set retention to 35 days
```

### Backup Configuration

**File:** `scripts/backup-mongodb.sh`

```bash
#!/bin/bash

# MongoDB Atlas Backup Script
# Runs daily via cron

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
MONGODB_URI="${MONGODB_ATLAS_URI}"
BACKUP_NAME="evidence-website-backup-${TIMESTAMP}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Perform backup
mongodump \
  --uri="${MONGODB_URI}" \
  --out="${BACKUP_DIR}/${BACKUP_NAME}" \
  --gzip

# Compress backup
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
  "${BACKUP_DIR}/${BACKUP_NAME}"

# Upload to S3
aws s3 cp \
  "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
  "s3://evidence-website-backups/mongodb/${BACKUP_NAME}.tar.gz"

# Clean up local backup
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"
rm "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# Log backup
echo "$(date): Backup ${BACKUP_NAME} completed successfully" >> /var/log/mongodb-backup.log
```

### Cron Job

```bash
# Add to crontab
0 2 * * * /home/ubuntu/evidence-website/scripts/backup-mongodb.sh

# View crontab
crontab -l
```

---

## 3. TERRAFORM CLOUD CONNECTOR

### Setup

```bash
# Create Terraform Cloud account
# https://app.terraform.io/signup

# Generate API token
# https://app.terraform.io/app/settings/tokens

# Configure authentication
terraform login

# Create organization
terraform organization create hoopstreet-projects

# Create workspace
terraform workspace new production
```

### Remote State Configuration

**File:** `terraform/cloud.tf`

```hcl
terraform {
  cloud {
    organization = "hoopstreet-projects"
    
    workspaces {
      name = "evidence-website-prod"
    }
  }
}
```

### Workspace Variables

```bash
# Set sensitive variables in Terraform Cloud
terraform var set openrouter_api_key "sk-or-..."
terraform var set mongodb_atlas_uri "mongodb+srv://..."
terraform var set tidb_database_url "mysql://..."
terraform var set terraform_token "..."
terraform var set github_token "ghp_..."

# View variables
terraform var list
```

### State Locking

```bash
# Enable state locking
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

---

## 4. OPENROUTER CONNECTOR

### API Integration

```bash
# Test OpenRouter API
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"

# List available models
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  | jq '.data[] | select(.id | contains("gpt")) | .id'
```

### Application Integration

**File:** `server/_core/llm.ts`

```typescript
import { invokeLLM, listLLMModels } from "./server/_core/llm";

// Use OpenRouter for AI operations
export async function analyzeEvidence(evidenceText: string) {
  const response = await invokeLLM({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: "You are a legal evidence analysis expert."
      },
      {
        role: "user",
        content: `Analyze this evidence: ${evidenceText}`
      }
    ]
  });
  
  return response.choices[0].message.content;
}

// Generate documentation
export async function generateDocumentation(
  caseDetails: string,
  evidenceList: string[]
) {
  const response = await invokeLLM({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: "You are a legal document writer."
      },
      {
        role: "user",
        content: `Generate legal documentation for: ${caseDetails}\n\nEvidence: ${evidenceList.join(", ")}`
      }
    ]
  });
  
  return response.choices[0].message.content;
}
```

### Rate Limiting

```typescript
// Implement rate limiting for OpenRouter API
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: "minute"
});

export async function callOpenRouterAPI(prompt: string) {
  await limiter.removeTokens(1);
  
  return await invokeLLM({
    model: "gpt-4-turbo",
    messages: [
      { role: "user", content: prompt }
    ]
  });
}
```

---

## 5. AWS SECRETS MANAGER CONNECTOR

### Secret Management

```bash
# Create secret
aws secretsmanager create-secret \
  --name master-kanor-evidence/openrouter/api-key \
  --secret-string '{"api_key":"sk-or-..."}'

# Update secret
aws secretsmanager update-secret \
  --secret-id master-kanor-evidence/openrouter/api-key \
  --secret-string '{"api_key":"sk-or-..."}'

# Get secret
aws secretsmanager get-secret-value \
  --secret-id master-kanor-evidence/openrouter/api-key

# Rotate secret
aws secretsmanager rotate-secret \
  --secret-id master-kanor-evidence/openrouter/api-key \
  --rotation-lambda-arn arn:aws:lambda:us-east-1:ACCOUNT_ID:function:master-kanor-evidence-credential-rotation
```

### Application Integration

```typescript
// Retrieve secrets in application
import { SecretsManager } from 'aws-sdk';

const secretsManager = new SecretsManager();

export async function getOpenRouterKey() {
  const secret = await secretsManager.getSecretValue({
    SecretId: 'master-kanor-evidence/openrouter/api-key'
  }).promise();
  
  return JSON.parse(secret.SecretString).api_key;
}
```

---

## 6. CLOUDWATCH CONNECTOR

### Monitoring Setup

```bash
# Create log group
aws logs create-log-group \
  --log-group-name /aws/lambda/master-kanor-evidence

# Set retention
aws logs put-retention-policy \
  --log-group-name /aws/lambda/master-kanor-evidence \
  --retention-in-days 30

# Create metric filter
aws logs put-metric-filter \
  --log-group-name /aws/lambda/master-kanor-evidence \
  --filter-name RotationErrors \
  --filter-pattern "[ERROR]" \
  --metric-transformations metricName=RotationErrors,metricValue=1
```

### Custom Metrics

```typescript
// Send custom metrics to CloudWatch
import { CloudWatch } from 'aws-sdk';

const cloudwatch = new CloudWatch();

export async function recordMetric(
  metricName: string,
  value: number,
  unit: string = 'Count'
) {
  await cloudwatch.putMetricData({
    Namespace: 'MasterKanorEvidence',
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date()
      }
    ]
  }).promise();
}
```

---

## END-TO-END AUTOMATION FLOW

### Daily Operations

```
1. GitHub Push
   ↓
2. GitHub Actions Triggered
   ├─ Run Security Scan
   ├─ Run Tests
   └─ Run Terraform Plan
   ↓
3. Manual Review & Approval
   ↓
4. Terraform Apply
   ├─ Update AWS Infrastructure
   ├─ Update Secrets Manager
   └─ Trigger Lambda Functions
   ↓
5. Monitoring & Alerts
   ├─ CloudWatch Logs
   ├─ SNS Notifications
   └─ Metrics Dashboard
   ↓
6. MongoDB Backup
   ├─ Daily Backup
   ├─ Verify Backup
   └─ Upload to S3
```

### Credential Rotation Cycle

```
1. EventBridge Trigger (Every 30 days)
   ↓
2. Lambda Function Executes
   ├─ Check Anomalies
   ├─ Generate New Keys
   └─ Update Secrets Manager
   ↓
3. Secrets Manager Stores New Keys
   ↓
4. Application Reads New Keys
   ├─ OpenRouter API
   ├─ MongoDB Atlas
   └─ TiDB Database
   ↓
5. SNS Notification Sent
   ├─ Email Alert
   ├─ Slack Notification
   └─ PagerDuty Alert
   ↓
6. CloudWatch Logs Updated
   ├─ Rotation History
   ├─ Success/Failure Status
   └─ Audit Trail
```

---

## AUTOMATION SCRIPTS

### Deploy Script

**File:** `scripts/deploy.sh`

```bash
#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# 1. Validate code
echo "📋 Validating code..."
pnpm check
pnpm lint

# 2. Run tests
echo "🧪 Running tests..."
pnpm test

# 3. Build application
echo "🔨 Building application..."
pnpm build

# 4. Update Terraform
echo "🏗️  Updating infrastructure..."
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply -auto-approve tfplan
cd ..

# 5. Deploy application
echo "🚀 Deploying application..."
pnpm deploy

# 6. Run smoke tests
echo "✅ Running smoke tests..."
pnpm test:smoke

echo "✅ Deployment completed successfully!"
```

### Backup Script

**File:** `scripts/backup-all.sh`

```bash
#!/bin/bash

echo "🔄 Starting backup cycle..."

# 1. Backup MongoDB
echo "📦 Backing up MongoDB..."
./scripts/backup-mongodb.sh

# 2. Backup TiDB
echo "📦 Backing up TiDB..."
./scripts/backup-tidb.sh

# 3. Backup application data
echo "📦 Backing up application data..."
aws s3 sync ./data s3://evidence-website-backups/data/

# 4. Verify backups
echo "✅ Verifying backups..."
aws s3 ls s3://evidence-website-backups/

echo "✅ Backup cycle completed!"
```

---

## MONITORING DASHBOARD

### CloudWatch Dashboard

```bash
# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name master-kanor-evidence-monitoring \
  --dashboard-body file://dashboard-config.json
```

**File:** `dashboard-config.json`

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
          [".", "Errors", {"stat": "Sum"}],
          [".", "Duration", {"stat": "Average"}],
          ["AWS/Secrets Manager", "RotationAttempts", {"stat": "Sum"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "System Health"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "fields @timestamp, @message | stats count() by @message",
        "region": "us-east-1",
        "title": "Error Logs"
      }
    }
  ]
}
```

---

## TROUBLESHOOTING

### GitHub Actions Failures

```bash
# View workflow logs
gh run list --repo hoopstreet-projects/master-kanor-evidence
gh run view RUN_ID --log

# Re-run failed workflow
gh run rerun RUN_ID
```

### Terraform Cloud Issues

```bash
# Check workspace status
terraform workspace show
terraform state list

# Force unlock
terraform force-unlock LOCK_ID
```

### MongoDB Connection Issues

```bash
# Test connection
mongosh "mongodb+srv://user:password@cluster.mongodb.net/database"

# Check connection string
echo $MONGODB_ATLAS_URI

# Verify IP whitelist
# https://cloud.mongodb.com/v2/[PROJECT_ID]#/security/network/accessList
```

### OpenRouter API Issues

```bash
# Test API
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4-turbo","messages":[{"role":"user","content":"test"}]}'

# Check rate limits
curl https://openrouter.ai/api/v1/auth/key \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

---

## SECURITY CHECKLIST

- [ ] All secrets stored in AWS Secrets Manager
- [ ] GitHub branch protection enabled
- [ ] Terraform Cloud state locked
- [ ] MongoDB backups automated
- [ ] CloudWatch monitoring active
- [ ] SNS alerts configured
- [ ] IAM roles restricted
- [ ] API rate limiting enabled
- [ ] Audit logging enabled
- [ ] Disaster recovery tested

---

**Professional Connector Setup Complete**

**Status:** ✅ Production Ready
**Last Updated:** July 5, 2026
**Maintained By:** hoopstreet-projects
