import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import PostComposer from './PostComposer';
import Post from './Post';
import TrendingSidebar from './TrendingSidebar';
import FriendSuggestions from './FriendSuggestions';
import ApiService from '../services/ApiService';

function Dashboard({ user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      const data = await ApiService.getFeed(pageNum, 20);

      if (pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }

      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPost = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostUpdate = (updatedPost, options = {}) => {
    if (options.isNewShare) {
      setPosts(prev => [updatedPost, ...prev]); // New repost at top
    } else {
      setPosts(prev => prev.map(post =>
        post._id === updatedPost._id ? updatedPost : post
      ));
    }
  };


  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadFeed(page + 1);
    }
  };

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />

      <div className="main-container">
        <div className="sidebar">
          <FriendSuggestions />
        </div>

        <div className="main-content">
          <PostComposer onNewPost={handleNewPost} />

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="posts-container">
            {posts.map(post => (
              <Post
                key={post._id}
                post={post}
                currentUser={user}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
              />
            ))}

            {loading && (
              <div className="loading-container" style={{ padding: '40px' }}>
                <div className="loading-spinner"></div>
                <p>Loading posts...</p>
              </div>
            )}

            {!loading && hasMore && posts.length > 0 && (
              <div className="text-center mt-20">
                <button
                  onClick={loadMore}
                  className="gradient-button secondary"
                >
                  Load More Posts
                </button>
              </div>
            )}

            {!loading && posts.length === 0 && (
              <div className="glass-card text-center">
                <h3>No posts yet</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Start by creating your first post or adding some friends!
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar">
          <TrendingSidebar />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;