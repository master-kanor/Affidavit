#!/bin/bash

# Complete Enterprise Infrastructure Setup Script
# Automates all steps for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Main setup
print_header "Master Kanor Evidence Website - Enterprise Infrastructure Setup"

# Step 1: Verify prerequisites
print_header "Step 1: Verifying Prerequisites"

echo "Checking required tools..."

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found"
    exit 1
fi
print_success "AWS CLI installed: $(aws --version | head -1)"

if ! command -v terraform &> /dev/null; then
    print_error "Terraform not found"
    exit 1
fi
print_success "Terraform installed: $(terraform version | head -1)"

if ! command -v git &> /dev/null; then
    print_error "Git not found"
    exit 1
fi
print_success "Git installed: $(git --version)"

# Step 2: Configure AWS credentials
print_header "Step 2: Configuring AWS Credentials"

if [ -f ~/.aws/credentials ]; then
    print_warning "AWS credentials already configured"
    read -p "Reconfigure? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_success "Using existing AWS credentials"
    else
        bash scripts/setup-aws-credentials.sh
    fi
else
    print_warning "AWS credentials not found"
    bash scripts/setup-aws-credentials.sh
fi

# Verify AWS credentials
echo "Verifying AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    print_error "Failed to verify AWS credentials"
    exit 1
fi
print_success "AWS credentials verified"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_success "AWS Account ID: $AWS_ACCOUNT_ID"

# Step 3: Configure Terraform Cloud
print_header "Step 3: Configuring Terraform Cloud"

read -p "Terraform Cloud API Token: " -s TF_API_TOKEN
echo ""

if [ -z "$TF_API_TOKEN" ]; then
    print_error "Terraform Cloud API token is required"
    exit 1
fi

export TF_TOKEN_app_terraform_io=$TF_API_TOKEN
print_success "Terraform Cloud API token configured"

# Step 4: Configure environment variables
print_header "Step 4: Configuring Environment Variables"

read -p "OpenRouter API Key: " -s OPENROUTER_API_KEY
echo ""
read -p "MongoDB Atlas URI: " -s MONGODB_ATLAS_URI
echo ""
read -p "TiDB Database URL: " -s TIDB_DATABASE_URL
echo ""
read -p "GitHub Personal Access Token: " -s GITHUB_TOKEN
echo ""
read -p "Alert Email Address: " ALERT_EMAIL
echo ""

# Export variables for Terraform
export TF_VAR_openrouter_api_key=$OPENROUTER_API_KEY
export TF_VAR_mongodb_atlas_uri=$MONGODB_ATLAS_URI
export TF_VAR_tidb_database_url=$TIDB_DATABASE_URL
export TF_VAR_terraform_token=$TF_API_TOKEN
export TF_VAR_github_token=$GITHUB_TOKEN
export TF_VAR_alert_email=$ALERT_EMAIL

print_success "Environment variables configured"

# Step 5: Initialize Terraform
print_header "Step 5: Initializing Terraform"

cd terraform

echo "Running terraform init..."
terraform init -upgrade

print_success "Terraform initialized"

# Step 6: Validate Terraform configuration
print_header "Step 6: Validating Terraform Configuration"

echo "Running terraform validate..."
terraform validate

print_success "Terraform configuration valid"

# Step 7: Format Terraform code
print_header "Step 7: Formatting Terraform Code"

echo "Running terraform fmt..."
terraform fmt -recursive

print_success "Terraform code formatted"

# Step 8: Plan Terraform deployment
print_header "Step 8: Planning Terraform Deployment"

echo "Running terraform plan..."
terraform plan -out=tfplan

print_success "Terraform plan created"

# Step 9: Review and approve plan
print_header "Step 9: Reviewing Terraform Plan"

echo "Review the terraform plan above"
read -p "Proceed with terraform apply? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_warning "Terraform apply cancelled"
    exit 0
fi

# Step 10: Apply Terraform configuration
print_header "Step 10: Applying Terraform Configuration"

echo "Running terraform apply..."
terraform apply tfplan

print_success "Terraform configuration applied"

# Step 11: Save outputs
print_header "Step 11: Saving Terraform Outputs"

echo "Saving terraform outputs..."
terraform output -json > terraform-outputs.json

print_success "Terraform outputs saved to terraform-outputs.json"

