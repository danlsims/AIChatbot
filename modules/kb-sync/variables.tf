variable "app_name" {
  description = "Application name"
  type        = string
}

variable "env_name" {
  description = "Environment name"
  type        = string
}

variable "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  type        = string
}

variable "kb_id" {
  description = "Knowledge Base ID"
  type        = string
}

variable "kb_data_source_id" {
  description = "Knowledge Base Data Source ID"
  type        = string
}

variable "kb_bucket_name" {
  description = "Knowledge Base S3 bucket name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs"
  type        = list(string)
}
