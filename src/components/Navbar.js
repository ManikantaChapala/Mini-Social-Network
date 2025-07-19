import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-brand">
          Social Network
        </Link>
        
        <div className="navbar-nav">
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard')}`}
          >
            Feed
          </Link>
          <Link 
            to="/friends" 
            className={`nav-link ${isActive('/friends')}`}
          >
            Friends
          </Link>
          <Link 
            to="/profile" 
            className={`nav-link ${isActive('/profile')}`}
          >
            Profile
          </Link>
          
          <div className="nav-link" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Welcome, {user?.username}
          </div>
          
          <button 
            onClick={onLogout}
            className="gradient-button secondary"
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;