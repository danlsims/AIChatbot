import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { DynamoDBClient, PutItemCommand, QueryCommand, UpdateItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import authService from '../auth/authService';
import config from '../config';

class BedrockAgentService {
  constructor() {
    this.client = null;
    this.dynamoClient = null;
    this.agentId = config.bedrock.agentId;
    this.agentAliasId = config.bedrock.agentAliasId;
    this.region = config.aws.region;
    this.conversationsTable = config.dynamodb.conversationsTable;
    this.messagesTable = config.dynamodb.messagesTable;
    
    // Local cache for better performance
    this.conversationsCache = new Map();
    this.messagesCache = new Map();
    this.messageUpdateCallback = null;
  }

  async initializeClients() {
    if (!this.client || !this.dynamoClient) {
      try {
        const credentials = await authService.getCredentials();
        if (!credentials) {
          throw new Error('No AWS credentials available');
        }

        this.client = new BedrockAgentRuntimeClient({
          region: this.region,
          credentials,
        });

        this.dynamoClient = new DynamoDBClient({
          region: this.region,
          credentials,
        });
        
        console.log('Bedrock and DynamoDB clients initialized successfully');
      } catch (error) {
        console.error('Error initializing clients:', error);
        throw error;
      }
    }
  }

  async getCurrentUserId() {
    try {
      const user = await authService.getCurrentUser();
      const userId = user?.attributes?.sub || user?.username || 'anonymous';
      console.log('Current user ID for DynamoDB:', userId);
      console.log('Full user object:', user);
      return userId;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return 'anonymous';
    }
  }

  // ============================================================================
  // CONVERSATION MANAGEMENT
  // ============================================================================

  async createConversation(title = null) {
    await this.initializeClients();
    const userId = await this.getCurrentUserId();
    
    const conversationId = this.generateId();
    const now = new Date().toISOString();
    
    const conversation = {
      id: conversationId,
      user_id: userId,
      conversation_id: conversationId,
      title: title || `New Conversation ${new Date().toLocaleDateString()}`,
      created_at: now,
      updated_at: now,
      message_count: 0
    };

    try {
      // Save to DynamoDB
      const command = new PutItemCommand({
        TableName: this.conversationsTable,
        Item: marshall(conversation)
      });
      
      await this.dynamoClient.send(command);
      
      // Update local cache
      this.conversationsCache.set(conversationId, conversation);
      
      console.log('Conversation created:', conversationId);
      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async listConversations() {
    await this.initializeClients();
    const userId = await this.getCurrentUserId();

    const command = new QueryCommand({
      TableName: this.conversationsTable,
      IndexName: 'ConversationsByDate',
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: marshall({
        ':userId': userId
      }),
      ScanIndexForward: false, // Sort by created_at descending
      Limit: 50
    });

    try {
      console.log('Querying conversations for user:', userId);
      console.log('DynamoDB Query command:', {
        TableName: this.conversationsTable,
        IndexName: 'ConversationsByDate',
        KeyConditionExpression: 'user_id = :userId',
        userId: userId
      });

      const response = await this.dynamoClient.send(command);
      const conversations = response.Items?.map(item => unmarshall(item)) || [];
      
      // Update local cache
      conversations.forEach(conv => {
        this.conversationsCache.set(conv.conversation_id, conv);
      });

      console.log(`Successfully loaded ${conversations.length} conversations for user ${userId}`);
      return conversations;
    } catch (error) {
      console.error('Error listing conversations:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode
      });
      
      // If it's a permission error, provide helpful guidance
      if (error.name === 'AccessDeniedException') {
        console.log('Access denied - this might be due to IAM policy propagation delay. Trying again in a few seconds...');
        
        // Wait a bit and try once more
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
          const retryResponse = await this.dynamoClient.send(command);
          const retryConversations = retryResponse.Items?.map(item => unmarshall(item)) || [];
          console.log(`Retry successful: loaded ${retryConversations.length} conversations`);
          return retryConversations;
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
        }
      }
      
      // Return cached conversations as fallback
      return Array.from(this.conversationsCache.values())
        .filter(conv => conv.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }

  async getConversation(conversationId) {
    // Check cache first
    if (this.conversationsCache.has(conversationId)) {
      return this.conversationsCache.get(conversationId);
    }

    await this.initializeClients();
    const userId = await this.getCurrentUserId();

    try {
      const command = new QueryCommand({
        TableName: this.conversationsTable,
        KeyConditionExpression: 'user_id = :userId AND conversation_id = :conversationId',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
          ':conversationId': conversationId
        })
      });

      const response = await this.dynamoClient.send(command);
      if (response.Items && response.Items.length > 0) {
        const conversation = unmarshall(response.Items[0]);
        this.conversationsCache.set(conversationId, conversation);
        return conversation;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting conversation:', error);
      return null;
    }
  }

  async updateConversation(conversationId, updates) {
    await this.initializeClients();
    const userId = await this.getCurrentUserId();

    try {
      const updateExpression = [];
      const expressionAttributeValues = {};
      const expressionAttributeNames = {};

      // Add all updates except user_id and conversation_id
      Object.keys(updates).forEach(key => {
        if (key !== 'user_id' && key !== 'conversation_id') {
          updateExpression.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = updates[key];
        }
      });

      // Only add updated_at if it wasn't already included in updates
      if (!updates.updated_at) {
        updateExpression.push('#updated_at = :updated_at');
        expressionAttributeNames['#updated_at'] = 'updated_at';
        expressionAttributeValues[':updated_at'] = new Date().toISOString();
      }

      console.log('DynamoDB Update Expression:', `SET ${updateExpression.join(', ')}`);
      console.log('Expression Attribute Names:', expressionAttributeNames);
      console.log('Expression Attribute Values:', expressionAttributeValues);

      const command = new UpdateItemCommand({
        TableName: this.conversationsTable,
        Key: marshall({
          user_id: userId,
          conversation_id: conversationId
        }),
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
        ReturnValues: 'ALL_NEW'
      });

      const response = await this.dynamoClient.send(command);
      const updatedConversation = unmarshall(response.Attributes);
      
      // Update cache
      this.conversationsCache.set(conversationId, updatedConversation);
      
      console.log('Conversation updated successfully:', updatedConversation);
      return updatedConversation;
    } catch (error) {
      console.error('Error updating conversation:', error);
      console.error('Update details:', {
        conversationId,
        updates,
        userId
      });
      throw error;
    }
  }

  async deleteConversation(conversationId) {
    await this.initializeClients();
    const userId = await this.getCurrentUserId();

    try {
      // Delete all messages first
      await this.deleteAllMessages(conversationId);

      // Delete conversation
      const command = new DeleteItemCommand({
        TableName: this.conversationsTable,
        Key: marshall({
          user_id: userId,
          conversation_id: conversationId
        })
      });

      await this.dynamoClient.send(command);
      
      // Remove from cache
      this.conversationsCache.delete(conversationId);
      this.messagesCache.delete(conversationId);
      
      console.log('Conversation deleted:', conversationId);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  // ============================================================================
  // MESSAGE MANAGEMENT
  // ============================================================================

  async getMessages(conversationId) {
    // Check cache first
    if (this.messagesCache.has(conversationId)) {
      return this.messagesCache.get(conversationId);
    }

    await this.initializeClients();

    try {
      const command = new QueryCommand({
        TableName: this.messagesTable,
        KeyConditionExpression: 'conversation_id = :conversationId',
        ExpressionAttributeValues: marshall({
          ':conversationId': conversationId
        }),
        ScanIndexForward: true // Sort by timestamp ascending
      });

      const response = await this.dynamoClient.send(command);
      const messages = response.Items?.map(item => unmarshall(item)) || [];
      
      // Update cache
      this.messagesCache.set(conversationId, messages);
      
      console.log(`Loaded ${messages.length} messages for conversation ${conversationId}`);
      return messages;
    } catch (error) {
      console.error('Error getting messages:', error);
      // Return cached messages as fallback
      return this.messagesCache.get(conversationId) || [];
    }
  }

  async saveMessage(message) {
    await this.initializeClients();

    try {
      const command = new PutItemCommand({
        TableName: this.messagesTable,
        Item: marshall(message)
      });
      
      await this.dynamoClient.send(command);
      
      // Update cache
      const messages = this.messagesCache.get(message.conversation_id) || [];
      const existingIndex = messages.findIndex(m => m.id === message.id);
      
      if (existingIndex >= 0) {
        messages[existingIndex] = message;
      } else {
        messages.push(message);
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      }
      
      this.messagesCache.set(message.conversation_id, messages);
      
      console.log('Message saved:', message.id);
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async deleteAllMessages(conversationId) {
    const messages = await this.getMessages(conversationId);
    
    for (const message of messages) {
      try {
        const command = new DeleteItemCommand({
          TableName: this.messagesTable,
          Key: marshall({
            conversation_id: conversationId,
            timestamp: message.timestamp
          })
        });
        
        await this.dynamoClient.send(command);
      } catch (error) {
        console.error('Error deleting message:', message.id, error);
      }
    }
    
    // Clear cache
    this.messagesCache.delete(conversationId);
  }

  // ============================================================================
  // BEDROCK AGENT INTERACTION
  // ============================================================================

  async sendMessage(conversationId, content) {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const userId = await this.getCurrentUserId();
    const now = new Date().toISOString();

    // Create user message
    const userMessage = {
      id: this.generateId(),
      conversation_id: conversationId,
      user_id: userId,
      content,
      role: 'user',
      timestamp: now,
      isComplete: true,
    };

    // Save user message
    await this.saveMessage(userMessage);

    // Create assistant message placeholder
    const assistantMessage = {
      id: this.generateId(),
      conversation_id: conversationId,
      user_id: userId,
      content: '',
      role: 'assistant',
      timestamp: new Date().toISOString(),
      isComplete: false,
    };

    // Save initial assistant message
    await this.saveMessage(assistantMessage);

    // Update conversation
    await this.updateConversation(conversationId, {
      updated_at: now,
      message_count: (conversation.message_count || 0) + 2
    });

    try {
      await this.initializeClients();
      
      if (!this.client) {
        assistantMessage.content = 'I apologize, but I cannot connect to the Bedrock Agent service at the moment. Please ensure your AWS configuration is correct and try again.';
        assistantMessage.isComplete = true;
        await this.saveMessage(assistantMessage);
        return assistantMessage;
      }

      console.log('Sending message to Bedrock Agent:', {
        agentId: this.agentId,
        agentAliasId: this.agentAliasId,
        sessionId: conversationId,
        inputText: content
      });

      const command = new InvokeAgentCommand({
        agentId: this.agentId,
        agentAliasId: this.agentAliasId,
        sessionId: conversationId,
        inputText: content,
      });

      console.log('Invoking Bedrock Agent...');
      const response = await this.client.send(command);
      console.log('Bedrock Agent response received:', response);
      
      let fullResponse = '';
      if (response.completion) {
        console.log('Processing streaming response...');
        for await (const chunk of response.completion) {
          if (chunk.chunk?.bytes) {
            const text = new TextDecoder().decode(chunk.chunk.bytes);
            fullResponse += text;
            console.log('Received chunk:', text);
            
            // Update message with partial content
            assistantMessage.content = fullResponse;
            await this.saveMessage(assistantMessage);
            this.notifyMessageUpdate(assistantMessage);
          }
        }
      } else {
        console.log('No completion stream in response');
        assistantMessage.content = 'I received your message but got an empty response. Please try asking your question again.';
      }

      // Mark message as complete and save final version
      assistantMessage.isComplete = true;
      assistantMessage.timestamp = new Date().toISOString();
      await this.saveMessage(assistantMessage);
      
      console.log('Final response:', fullResponse);
      return assistantMessage;
    } catch (error) {
      console.error('Error invoking Bedrock Agent:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId
      });
      
      let errorMessage = 'Sorry, I encountered an error while processing your request. ';
      
      if (error.name === 'AccessDeniedException') {
        errorMessage += 'It seems there\'s a permission issue. Please check your AWS credentials.';
      } else if (error.name === 'ValidationException') {
        errorMessage += 'There was a validation error with the request.';
      } else if (error.name === 'ThrottlingException') {
        errorMessage += 'The service is currently busy. Please try again in a moment.';
      } else if (error.name === 'ResourceNotFoundException') {
        errorMessage += 'The Bedrock Agent could not be found. Please check the configuration.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      assistantMessage.content = errorMessage;
      assistantMessage.isComplete = true;
      await this.saveMessage(assistantMessage);
      
      return assistantMessage;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  onMessageUpdate(callback) {
    this.messageUpdateCallback = callback;
  }

  notifyMessageUpdate(message) {
    if (this.messageUpdateCallback) {
      this.messageUpdateCallback(message);
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Clear local cache (useful for logout)
  clearCache() {
    this.conversationsCache.clear();
    this.messagesCache.clear();
  }
}

// Export singleton instance
export default new BedrockAgentService();
