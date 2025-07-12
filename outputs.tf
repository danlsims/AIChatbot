# Pure Terraform Outputs
# Enhanced outputs for pure Terraform deployment

# ============================================================================
# DEPLOYMENT SUMMARY OUTPUTS
# ============================================================================

output "deployment_summary" {
  description = "Complete deployment summary"
  sensitive   = true
  value = {
    status = "✅ Deployment completed successfully!"

    # Core Infrastructure
    vpc_id     = module.vpc.vpc_id
    kms_key_id = module.kms.kms_key_id
    region     = data.aws_region.current.name

    # Bedrock Agent Information
    agent_id       = module.bedrock_agent.bedrock_agent_id
    agent_name     = module.bedrock_agent.bedrock_agent_name
    agent_arn      = module.bedrock_agent.bedrock_agent_arn
    agent_alias_id = module.bedrock_agent.bedrock_agent_alias_id

    # Knowledge Base Information
    knowledge_base_id     = module.bedrock_knowledge_base.knowledge_base_id
    knowledge_base_name   = module.bedrock_knowledge_base.knowledge_base_name
    knowledge_base_bucket = module.knowledge_base_bucket.name

    # Frontend Information
    frontend_url               = module.frontend.cloudfront_distribution_url
    frontend_bucket            = module.frontend.frontend_bucket_name
    cloudfront_distribution_id = module.frontend.cloudfront_distribution_id

    # Authentication Information
    cognito_user_pool_id        = module.frontend.cognito_user_pool_id
    cognito_identity_pool_id    = module.frontend.cognito_identity_pool_id
    cognito_user_pool_client_id = module.frontend.cognito_user_pool_client_id

    # User Account Information (if created)
    user_created  = var.user_email != "" ? true : false
    user_email    = var.user_email != "" ? var.user_email : "No user created"
    user_password = var.user_email != "" && var.user_password == "" ? "Auto-generated (check Terraform state)" : "User-provided"
  }
}

# ============================================================================
# QUICK ACCESS OUTPUTS
# ============================================================================

output "frontend_url" {
  description = "CloudFront URL for the frontend application"
  value       = module.frontend.cloudfront_distribution_url
}

output "knowledge_base_bucket" {
  description = "S3 bucket name for knowledge base documents"
  value       = module.knowledge_base_bucket.name
}

output "agent_id" {
  description = "Bedrock Agent ID"
  value       = module.bedrock_agent.bedrock_agent_id
}

output "agent_alias_id" {
  description = "Bedrock Agent Alias ID"
  value       = module.bedrock_agent.bedrock_agent_alias_id
}

# ============================================================================
# NEXT STEPS OUTPUT
# ============================================================================

output "next_steps" {
  description = "Next steps after deployment"
  value = {
    step_1 = "📚 Upload knowledge base documents to: ${module.knowledge_base_bucket.name}"
    step_2 = "🚀 Files uploaded via web interface will automatically sync the knowledge base"
    step_3 = "⚙️  Ensure 'user input' is enabled in your Bedrock Agent"
    step_4 = "🌐 Access your chatbot at: ${module.frontend.cloudfront_distribution_url}"
    step_5 = var.user_email != "" ? "🔐 Login with email: ${var.user_email}" : "🔐 Create a user account in Cognito User Pool: ${module.frontend.cognito_user_pool_id}"
    note   = "⚠️  CloudFront distribution may take a few minutes to propagate. Knowledge base sync now happens automatically in the background!"
  }
}

# ============================================================================
# AUTHENTICATION OUTPUTS
# ============================================================================

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.frontend.cognito_user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.frontend.cognito_user_pool_client_id
}

output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool ID"
  value       = module.frontend.cognito_identity_pool_id
}

# ============================================================================
# INFRASTRUCTURE OUTPUTS
# ============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "kms_key_id" {
  description = "KMS Key ID"
  value       = module.kms.kms_key_id
}

output "kms_key_arn" {
  description = "KMS Key ARN"
  value       = module.kms.kms_key_arn
}

# ============================================================================
# BEDROCK AGENT OUTPUTS
# ============================================================================

