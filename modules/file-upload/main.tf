data "archive_file" "file_upload_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.root}/lambda/file-upload-handler"
  output_path = "${path.root}/lambda/file-upload-handler.zip"
}

resource "aws_lambda_function" "file_upload_handler" {
  filename         = data.archive_file.file_upload_lambda_zip.output_path
  function_name    = "file-upload-handler-${var.app_name}-${var.env_name}"
  role            = var.lambda_role_arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.file_upload_lambda_zip.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30  # Reduced timeout since we're not syncing KB here

  environment {
    variables = {
      KB_BUCKET = var.kb_bucket_name
      # Removed KB sync variables since sync is handled by separate Lambda
    }
  }

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [aws_security_group.file_upload_lambda_sg.id]
  }

  tags = {
    Name = "file-upload-handler-${var.app_name}-${var.env_name}"
  }
}

resource "aws_security_group" "file_upload_lambda_sg" {
  name_prefix = "file-upload-lambda-sg-"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "file-upload-lambda-sg-${var.app_name}-${var.env_name}"
  }
}

# API Gateway for file upload
resource "aws_api_gateway_rest_api" "file_upload_api" {
  name        = "file-upload-api-${var.app_name}-${var.env_name}"
  description = "API for file uploads to knowledge base"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "upload_resource" {
  rest_api_id = aws_api_gateway_rest_api.file_upload_api.id
  parent_id   = aws_api_gateway_rest_api.file_upload_api.root_resource_id
  path_part   = "upload"
}

resource "aws_api_gateway_method" "upload_method" {
  rest_api_id   = aws_api_gateway_rest_api.file_upload_api.id
  resource_id   = aws_api_gateway_resource.upload_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "upload_options" {
  rest_api_id   = aws_api_gateway_rest_api.file_upload_api.id
  resource_id   = aws_api_gateway_resource.upload_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "upload_integration" {
  rest_api_id = aws_api_gateway_rest_api.file_upload_api.id
  resource_id = aws_api_gateway_resource.upload_resource.id
  http_method = aws_api_gateway_method.upload_method.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.file_upload_handler.invoke_arn
}

resource "aws_api_gateway_integration" "upload_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.file_upload_api.id
  resource_id = aws_api_gateway_resource.upload_resource.id
  http_method = aws_api_gateway_method.upload_options.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "upload_options_200" {
  rest_api_id = aws_api_gateway_rest_api.file_upload_api.id
  resource_id = aws_api_gateway_resource.upload_resource.id
  http_method = aws_api_gateway_method.upload_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "upload_options_integration_response" {
  depends_on = [aws_api_gateway_integration.upload_options_integration]
  
  rest_api_id = aws_api_gateway_rest_api.file_upload_api.id
  resource_id = aws_api_gateway_resource.upload_resource.id
  http_method = aws_api_gateway_method.upload_options.http_method
  status_code = aws_api_gateway_method_response.upload_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_deployment" "file_upload_deployment" {
  depends_on = [
    aws_api_gateway_integration.upload_integration,
    aws_api_gateway_integration.upload_options_integration,
    aws_api_gateway_method_response.upload_options_200,
    aws_api_gateway_integration_response.upload_options_integration_response
  ]

  rest_api_id = aws_api_gateway_rest_api.file_upload_api.id
  stage_name  = "prod"
}

resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.file_upload_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.file_upload_api.execution_arn}/*/*"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "file_upload_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.file_upload_handler.function_name}"
  retention_in_days = 14
}
