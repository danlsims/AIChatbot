# AI Chat Assistant - Customer Deployment Guide

## Overview

This package contains a complete AI-powered chat assistant built on AWS using Amazon Bedrock, featuring:

- **Modern React Frontend** with real-time chat interface
- **Amazon Bedrock Agent** for intelligent responses
- **Knowledge Base Integration** with document upload capability
- **DynamoDB Chat History** for persistent conversations
- **Secure Authentication** via Amazon Cognito
- **Professional UI/UX** with modern styling and animations

## What's Included

### ✅ **Complete Infrastructure as Code**
- All Terraform modules for AWS resource provisioning
- Pre-built Lambda functions (no compilation needed)
- Frontend application (pre-built and ready to deploy)
- Sample data and documentation

### ✅ **Key Features Implemented**
- **Chat Interface**: Modern, responsive chat with conversation history
- **File Upload**: PDF document upload with automatic knowledge base sync
- **User Authentication**: Secure login with password management
- **Conversation Management**: Create, rename, and delete conversations
- **Real-time Responses**: Streaming responses from Bedrock Agent
- **Mobile Responsive**: Works perfectly on all devices

### ✅ **Recent Enhancements**
- **Asynchronous File Processing**: Fast uploads with background knowledge base sync
- **Modern Login Screen**: Professional styling with distinct field types
- **Conversation Renaming**: Rename conversations from both sidebar and header
- **Enhanced Navigation**: Clean, consistent UI throughout the application
- **Error Handling**: Comprehensive error handling and user feedback

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform CLI** (latest version)
3. **AWS CLI V2** configured with credentials
4. **Node.js 16+** and npm (for any frontend modifications)

### Required AWS Permissions
- Bedrock model access (Claude 3 Haiku, Titan Text V2, Titan Embed V2)
- Full access to: S3, DynamoDB, Lambda, Cognito, CloudFront, VPC, IAM

## Quick Deployment

### 1. **Configure Deployment**
```bash
# Copy and customize the configuration
cp terraform-production.tfvars terraform.tfvars

# Edit terraform.tfvars with your specific values:
# - AWS region
# - Application name
# - Environment name
# - VPC CIDR blocks (if needed)
```

### 2. **Deploy Infrastructure**
```bash
# Initialize Terraform
terraform init

# Review the deployment plan
terraform plan

# Deploy (this will take 10-15 minutes)
terraform apply --auto-approve
```

### 3. **Access Your Application**
After deployment completes, Terraform will output the CloudFront URL:
```
frontend_url = "https://d1234567890abc.cloudfront.net"
```

## Configuration Options

### **terraform.tfvars Settings**

```hcl
# Basic Configuration
app_name = "YourCompany"           # Your company/app name
env_name = "prod"                  # Environment (dev/staging/prod)
app_region = "use1"               # Region abbreviation

# Application Customization
app_title = "Your AI Assistant"
app_description = "AI-powered assistant for your organization"
app_login_subtitle = "Sign in to access your AI assistant"

# Bedrock Models (ensure these are enabled in your account)
agent_model_id = "anthropic.claude-3-haiku-20240307-v1:0"
knowledge_base_model_id = "amazon.titan-embed-text-v2:0"

# Agent Behavior
agent_instructions = "You are a helpful AI assistant for [Your Organization]. 
Use the knowledge base to answer questions about company policies and procedures."

# Security & Networking (optional - defaults provided)
vpc_cidr = "10.0.0.0/16"
enable_guardrails = true
```

## Post-Deployment Setup

### 1. **Upload Knowledge Base Content**
1. Navigate to the S3 bucket: `{app_name}-kb-{env_name}-{random_id}`
2. Upload your PDF documents
3. The system will automatically sync them to the knowledge base

### 2. **Create User Accounts**
```bash
# Create a user account
aws cognito-idp admin-create-user \
  --user-pool-id {user_pool_id} \
  --username user@yourcompany.com \
  --user-attributes Name=email,Value=user@yourcompany.com Name=name,Value="User Name" \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS
```

