const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: true, 
    maxlength: 500 
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [this], // Tree structure for nested comments
  depth: { type: Number, default: 0 },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: true, 
    maxlength: 1000 
  },
  media: {
    type: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
    url: { type: String }
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema], // Tree structure for comments
  shares: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sharedAt: { type: Date, default: Date.now }
  }],
  visibility: { 
    type: String, 
    enum: ['public', 'friends', 'private'], 
    default: 'public' 
  },
  engagementScore: { type: Number, default: 0 }, // For priority queue ranking
  trending: { type: Boolean, default: false },
  hashtags: [String],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

// Calculate engagement score for priority queue
postSchema.methods.calculateEngagementScore = function() {
  const now = new Date();
  const createdAt = this.createdAt || now;  // fallback to now if undefined
  const ageInHours = (now - createdAt) / (1000 * 60 * 60);

  const likes = Array.isArray(this.likes) ? this.likes : [];
  const comments = Array.isArray(this.comments) ? this.comments : [];
  const shares = Array.isArray(this.shares) ? this.shares : [];

  const likeScore = likes.length * 1;
  const commentScore = comments.length * 2;
  const shareScore = shares.length * 3;
  const recencyScore = Math.max(0, 100 - (isNaN(ageInHours) ? 0 : ageInHours));

  const totalScore = likeScore + commentScore + shareScore + recencyScore;
  this.engagementScore = isNaN(totalScore) ? 0 : totalScore;

  return this.engagementScore;
};


module.exports = mongoose.model('Post', postSchema);