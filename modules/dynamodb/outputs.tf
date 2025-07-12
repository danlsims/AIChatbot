output "conversations_table_name" {
  description = "Name of the conversations DynamoDB table"
  value       = aws_dynamodb_table.conversations.name
}

output "conversations_table_arn" {
  description = "ARN of the conversations DynamoDB table"
  value       = aws_dynamodb_table.conversations.arn
}

output "messages_table_name" {
  description = "Name of the messages DynamoDB table"
  value       = aws_dynamodb_table.messages.name
}

output "messages_table_arn" {
  description = "ARN of the messages DynamoDB table"
  value       = aws_dynamodb_table.messages.arn
}

output "chat_storage_role_arn" {
  description = "ARN of the chat storage IAM role"
  value       = aws_iam_role.chat_storage_role.arn
}

output "cognito_dynamodb_policy_arn" {
  description = "ARN of the Cognito DynamoDB policy"
  value       = aws_iam_policy.cognito_dynamodb_policy.arn
}
