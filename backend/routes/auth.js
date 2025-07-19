    const express = require('express');
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    const auth = require('../middleware/auth');

    const router = express.Router();

    // Register
    router.post('/register', async (req, res) => {
      try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [{ email }, { username }] 
        });

        if (existingUser) {
          return res.status(400).json({ 
            message: 'User with this email or username already exists' 
          });
        }

        // Create new user
        const user = new User({
          username,
          email,
          password
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.status(201).json({
          message: 'User created successfully',
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email
          }
        });
      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
      }
    });

    // Login
    router.post('/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update online status
        user.isOnline = true;
        user.lastSeen = new Date();
        await user.save();

        // Create JWT token
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email
          }
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
      }
    });

    // Get current user
    router.get('/me', auth, async (req, res) => {
      try {
        const user = await User.findById(req.user._id)
          .select('-password')
          .populate('friends.user', 'username email profile');
        
        res.json(user);
      } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });

    // Refresh token endpoint
    router.post('/refresh', async (req, res) => {
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token missing' });
      }

      try {
        const decoded = verifyRefreshToken(refreshToken);
        const newAccessToken = generateAccessToken(decoded.userId);
        res.json({ token: newAccessToken });
      } catch (error) {
        res.status(403).json({ message: 'Invalid refresh token' });
      }
    });

    // Logout
    router.post('/logout', auth, async (req, res) => {
      try {
        const user = await User.findById(req.user._id);
        user.isOnline = false;
        user.lastSeen = new Date();
        await user.save();

        res.json({ message: 'Logged out successfully' });
      } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });

    module.exports = router;