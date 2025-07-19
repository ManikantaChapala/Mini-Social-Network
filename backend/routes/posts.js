const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { PriorityQueue, TopologicalSort } = require('../utils/GraphAlgorithms');

const router = express.Router();

// Create a new post
router.post('/', auth, async (req, res) => {
  try {
    const { content, visibility = 'public', hashtags = [] } = req.body;

    const post = new Post({
      author: req.user._id,
      content,
      visibility,
      hashtags: hashtags.map(tag => tag.replace('#', ''))
    });

    post.calculateEngagementScore();
    await post.save();

    // Add post to user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { posts: post._id }
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username profile')
      .populate('comments.author', 'username profile');

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feed with ranking using priority queue
router.get('/feed', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id).populate('friends.user');
    const friendIds = currentUser.friends.map(friend => friend.user._id);
    
    // Get posts from friends, public posts, and shared posts
    const authoredPosts = await Post.find({
      $or: [
        { author: { $in: friendIds } },
        { visibility: 'public' },
        { author: req.user._id }
      ]
    })
    .populate('author', 'username profile')
    .populate('comments.author', 'username profile')
    .sort({ createdAt: -1 })
    .limit(limit * 3); // Get more posts for ranking

    // Get shared posts by friends and current user
    const sharedPosts = await Post.find({
      'shares.user': { $in: [...friendIds, req.user._id] }
    })
    .populate('author', 'username profile')
    .populate('comments.author', 'username profile')
    .populate('shares.user', 'username profile')
    .sort({ 'shares.sharedAt': -1 })
    .limit(limit * 2);

    // Combine and deduplicate posts
    const allPostsMap = new Map();
    
    // Add authored posts
    authoredPosts.forEach(post => {
      allPostsMap.set(post._id.toString(), post);
    });
    
    // Add shared posts (mark them as shared)
    sharedPosts.forEach(post => {
      const postId = post._id.toString();
      if (!allPostsMap.has(postId)) {
        // Mark this post as shared and add share info
        post.isShared = true;
        post.sharedBy = post.shares.filter(share => 
          [...friendIds, req.user._id].some(id => id.toString() === share.user._id.toString())
        );
        allPostsMap.set(postId, post);
      }
    });

    const posts = Array.from(allPostsMap.values());

    // Use priority queue for feed ranking
    const priorityQueue = new PriorityQueue();
    
    posts.forEach(post => {
      post.calculateEngagementScore();
      priorityQueue.enqueue(post, post.engagementScore);
    });

    // Extract ranked posts from priority queue
    const rankedPosts = [];
    let count = 0;
    
    while (!priorityQueue.isEmpty() && count < limit) {
      rankedPosts.push(priorityQueue.dequeue());
      count++;
    }

    // Apply topological sorting for final organization
    const sortedPostIds = TopologicalSort.sort(rankedPosts);
    const finalPosts = sortedPostIds
      .map(id => rankedPosts.find(post => post._id.toString() === id))
      .filter(Boolean)
      .slice(skip, skip + parseInt(limit));

    res.json({
      posts: finalPosts,
      hasMore: rankedPosts.length > skip + parseInt(limit)
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get posts by user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get authored posts
    const authoredPosts = await Post.find({ author: userId })
      .populate('author', 'username profile')
      .populate('comments.author', 'username profile')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 2);

    // Get shared posts by this user
    const sharedPosts = await Post.find({
      'shares.user': userId,
      author: { $ne: userId } // Exclude posts authored by the same user
    })
    .populate('author', 'username profile')
    .populate('comments.author', 'username profile')
    .populate('shares.user', 'username profile')
    .sort({ 'shares.sharedAt': -1 })
    .limit(parseInt(limit));

    console.log(authoredPosts);

    // Combine posts and mark shared ones
    const allPosts = [];
    
    // Add authored posts
    authoredPosts.forEach(post => {
      allPosts.push({
        ...post.toObject(),
        isShared: false,
        postType: 'authored'
      });
    });
    // Add shared posts
    sharedPosts.forEach(post => {
      const userShare = post.shares.find(share => 
        share.user._id.toString() === userId.toString()
      );
      allPosts.push({
        ...post.toObject(),
        isShared: true,
        postType: 'shared',
        sharedAt: userShare ? userShare.sharedAt : null,
        sharedBy: [{ user: { _id: userId }, sharedAt: userShare ? userShare.sharedAt : null }]
      });
    });
    
    // Sort by creation/share date and paginate
    allPosts.sort((a, b) => {
      const dateA = a.isShared ? new Date(a.sharedAt) : new Date(a.createdAt);
      const dateB = b.isShared ? new Date(b.sharedAt) : new Date(b.createdAt);
      return dateB - dateA;
    });
    
    const paginatedPosts = allPosts.slice(skip, skip + parseInt(limit));
    
    const totalAuthoredPosts = await Post.countDocuments({ author: userId });
    const totalSharedPosts = await Post.countDocuments({ 
      'shares.user': userId,
      author: { $ne: userId }
    });
    const totalPosts = totalAuthoredPosts + totalSharedPosts;

    res.json({
      posts: paginatedPosts,
      hasMore: totalPosts > skip + parseInt(limit)
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/unlike a post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.some(like => {
      const likeId = like._id ? like._id.toString() : like.toString();
      return likeId === req.user._id.toString();
    });

    if (isLiked) {
      post.likes = post.likes.filter(like => {
        const likeId = like._id ? like._id.toString() : like.toString();
        return likeId !== req.user._id.toString();
      });
    } else {
      post.likes.push(req.user._id);
    }

    post.calculateEngagementScore();
    await post.save();

    res.json({ 
      liked: !isLiked, 
      likesCount: post.likes.length,
      engagementScore: post.engagementScore
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to post (tree structure)
router.post('/:postId/comment', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId = null } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = {
      author: req.user._id,
      content,
      parentComment: parentCommentId,
      depth: 0
    };

    // If it's a reply, find parent and set depth
    if (parentCommentId) {
      const parentComment = post.comments.id(parentCommentId);
      if (parentComment) {
        newComment.depth = parentComment.depth + 1;
        parentComment.replies.push(newComment);
      }
    } else {
      post.comments.push(newComment);
    }

    post.calculateEngagementScore();
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('author', 'username profile')
      .populate('comments.author', 'username profile')
      .populate('comments.replies.author', 'username profile');

    res.json(updatedPost);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share a post
router.post('/:postId/share', auth, async (req, res) => {
  try {
    const { postId } = req.params;

    const originalPost = await Post.findById(postId);
    if (!originalPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already shared this post
    const existingShareIndex = originalPost.shares.findIndex(
      share => share.user.toString() === req.user._id.toString()
    );

    let action;
    if (existingShareIndex !== -1) {
      // Remove share (undo repost)
      originalPost.shares.splice(existingShareIndex, 1);
      action = 'unshared';
    } else {
      // Add share
      originalPost.shares.push({ user: req.user._id });
      action = 'shared';
    }

    originalPost.calculateEngagementScore();
    await originalPost.save();

    res.json({
      message: action === 'shared' ? 'Post shared successfully' : 'Post unshared successfully',
      action: action,
      sharesCount: originalPost.shares.length,
      shares: originalPost.shares
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);

    // Remove from user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { posts: postId }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get trending posts
router.get('/trending', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const posts = await Post.find({ visibility: 'public' })
      .populate('author', 'username profile')
      .populate('comments.author', 'username profile')
      .sort({ engagementScore: -1 })
      .limit(parseInt(limit));

    res.json(posts);
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search posts
router.get('/search', auth, async (req, res) => {
  try {
    const { q, hashtag } = req.query;

    let query = { visibility: 'public' };

    if (q) {
      query.content = { $regex: q, $options: 'i' };
    }

    if (hashtag) {
      query.hashtags = { $in: [hashtag.replace('#', '')] };
    }

    const posts = await Post.find(query)
      .populate('author', 'username profile')
      .populate('comments.author', 'username profile')
      .sort({ engagementScore: -1 })
      .limit(20);

    res.json(posts);
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;