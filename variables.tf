# Pure Terraform Variables
# Enhanced variables file for pure Terraform deployment without bash scripts

# ============================================================================
# DEPLOYMENT CONTROL VARIABLES
# ============================================================================

variable "deployment_mode" {
  description = "Deployment mode: 'development' for local testing, 'production' for clean deployments"
  type        = string
  default     = "development"
  validation {
    condition     = contains(["development", "production"], var.deployment_mode)
    error_message = "Deployment mode must be either 'development' or 'production'."
  }
}

variable "skip_opensearch_index" {
  description = "Skip OpenSearch index creation (useful for cross-account deployments)"
  type        = bool
  default     = false
}

variable "deploy_frontend" {
  description = "Whether to deploy the frontend application"
  type        = bool
  default     = true
}

variable "install_lambda_dependencies" {
  description = "Whether to install Lambda dependencies using pip"
  type        = bool
  default     = true
}

variable "upload_sample_data" {
  description = "Whether to upload sample data to the knowledge base bucket"
  type        = bool
  default     = false
}

# ============================================================================
# USER ACCOUNT VARIABLES (replaces deploy-with-user.sh)
# ============================================================================

variable "user_email" {
  description = "User email for Cognito account creation (optional)"
  type        = string
  default     = ""
  validation {
    condition     = var.user_email == "" || can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.user_email))
    error_message = "User email must be a valid email address."
  }
}

variable "user_name" {
  description = "User name for Cognito account (optional, defaults to email)"
  type        = string
  default     = ""
}

variable "user_password" {
  description = "User password for Cognito account (optional, will generate random if not provided)"
  type        = string
  default     = ""
  sensitive   = true
}

# ============================================================================
# VPC CONFIGURATION
# ============================================================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "public_subnet_count" {
  description = "Number of public subnets"
  type        = number
  default     = 2
  validation {
    condition     = var.public_subnet_count >= 1 && var.public_subnet_count <= 6
    error_message = "Public subnet count must be between 1 and 6."
  }
}

variable "private_subnet_count" {
  description = "Number of private subnets"
  type        = number
  default     = 2
  validation {
    condition     = var.private_subnet_count >= 1 && var.private_subnet_count <= 6
    error_message = "Private subnet count must be between 1 and 6."
  }
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

# ============================================================================
# LAMBDA CODE CONFIGURATION
# ============================================================================

variable "lambda_zip_filename" {
  description = "Name of the lambda zip file in S3"
  type        = string
  default     = "lambda-code.zip"
}

variable "lambda_zip_source_path" {
  description = "Local path to the lambda zip file (auto-generated)"
  type        = string
  default     = "./lambda-code.zip"
}

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================

variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
  default     = "acme"
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.app_name))
    error_message = "App name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "env_name" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod", "test"], var.env_name)
    error_message = "Environment name must be one of: dev, staging, prod, test."
  }
}

variable "app_region" {
  description = "AWS region abbreviation for resource naming"
  type        = string
  default     = "usw2"
}

# ============================================================================
# BEDROCK AGENT CONFIGURATION
# ============================================================================

variable "agent_model_id" {
  description = "The ID of the foundational model used by the agent"
  type        = string
  default     = "anthropic.claude-3-haiku-20240307-v1:0"
}

variable "agent_name" {
  description = "The Bedrock Agent Name"
  type        = string
  default     = "bedrock-agent"
}

variable "agent_alias_name" {
  description = "The Bedrock Agent Alias Name"
  type        = string
  default     = "bedrock-agent-alias"
}

variable "agent_action_group_name" {
  description = "The Bedrock Agent Action Group Name"
  type        = string
  default     = "bedrock-agent-ag"
}

variable "agent_instructions" {
  description = "Instructions for the Bedrock Agent"
  type        = string
  default     = "You are a helpful fitness assistant. You can answer questions related to fitness, diet plans. Use only the tools or knowledge base provided to answer user questions. Choose between the tools or the knowledge base. Do not use both. Do not respond without using a tool or knowledge base. When a user asks to calculate their BMI: 1. Ask for their weight in kilograms. 2. Ask for their height in meters If the user provides values in any other unit, convert it into kilograms for weight and meters for height. Do not make any comments about health status."
}

variable "agent_description" {
  description = "Description of the agent"
  type        = string
  default     = "You are a fitness chatbot"
}

variable "agent_actiongroup_descrption" {
  description = "Description of the action group of the bedrock agent"
  type        = string
  default     = "Use the action group to get the fitness plans, diet plans and historical details"
}

# ============================================================================
# KNOWLEDGE BASE CONFIGURATION
# ============================================================================

variable "knowledge_base_name" {
  description = "Name of the Bedrock Knowledge Base"
  type        = string
  default     = "bedrock-kb"
}

variable "knowledge_base_model_id" {
  description = "The ID of the foundational model used by the knowledge base"
  type        = string
  default     = "amazon.titan-embed-text-v2:0"
}

variable "kb_instructions_for_agent" {
  description = "Instructions for how the agent should use the knowledge base"
  type        = string
  default     = "Use the knowledge base when the user is asking for a definition about a fitness, diet plans. Give a very detailed answer and cite the source."
}

