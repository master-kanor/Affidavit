# Complete Deployment Guide
## Master Kanor Case Evidence Website - Production Ready

---

## 📋 TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Verification & Testing](#verification--testing)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

---

## QUICK START

### Automated Setup (Recommended)

```bash
# Navigate to project directory
cd /home/ubuntu/evidence-website

# Run automated setup script
bash scripts/setup-enterprise-infrastructure.sh
```

This script will:
- ✅ Verify all prerequisites
- ✅ Configure AWS credentials
- ✅ Set up Terraform Cloud
- ✅ Initialize Terraform
- ✅ Plan and apply infrastructure
- ✅ Verify AWS resources
- ✅ Test credential rotation
- ✅ Set up monitoring

---

## PREREQUISITES

### Required Tools

```bash
# Check AWS CLI
aws --version
# Expected: aws-cli/1.45.40 or higher

# Check Terraform
terraform version
# Expected: Terraform v1.9.0 or higher

# Check Git
git --version
# Expected: git version 2.x or higher
```

### Required Accounts

1. **AWS Account**
   - Access Key ID
   - Secret Access Key
   - Region: us-east-1

2. **Terraform Cloud**
   - Organization: hoopstreet-projects
   - API Token: https://app.terraform.io/app/settings/tokens

3. **GitHub**
   - Personal Access Token: https://github.com/settings/tokens
   - Repository: master-kanor-evidence

4. **OpenRouter**
   - API Key: https://openrouter.ai/keys

5. **MongoDB Atlas**
   - Connection String
   - Cluster created

6. **TiDB Cloud**
   - Database URL
   - Cluster created

---

## STEP-BY-STEP DEPLOYMENT

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/hoopstreet-projects/master-kanor-evidence.git
cd master-kanor-evidence

# Verify directory structure
ls -la
# Should see: terraform/, scripts/, .github/workflows/
```

### Step 2: Install Tools

```bash
# AWS CLI
sudo pip3 install awscli

# Terraform
wget https://releases.hashicorp.com/terraform/1.9.0/terraform_1.9.0_linux_amd64.zip
unzip terraform_1.9.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Verify installation
aws --version
terraform version
```

### Step 3: Configure AWS Credentials

```bash
# Option A: Interactive setup
bash scripts/setup-aws-credentials.sh

# Option B: Manual setup
mkdir -p ~/.aws

# Create credentials file
cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = YOUR_ACCESS_KEY_ID
aws_secret_access_key = YOUR_SECRET_ACCESS_KEY
EOF

# Create config file
cat > ~/.aws/config << EOF
[default]
region = us-east-1
output = json
EOF

# Set permissions
chmod 600 ~/.aws/credentials ~/.aws/config

# Verify credentials
aws sts get-caller-identity
```

### Step 4: Configure Terraform Cloud

```bash
# Authenticate with Terraform Cloud
terraform login

# When prompted, enter your API token:
# https://app.terraform.io/app/settings/tokens

# Verify authentication
terraform cloud -help
```

### Step 5: Set Environment Variables

```bash
# Export credentials as environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"

export TF_TOKEN_app_terraform_io="your-terraform-token"

export TF_VAR_openrouter_api_key="sk-or-..."
export TF_VAR_mongodb_atlas_uri="mongodb+srv://..."
export TF_VAR_tidb_database_url="mysql://..."
export TF_VAR_terraform_token="your-terraform-token"
export TF_VAR_github_token="ghp_..."
export TF_VAR_alert_email="admin@hoopstreet.space"

# Verify variables are set
echo $AWS_ACCESS_KEY_ID
echo $TF_VAR_openrouter_api_key
```

### Step 6: Initialize Terraform

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init -upgrade

# Expected output:
# Terraform has been successfully configured!
```

### Step 7: Validate Configuration

```bash
# Validate Terraform configuration
terraform validate

# Expected output:
# Success! The configuration is valid.

# Format code
terraform fmt -recursive

# Plan deployment
terraform plan -out=tfplan
```

### Step 8: Review Plan

```bash
# Display the plan
terraform show tfplan

# Key resources to verify:
# - aws_vpc.main
# - aws_security_group.app
# - aws_secretsmanager_secret (3x)
# - aws_lambda_function.credential_rotation
# - aws_cloudwatch_event_rule.credential_rotation_schedule
# - aws_sns_topic.credential_alerts
```

