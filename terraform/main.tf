terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "Master-Kanor-Evidence"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "master-kanor-evidence-vpc" }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "master-kanor-evidence-igw" }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "master-kanor-evidence-public-${count.index + 1}" }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block      = "0.0.0.0/0"
    gateway_id      = aws_internet_gateway.main.id
  }
  tags = { Name = "master-kanor-evidence-rt" }
}

resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Group
resource "aws_security_group" "app" {
  name        = "master-kanor-evidence-sg"
  description = "Security group for Master Kanor Evidence"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "master-kanor-evidence-sg" }
}

# Secrets Manager
resource "aws_secretsmanager_secret" "openrouter_key" {
  name                    = "master-kanor-evidence/openrouter/api-key"
  recovery_window_in_days = 7
  tags = { Name = "openrouter-api-key" }
}

resource "aws_secretsmanager_secret_version" "openrouter_key" {
  secret_id = aws_secretsmanager_secret.openrouter_key.id
  secret_string = jsonencode({
    api_key          = var.openrouter_api_key
    endpoint         = "https://openrouter.ai/api/v1"
    rotation_enabled = true
    rotation_days    = 30
  })
}

resource "aws_secretsmanager_secret" "mongodb_uri" {
  name                    = "master-kanor-evidence/mongodb/connection-string"
  recovery_window_in_days = 7
  tags = { Name = "mongodb-connection-string" }
}

resource "aws_secretsmanager_secret_version" "mongodb_uri" {
  secret_id = aws_secretsmanager_secret.mongodb_uri.id
  secret_string = jsonencode({
    connection_string = var.mongodb_atlas_uri
    rotation_enabled  = true
    rotation_days     = 30
  })
}

resource "aws_secretsmanager_secret" "tidb_url" {
  name                    = "master-kanor-evidence/tidb/database-url"
  recovery_window_in_days = 7
  tags = { Name = "tidb-database-url" }
}

resource "aws_secretsmanager_secret_version" "tidb_url" {
  secret_id = aws_secretsmanager_secret.tidb_url.id
  secret_string = jsonencode({
    database_url     = var.tidb_database_url
    rotation_enabled = true
    rotation_days    = 30
  })
}

# IAM Role
resource "aws_iam_role" "lambda_role" {
  name = "master-kanor-evidence-credential-rotation-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = { Name = "lambda-credential-rotation-role" }
}

# IAM Policy
resource "aws_iam_role_policy" "lambda_policy" {
  name = "master-kanor-evidence-credential-rotation-policy"
  role = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:UpdateSecret",
          "secretsmanager:PutSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.openrouter_key.arn,
          aws_secretsmanager_secret.mongodb_uri.arn,
          aws_secretsmanager_secret.tidb_url.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/*"
      },
      {
        Effect = "Allow"
        Action = ["sns:Publish"]
        Resource = aws_sns_topic.credential_alerts.arn
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "credential_rotation" {
  filename      = "lambda_credential_rotation.zip"
  function_name = "master-kanor-evidence-credential-rotation"
  role          = aws_iam_role.lambda_role.arn
  handler       = "lambda_credential_rotation.lambda_handler"
  runtime       = "python3.11"
  timeout       = 60
  memory_size   = 256

  environment {
    variables = {
      OPENROUTER_SECRET_ID = aws_secretsmanager_secret.openrouter_key.id
      MONGODB_SECRET_ID    = aws_secretsmanager_secret.mongodb_uri.id
      TIDB_SECRET_ID       = aws_secretsmanager_secret.tidb_url.id
      SNS_TOPIC_ARN        = aws_sns_topic.credential_alerts.arn
      ALERT_EMAIL          = var.alert_email
    }
  }

  tags = { Name = "credential-rotation-function" }
  depends_on = [aws_iam_role_policy.lambda_policy]
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/master-kanor-evidence-credential-rotation"
  retention_in_days = 30
  tags = { Name = "lambda-credential-rotation-logs" }
}

# EventBridge Rule
resource "aws_cloudwatch_event_rule" "credential_rotation_schedule" {
  name                = "master-kanor-evidence-credential-rotation-schedule"
  description         = "Trigger credential rotation every 30 days"
  schedule_expression = "rate(30 days)"
  is_enabled          = true
  tags = { Name = "credential-rotation-schedule" }
}

# EventBridge Target
resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.credential_rotation_schedule.name
  target_id = "CredentialRotationLambda"
  arn       = aws_lambda_function.credential_rotation.arn
  input     = jsonencode({ action = "rotate" })
}

# Lambda Permission
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.credential_rotation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.credential_rotation_schedule.arn
}

# SNS Topic
resource "aws_sns_topic" "credential_alerts" {
  name = "master-kanor-evidence-credential-alerts"
  tags = { Name = "credential-alerts-topic" }
}

# SNS Subscription
resource "aws_sns_topic_subscription" "credential_alerts_email" {
  topic_arn = aws_sns_topic.credential_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Outputs
output "vpc_id" {
  value = aws_vpc.main.id
}

output "lambda_function_name" {
  value = aws_lambda_function.credential_rotation.function_name
}

output "sns_topic_arn" {
  value = aws_sns_topic.credential_alerts.arn
}
