  import axios from 'axios';

  const API_BASE_URL = 'https://msmbackend.onrender.com/api';

  // Set up axios interceptor for auth token
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.withCredentials = true; // Ensure cookies are sent
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Enhanced response interceptor
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        // Don't redirect here - let components handle it
      }
      return Promise.reject(error);
    }
  );

  class AuthService {
    static async login(email, password) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email,
          password
        }, {
          withCredentials: true // Important for session cookies
        });
        
        const { token, user } = response.data;
        if (token) {
          localStorage.setItem('token', token);
        }
        return user;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Login failed');
      }
    }

    static async register(username, email, password) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
          username,
          email,
          password
        }, {
          withCredentials: true
        });
        
        const { token, user } = response.data;
        if (token) {
          localStorage.setItem('token', token);
        }
        return user;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Registration failed');
      }
    }

    static async getCurrentUser() {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          withCredentials: true
        });
        return response.data;
      } catch (error) {
        // Return null instead of throwing to simplify auth checks
        return null;
      }
    }

    static async logout() {
      try {
        await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
          withCredentials: true
        });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        localStorage.removeItem('token');
      }
    }

    static getToken() {
      return localStorage.getItem('token');
    }

    static isAuthenticated() {
      return !!this.getToken();
    }
  }

  export default AuthService;