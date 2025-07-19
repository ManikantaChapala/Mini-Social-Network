const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { Graph } = require('../utils/GraphAlgorithms');

const router = express.Router();

// Send friend request
router.post('/request/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    const targetUser = await User.findById(userId);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends
    const isAlreadyFriend = currentUser.friends.some(
      friend => friend.user.toString() === userId
    );
    
    if (isAlreadyFriend) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if request already sent
    const requestAlreadySent = currentUser.friendRequests.sent.includes(userId);
    if (requestAlreadySent) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Check if there's a pending request from target user
    const pendingRequest = currentUser.friendRequests.received.includes(userId);
    if (pendingRequest) {
      // Accept the existing request
      currentUser.friends.push({ user: userId });
      targetUser.friends.push({ user: req.user._id });
      
      currentUser.friendRequests.received = currentUser.friendRequests.received.filter(
        id => id.toString() !== userId
      );
      targetUser.friendRequests.sent = targetUser.friendRequests.sent.filter(
        id => id.toString() !== req.user._id.toString()
      );

      await currentUser.save();
      await targetUser.save();

      return res.json({ message: 'Friend request accepted' });
    }

    // Send new friend request
    currentUser.friendRequests.sent.push(userId);
    targetUser.friendRequests.received.push(req.user._id);

    await currentUser.save();
    await targetUser.save();

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept friend request
router.post('/accept/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUser = await User.findById(req.user._id);
    const requestingUser = await User.findById(userId);

    if (!requestingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if request exists
    const requestExists = currentUser.friendRequests.received.includes(userId);
    if (!requestExists) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }

    // Add to friends list
    currentUser.friends.push({ user: userId });
    requestingUser.friends.push({ user: req.user._id });

    // Remove from requests
    currentUser.friendRequests.received = currentUser.friendRequests.received.filter(
      id => id.toString() !== userId
    );
    requestingUser.friendRequests.sent = requestingUser.friendRequests.sent.filter(
      id => id.toString() !== req.user._id.toString()
    );

    await currentUser.save();
    await requestingUser.save();

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject friend request
router.post('/reject/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUser = await User.findById(req.user._id);
    const requestingUser = await User.findById(userId);

    if (!requestingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from requests
    currentUser.friendRequests.received = currentUser.friendRequests.received.filter(
      id => id.toString() !== userId
    );
    requestingUser.friendRequests.sent = requestingUser.friendRequests.sent.filter(
      id => id.toString() !== req.user._id.toString()
    );

    await currentUser.save();
    await requestingUser.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove friend
router.delete('/remove/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUser = await User.findById(req.user._id);
    const friend = await User.findById(userId);

    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from friends list
    currentUser.friends = currentUser.friends.filter(
      friendObj => friendObj.user.toString() !== userId
    );
    friend.friends = friend.friends.filter(
      friendObj => friendObj.user.toString() !== req.user._id.toString()
    );

    await currentUser.save();
    await friend.save();

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get friend requests
router.get('/requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friendRequests.received', 'username email profile')
      .populate('friendRequests.sent', 'username email profile');

    res.json({
      received: user.friendRequests.received,
      sent: user.friendRequests.sent
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get friends list
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends.user', 'username email profile isOnline lastSeen');

    const friends = user.friends.map(friendship => ({
      ...friendship.user.toObject(),
      connectedAt: friendship.connectedAt
    }));

    res.json(friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Detect communities using DFS
router.get('/communities', auth, async (req, res) => {
  try {
    const allUsers = await User.find().populate('friends.user');
    const graph = new Graph();
    
    // Build friendship graph
    allUsers.forEach(user => {
      graph.addVertex(user._id.toString());
      user.friends.forEach(friend => {
        graph.addEdge(user._id.toString(), friend.user._id.toString());
      });
    });
    
    // Detect communities using DFS
    const communities = graph.dfsComponentDetection();
    
    // Get user details for each community
    const communitiesWithDetails = await Promise.all(
      communities.map(async (community) => {
        const users = await User.find({ 
          _id: { $in: community } 
        }).select('username profile');
        
        return {
          id: community[0], // Use first user ID as community ID
          size: community.length,
          users: users
        };
      })
    );
    
    // Update user community assignments
    for (let i = 0; i < communities.length; i++) {
      const communityId = `community_${i}`;
      await User.updateMany(
        { _id: { $in: communities[i] } },
        { community: communityId }
      );
    }
    
    res.json(communitiesWithDetails);
  } catch (error) {
    console.error('Detect communities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;