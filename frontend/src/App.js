import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ConversationList from './components/ConversationList';
import ChatInterface from './components/ChatInterface';
import LoginForm from './components/LoginForm';
import FileUploadPage from './components/FileUploadPage';
import Navigation from './components/Navigation';
import authService from './auth/authService';
import bedrockAgentService from './services/bedrockAgentService';
import './App.css';

// Dashboard component that contains the main app functionality
function Dashboard() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user info on component mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        console.log('User loaded:', currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    console.log('Selected conversation:', conversation);
    setSelectedConversation(conversation);
  };

  // Handle creating new conversation
  const handleCreateConversation = async () => {
    try {
      console.log('Creating new conversation...');
      const newConversation = await bedrockAgentService.createConversation();
      setSelectedConversation(newConversation);
      console.log('Created and selected new conversation:', newConversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation. Please try again.');
    }
  };

  // Handle conversation updates (e.g., from header rename)
  const handleConversationUpdate = (updatedConversation) => {
    console.log('Conversation updated in App:', updatedConversation);
    // Update the selected conversation if it's the one being updated
    if (selectedConversation?.conversation_id === updatedConversation.conversation_id) {
      setSelectedConversation(updatedConversation);
    }
    
    // Update the conversation list if the handler exists
    if (window.updateConversationInList) {
      window.updateConversationInList(updatedConversation);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <div>Loading PECARN Assistant...</div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Navigation user={user} />
      <main className="main-content">
        <div className="app">
          <div className="app-container">
            <div className="sidebar">
              <ConversationList 
                onSelectConversation={handleSelectConversation}
                onCreateConversation={handleCreateConversation}
                selectedConversationId={selectedConversation?.conversation_id}
                onConversationUpdate={handleConversationUpdate}
              />
            </div>
            <div className="main-content">
              {selectedConversation ? (
                <ChatInterface 
                  key={`chat-interface-${selectedConversation.conversation_id}`} 
                  conversation={selectedConversation}
                  onConversationUpdate={handleConversationUpdate}
                />
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">💬</div>
                  <h3>Welcome to Your AI PECARN Assistant!</h3>
                  <p>Select a conversation or create a new one to start chatting about medical records, clinical data, and pediatric emergency care.</p>
                  <button onClick={handleCreateConversation} className="create-conversation-button">
                    <span className="button-icon">➕</span>
                    Start New Conversation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await authService.initialize();
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Login Page Component
function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    if (authService.isAuthenticated()) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (isAuthenticated) {
    return <Navigate to="/conversations" replace />;
  }

  return <LoginForm onLoginSuccess={handleLoginSuccess} />;
}

// Main App component that provides routing
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/conversations" replace />} />
        
        {/* Protected routes */}
        <Route path="/conversations" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/conversations/:id" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute>
            <FileUploadPage />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
