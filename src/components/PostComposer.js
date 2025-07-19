import React, { useState } from 'react';
import ApiService from '../services/ApiService';

function PostComposer({ onNewPost }) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Please write something');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Extract hashtags from content
      const hashtags = content.match(/#\w+/g) || [];
      
      const newPost = await ApiService.createPost(content, visibility, hashtags);
      onNewPost(newPost);
      setContent('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-composer glass-card">
      <h3 style={{ marginBottom: '20px' }}>What's on your mind?</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <textarea
            className="form-input textarea"
            placeholder="Share your thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength="1000"
            style={{ minHeight: '120px' }}
          />
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            fontSize: '12px', 
            textAlign: 'right',
            marginTop: '5px'
          }}>
            {content.length}/1000
          </div>
        </div>

        <div className="flex justify-between items-center">
          <select
            className="form-input"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            style={{ width: 'auto', marginRight: '10px'}}
          >
            <option value="public" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#191919ff',  }}>Public</option>
            <option value="friends" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#191919ff' }}>Friends Only</option>
            <option value="private" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#191919ff' }}>Private</option>
          </select>

          <button
            type="submit"
            className="gradient-button"
            disabled={loading || !content.trim()}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ marginTop: '10px' }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

export default PostComposer;