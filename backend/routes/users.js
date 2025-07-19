const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { Graph } = require('../utils/GraphAlgorithms');

const router = express.Router();

// Get all users (for search)
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = { _id: { $ne: req.user._id } };
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('username email profile isOnline lastSeen')
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('friends.user', 'username email profile')
      .populate('posts');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { bio, location } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (bio !== undefined) user.profile.bio = bio;
    if (location !== undefined) user.profile.location = location;
    
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get friend suggestions using graph algorithms
router.get('/suggestions/friends', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate('friends.user');
    const allUsers = await User.find({ _id: { $ne: req.user._id } });
    
    // Build friendship graph
    const graph = new Graph();
    
    // Add all users as vertices
    allUsers.forEach(user => {
      graph.addVertex(user._id.toString());
    });
    graph.addVertex(currentUser._id.toString());
    
    // Add friendship edges
    const userFriendsMap = new Map();
    
    for (const user of allUsers) {
      const userWithFriends = await User.findById(user._id).populate('friends.user');
      userFriendsMap.set(user._id.toString(), userWithFriends.friends.map(f => f.user._id.toString()));
      
      userWithFriends.friends.forEach(friend => {
        graph.addEdge(user._id.toString(), friend.user._id.toString());
      });
    }
    
    // Add current user's friendships
    currentUser.friends.forEach(friend => {
      graph.addEdge(currentUser._id.toString(), friend.user._id.toString());
    });
    
    const currentUserFriends = new Set(currentUser.friends.map(f => f.user._id.toString()));
    const suggestions = [];
    
    // Find mutual friends for suggestions
    for (const user of allUsers) {
      const userId = user._id.toString();
      
      if (!currentUserFriends.has(userId)) {
        const mutualFriends = graph.findMutualFriends(currentUser._id.toString(), userId);
        
        if (mutualFriends.length > 0) {
          suggestions.push({
            user: {
              _id: user._id,
              username: user.username,
              profile: user.profile
            },
            mutualFriendsCount: mutualFriends.length,
            mutualFriends: mutualFriends.slice(0, 3) // Show top 3 mutual friends
          });
        }
      }
    }
    
    // Sort by mutual friends count
    suggestions.sort((a, b) => b.mutualFriendsCount - a.mutualFriendsCount);
    
    res.json(suggestions.slice(0, 10)); // Return top 10 suggestions
  } catch (error) {
    console.error('Get friend suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Find shortest connection path between users
router.get('/connection/:targetUserId', auth, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    
    const allUsers = await User.find().populate('friends.user');
    const graph = new Graph();
    
    // Build graph
    allUsers.forEach(user => {
      graph.addVertex(user._id.toString());
      user.friends.forEach(friend => {
        graph.addEdge(user._id.toString(), friend.user._id.toString());
      });
    });
    
    // Find shortest path using BFS
    const path = graph.bfsShortestPath(req.user._id.toString(), targetUserId);
    
    if (!path) {
      return res.json({ connected: false, message: 'No connection found' });
    }
    
    // Get user details for the path
    const pathUsers = await User.find({ 
      _id: { $in: path } 
    }).select('username profile');
    
    const pathWithDetails = path.map(userId => 
      pathUsers.find(user => user._id.toString() === userId)
    );
    
    res.json({
      connected: true,
      distance: path.length - 1,
      path: pathWithDetails
    });
  } catch (error) {
    console.error('Find connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;