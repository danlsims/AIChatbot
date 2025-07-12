variable "app_name" {
  description = "Application name"
  type        = string
}

variable "env_name" {
  description = "Environment name"
  type        = string
}

variable "agent_arn" {
  description = "ARN of the Bedrock Agent"
  type        = string
}

variable "agent_id" {
  description = "ID of the Bedrock Agent"
  type        = string
}

variable "agent_alias_id" {
  description = "ID of the Bedrock Agent Alias"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  type        = string
}

variable "app_title" {
  description = "Application title displayed in login page and header"
  type        = string
}

variable "app_description" {
  description = "Application description"
  type        = string
}

variable "app_login_subtitle" {
  description = "Subtitle text displayed under the login title"
  type        = string
}

variable "app_input_placeholder" {
  description = "Placeholder text for the chat input field"
  type        = string
}

variable "app_tips" {
  description = "Tips text displayed below the chat input"
  type        = string
}

variable "app_shortcuts" {
  description = "Keyboard shortcuts information displayed to users"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