### 3. **Test the Application**
1. Visit the CloudFront URL
2. Login with the created credentials
3. Upload a test document
4. Start a conversation to test the AI responses

## Architecture Components

### **Frontend (React Application)**
- **Location**: `frontend/` directory
- **Features**: Modern chat interface, file upload, user management
- **Deployment**: Automatically deployed to S3 + CloudFront
- **Authentication**: Integrated with Cognito

### **Backend Services**
- **Bedrock Agent**: Handles AI conversations and reasoning
- **Knowledge Base**: Stores and searches uploaded documents
- **Lambda Functions**: File processing and knowledge base sync
- **DynamoDB**: Stores conversation history and user data

### **Infrastructure**
- **VPC**: Secure networking with public/private subnets
- **S3 Buckets**: Frontend hosting, file storage, Lambda code
- **CloudFront**: Global CDN for fast content delivery
- **Cognito**: User authentication and authorization

## Customization

### **Branding & Styling**
The application uses your `app_name` throughout the interface. To further customize:

1. **Colors**: Edit `frontend/src/index.css` for global color scheme
2. **Logo**: Replace favicon and add logo images to `frontend/public/`
3. **Content**: Modify text in `terraform.tfvars` configuration

### **Agent Behavior**
Customize the AI assistant by modifying:
- `agent_instructions`: Core behavior and personality
- `kb_instructions_for_agent`: How to use knowledge base
- `guardrail_*`: Content filtering and safety policies

### **Frontend Modifications**
If you need to modify the frontend:
```bash
cd frontend
npm install
npm run build
# Then redeploy with terraform apply
```

## Monitoring & Maintenance

### **CloudWatch Logs**
- Lambda function logs: `/aws/lambda/{function-name}`
- Bedrock Agent logs: Check CloudWatch for agent invocations

### **Cost Optimization**
- Monitor Bedrock usage in AWS Cost Explorer
- Consider adjusting Lambda memory/timeout settings
- Review S3 storage classes for uploaded documents

### **Updates**
To update the application:
1. Modify configuration in `terraform.tfvars`
2. Run `terraform plan` to review changes
3. Run `terraform apply` to deploy updates

## Troubleshooting

### **Common Issues**

1. **Bedrock Models Not Available**
   - Ensure Claude 3 Haiku and Titan models are enabled in your AWS account
   - Check the correct region is being used

2. **File Upload Issues**
   - Verify S3 bucket permissions
   - Check Lambda function logs for errors

3. **Authentication Problems**
   - Confirm Cognito user pool configuration
   - Check user account status in AWS Console

4. **Frontend Not Loading**
   - Verify CloudFront distribution is deployed
   - Check S3 bucket has correct files

### **Support**
For technical support:
1. Check CloudWatch logs for error details
2. Review Terraform state for resource status
3. Verify AWS service quotas and limits

## Security Considerations

- **Data Encryption**: All data encrypted at rest and in transit
- **Network Security**: VPC with private subnets for backend services
- **Access Control**: IAM roles with least privilege principles
- **Content Filtering**: Bedrock guardrails for safe AI responses
- **Authentication**: Secure Cognito-based user management

## Cleanup

To remove all resources:
```bash
# Empty S3 buckets first
aws s3 rm s3://{knowledge-base-bucket} --recursive
aws s3 rm s3://{frontend-bucket} --recursive

# Destroy infrastructure
terraform destroy --auto-approve
```

---

## 🎉 **Your AI Chat Assistant is Ready!**

You now have a production-ready AI chat assistant with:
- ✅ Modern, professional interface
- ✅ Intelligent document-based responses
- ✅ Secure user authentication
- ✅ Persistent conversation history
- ✅ Mobile-responsive design
- ✅ Enterprise-grade security

Visit your CloudFront URL and start chatting with your AI assistant!
