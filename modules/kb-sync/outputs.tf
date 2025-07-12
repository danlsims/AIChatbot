output "kb_sync_lambda_arn" {
  description = "ARN of the Knowledge Base sync Lambda function"
  value       = aws_lambda_function.kb_sync_handler.arn
}

output "kb_sync_lambda_name" {
  description = "Name of the Knowledge Base sync Lambda function"
  value       = aws_lambda_function.kb_sync_handler.function_name
}
