# Pure Terraform Deployment for Intelligent RAG Bedrock Agent
# This file eliminates the need for bash scripts by handling all deployment logic in Terraform

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.69"
    }
    external = {
      source  = "hashicorp/external"
      version = "2.3.3"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.6.2"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# Common tags for all resources
locals {
  common_tags = {
    Environment = var.env_name
    Application = var.app_name
    Project     = "intelligent-rag-bedrock-agent"
    Component   = "chatbot"
    ManagedBy   = "terraform"
    Purpose     = "bedrock-agent-chatbot"
    Owner       = "ai-team"
    CostCenter  = "ai-development"
    CreatedBy   = "terraform"
    Repository  = "intelligent-rag-bedrockagent-iac"
  }

  # Unique identifier for resource naming
  resource_suffix = "${var.app_name}-${var.env_name}"

  # MIME types for frontend files
  mime_types = {
    ".html"  = "text/html"
    ".css"   = "text/css"
    ".js"    = "application/javascript"
    ".json"  = "application/json"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".gif"   = "image/gif"
    ".svg"   = "image/svg+xml"
    ".ico"   = "image/x-icon"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf"   = "font/ttf"
    ".eot"   = "application/vnd.ms-fontobject"
  }
}

# ============================================================================
# LAMBDA CODE PACKAGING (replaces package-lambda.sh)
# ============================================================================

# Create Lambda function if it doesn't exist
resource "local_file" "lambda_function" {
  count = fileexists("${path.module}/lambda-code/lambda_function.py") ? 0 : 1

  filename = "${path.module}/lambda-code/lambda_function.py"
  content  = <<EOF
import json
import boto3
from datetime import datetime

def lambda_handler(event, context):
    """
    Sample Lambda function for Bedrock Agent Action Group
    This is a placeholder - replace with your actual business logic
    """
    
    # Extract the action and parameters from the event
    action = event.get('actionGroup', '')
    function_name = event.get('function', '')
    parameters = event.get('parameters', {})
    
    print(f"Action: {action}, Function: {function_name}")
    print(f"Parameters: {json.dumps(parameters)}")
    
    # Sample responses based on function name
    if function_name == 'get_fitness_plan':
        response_body = {
            "fitness_plan": "Here's a sample fitness plan: 30 minutes cardio, 20 minutes strength training, 3 times per week.",
            "duration": "4 weeks",
            "difficulty": "beginner"
        }
    elif function_name == 'calculate_bmi':
        weight = float(parameters.get('weight', 70))
        height = float(parameters.get('height', 1.75))
        bmi = weight / (height ** 2)
        response_body = {
            "bmi": round(bmi, 2),
            "category": "normal" if 18.5 <= bmi < 25 else "other",
            "weight": weight,
            "height": height
        }
    elif function_name == 'get_diet_plan':
        response_body = {
            "diet_plan": "Sample diet plan: Balanced meals with proteins, carbs, and vegetables.",
            "calories_per_day": 2000,
            "meals": ["Breakfast", "Lunch", "Dinner", "2 Snacks"]
        }
    else:
        response_body = {
            "message": f"Function {function_name} not implemented yet.",
            "available_functions": ["get_fitness_plan", "calculate_bmi", "get_diet_plan"]
        }
    
    # Return the response in the format expected by Bedrock Agent
    return {
        'statusCode': 200,
        'body': json.dumps({
            'application/json': {
                'body': json.dumps(response_body)
            }
        })
    }
EOF
}

# Create requirements.txt if it doesn't exist
resource "local_file" "lambda_requirements" {
  count = fileexists("${path.module}/lambda-code/requirements.txt") ? 0 : 1

  filename = "${path.module}/lambda-code/requirements.txt"
  content  = <<EOF
boto3>=1.26.0
botocore>=1.29.0
EOF
}

# Install Python dependencies
resource "null_resource" "install_lambda_dependencies" {
  count = var.install_lambda_dependencies ? 1 : 0

  provisioner "local-exec" {
    command = <<EOF
      cd ${path.module}/lambda-code
      if [ -f requirements.txt ]; then
        pip install -r requirements.txt -t . --quiet
      fi
    EOF
  }

  triggers = {
    # Use timestamp to ensure this runs once per deployment
    timestamp = timestamp()
  }

  depends_on = [
    local_file.lambda_function,
    local_file.lambda_requirements
  ]
}

# Package Lambda code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-code"
  output_path = "${path.module}/lambda-code.zip"

  depends_on = [
    local_file.lambda_function,
    local_file.lambda_requirements,
    null_resource.install_lambda_dependencies
  ]
}

