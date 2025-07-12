import React, { useState } from 'react';
import bedrockAgentService from '../services/bedrockAgentService';
import './ConversationHeader.css';

function ConversationHeader({ conversation, onConversationUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(conversation?.title || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Handle starting to edit the title
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditingTitle(conversation.title);
    setError(null);
  };

  // Handle saving the edited title
  const handleSaveEdit = async () => {
    try {
      const newTitle = editingTitle.trim();
      if (!newTitle) {
        setError('Title cannot be empty');
        return;
      }

      setIsUpdating(true);
      setError(null);

      console.log('Updating conversation title from header:', conversation.conversation_id, newTitle);
      
      // Update the conversation in DynamoDB
      const updatedConversation = await bedrockAgentService.updateConversation(conversation.conversation_id, {
        title: newTitle
      });
      
      // Notify parent component of the update
      if (onConversationUpdate) {
        onConversationUpdate(updatedConversation);
      }
      
      // Reset editing state
      setIsEditing(false);
      setIsUpdating(false);
      
      console.log('Conversation title updated successfully from header');
    } catch (error) {
      console.error('Error updating conversation title from header:', error);
      setError('Failed to update title: ' + error.message);
      setIsUpdating(false);
    }
  };

  // Handle canceling the edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingTitle(conversation.title);
    setError(null);
  };

  // Handle key press in edit input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  if (!conversation) {
    return null;
  }

  return (
    <div className="conversation-header">
      <div className="conversation-header-content">
        <div className="conversation-header-icon">💬</div>
        
        {isEditing ? (
          <div className="conversation-header-edit">
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              className="conversation-header-input"
              autoFocus
              disabled={isUpdating}
            />
            <div className="conversation-header-actions">
              <button
                className="conversation-header-save"
                onClick={handleSaveEdit}
                disabled={isUpdating}
                title="Save title"
              >
                {isUpdating ? '⏳' : '✓'}
              </button>
              <button
                className="conversation-header-cancel"
                onClick={handleCancelEdit}
                disabled={isUpdating}
                title="Cancel edit"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div className="conversation-header-title-section">
            <h2 className="conversation-header-title">{conversation.title}</h2>
            <button
              className="conversation-header-edit-button"
              onClick={handleStartEdit}
              title="Rename conversation"
            >
              <span className="edit-icon">✏️</span>
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="conversation-header-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      <div className="conversation-header-info">
        <span className="conversation-info-item">
          📅 {new Date(conversation.created_at).toLocaleDateString()}
        </span>
        <span className="conversation-info-item">
          💬 {conversation.message_count || 0} messages
        </span>
      </div>
    </div>
  );
}

export default ConversationHeader;
