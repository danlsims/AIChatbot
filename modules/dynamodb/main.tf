# DynamoDB Tables for Chat History Storage

# Conversations Table
resource "aws_dynamodb_table" "conversations" {
  name           = "${var.app_name}-conversations-${var.env_name}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "user_id"
  range_key      = "conversation_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "conversation_id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  global_secondary_index {
    name     = "ConversationsByDate"
    hash_key = "user_id"
    range_key = "created_at"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${var.app_name}-conversations-${var.env_name}"
    Environment = var.env_name
    Component   = "chat-storage"
    ManagedBy   = "terraform"
  }
}

# Messages Table
resource "aws_dynamodb_table" "messages" {
  name           = "${var.app_name}-messages-${var.env_name}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "conversation_id"
  range_key      = "timestamp"

  attribute {
    name = "conversation_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name     = "MessagesByUser"
    hash_key = "user_id"
    range_key = "timestamp"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${var.app_name}-messages-${var.env_name}"
    Environment = var.env_name
    Component   = "chat-storage"
    ManagedBy   = "terraform"
  }
}

# IAM Role for DynamoDB Access
resource "aws_iam_role" "chat_storage_role" {
  name = "${var.app_name}-chat-storage-role-${var.env_name}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-chat-storage-role-${var.env_name}"
    Environment = var.env_name
    Component   = "chat-storage"
    ManagedBy   = "terraform"
  }
}

# IAM Policy for DynamoDB Access
resource "aws_iam_policy" "chat_storage_policy" {
  name        = "${var.app_name}-chat-storage-policy-${var.env_name}"
  description = "Policy for chat storage DynamoDB access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.conversations.arn,
          aws_dynamodb_table.messages.arn,
          "${aws_dynamodb_table.conversations.arn}/index/*",
          "${aws_dynamodb_table.messages.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-chat-storage-policy-${var.env_name}"
    Environment = var.env_name
    Component   = "chat-storage"
    ManagedBy   = "terraform"
  }
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "chat_storage_policy_attachment" {
  role       = aws_iam_role.chat_storage_role.name
  policy_arn = aws_iam_policy.chat_storage_policy.arn
}

# Update Cognito authenticated role to include DynamoDB permissions
resource "aws_iam_policy" "cognito_dynamodb_policy" {
  name        = "${var.app_name}-cognito-dynamodb-policy-${var.env_name}"
  description = "Policy for Cognito users to access chat DynamoDB tables"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.conversations.arn,
          aws_dynamodb_table.messages.arn,
          "${aws_dynamodb_table.conversations.arn}/index/*",
          "${aws_dynamodb_table.messages.arn}/index/*"
        ]
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-cognito-dynamodb-policy-${var.env_name}"
    Environment = var.env_name
    Component   = "chat-storage"
    ManagedBy   = "terraform"
  }
}