# ============================================================================
# CORE INFRASTRUCTURE MODULES
# ============================================================================

# Create core infrastructure components
module "kms" {
  source      = "./modules/kms"
  app_name    = var.app_name
  env_name    = var.env_name
  common_tags = local.common_tags
}

module "vpc" {
  source               = "./modules/vpc"
  app_name             = var.app_name
  env_name             = var.env_name
  vpc_cidr             = var.vpc_cidr
  public_subnet_count  = var.public_subnet_count
  private_subnet_count = var.private_subnet_count
  enable_nat_gateway   = var.enable_nat_gateway
  common_tags          = local.common_tags
}

# Removed lambda_code_bucket module - using local zip files in pure Terraform approach

module "knowledge_base_bucket" {
  source                                = "./modules/s3"
  kb_bucket_name_prefix                 = "kb-${var.app_region}-${var.env_name}"
  log_bucket_name_prefix                = "kb-accesslog-${var.app_region}-${var.env_name}"
  kb_bucket_log_bucket_directory_prefix = "log-${var.app_region}-${var.env_name}"
  kms_key_id                            = module.kms.kms_key_arn
  enable_access_logging                 = var.enable_access_logging
  enable_s3_lifecycle_policies          = var.enable_s3_lifecycle_policies
  vpc_id                                = module.vpc.vpc_id
  common_tags                           = local.common_tags
}

module "roles" {
  source                              = "./modules/roles"
  agent_model_id                      = var.agent_model_id
  knowledge_base_model_id             = var.knowledge_base_model_id
  knowledge_base_bucket_arn           = module.knowledge_base_bucket.arn
  knowledge_base_arn                  = module.bedrock_knowledge_base.knowledge_base_arn
  bedrock_agent_invoke_log_group_name = "agent-invoke-log-${var.agent_name}-${var.app_region}-${var.env_name}"
  kms_key_id                          = module.kms.kms_key_arn
  env_name                            = var.env_name
  app_name                            = var.app_name
  common_tags                         = local.common_tags
}

# DynamoDB module for chat history storage
module "dynamodb" {
  source = "./modules/dynamodb"
  
  app_name               = var.app_name
  env_name               = var.env_name
  cognito_auth_role_name = module.frontend.cognito_auth_role_name
}

# Attach DynamoDB policy to Cognito authenticated role
resource "aws_iam_role_policy_attachment" "cognito_dynamodb_policy_attachment" {
  role       = module.frontend.cognito_auth_role_name
  policy_arn = module.dynamodb.cognito_dynamodb_policy_arn
}

module "aoss" {
  source                  = "./modules/aoss"
  aoss_collection_name    = "${var.aoss_collection_name}-${var.app_region}-${var.env_name}"
  aoss_collection_type    = var.aoss_collection_type
  knowledge_base_role_arn = module.roles.knowledge_base_role_arn
  vpc_id                  = module.vpc.vpc_id
  vpc_subnet_ids          = module.vpc.private_subnet_ids
  kms_key_id              = module.kms.kms_key_arn
  skip_opensearch_index   = var.skip_opensearch_index
  env_name                = var.env_name
  app_name                = var.app_name
  common_tags             = local.common_tags
}

module "bedrock_knowledge_base" {
  source                    = "./modules/bedrock/knowledge_base"
  aoss_collection_arn       = module.aoss.aoss_collection_arn
  knowledge_base_role_arn   = module.roles.knowledge_base_role_arn
  knowledge_base_role       = module.roles.knowledge_base_role_name
  knowledge_base_bucket_arn = module.knowledge_base_bucket.arn
  knowledge_base_model_id   = var.knowledge_base_model_id
  knowledge_base_name       = "${var.knowledge_base_name}-${var.app_region}-${var.env_name}"
  agent_model_id            = var.agent_model_id
  kms_key_id                = module.kms.kms_key_arn
  env_name                  = var.env_name
  app_name                  = var.app_name
  common_tags               = local.common_tags
}

