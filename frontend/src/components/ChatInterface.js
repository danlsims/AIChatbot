import React, { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import ConversationHeader from './ConversationHeader';
import bedrockAgentService from '../services/bedrockAgentService';
import config from '../config';
import './ChatInterface.css';

function ChatInterface({ conversation, onConversationUpdate }) {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentConversation, setCurrentConversation] = useState(conversation);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Character limit for messages
  const characterLimit = 2000;

  // Update current conversation when prop changes
  useEffect(() => {
    setCurrentConversation(conversation);
  }, [conversation]);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation && conversation.conversation_id) {
      const loadMessages = async () => {
        try {
          console.log('Loading messages for conversation:', conversation.conversation_id);
          const conversationMessages = await bedrockAgentService.getMessages(conversation.conversation_id);
          setMessages(conversationMessages);
          console.log('Loaded messages:', conversationMessages);
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      };
      
      loadMessages();
    }
  }, [conversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle conversation updates from header
  const handleConversationUpdate = (updatedConversation) => {
    setCurrentConversation(updatedConversation);
    console.log('Conversation updated in chat interface:', updatedConversation);
    
    // Notify parent component (App.js) about the update
    if (onConversationUpdate) {
      onConversationUpdate(updatedConversation);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [messageInput]);

  // Set up message update listener
  useEffect(() => {
    const handleMessageUpdate = (updatedMessage) => {
      setMessages(prevMessages => {
        return prevMessages.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        );
      });
    };

    bedrockAgentService.onMessageUpdate(handleMessageUpdate);

    return () => {
      bedrockAgentService.onMessageUpdate(null);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || isSending) return;
    
    const messageContent = messageInput.trim();
    setMessageInput('');
    setIsSending(true);
    setIsTyping(false);

    try {
      // Send message to Bedrock Agent
      console.log('Sending message to conversation:', conversation.conversation_id);
      await bedrockAgentService.sendMessage(conversation.conversation_id, messageContent);
      
      // Refresh messages from service
      const updatedMessages = await bedrockAgentService.getMessages(conversation.conversation_id);
      setMessages(updatedMessages);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Don't show alert, the error will be displayed in the message bubble
    } finally {
      setIsSending(false);
    }
  };

  // Handle input key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Get character count and limit
  const characterCount = messageInput.length;
  const isNearLimit = characterCount > characterLimit * 0.8;

  return (
    <div className="chat-interface">
      <ConversationHeader 
        conversation={currentConversation} 
        onConversationUpdate={handleConversationUpdate}
      />
      
      <div className="chat-messages-container">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              <div className="chat-empty-icon">🤖</div>
              <h3 className="chat-empty-title">Welcome to PECARN Assistant</h3>
              <p className="chat-empty-subtitle">
                I'm here to help you analyze PECARN medical records and clinical data. 
                Ask me questions about patient encounters, research findings, or clinical protocols.
              </p>
              <div className="chat-suggestions">
                <div className="chat-suggestion" onClick={() => setMessageInput("What types of medical records can you analyze?")}>
                  <div className="chat-suggestion-title">📋 Record Analysis</div>
                  <div className="chat-suggestion-text">What types of medical records can you analyze?</div>
                </div>
                <div className="chat-suggestion" onClick={() => setMessageInput("How can you help with pediatric emergency care?")}>
                  <div className="chat-suggestion-title">🏥 Emergency Care</div>
                  <div className="chat-suggestion-text">How can you help with pediatric emergency care?</div>
                </div>
                <div className="chat-suggestion" onClick={() => setMessageInput("What PECARN research data do you have access to?")}>
                  <div className="chat-suggestion-title">🔬 Research Data</div>
                  <div className="chat-suggestion-text">What PECARN research data do you have access to?</div>
                </div>
              </div>
            </div>
          ) : (
            <MessageList messages={messages} />
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <form onSubmit={handleSendMessage}>
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about PECARN medical records..."
              disabled={isSending}
              maxLength={characterLimit}
              className="chat-input"
              rows="1"
            />
            <button 
              type="submit" 
              disabled={!messageInput.trim() || isSending || characterCount > characterLimit}
              className="chat-send-button"
              title="Send message"
            >
              {isSending ? (
                <div className="chat-loading-spinner"></div>
              ) : (
                <span>➤</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatInterface;