### Step 9: Apply Configuration

```bash
# Apply the plan
terraform apply tfplan

# Expected output:
# Apply complete! Resources: XX added, 0 changed, 0 destroyed.

# Save outputs
terraform output -json > ../terraform-outputs.json

# Navigate back
cd ..
```

### Step 10: Verify Deployment

```bash
# Check AWS resources
aws ec2 describe-vpcs --region us-east-1 --query 'Vpcs[?Tags[?Key==`Project`]].VpcId' --output text

# Check Secrets Manager
aws secretsmanager list-secrets --region us-east-1 --query 'SecretList[?contains(Name, `master-kanor-evidence`)].Name' --output text

# Check Lambda function
aws lambda get-function --function-name master-kanor-evidence-credential-rotation --region us-east-1

# Check SNS topic
aws sns list-topics --region us-east-1 --query 'Topics[?contains(TopicArn, `master-kanor-evidence`)].TopicArn' --output text
```

---

## VERIFICATION & TESTING

### Test 1: Verify AWS Credentials

```bash
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "AIDAI...",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/..."
# }
```

### Test 2: Verify Terraform Cloud Connection

```bash
terraform cloud -help

# Should display Terraform Cloud commands
```

### Test 3: Verify AWS Resources

```bash
# List all resources
aws ec2 describe-vpcs --region us-east-1
aws secretsmanager list-secrets --region us-east-1
aws lambda list-functions --region us-east-1
aws sns list-topics --region us-east-1
```

### Test 4: Test Credential Rotation Lambda

```bash
# Invoke Lambda function
aws lambda invoke \
  --function-name master-kanor-evidence-credential-rotation \
  --region us-east-1 \
  response.json

# Check response
cat response.json

# View Lambda logs
aws logs tail /aws/lambda/master-kanor-evidence-credential-rotation --follow --region us-east-1
```

### Test 5: Verify SNS Notifications

```bash
# Get SNS topic ARN
SNS_TOPIC=$(aws sns list-topics --region us-east-1 --query 'Topics[?contains(TopicArn, `master-kanor-evidence`)].TopicArn' --output text | head -1)

# List subscriptions
aws sns list-subscriptions-by-topic --topic-arn $SNS_TOPIC --region us-east-1

# Send test notification
aws sns publish \
  --topic-arn $SNS_TOPIC \
  --subject "Test Notification" \
  --message "This is a test notification from Master Kanor Evidence infrastructure" \
  --region us-east-1

# Check email for notification
```

### Test 6: Verify Secrets Manager

```bash
# Get secret value
aws secretsmanager get-secret-value \
  --secret-id master-kanor-evidence/openrouter/api-key \
  --region us-east-1 \
  --query 'SecretString' \
  --output text | jq .

# Verify secret contains expected fields
# Should have: api_key, endpoint, rotation_enabled, rotation_days
```

### Test 7: Test Credential Rotation

```bash
# Manually trigger rotation
aws lambda invoke \
  --function-name master-kanor-evidence-credential-rotation \
  --payload '{"action": "rotate"}' \
  --region us-east-1 \
  response.json

# Monitor logs
aws logs tail /aws/lambda/master-kanor-evidence-credential-rotation --follow --region us-east-1
```

---

## MONITORING & MAINTENANCE

### CloudWatch Dashboard

```bash
# View dashboard
aws cloudwatch get-dashboard \
  --dashboard-name master-kanor-evidence-monitoring \
  --region us-east-1
```

### Monitor Lambda Execution

```bash
# View Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=master-kanor-evidence-credential-rotation \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum \
  --region us-east-1
```

### View Logs

```bash
# Tail Lambda logs
aws logs tail /aws/lambda/master-kanor-evidence-credential-rotation --follow --region us-east-1

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/master-kanor-evidence-credential-rotation \
  --filter-pattern "ERROR" \
  --region us-east-1
```

### Scheduled Maintenance

```bash
# Check rotation schedule
aws events describe-rule \
  --name master-kanor-evidence-credential-rotation-schedule \
  --region us-east-1

# Update rotation schedule (if needed)
aws events put-rule \
  --name master-kanor-evidence-credential-rotation-schedule \
  --schedule-expression "rate(30 days)" \
  --region us-east-1
```

