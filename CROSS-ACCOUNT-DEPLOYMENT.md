# Cross-Account Deployment Guide

This guide provides instructions for deploying the Intelligent RAG Bedrock Agent solution to a new AWS account using the pure Terraform deployment engine.

## Prerequisites

1. **AWS CLI configured** with credentials for the target account
2. **Terraform >= 1.0** installed
3. **Node.js 16+** and npm (for frontend deployment)
4. **Required Bedrock models enabled** in the target account:
   - `anthropic.claude-3-haiku-20240307-v1:0`
   - `amazon.titan-embed-text-v2:0`

## Quick Start

### 1. Clone and Configure

```bash
git clone <repository-url>
cd intelligent-rag-bedrockagent-iac

# Copy production configuration
cp terraform-production.tfvars terraform.tfvars

# Edit terraform.tfvars with your account-specific values
nano terraform.tfvars
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Deploy Infrastructure

```bash
# Review the deployment plan
terraform plan

# Deploy (this will skip OpenSearch index creation initially)
terraform apply --auto-approve
```

### 4. Create OpenSearch Index (Manual Step)

Since OpenSearch index creation can be problematic in cross-account deployments, create it manually:

1. Go to AWS Console → OpenSearch Serverless → Collections
2. Find your collection (e.g., `aoss-collection-usw2-prod`)
3. Click on the collection and go to "Indexes"
4. Create a new index with these settings:
   - **Index name**: `bedrock-knowledge-base-default-index`
   - **Index settings**:
     ```json
     {
       "settings": {
         "number_of_shards": 2,
         "number_of_replicas": 1,
         "index.knn": true,
         "index.knn.algo_param.ef_search": 512
       },
       "mappings": {
         "properties": {
           "bedrock-knowledge-base-default-vector": {
             "type": "knn_vector",
             "dimension": 1024,
             "method": {
               "name": "hnsw",
               "engine": "FAISS",
               "parameters": {
                 "m": 16,
                 "ef_construction": 512
               },
               "space_type": "l2"
             }
           },
           "AMAZON_BEDROCK_METADATA": {
             "type": "text",
             "index": false
           },
           "AMAZON_BEDROCK_TEXT_CHUNK": {
             "type": "text",
             "index": true
           }
         }
       }
     }
     ```

### 5. Complete Deployment

After creating the index manually:

```bash
# Update terraform.tfvars to enable index creation
sed -i 's/skip_opensearch_index = true/skip_opensearch_index = false/' terraform.tfvars

# Apply again to create the knowledge base
terraform apply --auto-approve
```

### 6. Upload Knowledge Base Data

```bash
# Upload your documents to the knowledge base S3 bucket
aws s3 cp your-documents/ s3://$(terraform output -raw knowledge_base_bucket)/ --recursive

# Sync the knowledge base in AWS Console
# Go to Bedrock → Knowledge Bases → Your KB → Data Source → Sync
```

### 7. Access Your Deployment

```bash
# Get the frontend URL
terraform output frontend_url

# Get login credentials (if user account was created)
terraform output user_account_info
```

## Configuration Options

### Key Variables in terraform.tfvars

| Variable | Description | Default |
|----------|-------------|---------|
| `deployment_mode` | Set to "production" for clean deployments | "development" |
| `skip_opensearch_index` | Skip automatic index creation | `true` |
| `app_name` | Your application name | "your-app-name" |
| `env_name` | Environment name | "prod" |
| `deploy_frontend` | Deploy the web frontend | `true` |
| `install_lambda_dependencies` | Install pip dependencies locally | `false` |
| `enable_guardrails` | Enable Bedrock guardrails | `true` |

### Account-Specific Customization

1. **Update application naming**:
   ```hcl
   app_name = "mycompany"
   env_name = "production"
   ```

2. **Customize agent behavior**:
   ```hcl
   agent_instructions = "You are a customer service assistant for MyCompany..."
   ```

3. **Configure frontend branding**:
   ```hcl
   app_title = "MyCompany AI Assistant"
   app_description = "Get help with MyCompany products and services"
   ```

## Troubleshooting

### Common Issues

1. **OpenSearch Index Creation Fails**
   - Set `skip_opensearch_index = true` and create manually
   - Ensure proper IAM permissions for OpenSearch Serverless

2. **Bedrock Models Not Available**
   - Enable required models in Bedrock console
   - Check regional availability

3. **Lambda Dependencies Issues**
   - Set `install_lambda_dependencies = false`
   - Use pre-packaged lambda-code.zip

4. **Frontend Deployment Fails**
   - Ensure Node.js and npm are installed
   - Set `deploy_frontend = false` to skip if not needed

### Clean Deployment Verification

```bash
# Check all resources are created
terraform state list | wc -l

# Verify key outputs
terraform output

# Test the deployment
curl -I $(terraform output -raw frontend_url)
```

## Production Considerations

1. **State Management**: Use remote state (S3 + DynamoDB)
2. **Secrets Management**: Use AWS Secrets Manager for sensitive data
3. **Monitoring**: Enable CloudWatch monitoring and alerting
4. **Backup**: Regular backups of knowledge base data
5. **Security**: Review IAM permissions and security groups

## Support

For issues with the deployment engine:
1. Check Terraform logs: `terraform apply -debug`
2. Review AWS CloudTrail for API errors
3. Validate prerequisites and permissions
4. Consult the main README.md for detailed documentation

## Next Steps

After successful deployment:
1. Upload your knowledge base documents
2. Test the Bedrock Agent functionality
3. Customize the frontend for your use case
4. Set up monitoring and alerting
5. Configure backup and disaster recovery
