variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "openrouter_api_key" {
  description = "OpenRouter API key"
  type        = string
  sensitive   = true
}

variable "mongodb_atlas_uri" {
  description = "MongoDB Atlas connection string"
  type        = string
  sensitive   = true
}

variable "tidb_database_url" {
  description = "TiDB Cloud database URL"
  type        = string
  sensitive   = true
}

variable "terraform_token" {
  description = "Terraform Cloud API token"
  type        = string
  sensitive   = true
}

variable "github_token" {
  description = "GitHub Personal Access Token"
  type        = string
  sensitive   = true
}

variable "alert_email" {
  description = "Email address for SNS alerts"
  type        = string
}
