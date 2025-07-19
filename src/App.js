import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Friends from './components/Friends';
import AuthService from './services/AuthService';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // First check if we have a token
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        // Use stored user data immediately to prevent logout on refresh
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Optionally validate token with server in background
        try {
          const freshUserData = await AuthService.getCurrentUser();
          if (freshUserData && freshUserData.id) {
            setUser(freshUserData);
            localStorage.setItem('user', JSON.stringify(freshUserData));
          }
        } catch (error) {
          // If token is invalid, clear everything
          console.log('Token validation failed, logging out');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        // No token or stored user, try to get current user
        const userData = await AuthService.getCurrentUser();
        if (userData && userData.id) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.log('Not authenticated');
      // Clear any stale data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    if (userData && userData.id) {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local data even if server logout fails
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/dashboard" replace /> : 
              <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/register" 
            element={
              user ? <Navigate to="/dashboard" replace /> : 
              <Register onRegister={handleLogin} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              user ? <Dashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/profile/:userId?" 
            element={
              user ? <Profile user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/friends" 
            element={
              user ? <Friends user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;