# Knowledge Base Sync Lambda Function
data "archive_file" "kb_sync_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.root}/lambda/kb-sync-handler"
  output_path = "${path.root}/lambda/kb-sync-handler.zip"
}

resource "aws_lambda_function" "kb_sync_handler" {
  filename         = data.archive_file.kb_sync_lambda_zip.output_path
  function_name    = "kb-sync-handler-${var.app_name}-${var.env_name}"
  role            = var.lambda_role_arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.kb_sync_lambda_zip.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 300  # 5 minutes for knowledge base sync
  memory_size     = 256

  environment {
    variables = {
      KB_ID = var.kb_id
      KB_DATA_SOURCE_ID = var.kb_data_source_id
    }
  }

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [aws_security_group.kb_sync_lambda_sg.id]
  }

  tags = {
    Name        = "kb-sync-handler-${var.app_name}-${var.env_name}"
    Application = var.app_name
    Environment = var.env_name
    Component   = "knowledge-base-sync"
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "kb_sync_lambda_sg" {
  name_prefix = "kb-sync-lambda-sg-"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "kb-sync-lambda-sg-${var.app_name}-${var.env_name}"
  }
}

# S3 Bucket Notification to trigger Lambda
resource "aws_s3_bucket_notification" "kb_bucket_notification" {
  bucket = var.kb_bucket_name

  lambda_function {
    lambda_function_arn = aws_lambda_function.kb_sync_handler.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""
    filter_suffix       = ".pdf"
  }

  depends_on = [aws_lambda_permission.allow_s3_invoke]
}

# Permission for S3 to invoke Lambda
resource "aws_lambda_permission" "allow_s3_invoke" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.kb_sync_handler.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = "arn:aws:s3:::${var.kb_bucket_name}"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "kb_sync_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.kb_sync_handler.function_name}"
  retention_in_days = 14
  
  tags = {
    Application = var.app_name
    Environment = var.env_name
    Component   = "knowledge-base-sync"
  }
}
