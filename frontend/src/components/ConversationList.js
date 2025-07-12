import React, { useState, useEffect } from 'react';
import bedrockAgentService from '../services/bedrockAgentService';
import './ConversationList.css';

function ConversationList({ onSelectConversation, onCreateConversation, selectedConversationId, onConversationUpdate }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Listen for conversation updates from parent (e.g., header renames)
  useEffect(() => {
    if (onConversationUpdate) {
      // This will be called when the parent wants to update a conversation
      const handleExternalUpdate = (updatedConversation) => {
        setConversations(prev => 
          prev.map(conv => 
            conv.conversation_id === updatedConversation.conversation_id 
              ? updatedConversation
              : conv
          )
        );
      };
      
      // Store the handler so parent can call it
      window.updateConversationInList = handleExternalUpdate;
    }
    
    return () => {
      if (window.updateConversationInList) {
        delete window.updateConversationInList;
      }
    };
  }, [onConversationUpdate]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const conversationList = await bedrockAgentService.listConversations();
      setConversations(conversationList);
      console.log('Loaded conversations:', conversationList);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new conversation (simplified - no custom title)
  const handleCreateConversation = async (e) => {
    e.preventDefault();
    
    try {
      setIsCreating(true);
      setError(null);
      
      console.log('Creating conversation...');
      
      const newConversation = await bedrockAgentService.createConversation();
      console.log('Conversation created:', newConversation);
      
      // Add to local state
      setConversations(prev => [newConversation, ...prev]);
      
      // Select the new conversation
      onSelectConversation(newConversation);
      
      console.log('Successfully created and selected conversation:', newConversation.conversation_id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Failed to create conversation: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle quick conversation creation (no title)
  const handleQuickCreateConversation = async () => {
    try {
      setError(null);
      setIsCreating(true);
      console.log('Quick creating conversation...');
      
      const newConversation = await bedrockAgentService.createConversation();
      console.log('Quick conversation created:', newConversation);
      
      // Add to local state
      setConversations(prev => [newConversation, ...prev]);
      
      // Select the new conversation
      onSelectConversation(newConversation);
      
      console.log('Successfully quick created and selected conversation:', newConversation.conversation_id);
    } catch (error) {
      console.error('Error quick creating conversation:', error);
      setError('Failed to create conversation: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle starting to edit a conversation title
  const handleStartEditTitle = (conversation, e) => {
    e.stopPropagation(); // Prevent conversation selection
    setEditingConversationId(conversation.conversation_id);
    setEditingTitle(conversation.title);
  };

  // Handle saving the edited title
  const handleSaveEditTitle = async (conversationId, e) => {
    e.stopPropagation(); // Prevent conversation selection
    
    try {
      const newTitle = editingTitle.trim();
      if (!newTitle) {
        setError('Title cannot be empty');
        return;
      }

      console.log('Updating conversation title:', conversationId, newTitle);
      
      // Update the conversation in DynamoDB
      const updatedConversation = await bedrockAgentService.updateConversation(conversationId, {
        title: newTitle
      });
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.conversation_id === conversationId 
            ? { ...conv, title: newTitle, updated_at: updatedConversation.updated_at }
            : conv
        )
      );
      
      // Reset editing state
      setEditingConversationId(null);
      setEditingTitle('');
      setError(null);
      
      console.log('Conversation title updated successfully');
    } catch (error) {
      console.error('Error updating conversation title:', error);
      setError('Failed to update title: ' + error.message);
    }
  };

  // Handle canceling the edit
  const handleCancelEditTitle = (e) => {
    e.stopPropagation(); // Prevent conversation selection
    setEditingConversationId(null);
    setEditingTitle('');
  };

  // Handle key press in edit input
  const handleEditKeyPress = (conversationId, e) => {
    if (e.key === 'Enter') {
      handleSaveEditTitle(conversationId, e);
    } else if (e.key === 'Escape') {
      handleCancelEditTitle(e);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = async (conversation) => {
    try {
      // Load messages for the selected conversation
      const messages = await bedrockAgentService.getMessages(conversation.conversation_id);
      console.log(`Loaded ${messages.length} messages for conversation ${conversation.conversation_id}`);
      
      // Notify parent component
      onSelectConversation(conversation);
    } catch (error) {
      console.error('Error selecting conversation:', error);
      setError('Failed to load conversation messages');
    }
  };

  // Handle conversation deletion
  const handleDeleteConversation = async (conversationId, e) => {
    e.stopPropagation(); // Prevent conversation selection
    
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      await bedrockAgentService.deleteConversation(conversationId);
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.conversation_id !== conversationId));
      
      // If this was the selected conversation, clear selection
      if (selectedConversationId === conversationId) {
        onSelectConversation(null);
      }
      
      console.log('Deleted conversation:', conversationId);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError('Failed to delete conversation');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format conversation preview
  const getConversationPreview = (conversation) => {
    if (conversation.message_count > 0) {
      return `${conversation.message_count} messages`;
    }
    return 'No messages yet';
  };

  if (loading) {
    return (
      <div className="conversation-list">
        <div className="conversation-list-header">
          <h2 className="conversation-list-title">Conversations</h2>
        </div>
        <div className="conversations-loading">
          <div className="conversations-loading-spinner"></div>
          <div className="conversations-loading-text">Loading conversations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <h2 className="conversation-list-title">Conversations</h2>
        <p className="conversation-list-subtitle">Your chat history with PECARN Assistant</p>
        
        <button 
          className="new-conversation-button"
          onClick={handleQuickCreateConversation}
          disabled={isCreating}
        >
          <span className="new-conversation-icon">✨</span>
          {isCreating ? 'Creating...' : 'New Chat'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={loadConversations} className="retry-button">
            Retry
          </button>
        </div>
      )}

      <div className="conversations-container">
        {conversations.length === 0 ? (
          <div className="conversations-empty">
            <div className="conversations-empty-icon">💭</div>
            <h3 className="conversations-empty-title">No conversations yet</h3>
            <p className="conversations-empty-text">
              Start a new conversation to begin chatting with the PECARN Assistant
            </p>
            <button 
              className="conversations-empty-button"
              onClick={handleQuickCreateConversation}
            >
              <span className="button-icon">✨</span>
              Start First Conversation
            </button>
          </div>
        ) : (
          <div className="conversations-list">
            {conversations.map((conversation) => (
              <div 
                key={conversation.conversation_id}
                className={`conversation-item ${selectedConversationId === conversation.conversation_id ? 'active' : ''}`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <div className="conversation-avatar">
                  {conversation.title.charAt(0).toUpperCase()}
                </div>
                
                <div className="conversation-details">
                  {editingConversationId === conversation.conversation_id ? (
                    <div className="conversation-title-edit">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => handleEditKeyPress(conversation.conversation_id, e)}
                        className="conversation-title-input"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="conversation-title-actions">
                        <button
                          className="conversation-title-save"
                          onClick={(e) => handleSaveEditTitle(conversation.conversation_id, e)}
                          title="Save title"
                        >
                          ✓
                        </button>
                        <button
                          className="conversation-title-cancel"
                          onClick={handleCancelEditTitle}
                          title="Cancel edit"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="conversation-title">
                        {conversation.title}
                      </div>
                      <div className="conversation-preview">
                        {getConversationPreview(conversation)}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="conversation-meta">
                  <div className="conversation-time">
                    {formatDate(conversation.updated_at)}
                  </div>
                  {conversation.message_count > 0 && (
                    <div className="conversation-badge">
                      {conversation.message_count}
                    </div>
                  )}
                </div>

                <div className="conversation-actions">
                  <button
                    className="conversation-action rename"
                    onClick={(e) => handleStartEditTitle(conversation, e)}
                    title="Rename conversation"
                  >
                    <span className="conversation-action-icon">✏️</span>
                  </button>
                  <button
                    className="conversation-action delete"
                    onClick={(e) => handleDeleteConversation(conversation.conversation_id, e)}
                    title="Delete conversation"
                  >
                    <span className="conversation-action-icon">🗑️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConversationList;
