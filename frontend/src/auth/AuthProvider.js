import React, { createContext, useContext, useState, useEffect } from 'react';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const storedUser = localStorage.getItem('chatbot_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAuthenticated(true);
      initializeCredentials(userData);
    }
    setLoading(false);
  }, []);

  const initializeCredentials = async (userData) => {
    try {
      const credentialsProvider = fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: config.aws.region }),
        identityPoolId: config.aws.identityPoolId,
        logins: userData ? {
          'cognito-identity.amazonaws.com': userData.id
        } : undefined
      });

      setCredentials(credentialsProvider);
    } catch (error) {
      console.error('Error initializing credentials:', error);
    }
  };

  const login = async (username, email) => {
    try {
      setLoading(true);
      
      // Create a simple user object
      const userData = {
        id: `user_${Date.now()}`,
        username: username || 'Anonymous',
        email: email || 'anonymous@example.com',
        loginTime: new Date().toISOString()
      };

      // Store user data
      localStorage.setItem('chatbot_user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      // Initialize AWS credentials
      await initializeCredentials(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = async () => {
    return await login('Guest User', 'guest@example.com');
  };

  const logout = () => {
    localStorage.removeItem('chatbot_user');
    setUser(null);
    setIsAuthenticated(false);
    setCredentials(null);
  };

  const value = {
    isAuthenticated,
    user,
    credentials,
    loading,
    login,
    loginAsGuest,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
