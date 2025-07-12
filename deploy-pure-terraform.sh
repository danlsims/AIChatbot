#!/bin/bash

# Pure Terraform Deployment Script
# This script demonstrates how simple deployment becomes with pure Terraform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Pure Terraform Deployment...${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${GREEN}🔍 Checking prerequisites...${NC}"

if ! command_exists terraform; then
    echo -e "${RED}❌ Terraform is not installed. Please install Terraform first.${NC}"
    exit 1
fi

if ! command_exists aws; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install AWS CLI first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Check if we should use pure terraform files
USE_PURE_TERRAFORM=${1:-"yes"}

if [ "$USE_PURE_TERRAFORM" = "yes" ]; then
    echo -e "${GREEN}📝 Using pure Terraform configuration...${NC}"
    
    # Copy pure terraform files to main files
    if [ -f "main-pure-terraform.tf" ]; then
        cp main-pure-terraform.tf main.tf
        echo -e "${GREEN}✅ Updated main.tf with pure Terraform configuration${NC}"
    fi
    
    if [ -f "variables-pure-terraform.tf" ]; then
        cp variables-pure-terraform.tf variables.tf
        echo -e "${GREEN}✅ Updated variables.tf with enhanced variables${NC}"
    fi
    
    if [ -f "outputs-pure-terraform.tf" ]; then
        cp outputs-pure-terraform.tf outputs.tf
        echo -e "${GREEN}✅ Updated outputs.tf with enhanced outputs${NC}"
    fi
    
    if [ -f "terraform-pure.tfvars" ]; then
        cp terraform-pure.tfvars terraform.tfvars
        echo -e "${GREEN}✅ Updated terraform.tfvars with pure Terraform configuration${NC}"
    fi
fi

# Initialize Terraform
echo -e "${GREEN}🔧 Initializing Terraform...${NC}"
terraform init

# Plan deployment
echo -e "${GREEN}📋 Planning deployment...${NC}"
terraform plan -var-file="terraform.tfvars" -out=tfplan

# Apply deployment
echo -e "${GREEN}🏗️  Deploying infrastructure...${NC}"
echo -e "${YELLOW}This may take 15-20 minutes for complete deployment...${NC}"
terraform apply tfplan

# Show deployment summary
echo -e "${GREEN}📊 Deployment Summary:${NC}"
terraform output deployment_summary

echo -e "${GREEN}📝 Next Steps:${NC}"
terraform output next_steps

echo -e "${GREEN}🎉 Pure Terraform deployment completed successfully!${NC}"
echo -e "${YELLOW}💡 No bash scripts needed - everything handled by Terraform!${NC}"
