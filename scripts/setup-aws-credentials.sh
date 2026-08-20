#!/bin/bash

# AWS Credentials Setup Script
# This script configures AWS CLI with your credentials

set -e

echo "🔐 AWS Credentials Configuration"
echo "================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

# Get AWS credentials from user
echo "Please provide your AWS credentials:"
echo ""

read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -sp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""
read -p "AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

# Configure AWS credentials
mkdir -p ~/.aws

# Create credentials file
cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = $AWS_ACCESS_KEY_ID
aws_secret_access_key = $AWS_SECRET_ACCESS_KEY
EOF

# Create config file
cat > ~/.aws/config << EOF
[default]
region = $AWS_REGION
output = json
EOF

# Set permissions
chmod 600 ~/.aws/credentials
chmod 600 ~/.aws/config

# Verify credentials
echo ""
echo "✅ Verifying AWS credentials..."
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "✅ AWS credentials configured successfully!"
    aws sts get-caller-identity
else
    echo "❌ Failed to verify AWS credentials"
    exit 1
fi

# Export environment variables
export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
export AWS_REGION=$AWS_REGION

echo ""
echo "✅ AWS credentials configured and verified!"
