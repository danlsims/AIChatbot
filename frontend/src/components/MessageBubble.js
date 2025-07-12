import React from 'react';
import './MessageBubble.css';

function MessageBubble({ message }) {
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Determine if the message is from the user or the AI assistant
  const isUserMessage = message.role === 'user';

  // Check if the message is still being generated (streaming)
  const isGenerating = message.role === 'assistant' && message.isComplete === false;
  
  // Check if this is a placeholder message (just "...")
  const isPlaceholder = message.role === 'assistant' && 
                        message.content === "..." && 
                        message.id && message.id.startsWith('placeholder-');
  
  // Don't render placeholder messages if they should be hidden
  if (isPlaceholder) {
    return null;
  }
  
  // Safety check for undefined message properties
  if (!message || !message.content) {
    return null;
  }

  // Show typing indicator for generating messages
  if (isGenerating && !message.content) {
    return (
      <div className="message-bubble assistant">
        <div className="message-content">
          <div className="message-header">
            <div className="message-avatar">🤖</div>
            <div className="message-info">
              <div className="message-sender">PECARN Assistant</div>
              <div className="message-timestamp">{formatTimestamp(message.timestamp)}</div>
            </div>
          </div>
          <div className="message-loading">
            <div className="message-loading-dots">
              <div className="message-loading-dot"></div>
              <div className="message-loading-dot"></div>
              <div className="message-loading-dot"></div>
            </div>
            <div className="message-loading-text">Thinking...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`message-bubble ${isUserMessage ? 'user' : 'assistant'}`}>
      <div className="message-content">
        <div className="message-header">
          <div className="message-avatar">
            {isUserMessage ? '👤' : '🤖'}
          </div>
          <div className="message-info">
            <div className="message-sender">
              {isUserMessage ? 'You' : 'PECARN Assistant'}
            </div>
            <div className="message-timestamp">
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
        
        <div className="message-text">
          {/* Format the message content with proper line breaks and formatting */}
          {message.content.split('\n').map((line, index) => (
            <p key={index}>{line || '\u00A0'}</p>
          ))}
          
          {/* Show generating indicator for streaming messages */}
          {isGenerating && (
            <div className="generating-indicator">
              <span className="cursor">|</span>
            </div>
          )}
        </div>

        {/* Message actions (copy, etc.) */}
        <div className="message-actions">
          <button 
            className="message-action-button"
            onClick={() => navigator.clipboard.writeText(message.content)}
            title="Copy message"
          >
            📋 Copy
          </button>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
