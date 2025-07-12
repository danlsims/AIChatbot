variable "app_name" {
  description = "Application name"
  type        = string
}

variable "env_name" {
  description = "Environment name"
  type        = string
}

variable "cognito_auth_role_name" {
  description = "Name of the Cognito authenticated role"
  type        = string
}