module "bedrock_agent" {
  source                              = "./modules/bedrock/agent"
  agent_name                          = "${var.agent_name}-${var.app_region}-${var.env_name}"
  agent_model_id                      = var.agent_model_id
  agent_role_arn                      = module.roles.bedrock_agent_role_arn
  agent_lambda_role_arn               = module.roles.bedrock_agent_lambda_role_arn
  agent_alias_name                    = "${var.agent_alias_name}-${var.app_region}-${var.env_name}"
  agent_action_group_name             = "${var.agent_action_group_name}-${var.app_region}-${var.env_name}"
  agent_instructions                  = var.agent_instructions
  agent_actiongroup_descrption        = var.agent_actiongroup_descrption
  agent_description                   = var.agent_description
  knowledge_base_arn                  = module.bedrock_knowledge_base.knowledge_base_arn
  knowledge_base_id                   = module.bedrock_knowledge_base.knowledge_base_id
  knowledge_base_bucket               = module.knowledge_base_bucket.name
  bedrock_agent_invoke_log_group_name = "agent-invoke-log-${var.agent_name}-${var.app_region}-${var.env_name}"
  bedrock_agent_invoke_log_group_arn  = module.roles.bedrock_agent_invoke_log_group_role_arn
  lambda_zip_filename                 = var.lambda_zip_filename
  lambda_zip_source_path              = data.archive_file.lambda_zip.output_path
  kb_instructions_for_agent           = var.kb_instructions_for_agent
  vpc_id                              = module.vpc.vpc_id
  cidr_blocks_sg                      = module.vpc.private_subnet_cidrs
  vpc_subnet_ids                      = module.vpc.private_subnet_ids
  kms_key_id                          = module.kms.kms_key_arn
  env_name                            = var.env_name
  app_name                            = var.app_name
  common_tags                         = local.common_tags
}

module "bedrock_guardrail" {
  count                               = var.enable_guardrails ? 1 : 0
  source                              = "./modules/bedrock/agent-guardrails"
  name                                = var.guardrail_name
  blocked_input_messaging             = var.guardrail_blocked_input_messaging
  blocked_outputs_messaging           = var.guardrail_blocked_outputs_messaging
  description                         = var.guardrail_description
  content_policy_config               = var.guardrail_content_policy_config
  sensitive_information_policy_config = var.guardrail_sensitive_information_policy_config
  topic_policy_config                 = var.guardrail_topic_policy_config
  word_policy_config                  = var.guardrail_word_policy_config
  kms_key_id                          = module.kms.kms_key_arn
  common_tags                         = local.common_tags
}

module "vpc_endpoints" {
  source                                = "./modules/endpoints"
  count                                 = var.enable_endpoints ? 1 : 0
  vpc_id                                = module.vpc.vpc_id
  cidr_blocks_sg                        = module.vpc.private_subnet_cidrs
  vpc_subnet_ids                        = module.vpc.private_subnet_ids
  lambda_security_group_id              = module.bedrock_agent.lambda_security_group_id
  enable_cloudwatch_endpoint            = true
  enable_kms_endpoint                   = true
  enable_ssm_endpoint                   = true
  enable_s3_endpoint                    = true
  enable_sqs_endpoint                   = true
  enable_bedrock_endpoint               = true
  enable_bedrock_runtime_endpoint       = true
  enable_bedrock_agent_endpoint         = true
  enable_bedrock_agent_runtime_endpoint = true
  env_name                              = var.env_name
  app_name                              = var.app_name
  common_tags                           = local.common_tags
}

# ============================================================================
# FRONTEND DEPLOYMENT (replaces frontend/deploy.sh)
# ============================================================================

