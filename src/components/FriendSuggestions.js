import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';

function FriendSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(new Set());

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const data = await ApiService.getFriendSuggestions();
      setSuggestions(data);
    } catch (error) {
      console.error('Error loading friend suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    setSendingRequest(prev => new Set(prev).add(userId));
    
    try {
      await ApiService.sendFriendRequest(userId);
      setSuggestions(prev => prev.filter(suggestion => suggestion.user._id !== userId));
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setSendingRequest(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="glass-card">
        <h3>Friend Suggestions</h3>
        <div className="loading-container" style={{ padding: '20px' }}>
          <div className="loading-spinner" style={{ width: '30px', height: '30px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: '20px' }}>👥 Friend Suggestions</h3>
      
      {suggestions.length === 0 ? (
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          No suggestions available
        </p>
      ) : (
        <div>
          {suggestions.slice(0, 5).map((suggestion) => (
            <div
              key={suggestion.user._id}
              className="suggestion-card"
              style={{
                padding: '15px',
                marginBottom: '15px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8EC5FC 0%, #E0C3FC 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  {getInitials(suggestion.user.username)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>
                    {suggestion.user.username}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'rgba(255, 255, 255, 0.6)' 
                  }}>
                    {suggestion.mutualFriendsCount} mutual friends
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleSendRequest(suggestion.user._id)}
                disabled={sendingRequest.has(suggestion.user._id)}
                className="gradient-button"
                style={{ 
                  width: '100%', 
                  padding: '8px 16px',
                  fontSize: '13px'
                }}
              >
                {sendingRequest.has(suggestion.user._id) ? 'Sending...' : 'Add Friend'}
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(224, 195, 252, 0.1)',
        borderRadius: '10px',
        border: '1px solid rgba(224, 195, 252, 0.2)'
      }}>
        <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>
          🤖 Algorithm Info
        </h4>
        <p style={{ 
          fontSize: '12px', 
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: '1.4'
        }}>
          Suggestions based on mutual friends using graph traversal algorithms (BFS & MST)
        </p>
      </div> */}
    </div>
  );
}

export default FriendSuggestions;