output "agent_name" {
  description = "Bedrock Agent Name"
  value       = module.bedrock_agent.bedrock_agent_name
}

output "agent_arn" {
  description = "Bedrock Agent ARN"
  value       = module.bedrock_agent.bedrock_agent_arn
}

output "agent_actiongroup_lambda_name" {
  description = "Bedrock Agent Action Group Lambda Name"
  value       = module.bedrock_agent.lambda_function_name
}

output "agent_actiongroup_lambda_arn" {
  description = "Bedrock Agent Action Group Lambda ARN"
  value       = module.bedrock_agent.bedrock_agent_actiongroup_lambda_arn
}

output "bedrock_agent_instruction" {
  description = "Bedrock Agent Instruction"
  value       = var.agent_instructions
}

output "bedrock_agent_action_group_instruction" {
  description = "Bedrock Agent Action Group Instruction"
  value       = var.agent_actiongroup_descrption
}

# ============================================================================
# KNOWLEDGE BASE OUTPUTS
# ============================================================================

output "knowledge_base_id" {
  description = "Knowledge Base ID"
  value       = module.bedrock_knowledge_base.knowledge_base_id
}

output "knowledge_base_name" {
  description = "Knowledge Base Name"
  value       = module.bedrock_knowledge_base.knowledge_base_name
}

output "knowledge_base_arn" {
  description = "Knowledge Base ARN"
  value       = module.bedrock_knowledge_base.knowledge_base_arn
}

output "knowledge_base_data_source_id" {
  description = "Knowledge Base Data Source ID"
  value       = module.bedrock_knowledge_base.knowledge_base_data_source_id
}

# ============================================================================
# OPENSEARCH OUTPUTS
# ============================================================================

output "aoss_collection_id" {
  description = "AOSS Collection ID"
  value       = module.aoss.aoss_collection_id
}

output "aoss_collection_name" {
  description = "AOSS Collection Name"
  value       = module.aoss.aoss_collection_name
}

output "aoss_collection_arn" {
  description = "AOSS Collection ARN"
  value       = module.aoss.aoss_collection_arn
}

# ============================================================================
# FRONTEND OUTPUTS
# ============================================================================

output "frontend_bucket_name" {
  description = "Frontend S3 bucket name"
  value       = module.frontend.frontend_bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID"
  value       = module.frontend.cloudfront_distribution_id
}

output "cloudfront_distribution_url" {
  description = "CloudFront Distribution URL"
  value       = module.frontend.cloudfront_distribution_url
}

# ============================================================================
# GUARDRAILS OUTPUTS
# ============================================================================

output "bedrock_guardrail_id" {
  description = "The ID of the created Bedrock Guardrail"
  value       = var.enable_guardrails ? module.bedrock_guardrail[0].guardrail_id : null
}

output "bedrock_guardrail_arn" {
  description = "The ARN of the created Bedrock Guardrail"
  value       = var.enable_guardrails ? module.bedrock_guardrail[0].guardrail_arn : null
}

# ============================================================================
# VPC ENDPOINTS OUTPUTS
# ============================================================================

output "vpc_endpoint_ids" {
  description = "VPC Endpoint IDs"
  value       = var.enable_endpoints ? module.vpc_endpoints[0].interface_endpoint_ids : {}
}

output "s3_endpoint_id" {
  description = "S3 VPC Endpoint ID"
  value       = var.enable_endpoints ? module.vpc_endpoints[0].s3_endpoint_id : null
}

output "bedrock_vpc_endpoint_ids" {
  description = "Bedrock VPC Endpoint IDs"
  value       = var.enable_endpoints ? module.vpc_endpoints[0].bedrock_interface_endpoint_ids : {}
}

# ============================================================================
# SSM PARAMETER OUTPUTS
# ============================================================================

output "ssm_parameter_agent_id" {
  description = "SSM Parameter for Bedrock Agent ID"
  value       = module.bedrock_agent.ssm_parameter_agent_id
}

output "ssm_parameter_agent_name" {
  description = "SSM Parameter for Bedrock Agent Name"
  value       = module.bedrock_agent.ssm_parameter_agent_name
}