# Frontend infrastructure
module "frontend" {
  source                = "./modules/frontend"
  app_name              = var.app_name
  env_name              = var.env_name
  agent_arn             = module.bedrock_agent.bedrock_agent_arn
  agent_id              = module.bedrock_agent.bedrock_agent_id
  agent_alias_id        = module.bedrock_agent.bedrock_agent_alias_id
  kms_key_arn           = module.kms.kms_key_arn
  app_title             = var.app_title
  app_description       = var.app_description
  app_login_subtitle    = var.app_login_subtitle
  app_input_placeholder = var.app_input_placeholder
  app_tips              = var.app_tips
  app_shortcuts         = var.app_shortcuts
  common_tags           = local.common_tags
}

# File upload infrastructure
module "file_upload" {
  source             = "./modules/file-upload"
  app_name           = var.app_name
  env_name           = var.env_name
  lambda_role_arn    = module.roles.bedrock_agent_lambda_role_arn
  kb_bucket_name     = module.knowledge_base_bucket.name
  kb_id              = module.bedrock_knowledge_base.knowledge_base_id
  kb_data_source_id  = module.bedrock_knowledge_base.knowledge_base_data_source_id
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
}

# Knowledge Base sync infrastructure (S3 event-triggered)
module "kb_sync" {
  source             = "./modules/kb-sync"
  app_name           = var.app_name
  env_name           = var.env_name
  lambda_role_arn    = module.roles.bedrock_agent_lambda_role_arn
  kb_id              = module.bedrock_knowledge_base.knowledge_base_id
  kb_data_source_id  = module.bedrock_knowledge_base.knowledge_base_data_source_id
  kb_bucket_name     = module.knowledge_base_bucket.name
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
}

# Generate frontend configuration file
resource "local_file" "frontend_config" {
  filename = "${path.module}/frontend/src/config.js"
  content  = <<EOF
// Configuration for Bedrock Agent Chatbot
// This file is auto-generated by Terraform
const config = {
  aws: {
    region: '${data.aws_region.current.name}',
    identityPoolId: '${module.frontend.cognito_identity_pool_id}',
  },
  cognito: {
    userPoolId: '${module.frontend.cognito_user_pool_id}',
    userPoolClientId: '${module.frontend.cognito_user_pool_client_id}',
  },
  bedrock: {
    agentId: '${module.bedrock_agent.bedrock_agent_id}',
    agentAliasId: '${module.bedrock_agent.bedrock_agent_alias_id}',
  },
  fileUpload: {
    apiUrl: '${module.file_upload.api_gateway_invoke_url}',
  },
  dynamodb: {
    conversationsTable: '${module.dynamodb.conversations_table_name}',
    messagesTable: '${module.dynamodb.messages_table_name}',
  },
  app: {
    title: '${var.app_title}',
    description: '${var.app_description}',
    loginSubtitle: '${var.app_login_subtitle}',
    inputPlaceholder: '${var.app_input_placeholder}',
    tips: '${var.app_tips}',
    shortcuts: '${var.app_shortcuts}'
  }
};

export default config;
EOF

  depends_on = [
    module.frontend,
    module.bedrock_agent
  ]
}

# Install frontend dependencies
resource "null_resource" "frontend_dependencies" {
  count = var.deploy_frontend ? 1 : 0

  provisioner "local-exec" {
    command = "cd ${path.module}/frontend && npm install"
  }

  triggers = {
    package_json_hash = fileexists("${path.module}/frontend/package.json") ? filemd5("${path.module}/frontend/package.json") : ""
  }
}

# Build frontend
resource "null_resource" "frontend_build" {
  count = var.deploy_frontend ? 1 : 0

  provisioner "local-exec" {
    command = "cd ${path.module}/frontend && npm run build"
  }

  triggers = {
    config_hash       = local_file.frontend_config.content_md5
    package_json_hash = fileexists("${path.module}/frontend/package.json") ? filemd5("${path.module}/frontend/package.json") : ""
    # Add more triggers for source files if needed
  }

  depends_on = [
    local_file.frontend_config,
    null_resource.frontend_dependencies
  ]
}

