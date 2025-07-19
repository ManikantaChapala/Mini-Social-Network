import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Repeat2, Trash2 } from 'lucide-react';
import ApiService from '../services/ApiService';

function Post({ post, currentUser, onUpdate, onDelete }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize states when post or currentUser changes
  useEffect(() => {
    if (post && currentUser) {
      // Check if current user has liked this post
      const userLiked = post.likes && Array.isArray(post.likes) && post.likes.some(like => {
        const likeId = typeof like === 'object' ? (like._id || like.toString()) : like.toString();
        const userId = currentUser.id.toString();
        return likeId === userId;
      });

      setLiked(userLiked);
      setLikesCount(post.likes ? post.likes.length : 0);

      // Check if current user has reposted this post
      // Check if current user has reposted this post
      // Check if current user has reposted this post
      const userReposted = Array.isArray(post.shares) && post.shares.some(share => {
        const uid = share?.user?._id?.toString?.() || share?.user?.toString?.();
        return uid === currentUser.id.toString();
      });

      setReposted(userReposted);
      setRepostCount(post.shares?.length || 0);


    }
  }, [post, currentUser]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLike = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const result = await ApiService.likePost(post._id);

      setLiked(result.liked);
      setLikesCount(result.likesCount);

      // Update the post object for parent components
      const updatedPost = {
        ...post,
        likes: result.liked
          ? [...(post.likes || []), currentUser.id]
          : (post.likes || []).filter(like => {
            const likeId = typeof like === 'object' ? (like._id || like.toString()) : like.toString();
            return likeId !== currentUser.id.toString();
          })
      };

      if (onUpdate) {
        onUpdate(updatedPost);
      }
    } catch (error) {
      console.error('Like error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim() || commenting) return;

    setCommenting(true);
    try {
      const updatedPost = await ApiService.addComment(post._id, newComment);
      if (onUpdate) {
        onUpdate(updatedPost);
      }
      setNewComment('');
      setShowComments(true);
    } catch (error) {
      console.error('Comment error:', error);
    } finally {
      setCommenting(false);
    }
  };

  const handleRepost = async () => {
  if (loading) return;
  setLoading(true);
  try {
    const result = await ApiService.sharePost(post._id, `Shared: ${post.content}`);
    console.log('SHARE API RESULT:', result); // 🔍 Debug log

    if (result.sharedPost) {
      setReposted(true);
      setRepostCount(result.originalShares);

      // Update original post (to reflect count and icon)
      const updatedPost = {
        ...post,
        shares: [...(post.shares || []), { user: { _id: currentUser.id } }]
      };
      onUpdate?.(updatedPost); // Update original post
      onUpdate?.(result.sharedPost, { isNewShare: true }); // Add shared post at top
    } else {
      console.log('❌ No sharedPost in result');
    }
  } catch (err) {
    console.error('❌ Share error:', err);
  } finally {
    setLoading(false);
  }
};



  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await ApiService.deletePost(post._id);
        if (onDelete) {
          onDelete(post._id);
        }
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const renderComments = (comments, depth = 0) => {
    if (!comments || comments.length === 0) return null;

    return comments.map((comment) => (
      <div
        key={comment._id}
        className={`comment ${depth > 0 ? 'reply' : ''}`}
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <div className="comment-header">
          <span className="comment-author">{comment.author?.username || 'Unknown User'}</span>
          <span className="comment-time">{formatDate(comment.createdAt)}</span>
        </div>
        <div className="comment-content">{comment.content}</div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="comment-replies">
            {renderComments(comment.replies, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!post || !currentUser) {
    return null;
  }

  return (
    <div className="post fade-in">
      {post.isShared && post.sharedBy && post.sharedBy.length > 0 && (
        <div className="shared-indicator" style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <Repeat2 size={16} />
          <span>
            {post.sharedBy[0].user?.username} You Shared this post
            {post.sharedBy[0].sharedAt && (
              <span style={{ marginLeft: '5px' }}>
                • {formatDate(post.sharedBy[0].sharedAt)}
              </span>
            )}
          </span>
        </div>
      )}
      <div className="post-header">
        <div className="post-avatar">
          {getInitials(post.author?.username || 'Unknown')}
        </div>
        <div>
          <div className="post-author">{post.author?.username || 'Unknown User'}</div>
          <div className="post-time">
            {formatDate(post.createdAt)}
            {post.isShared && (
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', marginLeft: '5px' }}>
                (Original post)
              </span>
            )}
          </div>
        </div>

        {(post.author?._id === currentUser.id ||
          (post.isShared && post.sharedBy?.some(share =>
            share.user?._id?.toString() === currentUser.id.toString()
          ))) && (
            <button
              onClick={handleDelete}
              className="post-action delete-button"
              style={{ marginLeft: 'auto' }}
            >
              <Trash2 size={16} />
            </button>
          )}
      </div>

      <div className="post-content">
        {post.content}
      </div>

      {post.hashtags && post.hashtags.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          {post.hashtags.map((tag, index) => (
            <span
              key={index}
              className="hashtag"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="post-actions">
        <button
          onClick={handleLike}
          className={`post-action like-button ${liked ? 'active' : ''}`}
          disabled={loading}
        >
          <Heart
            size={18}
            fill={liked ? 'currentColor' : 'none'}
          />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="post-action comment-button"
        >
          <MessageCircle size={18} />
          <span>{post.comments?.length || 0}</span>
        </button>

        <button
          onClick={handleRepost}
          className={`post-action repost-button ${reposted ? 'active' : ''}`}
          disabled={loading}
        >
          <Repeat2 size={18} />
          <span>{repostCount}</span>
        </button>
      </div>

      {showComments && (
        <div className="comments-section" >
          <form onSubmit={handleComment} className="comment-composer">
            <div className="comment-input-container">
              <input
                type="text"
                className="form-input comment-input"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{marginBottom:'10px'}}
              />
              <button
                type="submit"
                className="gradient-button comment-submit"
                disabled={commenting || !newComment.trim()}
              >
                {commenting ? '...' : 'Reply'}
              </button>
            </div>
          </form>

          <div className="comments-list">
            {renderComments(post.comments)}
          </div>
        </div>
      )}
    </div>
  );
}

export default Post;