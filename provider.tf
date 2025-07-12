// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

provider "aws" {
  # Region should be configured via AWS_DEFAULT_REGION environment variable
  # or AWS CLI configuration for cross-account compatibility

  default_tags {
    tags = {
      Environment = var.env_name
      Application = var.app_name
      Project     = "intelligent-rag-bedrock-agent"
      Component   = "chatbot"
      ManagedBy   = "terraform"
      Purpose     = "bedrock-agent-chatbot"
      Owner       = "ai-team"
      CostCenter  = "ai-development"
      CreatedBy   = "terraform"
    }
  }
}