# Upload frontend files to S3
resource "aws_s3_object" "frontend_files" {
  for_each = var.deploy_frontend && fileexists("${path.module}/frontend/build/index.html") ? fileset("${path.module}/frontend/build", "**/*") : []

  bucket       = module.frontend.frontend_bucket_name
  key          = each.value
  source       = "${path.module}/frontend/build/${each.value}"
  content_type = lookup(local.mime_types, regex("\\.[^.]+$", each.value), "application/octet-stream")
  etag         = filemd5("${path.module}/frontend/build/${each.value}")

  depends_on = [null_resource.frontend_build]
}

# Invalidate CloudFront cache after deployment
resource "null_resource" "cloudfront_invalidation" {
  count = var.deploy_frontend ? 1 : 0

  provisioner "local-exec" {
    command = "aws cloudfront create-invalidation --distribution-id ${module.frontend.cloudfront_distribution_id} --paths '/*'"
  }

  triggers = {
    frontend_files_hash = join(",", [for file in aws_s3_object.frontend_files : file.etag])
  }

  depends_on = [aws_s3_object.frontend_files]
}

# ============================================================================
# USER ACCOUNT CREATION (replaces deploy-with-user.sh functionality)
# ============================================================================

# Create Cognito user if email is provided (using AWS CLI since resource doesn't exist)
resource "null_resource" "create_cognito_user" {
  count = var.user_email != "" ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      aws cognito-idp admin-create-user \
        --user-pool-id ${module.frontend.cognito_user_pool_id} \
        --username ${var.user_email} \
        --user-attributes Name=email,Value=${var.user_email} Name=name,Value="${var.user_name != "" ? var.user_name : var.user_email}" Name=email_verified,Value=true \
        --temporary-password ${var.user_password != "" ? var.user_password : random_password.temp_password[0].result} \
        --message-action SUPPRESS || echo "User may already exist"
    EOT
  }

  depends_on = [module.frontend]
}

# Generate temporary password if not provided
resource "random_password" "temp_password" {
  count   = var.user_email != "" && var.user_password == "" ? 1 : 0
  length  = 12
  special = true
}

# ============================================================================
# AGENT LIFECYCLE MANAGEMENT
# ============================================================================

module "agent_update_lifecycle" {
  source = "./modules/bedrock/agent-lifecycle"
  # Removed code_base_bucket for pure Terraform approach
  ssm_parameter_agent_name                = module.bedrock_agent.ssm_parameter_agent_name
  ssm_parameter_agent_id                  = module.bedrock_agent.ssm_parameter_agent_id
  ssm_parameter_agent_alias               = module.bedrock_agent.ssm_parameter_agent_alias
  ssm_parameter_agent_instruction         = module.bedrock_agent.ssm_parameter_agent_instruction
  ssm_parameter_agent_ag_instruction      = module.bedrock_agent.ssm_parameter_agent_ag_instruction
  ssm_parameter_knowledge_base_id         = module.bedrock_knowledge_base.ssm_parameter_knowledge_base_id
  ssm_parameter_lambda_code_sha           = module.bedrock_agent.ssm_parameter_agent_ag_lambda_sha
  ssm_parameter_agent_instruction_history = module.bedrock_agent.ssm_parameter_agent_instruction_history
  ssm_parameter_kb_instruction_history    = module.bedrock_knowledge_base.ssm_parameter_kb_instruction_history
  lambda_function_name                    = module.bedrock_agent.lambda_function_name
  common_tags                             = local.common_tags

  depends_on = [
    module.knowledge_base_bucket,
    module.roles,
    module.aoss,
    module.bedrock_knowledge_base,
    module.bedrock_agent,
    module.bedrock_guardrail
  ]
}

# ============================================================================
# SAMPLE DATA UPLOAD (Optional)
# ============================================================================

# Upload sample data to knowledge base bucket if enabled
resource "aws_s3_object" "sample_data" {
  for_each = var.upload_sample_data ? fileset("${path.module}/sample-data", "**/*") : []

  bucket = module.knowledge_base_bucket.name
  key    = each.value
  source = "${path.module}/sample-data/${each.value}"
  etag   = filemd5("${path.module}/sample-data/${each.value}")

  depends_on = [module.knowledge_base_bucket]
}
