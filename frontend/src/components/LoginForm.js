import React, { useState } from 'react';
import authService from '../auth/authService';
import PasswordChangeForm from './PasswordChangeForm';
import config from '../config';
import './LoginForm.css';

const LoginForm = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState(''); // Remove pre-filled test user
  const [password, setPassword] = useState(''); // Remove pre-filled test password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [challengeData, setChallengeData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        // Successful login
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else if (result.challengeName === 'NEW_PASSWORD_REQUIRED') {
        // Password change required
        setChallengeData(result);
      } else {
        setError('Authentication challenge not supported');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    // Password change successful, proceed with login
    setChallengeData(null);
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleBackToLogin = () => {
    setChallengeData(null);
    setError('');
  };

  // Show password change form if challenge is required
  if (challengeData && challengeData.challengeName === 'NEW_PASSWORD_REQUIRED') {
    return (
      <div>
        <PasswordChangeForm 
          challengeData={challengeData}
          onPasswordChangeSuccess={handlePasswordChangeSuccess}
        />
        <div className="back-to-login">
          <button onClick={handleBackToLogin}>
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🤖</div>
          <h1>{config.app.title}</h1>
          <p>{config.app.loginSubtitle || 'Sign in to access your AI PECARN assistant'}</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <span className="label-icon">📧</span>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="form-input email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <span className="label-icon">🔒</span>
              Password
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-input password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading || !email.trim() || !password.trim()}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing In...
              </>
            ) : (
              <>
                <span className="login-icon">🔐</span>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Secure access to your AI-powered PECARN assistant.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