# ============================================================================
# OPENSEARCH CONFIGURATION
# ============================================================================

variable "aoss_collection_name" {
  description = "OpenSearch Collection Name"
  type        = string
  default     = "aoss-collection"
}

variable "aoss_collection_type" {
  description = "OpenSearch Collection Type"
  type        = string
  default     = "VECTORSEARCH"
  validation {
    condition     = contains(["SEARCH", "TIMESERIES", "VECTORSEARCH"], var.aoss_collection_type)
    error_message = "AOSS collection type must be one of: SEARCH, TIMESERIES, VECTORSEARCH."
  }
}

# ============================================================================
# S3 CONFIGURATION
# ============================================================================

variable "enable_access_logging" {
  description = "Option to enable Access logging of Knowledge base bucket"
  type        = bool
  default     = true
}

variable "enable_s3_lifecycle_policies" {
  description = "Option to enable Lifecycle policies for Knowledge base bucket Objects"
  type        = bool
  default     = true
}

# ============================================================================
# GUARDRAILS CONFIGURATION
# ============================================================================

variable "enable_guardrails" {
  description = "Whether to enable Bedrock guardrails"
  type        = bool
  default     = true
}

variable "guardrail_name" {
  description = "Name of the Bedrock Guardrail"
  type        = string
  default     = "my-bedrock-guardrail"
}

variable "guardrail_blocked_input_messaging" {
  description = "Blocked input messaging for the Bedrock Guardrail"
  type        = string
  default     = "This input is not allowed due to content restrictions."
}

variable "guardrail_blocked_outputs_messaging" {
  description = "Blocked outputs messaging for the Bedrock Guardrail"
  type        = string
  default     = "The generated output was blocked due to content restrictions."
}

variable "guardrail_description" {
  description = "Description of the Bedrock Guardrail"
  type        = string
  default     = "A guardrail for Bedrock to ensure safe and appropriate content"
}

variable "guardrail_content_policy_config" {
  description = "Content policy configuration for the Bedrock Guardrail"
  type        = any
  default = [
    {
      filters_config = [
        {
          input_strength  = "MEDIUM"
          output_strength = "MEDIUM"
          type            = "HATE"
        },
        {
          input_strength  = "HIGH"
          output_strength = "HIGH"
          type            = "VIOLENCE"
        }
      ]
    }
  ]
}

variable "guardrail_sensitive_information_policy_config" {
  description = "Sensitive information policy configuration for the Bedrock Guardrail"
  type        = any
  default = [
    {
      pii_entities_config = [
        {
          action = "BLOCK"
          type   = "NAME"
        },
        {
          action = "BLOCK"
          type   = "EMAIL"
        }
      ]
      regexes_config = [
        {
          action      = "BLOCK"
          description = "Block Social Security Numbers"
          name        = "SSN_Regex"
          pattern     = "^\\d{3}-\\d{2}-\\d{4}$"
        }
      ]
    }
  ]
}

variable "guardrail_topic_policy_config" {
  description = "Topic policy configuration for the Bedrock Guardrail"
  type        = any
  default = [
    {
      topics_config = [
        {
          definition = "Any advice or recommendations regarding financial investments or asset allocation."
          examples = [
            "Where should I invest my money?",
            "What stocks should I buy?"
          ]
          name = "investment_advice"
          type = "DENY"
        }
      ]
    }
  ]
}

variable "guardrail_word_policy_config" {
  description = "Word policy configuration for the Bedrock Guardrail"
  type        = any
  default = [
    {
      managed_word_lists_config = [
        {
          type = "PROFANITY"
        }
      ]
      words_config = [
        {
          text = "badword1"
        },
        {
          text = "badword2"
        }
      ]
    }
  ]
}

# ============================================================================
# VPC ENDPOINTS CONFIGURATION
# ============================================================================

variable "enable_endpoints" {
  description = "Whether to enable VPC Endpoints"
  type        = bool
  default     = true
}

# ============================================================================
# FRONTEND CUSTOMIZATION VARIABLES
# ============================================================================

variable "app_title" {
  description = "Application title displayed in login page and header"
  type        = string
  default     = "Bedrock Agent Chatbot"
}

variable "app_description" {
  description = "Application description"
  type        = string
  default     = "AI-powered chatbot using Amazon Bedrock Agent"
}

variable "app_login_subtitle" {
  description = "Subtitle text displayed under the login title"
  type        = string
  default     = "Sign in to start chatting with our AI assistant"
}

variable "app_input_placeholder" {
  description = "Placeholder text for the chat input field"
  type        = string
  default     = "Ask me anything... (Shift+Enter for new line)"
}

variable "app_tips" {
  description = "Tips text displayed below the chat input"
  type        = string
  default     = "Ask questions to get helpful responses"
}

variable "app_shortcuts" {
  description = "Keyboard shortcuts information displayed to users"
  type        = string
  default     = "Enter to send • Shift+Enter for new line"
}

# ============================================================================
# LEGACY VARIABLES (for backward compatibility)
# ============================================================================

variable "bedrock_agent_invoke_log_bucket" {
  description = "The Bedrock Agent invoke log bucket name (legacy)"
  type        = string
  default     = "bedrock-agent"
}