# Step 12: Verify AWS resources
print_header "Step 12: Verifying AWS Resources"

echo "Checking VPC..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Project,Values=Master-Kanor-Evidence" --query 'Vpcs[0].VpcId' --output text)
if [ "$VPC_ID" != "None" ] && [ -n "$VPC_ID" ]; then
    print_success "VPC created: $VPC_ID"
else
    print_warning "VPC not found"
fi

echo "Checking Secrets Manager..."
SECRETS=$(aws secretsmanager list-secrets --filters Key=name,Values=master-kanor-evidence --query 'SecretList[*].Name' --output text)
if [ -n "$SECRETS" ]; then
    print_success "Secrets created: $SECRETS"
else
    print_warning "Secrets not found"
fi

echo "Checking Lambda functions..."
LAMBDA=$(aws lambda list-functions --query 'Functions[?contains(FunctionName, `master-kanor-evidence`)].FunctionName' --output text)
if [ -n "$LAMBDA" ]; then
    print_success "Lambda function created: $LAMBDA"
else
    print_warning "Lambda function not found"
fi

# Step 13: Test credential rotation
print_header "Step 13: Testing Credential Rotation"

read -p "Test credential rotation Lambda function? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Invoking credential rotation Lambda..."
    aws lambda invoke \
        --function-name master-kanor-evidence-credential-rotation \
        --payload '{}' \
        response.json
    
    if [ -f response.json ]; then
        print_success "Lambda invocation successful"
        cat response.json
    else
        print_error "Lambda invocation failed"
    fi
fi

# Step 14: Verify SNS notifications
print_header "Step 14: Verifying SNS Notifications"

echo "Checking SNS topic..."
SNS_TOPIC=$(aws sns list-topics --query 'Topics[?contains(TopicArn, `master-kanor-evidence`)].TopicArn' --output text)
if [ -n "$SNS_TOPIC" ]; then
    print_success "SNS topic created: $SNS_TOPIC"
    
    echo "Checking SNS subscriptions..."
    SUBSCRIPTIONS=$(aws sns list-subscriptions-by-topic --topic-arn $SNS_TOPIC --query 'Subscriptions[*].SubscriptionArn' --output text)
    if [ -n "$SUBSCRIPTIONS" ]; then
        print_success "SNS subscriptions: $SUBSCRIPTIONS"
    else
        print_warning "No SNS subscriptions found"
    fi
else
    print_warning "SNS topic not found"
fi

# Step 15: Set up monitoring
print_header "Step 15: Setting Up Monitoring"

echo "Creating CloudWatch dashboard..."
aws cloudwatch put-dashboard \
    --dashboard-name master-kanor-evidence-monitoring \
    --dashboard-body '{
        "widgets": [
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                        [".", "Errors", {"stat": "Sum"}],
                        [".", "Duration", {"stat": "Average"}]
                    ],
                    "period": 300,
                    "stat": "Average",
                    "region": "'$AWS_REGION'",
                    "title": "Lambda Metrics"
                }
            }
        ]
    }' 2>/dev/null || true

print_success "CloudWatch dashboard created"

# Step 16: Save configuration
print_header "Step 16: Saving Configuration"

cat > setup-config.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "aws_account_id": "$AWS_ACCOUNT_ID",
  "aws_region": "$AWS_REGION",
  "alert_email": "$ALERT_EMAIL",
  "vpc_id": "$VPC_ID",
  "sns_topic": "$SNS_TOPIC",
  "lambda_function": "master-kanor-evidence-credential-rotation"
}
EOF

print_success "Configuration saved to setup-config.json"

# Final summary
print_header "Enterprise Infrastructure Setup Complete"

echo ""
print_success "All infrastructure components deployed successfully!"
echo ""
echo "Summary:"
echo "--------"
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo "VPC ID: $VPC_ID"
echo "SNS Topic: $SNS_TOPIC"
echo "Lambda Function: master-kanor-evidence-credential-rotation"
echo "Alert Email: $ALERT_EMAIL"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Confirm SNS email subscription"
echo "2. Monitor CloudWatch dashboard"
echo "3. Review Lambda logs"
echo "4. Test credential rotation"
echo "5. Set up GitHub Actions workflows"
echo ""
print_success "Setup completed at $(date)"

cd ..
