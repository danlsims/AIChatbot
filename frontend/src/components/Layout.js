import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import authService from '../auth/authService';
import './Layout.css';

const Layout = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    loadUser();
  }, []);

  return (
    <div className="app-layout">
      <Navigation user={user} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
