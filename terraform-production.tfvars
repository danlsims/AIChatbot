# Production Terraform Variables for Clean Cross-Account Deployment
# Copy this file to terraform.tfvars and customize for your target account

# ============================================================================
# DEPLOYMENT CONTROL
# ============================================================================
deployment_mode       = "production"
skip_opensearch_index = true # Set to true for initial deployment, then false after manual index creation

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================
app_name   = "your-app-name"
env_name   = "prod"
app_region = "usw2"

# ============================================================================
# BEDROCK AGENT CONFIGURATION
# ============================================================================
agent_name                   = "bedrock-agent"
agent_alias_name             = "bedrock-agent-alias"
agent_action_group_name      = "bedrock-agent-ag"
agent_model_id               = "anthropic.claude-3-haiku-20240307-v1:0"
agent_instructions           = "You are a helpful assistant. Use only the tools or knowledge base provided to answer user questions."
agent_description            = "AI-powered assistant using Amazon Bedrock Agent"
agent_actiongroup_descrption = "Use the action group to get information and perform tasks"

# ============================================================================
# KNOWLEDGE BASE CONFIGURATION
# ============================================================================
knowledge_base_name       = "bedrock-kb"
knowledge_base_model_id   = "amazon.titan-embed-text-v2:0"
kb_instructions_for_agent = "Use the knowledge base when the user is asking for information. Give detailed answers and cite sources."

# ============================================================================
# OPENSEARCH CONFIGURATION
# ============================================================================
aoss_collection_name = "aoss-collection"
aoss_collection_type = "VECTORSEARCH"

# ============================================================================
# FRONTEND CONFIGURATION
# ============================================================================
deploy_frontend       = true
app_title             = "Bedrock Agent Chatbot"
app_description       = "AI-powered chatbot using Amazon Bedrock Agent"
app_login_subtitle    = "Sign in to start chatting with our AI assistant"
app_input_placeholder = "Ask me anything... (Shift+Enter for new line)"
app_tips              = "Ask questions to get helpful responses"
app_shortcuts         = "Ctrl+Enter to send, Shift+Enter for new line"

# ============================================================================
# DEPLOYMENT OPTIONS
# ============================================================================
install_lambda_dependencies  = false # Set to false for production to avoid local pip dependencies
upload_sample_data           = false # Set to true if you want to upload sample data
enable_guardrails            = true
enable_endpoints             = true
enable_access_logging        = true
enable_s3_lifecycle_policies = true

# ============================================================================
# LAMBDA CONFIGURATION
# ============================================================================
lambda_zip_filename = "lambda-code.zip"

# ============================================================================
# USER ACCOUNT (Optional - for personal deployments)
# ============================================================================
create_user_account = false
# user_email = "your-email@example.com"
# user_name = "Your Name"
