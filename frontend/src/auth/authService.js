/**
 * Authentication service for Cognito User Pool authentication
 */

import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GetUserCommand,
  GlobalSignOutCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import config from '../config';

class AuthService {
  constructor() {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: config.aws.region
    });
    this.credentials = null;
    this.currentUser = null;
  }

  /**
   * Login with username and password using Cognito User Pool
   * @param {string} username - Username (email)
   * @param {string} password - Password
   * @returns {Promise<Object>} - Authentication data
   */
  async login(username, password) {
    try {
      console.log('Attempting login with:', { username, userPoolClientId: config.cognito.userPoolClientId });
      
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: config.cognito.userPoolClientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      });

      console.log('Sending authentication request...');
      const response = await this.cognitoClient.send(command);
      console.log('Authentication response received:', { 
        hasResult: !!response.AuthenticationResult,
        challengeName: response.ChallengeName 
      });
      
      if (response.AuthenticationResult) {
        const { AccessToken, IdToken, RefreshToken, ExpiresIn } = response.AuthenticationResult;
        
        // Store tokens in localStorage
        localStorage.setItem('accessToken', AccessToken);
        localStorage.setItem('idToken', IdToken);
        localStorage.setItem('refreshToken', RefreshToken);
        localStorage.setItem('tokenExpiry', Date.now() + (ExpiresIn * 1000));
        localStorage.setItem('username', username);
        
        // Get user details
        await this.getCurrentUser();
        
        // Initialize AWS credentials with the ID token
        await this.initializeCredentials();
        
        return {
          success: true,
          username: username,
          accessToken: AccessToken,
          idToken: IdToken,
          expiresIn: ExpiresIn
        };
      } else if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        // Store challenge data for password change
        return {
          success: false,
          challengeName: response.ChallengeName,
          challengeParameters: response.ChallengeParameters,
          session: response.Session,
          username: username
        };
      } else if (response.ChallengeName) {
        // Handle other challenges
        throw new Error(`Authentication challenge required: ${response.ChallengeName}`);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Invalid username or password');
      } else if (error.name === 'UserNotConfirmedException') {
        throw new Error('User account is not confirmed');
      } else if (error.name === 'PasswordResetRequiredException') {
        throw new Error('Password reset is required');
      } else if (error.name === 'UserNotFoundException') {
        throw new Error('User not found');
      } else if (error.name === 'TooManyRequestsException') {
        throw new Error('Too many login attempts. Please try again later.');
      }
      throw error;
    }
  }

  /**
   * Complete NEW_PASSWORD_REQUIRED challenge
   * @param {string} username - Username (email)
   * @param {string} newPassword - New password
   * @param {string} session - Challenge session
   * @returns {Promise<Object>} - Authentication data
   */
  async completeNewPasswordChallenge(username, newPassword, session) {
    try {
      console.log('Completing NEW_PASSWORD_REQUIRED challenge...');
      
      const command = new RespondToAuthChallengeCommand({
        ClientId: config.cognito.userPoolClientId,
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        Session: session,
        ChallengeResponses: {
          USERNAME: username,
          NEW_PASSWORD: newPassword
        }
      });

      const response = await this.cognitoClient.send(command);
      console.log('Password change response received:', { hasResult: !!response.AuthenticationResult });
      
      if (response.AuthenticationResult) {
        const { AccessToken, IdToken, RefreshToken, ExpiresIn } = response.AuthenticationResult;
        
        // Store tokens in localStorage
        localStorage.setItem('accessToken', AccessToken);
        localStorage.setItem('idToken', IdToken);
        localStorage.setItem('refreshToken', RefreshToken);
        localStorage.setItem('tokenExpiry', Date.now() + (ExpiresIn * 1000));
        localStorage.setItem('username', username);
        
        // Get user details
        await this.getCurrentUser();
        
        // Initialize AWS credentials with the ID token
        await this.initializeCredentials();
        
        return {
          success: true,
          username: username,
          accessToken: AccessToken,
          idToken: IdToken,
          expiresIn: ExpiresIn
        };
      } else if (response.ChallengeName) {
        // Handle additional challenges if any
        throw new Error(`Additional challenge required: ${response.ChallengeName}`);
      } else {
        throw new Error('Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      if (error.name === 'InvalidPasswordException') {
        throw new Error('Password does not meet requirements. Please ensure it has at least 8 characters with uppercase, lowercase, and numbers.');
      } else if (error.name === 'NotAuthorizedException') {
        throw new Error('Invalid session or credentials');
      }
      throw error;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser() {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const command = new GetUserCommand({
        AccessToken: accessToken
      });

      const response = await this.cognitoClient.send(command);
      this.currentUser = {
        username: response.Username,
        attributes: response.UserAttributes.reduce((acc, attr) => {
          acc[attr.Name] = attr.Value;
          return acc;
        }, {})
      };

      return this.currentUser;
    } catch (error) {
      console.error('Get current user error:', error);
      // If token is invalid, clear stored data
      if (error.name === 'NotAuthorizedException') {
        this.logout();
      }
      throw error;
    }
  }

  /**
   * Initialize AWS credentials using Cognito Identity Pool
   */
  async initializeCredentials() {
    try {
      const idToken = localStorage.getItem('idToken');
      if (!idToken) {
        throw new Error('No ID token found');
      }

      console.log('Initializing AWS credentials with ID token...');

      // Create credentials using Cognito Identity Pool with the ID token
      this.credentials = fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: config.aws.region }),
        identityPoolId: config.aws.identityPoolId,
        logins: {
          [`cognito-idp.${config.aws.region}.amazonaws.com/${config.cognito.userPoolId}`]: idToken
        }
      });

      // Test the credentials by resolving them
      console.log('Testing AWS credentials...');
      const resolvedCredentials = await this.credentials();
      console.log('AWS credentials initialized successfully:', {
        accessKeyId: resolvedCredentials.accessKeyId ? '***' : 'missing',
        secretAccessKey: resolvedCredentials.secretAccessKey ? '***' : 'missing',
        sessionToken: resolvedCredentials.sessionToken ? '***' : 'missing'
      });
      
      return this.credentials;
    } catch (error) {
      console.error('Failed to initialize AWS credentials:', error);
      throw error;
    }
  }

  /**
   * Get AWS credentials for making AWS service calls
   */
  async getCredentials() {
    if (!this.credentials) {
      await this.initializeCredentials();
    }
    return this.credentials;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !expiry) {
      return false;
    }
    
    // Check if token is expired
    if (Date.now() > parseInt(expiry)) {
      this.logout();
      return false;
    }
    
    return true;
  }

  /**
   * Get stored username
   */
  getUsername() {
    return localStorage.getItem('username') || 'User';
  }

  /**
   * Get user email from stored user attributes
   */
  getUserEmail() {
    if (this.currentUser && this.currentUser.attributes) {
      return this.currentUser.attributes.email;
    }
    return this.getUsername();
  }

  /**
   * Get access token
   */
  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get ID token
   */
  getIdToken() {
    return localStorage.getItem('idToken');
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: config.cognito.userPoolClientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response = await this.cognitoClient.send(command);
      
      if (response.AuthenticationResult) {
        const { AccessToken, IdToken, ExpiresIn } = response.AuthenticationResult;
        
        // Update stored tokens
        localStorage.setItem('accessToken', AccessToken);
        localStorage.setItem('idToken', IdToken);
        localStorage.setItem('tokenExpiry', Date.now() + (ExpiresIn * 1000));
        
        // Reinitialize credentials with new tokens
        await this.initializeCredentials();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Logout user and clear all stored data
   */
  async logout() {
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      if (accessToken) {
        // Sign out from Cognito
        const command = new GlobalSignOutCommand({
          AccessToken: accessToken
        });
        
        try {
          await this.cognitoClient.send(command);
        } catch (error) {
          console.warn('Error during Cognito sign out:', error);
          // Continue with local logout even if Cognito sign out fails
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all stored authentication data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('username');
      
      // Clear service state
      this.credentials = null;
      this.currentUser = null;
    }
  }

  /**
   * Sign out user (alias for logout)
   */
  async signOut() {
    return await this.logout();
  }

  /**
   * Auto-refresh tokens when they're about to expire
   */
  async autoRefreshTokens() {
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return false;

    const timeUntilExpiry = parseInt(expiry) - Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    // If token expires in less than 5 minutes, refresh it
    if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
      return await this.refreshTokens();
    }

    return true;
  }

  /**
   * Initialize the service and check authentication status
   */
  async initialize() {
    try {
      if (this.isAuthenticated()) {
        // Try to refresh tokens if needed
        await this.autoRefreshTokens();
        
        // Get current user info
        await this.getCurrentUser();
        
        // Initialize AWS credentials
        await this.initializeCredentials();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auth service initialization error:', error);
      this.logout();
      return false;
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