output "ssm_parameter_agent_arn" {
  description = "SSM Parameter for Bedrock Agent ARN"
  value       = module.bedrock_agent.ssm_parameter_agent_arn
}

output "ssm_parameter_agent_alias" {
  description = "SSM Parameter for Bedrock Agent Alias"
  value       = module.bedrock_agent.ssm_parameter_agent_alias
}

output "ssm_parameter_agent_instruction" {
  description = "SSM Parameter for Bedrock Agent Instruction"
  value       = module.bedrock_agent.ssm_parameter_agent_instruction
}

output "ssm_parameter_agent_ag_instruction" {
  description = "SSM Parameter for Bedrock Agent Action Group Instruction"
  value       = module.bedrock_agent.ssm_parameter_agent_ag_instruction
}

output "ssm_parameter_knowledge_base_id" {
  description = "SSM Parameter for Knowledge Base ID"
  value       = module.bedrock_knowledge_base.ssm_parameter_knowledge_base_id
}

output "ssm_parameter_knowledge_base_data_source_id" {
  description = "SSM Parameter for Knowledge Base Data Source ID"
  value       = module.bedrock_knowledge_base.ssm_parameter_knowledge_base_data_source_id
}

output "ssm_parameter_lambda_code_sha" {
  description = "SSM Parameter for Action Group Lambda SHA"
  value       = module.bedrock_agent.ssm_parameter_agent_ag_lambda_sha
}

output "lambda_code_sha" {
  description = "Lambda Code SHA"
  value       = data.archive_file.lambda_zip.output_md5
}

output "ssm_parameter_agent_instruction_history" {
  description = "SSM Parameter for Agent Instruction History"
  value       = module.bedrock_agent.ssm_parameter_agent_instruction_history
}

output "ssm_parameter_kb_instruction_history" {
  description = "SSM Parameter for Knowledge Base Instruction History"
  value       = module.bedrock_knowledge_base.ssm_parameter_kb_instruction_history
}

# ============================================================================
# USER ACCOUNT OUTPUTS (Sensitive)
# ============================================================================

output "user_account_info" {
  description = "User account information (if created)"
  value = var.user_email != "" ? {
    email_created = true
    username      = var.user_email
    password_type = var.user_password != "" ? "user_provided" : "auto_generated"
    login_url     = module.frontend.cloudfront_distribution_url
    } : {
    email_created = false
    message       = "No user account created. Set user_email variable to create one."
    login_url     = module.frontend.cloudfront_distribution_url
  }
  sensitive = true
}

# ============================================================================
# FILE UPLOAD OUTPUTS
# ============================================================================

output "file_upload_api_url" {
  description = "File upload API Gateway URL"
  value       = module.file_upload.api_gateway_invoke_url
}

output "file_upload_lambda_name" {
  description = "File upload Lambda function name"
  value       = module.file_upload.lambda_function_name
}

output "kb_sync_lambda_name" {
  description = "Knowledge Base sync Lambda function name"
  value       = module.kb_sync.kb_sync_lambda_name
}

output "kb_sync_lambda_arn" {
  description = "Knowledge Base sync Lambda function ARN"
  value       = module.kb_sync.kb_sync_lambda_arn
}

# ============================================================================
# CONFIGURATION OUTPUT FOR FRONTEND
# ============================================================================

output "app_config" {
  description = "Application configuration for frontend"
  value = {
    title            = var.app_title
    description      = var.app_description
    loginSubtitle    = var.app_login_subtitle
    inputPlaceholder = var.app_input_placeholder
    tips             = var.app_tips
    shortcuts        = var.app_shortcuts
  }
}

# DynamoDB Outputs
output "conversations_table_name" {
  description = "DynamoDB Conversations Table Name"
  value       = module.dynamodb.conversations_table_name
}

output "messages_table_name" {
  description = "DynamoDB Messages Table Name"
  value       = module.dynamodb.messages_table_name
}

output "conversations_table_arn" {
  description = "DynamoDB Conversations Table ARN"
  value       = module.dynamodb.conversations_table_arn
}

output "messages_table_arn" {
  description = "DynamoDB Messages Table ARN"
  value       = module.dynamodb.messages_table_arn
}
