// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


variable "code_base_bucket" {
  type        = string
  description = "S3 bucket for Lambda code (optional for pure Terraform approach)"
  default     = ""
}


variable "ssm_parameter_agent_name" {
  type = string
}


variable "ssm_parameter_agent_id" {
  type = string
}


variable "ssm_parameter_agent_instruction" {
  type = string
}


variable "ssm_parameter_agent_ag_instruction" {
  type = string
}


variable "ssm_parameter_knowledge_base_id" {
  type = string
}

variable "ssm_parameter_lambda_code_sha" {
  type = string
}

variable "ssm_parameter_agent_instruction_history" {
  type = string
}

variable "ssm_parameter_kb_instruction_history" {
  type = string
}

variable "ssm_parameter_agent_alias" {
  type = string
}


variable "lambda_function_name" {
  type = string
}
variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
