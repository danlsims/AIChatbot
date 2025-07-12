import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import authService from '../auth/authService';
import './Navigation.css';

const Navigation = ({ user }) => {
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Get display name from user pool attributes
  const getDisplayName = () => {
    // First try to get the 'name' attribute from user pool
    const name = user?.attributes?.name;
    if (name && name !== 'Your Name') {
      return name;
    }
    
    // Fallback to email username if no proper name is set
    const email = user?.attributes?.email || user?.username || authService.getUsername();
    if (email && email.includes('@')) {
      return email.split('@')[0];
    }
    return email || 'User';
  };

  const displayName = getDisplayName();

  return (
    <nav className="main-navigation">
      <div className="nav-header">
        <div className="header-content">
          <h2>🤖 PECARN Assistant</h2>
          {user && (
            <div className="user-info">
              <div className="user-details">
                <span className="user-greeting">Welcome, {displayName}</span>
              </div>
              <span className="user-icon">👤</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="nav-links">
        <Link 
          to="/conversations" 
          className={`nav-link ${isActive('/conversations') ? 'active' : ''}`}
        >
          💬 Chat
        </Link>
        <Link 
          to="/upload" 
          className={`nav-link ${isActive('/upload') ? 'active' : ''}`}
        >
          📚 Upload Documents
        </Link>
      </div>

      <div className="nav-footer">
        <button onClick={handleSignOut} className="logout-btn">
          <span className="logout-icon">🚪</span>
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
