# KMS Module for Bedrock Agent Infrastructure

# Get current AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.app_name}-${var.env_name} Bedrock Agent infrastructure"
  deletion_window_in_days = var.deletion_window_in_days
  enable_key_rotation     = var.enable_key_rotation

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow use of the key for Bedrock services"
        Effect = "Allow"
        Principal = {
          Service = [
            "bedrock.amazonaws.com",
            "aoss.amazonaws.com",
            "s3.amazonaws.com",
            "lambda.amazonaws.com",
            "logs.amazonaws.com"
          ]
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow attachment of persistent resources"
        Effect = "Allow"
        Principal = {
          Service = [
            "bedrock.amazonaws.com",
            "aoss.amazonaws.com",
            "s3.amazonaws.com",
            "lambda.amazonaws.com",
            "logs.amazonaws.com"
          ]
        }
        Action = [
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = "true"
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name      = "${var.app_name}-${var.env_name}-kms-key"
    Purpose   = "encryption"
    Component = "chatbot-security"
    KeyType   = "customer-managed"
    Service   = "kms"
  })
}

# KMS Key Alias
resource "aws_kms_alias" "main" {
  name          = "alias/${var.app_name}-${var.env_name}-bedrock-key"
  target_key_id = aws_kms_key.main.key_id
}
