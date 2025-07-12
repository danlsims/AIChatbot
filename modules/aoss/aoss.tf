// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


resource "aws_opensearchserverless_collection" "sample_aoss_collection" {
  name = var.aoss_collection_name
  type = var.aoss_collection_type
  # kms_key_arn = var.kms_key_id
  depends_on = [
    aws_opensearchserverless_access_policy.sample_kb_aoss_policy,
    aws_opensearchserverless_security_policy.sample_kb_encryption_policy,
    aws_opensearchserverless_security_policy.sample_kb_network_policy
  ]
}

# Add a delay to ensure AOSS collection is fully ready
resource "null_resource" "aoss_collection_ready" {
  provisioner "local-exec" {
    command = "sleep 90" # Increased delay for AOSS collection to be fully ready
  }

  depends_on = [aws_opensearchserverless_collection.sample_aoss_collection]
}

# Use the original opensearch_index resource with better dependency management
resource "opensearch_index" "sample_aoss_index" {
  count                          = var.skip_opensearch_index ? 0 : 1
  name                           = "bedrock-knowledge-base-default-index"
  number_of_shards               = "2"
  number_of_replicas             = "1"
  index_knn                      = true
  index_knn_algo_param_ef_search = "512"
  mappings                       = <<-EOF
    {
      "properties": {
        "bedrock-knowledge-base-default-vector": {
          "type": "knn_vector",
          "dimension": "1024",
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
          "index": "false"
        },
        "AMAZON_BEDROCK_TEXT_CHUNK": {
          "type": "text",
          "index": "true"
        }
      }
    }
  EOF
  lifecycle {
    ignore_changes = all
  }
  force_destroy = true
  depends_on = [
    aws_opensearchserverless_collection.sample_aoss_collection,
    null_resource.aoss_collection_ready
  ]
}

# Keep the original opensearch_index resource but make it optional
# Commented out due to healthcheck issues - using null_resource with curl instead
# resource "opensearch_index" "sample_aoss_index" {
#   name                           = "bedrock-knowledge-base-default-index"
#   number_of_shards               = "2"
#   number_of_replicas             = "1"
#   index_knn                      = true
#   index_knn_algo_param_ef_search = "512"
#   mappings                       = <<-EOF
#     {
#       "properties": {
#         "bedrock-knowledge-base-default-vector": {
#           "type": "knn_vector",
#           "dimension": "1024",
#           "method": {
#             "name": "hnsw",
#             "engine": "FAISS",
#             "parameters": {
#               "m": 16,
#               "ef_construction": 512
#             },
#             "space_type": "l2"
#           }
#         },
#         "AMAZON_BEDROCK_METADATA": {
#           "type": "text",
#           "index": "false"
#         },
#         "AMAZON_BEDROCK_TEXT_CHUNK": {
#           "type": "text",
#           "index": "true"
#         }
#       }
#     }
#   EOF
#   lifecycle {
#     ignore_changes = all
#   }
#   force_destroy = true
#   depends_on    = [
#     aws_opensearchserverless_collection.sample_aoss_collection,
#     null_resource.aoss_collection_ready
#   ]
# }