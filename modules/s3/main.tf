// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

# Random suffix for bucket names to ensure global uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket" "sample_kb_bucket" {
  bucket        = "${var.kb_bucket_name_prefix}-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = merge(var.common_tags, {
    Name       = "${var.kb_bucket_name_prefix}-${random_string.bucket_suffix.result}"
    Purpose    = "knowledge-base-storage"
    Component  = "chatbot-knowledge-base"
    BucketType = "knowledge-base"
    DataType   = "documents"
  })
}

resource "aws_s3_bucket" "sample_kb_logging_bucket" {
  bucket        = "${var.log_bucket_name_prefix}-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = merge(var.common_tags, {
    Name       = "${var.log_bucket_name_prefix}-${random_string.bucket_suffix.result}"
    Purpose    = "access-logging"
    Component  = "chatbot-logging"
    BucketType = "access-logs"
    DataType   = "logs"
  })
}

# S3 bucket public access block for knowledge base bucket
resource "aws_s3_bucket_public_access_block" "kb_bucket_pab" {
  bucket = aws_s3_bucket.sample_kb_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket public access block for logging bucket
resource "aws_s3_bucket_public_access_block" "kb_logging_bucket_pab" {
  bucket = aws_s3_bucket.sample_kb_logging_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "sample_kb_bucket_encryption_configurations" {
  bucket = aws_s3_bucket.sample_kb_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_id
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "sample_log_bucket_encryption_configurations" {
  bucket = aws_s3_bucket.sample_kb_logging_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_id
    }
  }
}

resource "aws_s3_bucket_versioning" "sample_kb_bucket_version" {
  bucket = aws_s3_bucket.sample_kb_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
  depends_on = [aws_s3_bucket_server_side_encryption_configuration.sample_kb_bucket_encryption_configurations]
}


resource "aws_s3_bucket_logging" "sample_kb_bucket_logging" {
  count         = var.enable_access_logging ? 1 : 0
  bucket        = aws_s3_bucket.sample_kb_bucket.id
  target_bucket = aws_s3_bucket.sample_kb_logging_bucket.id
  target_prefix = var.kb_bucket_log_bucket_directory_prefix
}


resource "aws_s3_bucket_lifecycle_configuration" "sample_kb_bucket_lifecycle" {
  count  = var.enable_s3_lifecycle_policies ? 1 : 0
  bucket = aws_s3_bucket.sample_kb_bucket.id

  rule {
    id     = "ABORT_INCOMPLETE_UPLOADS"
    status = "Enabled"

    filter {
      prefix = ""
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 3
    }
  }
}


resource "aws_s3_bucket_lifecycle_configuration" "sample_kb_logging_bucket_lifecycle" {
  count  = var.enable_s3_lifecycle_policies ? 1 : 0
  bucket = aws_s3_bucket.sample_kb_logging_bucket.id

  rule {
    id     = "ABORT_INCOMPLETE_UPLOADS"
    status = "Enabled"

    filter {
      prefix = ""
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 3
    }
  }
}