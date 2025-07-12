#!/bin/bash

# Test script for clean deployment validation
# This script validates the Terraform configuration without applying changes

set -e

echo "🔍 Testing Clean Deployment Configuration..."

# Test 1: Terraform validation
echo "1. Validating Terraform configuration..."
terraform validate
echo "✅ Terraform configuration is valid"

# Test 2: Check for syntax errors
echo "2. Checking for syntax errors..."
terraform fmt -check -recursive
echo "✅ Terraform formatting is correct"

# Test 3: Plan with clean state (no refresh) - quick test
echo "3. Testing plan syntax (quick test)..."
terraform plan -refresh=false -detailed-exitcode -out=testplan > /dev/null 2>&1 || {
    echo "⚠️  Plan has issues (may be due to existing state) - checking syntax only..."
    terraform plan -refresh=false > /dev/null 2>&1 && echo "✅ Plan syntax is valid" || {
        echo "❌ Plan syntax has errors"
        exit 1
    }
}
rm -f testplan 2>/dev/null || true
echo "✅ Terraform plan syntax is valid"

# Test 4: Check for hardcoded values
echo "4. Checking for hardcoded values..."
if grep -r "us-west-2\|522525133064\|medassist" *.tf modules/ --exclude-dir=.terraform 2>/dev/null | grep -v "comment\|#" | grep -v "layer.*017000801446"; then
    echo "❌ Found hardcoded values that should be variables"
    exit 1
else
    echo "✅ No problematic hardcoded values found"
fi

# Test 5: Check required files exist
echo "5. Checking required files..."
required_files=(
    "main.tf"
    "variables.tf" 
    "outputs.tf"
    "provider.tf"
    "terraform-production.tfvars"
    "CROSS-ACCOUNT-DEPLOYMENT.md"
    "lambda-code.zip"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done
echo "✅ All required files present"

# Test 6: Check module structure
echo "6. Checking module structure..."
required_modules=(
    "modules/aoss"
    "modules/bedrock/agent"
    "modules/bedrock/knowledge_base"
    "modules/bedrock/agent-guardrails"
    "modules/bedrock/agent-lifecycle"
    "modules/roles"
    "modules/vpc"
    "modules/kms"
    "modules/s3"
    "modules/frontend"
    "modules/endpoints"
)

for module in "${required_modules[@]}"; do
    if [[ ! -d "$module" ]]; then
        echo "❌ Required module missing: $module"
        exit 1
    fi
done
echo "✅ All required modules present"

echo ""
echo "🎉 Clean Deployment Configuration Test PASSED!"
echo ""
echo "The deployment engine is ready for cross-account deployment."
echo "Use the following commands to deploy to a new account:"
echo ""
echo "1. cp terraform-production.tfvars terraform.tfvars"
echo "2. # Edit terraform.tfvars with your account-specific values"
echo "3. terraform init"
echo "4. terraform plan"
echo "5. terraform apply --auto-approve"
echo ""
