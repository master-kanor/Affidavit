# Enterprise Infrastructure Setup Guide
## Master Kanor Case Evidence Website - Production Deployment

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Terraform Setup](#terraform-setup)
5. [Credential Rotation](#credential-rotation)
6. [Auto-Revoke Mechanism](#auto-revoke-mechanism)
7. [Connector Configuration](#connector-configuration)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## OVERVIEW

This guide provides step-by-step instructions for setting up enterprise-grade infrastructure with:

- **Infrastructure-as-Code (Terraform)** - Automated AWS resource provisioning
- **Automated Credential Rotation** - 30-day key rotation cycle
- **Auto-Revoke Mechanism** - Automatic credential revocation on anomaly detection
- **Professional Connectors** - GitHub, MongoDB Atlas, Terraform Cloud, OpenRouter
- **Comprehensive Monitoring** - CloudWatch, SNS alerts, audit logging

**Deployment Target:** AWS (us-east-1 region)
**Database:** TiDB Cloud (primary), MongoDB Atlas (backup/audit)
**AI/LLM:** OpenRouter API

---

## ARCHITECTURE

### Infrastructure Components

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Infrastructure                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              VPC (10.0.0.0/16)                       │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Public Subnets (3 AZs)                        │  │   │
│  │  │  - us-east-1a: 10.0.0.0/24                    │  │   │
│  │  │  - us-east-1b: 10.0.1.0/24                    │  │   │
│  │  │  - us-east-1c: 10.0.2.0/24                    │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Security Group (App)                          │  │   │
│  │  │  - Inbound: 80, 443 from 0.0.0.0/0            │  │   │
│  │  │  - Outbound: All traffic                       │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Internet Gateway                              │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Secrets Manager                                     │   │
│  │  ├─ OpenRouter API Key (30-day rotation)           │   │
│  │  ├─ MongoDB Atlas URI (30-day rotation)            │   │
│  │  └─ TiDB Database URL (30-day rotation)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Lambda Function: Credential Rotation               │   │
│  │  ├─ Triggered: Every 30 days (EventBridge)         │   │
│  │  ├─ Anomaly Detection: CloudWatch metrics          │   │
│  │  ├─ Auto-Revoke: On suspicious activity            │   │
│  │  └─ Notifications: SNS alerts                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Monitoring & Logging                               │   │
│  │  ├─ CloudWatch Logs: Rotation history              │   │
│  │  ├─ CloudWatch Metrics: Error tracking             │   │
│  │  ├─ CloudWatch Alarms: Failure alerts              │   │
│  │  └─ SNS Topic: Email notifications                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘

External Services:
├─ TiDB Cloud (Primary Database)
├─ MongoDB Atlas (Backup/Audit Store)
├─ OpenRouter API (AI/LLM Operations)
├─ GitHub (Code Repository)
└─ Terraform Cloud (State Management)
```

---

## PREREQUISITES

### Required Tools

```bash
# Terraform CLI
terraform version >= 1.0

# AWS CLI
aws --version

# Git
git --version

# Python 3.11+
python3 --version
```

### Required Accounts & Credentials

1. **AWS Account**
   - Access Key ID
   - Secret Access Key
   - Region: us-east-1

2. **Terraform Cloud**
   - Organization: hoopstreet-projects
   - API Token

3. **GitHub**
   - Personal Access Token
   - Repository: master-kanor-evidence

4. **OpenRouter**
   - API Key

5. **MongoDB Atlas**
   - Connection String
   - API Key (for programmatic access)

6. **TiDB Cloud**
   - Database URL
   - API Key

### Environment Setup

```bash
# Set AWS credentials
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"

# Set Terraform credentials
export TF_TOKEN_app_terraform_io="your-terraform-token"

# Set API credentials
export OPENROUTER_API_KEY="your-openrouter-key"
export MONGODB_ATLAS_URI="your-mongodb-uri"
export TIDB_DATABASE_URL="your-tidb-url"
```

---

## TERRAFORM SETUP

### 1. Initialize Terraform

```bash
cd /home/ubuntu/evidence-website/terraform

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Format code
terraform fmt -recursive
```

### 2. Create terraform.tfvars

```bash
# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Required values:**
```hcl
aws_region         = "us-east-1"
environment        = "prod"
alert_email        = "admin@hoopstreet.space"
github_owner       = "hoopstreet-projects"
github_repo        = "master-kanor-evidence"

# Set via environment variables (don't hardcode):
# export TF_VAR_openrouter_api_key="sk-or-..."
# export TF_VAR_mongodb_atlas_uri="mongodb+srv://..."
# export TF_VAR_tidb_database_url="mysql://..."
# export TF_VAR_terraform_token="..."
# export TF_VAR_github_token="ghp_..."
```

### 3. Plan Deployment

```bash
# Generate plan
terraform plan -out=tfplan

# Review changes
terraform show tfplan
```

### 4. Apply Configuration

```bash
# Apply Terraform configuration
terraform apply tfplan

# Save outputs
terraform output -json > terraform-outputs.json
```

### 5. Verify Deployment

```bash
# Check AWS resources
aws ec2 describe-vpcs --region us-east-1
aws secretsmanager list-secrets --region us-east-1
aws lambda list-functions --region us-east-1

# Check Terraform state
terraform state list
terraform state show aws_lambda_function.credential_rotation
```

---

## CREDENTIAL ROTATION

### How It Works

1. **Scheduled Trigger**
   - EventBridge rule triggers every 30 days
   - Lambda function executes credential rotation

2. **Rotation Process**
   - Retrieve current credentials from Secrets Manager
   - Generate new API keys for each service
   - Update secrets with new keys
   - Log rotation event

3. **Anomaly Detection**
   - Monitor CloudWatch metrics for suspicious activity
   - Check for unusual error rates
   - Detect unauthorized access patterns

4. **Auto-Revoke**
   - If anomaly detected, immediately revoke credential
   - Send critical alert to administrators
   - Trigger manual investigation

### Manual Rotation

```bash
# Rotate OpenRouter API key
aws lambda invoke \
  --function-name master-kanor-evidence-credential-rotation \
  --payload '{"service": "openrouter"}' \
  response.json

# Rotate MongoDB credentials
aws lambda invoke \
  --function-name master-kanor-evidence-credential-rotation \
  --payload '{"service": "mongodb"}' \
  response.json

# Rotate TiDB credentials
aws lambda invoke \
  --function-name master-kanor-evidence-credential-rotation \
  --payload '{"service": "tidb"}' \
  response.json
```

### Viewing Rotation History

```bash
# View CloudWatch logs
aws logs tail /aws/lambda/master-kanor-evidence-credential-rotation --follow

# Get specific rotation event
aws logs filter-log-events \
  --log-group-name /aws/lambda/master-kanor-evidence-credential-rotation \
  --filter-pattern "rotations"
```

---

## AUTO-REVOKE MECHANISM

### Anomaly Detection Triggers

The system automatically revokes credentials when:

1. **High Error Rate** (> 10 errors/hour)
   - Indicates potential compromise
   - Severity: MEDIUM

2. **Unusual Access Pattern** (> 20 errors/hour)
   - Indicates active attack
   - Severity: HIGH

3. **Multiple Failed Authentications** (> 5 in 5 minutes)
   - Indicates brute force attempt
   - Severity: CRITICAL

4. **Geographic Anomaly**
   - API accessed from unexpected location
   - Severity: HIGH

### Viewing Auto-Revoke Events

```bash
# Check revoked credentials
aws secretsmanager describe-secret \
  --secret-id master-kanor-evidence/openrouter/api-key

# View revocation reason
aws secretsmanager get-secret-value \
  --secret-id master-kanor-evidence/openrouter/api-key \
  | jq '.SecretString | fromjson | .revoke_reason'
```

### Manual Revocation

```bash
# Manually revoke a credential
aws lambda invoke \
  --function-name master-kanor-evidence-credential-rotation \
  --payload '{"action": "revoke", "service": "openrouter", "reason": "Manual revocation"}' \
  response.json
```

---

## CONNECTOR CONFIGURATION

### GitHub Integration

```bash
# Clone repository
gh repo clone hoopstreet-projects/master-kanor-evidence

# Configure Git
git config user.name "Master Kanor Evidence"
git config user.email "admin@hoopstreet.space"

# Add remote
git remote add origin https://github.com/hoopstreet-projects/master-kanor-evidence.git

# Push to GitHub
git push -u origin main
```

### MongoDB Atlas Integration

```bash
# Test connection
mongosh "mongodb+srv://user:password@cluster.mongodb.net/database"

# Create backup user
mongosh admin --eval "
  db.createUser({
    user: 'backup-user',
    pwd: 'secure-password',
    roles: ['backup', 'restore']
  })
"
```

### Terraform Cloud Integration

```bash
# Authenticate with Terraform Cloud
terraform login

# Create workspace
terraform workspace new production

# Link to Terraform Cloud
terraform workspace select production
```

### OpenRouter Integration

```bash
# Test OpenRouter API
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"

# List available models
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  | jq '.data[] | .id'
```

---

## MONITORING & ALERTS

### CloudWatch Dashboards

```bash
# Create custom dashboard
aws cloudwatch put-dashboard \
  --dashboard-name master-kanor-evidence-monitoring \
  --dashboard-body file://dashboard-config.json
```

### SNS Notifications

```bash
# Subscribe to alerts
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:master-kanor-evidence-credential-alerts \
  --protocol email \
  --notification-endpoint admin@hoopstreet.space

# Test notification
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:master-kanor-evidence-credential-alerts \
  --subject "Test Alert" \
  --message "This is a test notification"
```

### Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| Lambda Errors | > 1 | Page on-call |
| Rotation Failures | > 0 | Investigate immediately |
| Anomalies Detected | > 0 | Review and respond |
| Revocations | > 0 | Critical incident |
| API Latency | > 5s | Investigate |
| Failed Auth | > 5/5min | Block and investigate |

---

## DEPLOYMENT

### Pre-Deployment Checklist

- [ ] AWS credentials configured
- [ ] Terraform Cloud account set up
- [ ] GitHub repository created
- [ ] OpenRouter API key obtained
- [ ] MongoDB Atlas cluster created
- [ ] TiDB Cloud database provisioned
- [ ] terraform.tfvars configured
- [ ] SNS email subscription confirmed
- [ ] Lambda function code reviewed
- [ ] Security groups validated

### Deployment Steps

```bash
# 1. Initialize Terraform
cd terraform
terraform init

# 2. Validate configuration
terraform validate

# 3. Plan deployment
terraform plan -out=tfplan

# 4. Review plan
terraform show tfplan

# 5. Apply configuration
terraform apply tfplan

# 6. Save outputs
terraform output -json > outputs.json

# 7. Verify resources
aws ec2 describe-vpcs
aws secretsmanager list-secrets
aws lambda list-functions

# 8. Test credential rotation
aws lambda invoke \
  --function-name master-kanor-evidence-credential-rotation \
  response.json

# 9. Check logs
aws logs tail /aws/lambda/master-kanor-evidence-credential-rotation

# 10. Confirm SNS alerts
# Check email for test notification
```

### Post-Deployment

```bash
# 1. Document infrastructure
terraform output -json > infrastructure-docs.json

# 2. Set up monitoring
# Create CloudWatch dashboard
# Configure SNS subscriptions
# Set up log retention

# 3. Test failover
# Simulate credential revocation
# Verify auto-recovery

# 4. Schedule maintenance
# Document backup procedures
# Plan disaster recovery

# 5. Train team
# Document procedures
# Create runbooks
# Schedule training
```

---

## TROUBLESHOOTING

### Common Issues

#### 1. Terraform State Lock

```bash
# View lock
terraform force-unlock LOCK_ID

# Or use Terraform Cloud to unlock
```

#### 2. Lambda Function Timeout

```bash
# Increase timeout
aws lambda update-function-configuration \
  --function-name master-kanor-evidence-credential-rotation \
  --timeout 120
```

#### 3. Secrets Manager Access Denied

```bash
# Check IAM policy
aws iam get-role-policy \
  --role-name master-kanor-evidence-credential-rotation-role \
  --policy-name master-kanor-evidence-credential-rotation-policy

# Update policy if needed
```

#### 4. SNS Notifications Not Received

```bash
# Check subscription
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:master-kanor-evidence-credential-alerts

# Confirm subscription in email
# Resend confirmation if needed
```

### Debug Commands

```bash
# View Lambda logs
aws logs tail /aws/lambda/master-kanor-evidence-credential-rotation --follow

# Check Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=master-kanor-evidence-credential-rotation \
  --start-time 2026-07-01T00:00:00Z \
  --end-time 2026-07-05T00:00:00Z \
  --period 3600 \
  --statistics Sum

# Describe Lambda function
aws lambda get-function \
  --function-name master-kanor-evidence-credential-rotation

# Test Lambda locally
sam local invoke CredentialRotationFunction
```

---

## SECURITY BEST PRACTICES

1. **Never commit secrets to Git**
   - Use environment variables
   - Use AWS Secrets Manager
   - Use Terraform Cloud variables

2. **Rotate credentials regularly**
   - Automatic 30-day rotation enabled
   - Manual rotation available
   - Emergency revocation procedures

3. **Monitor access patterns**
   - CloudWatch metrics enabled
   - Anomaly detection active
   - Alert thresholds configured

4. **Implement least privilege**
   - IAM roles restricted
   - Security groups limited
   - VPC isolation enabled

5. **Audit all operations**
   - CloudWatch logs enabled
   - SNS notifications active
   - Rotation history tracked

---

## SUPPORT & MAINTENANCE

### Regular Tasks

- **Daily:** Check CloudWatch dashboards
- **Weekly:** Review credential rotation logs
- **Monthly:** Audit IAM permissions
- **Quarterly:** Test disaster recovery
- **Annually:** Security audit

### Contact Information

- **On-Call:** admin@hoopstreet.space
- **Escalation:** security@hoopstreet.space
- **AWS Support:** [AWS Support Console]
- **Terraform Support:** [Terraform Community]

---

**Enterprise Infrastructure Setup Complete**

**Status:** ✅ Production Ready
**Last Updated:** July 5, 2026
**Maintained By:** hoopstreet-projects
