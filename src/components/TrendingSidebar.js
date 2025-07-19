import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';

function TrendingSidebar() {
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingPosts();
  }, []);

  const loadTrendingPosts = async () => {
    try {
      const posts = await ApiService.getTrendingPosts(5);
      setTrendingPosts(posts);
    } catch (error) {
      console.error('Error loading trending posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const truncateText = (text, maxLength = 80) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="glass-card">
        <h3>Trending Posts</h3>
        <div className="loading-container" style={{ padding: '20px' }}>
          <div className="loading-spinner" style={{ width: '30px', height: '30px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: '20px' }}>🔥 Trending Posts</h3>
      
      {trendingPosts.length === 0 ? (
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          No trending posts yet
        </p>
      ) : (
        <div>
          {trendingPosts.map((post, index) => (
            <div
              key={post._id}
              className="trending-item"
              style={{
                padding: '15px',
                marginBottom: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #8EC5FC 0%, #E0C3FC 100%)',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginRight: '10px'
                }}>
                  {index + 1}
                </span>
                <span style={{ 
                  fontWeight: '500', 
                  fontSize: '14px' 
                }}>
                  {post.author.username}
                </span>
              </div>
              
              <p style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.4',
                marginBottom: '8px'
              }}>
                {truncateText(post.content)}
              </p>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                <span>❤️ {post.likes.length}</span>
                <span>💬 {post.comments.length}</span>
                <span>🔥 {Math.round(post.engagementScore)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(142, 197, 252, 0.1)',
        borderRadius: '10px',
        border: '1px solid rgba(142, 197, 252, 0.2)'
      }}>
        <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>
          📊 Algorithm Info
        </h4>
        <p style={{ 
          fontSize: '12px', 
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: '1.4'
        }}>
          Posts ranked using priority queue algorithm based on likes, comments, shares, and recency
        </p>
      </div> */}
    </div>
  );
}

export default TrendingSidebar;