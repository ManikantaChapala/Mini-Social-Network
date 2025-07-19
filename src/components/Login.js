import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await AuthService.login(formData.email, formData.password);
      onLogin(user);
      navigate('/dashboard'); 
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="glass-container">
        <div className="text-center mb-20">
          <h1 className="navbar-brand" style={{ fontSize: '36px' }}>
            Social Network
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginTop: '10px' }}>
            Connect with friends using advanced algorithms
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="gradient-button w-full"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="text-center mt-20">
            <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Don't have an account?{' '}
              <Link 
                to="/register" 
                style={{ 
                  color: '#8EC5FC', 
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                Sign Up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
