output "api_gateway_url" {
  description = "API Gateway URL for file uploads"
  value       = "${aws_api_gateway_rest_api.file_upload_api.execution_arn}/prod/upload"
}

output "api_gateway_invoke_url" {
  description = "API Gateway invoke URL for file uploads"
  value       = "https://${aws_api_gateway_rest_api.file_upload_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/prod/upload"
}

output "lambda_function_name" {
  description = "File upload Lambda function name"
  value       = aws_lambda_function.file_upload_handler.function_name
}

data "aws_region" "current" {}