---

## TROUBLESHOOTING

### Issue: AWS Credentials Not Found

```bash
# Solution 1: Set environment variables
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"

# Solution 2: Configure AWS CLI
aws configure

# Solution 3: Check credentials file
cat ~/.aws/credentials
```

### Issue: Terraform Cloud Authentication Failed

```bash
# Solution: Re-authenticate
terraform login

# Enter your API token when prompted
# Token: https://app.terraform.io/app/settings/tokens
```

### Issue: Lambda Function Not Found

```bash
# Solution 1: Check function exists
aws lambda list-functions --region us-east-1

# Solution 2: Check function name
aws lambda get-function \
  --function-name master-kanor-evidence-credential-rotation \
  --region us-east-1
```

### Issue: SNS Email Not Received

```bash
# Solution 1: Check subscription
SNS_TOPIC=$(aws sns list-topics --region us-east-1 --query 'Topics[?contains(TopicArn, `master-kanor-evidence`)].TopicArn' --output text | head -1)
aws sns list-subscriptions-by-topic --topic-arn $SNS_TOPIC --region us-east-1

# Solution 2: Confirm subscription in email
# Check spam folder for confirmation email

# Solution 3: Re-subscribe
aws sns subscribe \
  --topic-arn $SNS_TOPIC \
  --protocol email \
  --notification-endpoint admin@hoopstreet.space \
  --region us-east-1
```

### Issue: Terraform Plan Shows Errors

```bash
# Solution 1: Validate configuration
cd terraform
terraform validate

# Solution 2: Check variables
terraform plan -var-file=terraform.tfvars

# Solution 3: Check environment variables
echo $TF_VAR_openrouter_api_key
echo $TF_VAR_mongodb_atlas_uri
```

### Issue: Lambda Execution Fails

```bash
# Solution 1: Check Lambda logs
aws logs tail /aws/lambda/master-kanor-evidence-credential-rotation --follow --region us-east-1

# Solution 2: Check Lambda configuration
aws lambda get-function-configuration \
  --function-name master-kanor-evidence-credential-rotation \
  --region us-east-1

# Solution 3: Check IAM role
aws iam get-role-policy \
  --role-name master-kanor-evidence-credential-rotation-role \
  --policy-name master-kanor-evidence-credential-rotation-policy \
  --region us-east-1
```

---

## POST-DEPLOYMENT CHECKLIST

- [ ] AWS credentials configured and verified
- [ ] Terraform Cloud authenticated
- [ ] Infrastructure deployed successfully
- [ ] All AWS resources created
- [ ] Secrets Manager populated
- [ ] Lambda function deployed
- [ ] SNS topic created
- [ ] Email subscription confirmed
- [ ] Credential rotation tested
- [ ] CloudWatch dashboard created
- [ ] Monitoring alerts configured
- [ ] GitHub Actions workflows enabled
- [ ] Documentation updated
- [ ] Team trained on procedures
- [ ] Disaster recovery plan documented

---

## NEXT STEPS

1. **Enable GitHub Actions**
   - Push code to GitHub
   - Enable workflows in repository settings
   - Configure secrets in GitHub Actions

2. **Set Up Monitoring**
   - Create CloudWatch dashboard
   - Configure SNS alerts
   - Set up Slack integration

3. **Test Failover**
   - Simulate credential revocation
   - Verify auto-recovery
   - Test backup procedures

4. **Document Procedures**
   - Create runbooks
   - Document troubleshooting steps
   - Train team members

5. **Schedule Maintenance**
   - Daily: Monitor dashboards
   - Weekly: Review logs
   - Monthly: Test procedures
   - Quarterly: Security audit

---

## SUPPORT

For issues or questions:
- Check ENTERPRISE_SETUP_GUIDE.md
- Review PROFESSIONAL_CONNECTOR_SETUP.md
- Check AWS CloudWatch logs
- Contact: admin@hoopstreet.space

---

**Deployment Guide Complete**

**Status:** ✅ Ready for Production Deployment
**Last Updated:** July 5, 2026
**Maintained By:** hoopstreet-projects
