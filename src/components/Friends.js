import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import ApiService from '../services/ApiService';

function Friends({ user, onLogout }) {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ received: [], sent: [] });
  const [communities, setCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    try {
      const [friendsData, requestsData, communitiesData] = await Promise.all([
        ApiService.getFriends(),
        ApiService.getFriendRequests(),
        ApiService.getCommunities()
      ]);
      
      setFriends(friendsData);
      setFriendRequests(requestsData);
      setCommunities(communitiesData);
    } catch (error) {
      console.error('Error loading friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await ApiService.getUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await ApiService.sendFriendRequest(userId);
      setSearchResults(prev => prev.filter(user => user._id !== userId));
      loadFriendsData(); // Reload to update sent requests
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await ApiService.acceptFriendRequest(userId);
      loadFriendsData();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await ApiService.rejectFriendRequest(userId);
      loadFriendsData();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const handleRemoveFriend = async (userId) => {
    if (window.confirm('Are you sure you want to remove this friend?')) {
      try {
        await ApiService.removeFriend(userId);
        loadFriendsData();
      } catch (error) {
        console.error('Error removing friend:', error);
      }
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isUserInFriends = (userId) => {
    return friends.some(friend => friend._id === userId);
  };

  const isRequestSent = (userId) => {
    return friendRequests.sent.some(user => user._id === userId);
  };

  const isRequestReceived = (userId) => {
    return friendRequests.received.some(user => user._id === userId);
  };

  const renderUserCard = (userData, actions) => (
    <div key={userData._id} className="friend-card">
      <div className="friend-avatar">
        {getInitials(userData.username)}
      </div>
      <div className="friend-info">
        <div className="friend-name">{userData.username}</div>
        <div className="friend-status">
          {userData.isOnline ? (
            <>
              <span className="online-indicator"></span>
              Online
            </>
          ) : (
            `Last seen: ${formatDate(userData.lastSeen)}`
          )}
        </div>
        {userData.profile?.bio && (
          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '5px' }}>
            {userData.profile.bio}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        {actions}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        <Navbar user={user} onLogout={onLogout} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="main-container" style={{ gridTemplateColumns: '1fr' }}>
        <div className="glass-container">
          <h1 style={{ marginBottom: '30px' }}>Friends & Connections</h1>
          
          {/* Search Bar */}
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="Search for users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="glass-card">
              <h3>Search Results</h3>
              {searchLoading ? (
                <div className="loading-container" style={{ padding: '20px' }}>
                  <div className="loading-spinner" style={{ width: '30px', height: '30px' }}></div>
                </div>
              ) : searchResults.length === 0 ? (
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>No users found</p>
              ) : (
                searchResults.map(userData => renderUserCard(userData, 
                  <>
                    {isUserInFriends(userData._id) ? (
                      <span style={{ color: '#4CAF50', fontSize: '14px' }}>✓ Friends</span>
                    ) : isRequestSent(userData._id) ? (
                      <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Request Sent</span>
                    ) : isRequestReceived(userData._id) ? (
                      <span style={{ color: '#8EC5FC', fontSize: '14px' }}>Pending Request</span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(userData._id)}
                        className="gradient-button"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Add Friend
                      </button>
                    )}
                  </>
                ))
              )}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {['friends', 'requests', 'communities'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`gradient-button ${activeTab === tab ? '' : 'secondary'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {tab} {tab === 'requests' && friendRequests.received.length > 0 && `(${friendRequests.received.length})`}
              </button>
            ))}
          </div>

          {/* Friends List */}
          {activeTab === 'friends' && (
            <div className="glass-card">
              <h3>My Friends ({friends.length})</h3>
              {friends.length === 0 ? (
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>No friends yet</p>
              ) : (
                friends.map(friendData => renderUserCard(friendData,
                  <button
                    onClick={() => handleRemoveFriend(friendData._id)}
                    className="gradient-button secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Remove
                  </button>
                ))
              )}
            </div>
          )}

          {/* Friend Requests */}
          {activeTab === 'requests' && (
            <div>
              <div className="glass-card">
                <h3>Received Requests ({friendRequests.received.length})</h3>
                {friendRequests.received.length === 0 ? (
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>No pending requests</p>
                ) : (
                  friendRequests.received.map(userData => renderUserCard(userData,
                    <>
                      <button
                        onClick={() => handleAcceptRequest(userData._id)}
                        className="gradient-button"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(userData._id)}
                        className="gradient-button secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Reject
                      </button>
                    </>
                  ))
                )}
              </div>

              <div className="glass-card">
                <h3>Sent Requests ({friendRequests.sent.length})</h3>
                {friendRequests.sent.length === 0 ? (
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>No sent requests</p>
                ) : (
                  friendRequests.sent.map(userData => renderUserCard(userData,
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                      Pending...
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Communities */}
          {activeTab === 'communities' && (
            <div className="glass-card">
              <h3>Communities Detected by DFS Algorithm</h3>
              {communities.length === 0 ? (
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  No communities detected yet
                </p>
              ) : (
                <div>
                  {communities.map((community, index) => (
                    <div
                      key={community.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        padding: '20px',
                        marginBottom: '15px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <h4 style={{ marginBottom: '15px' }}>
                        Community #{index + 1} ({community.size} members)
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {community.users.map(userData => (
                          <div
                            key={userData._id}
                            style={{
                              background: 'rgba(142, 197, 252, 0.2)',
                              borderRadius: '20px',
                              padding: '8px 15px',
                              fontSize: '14px',
                              border: '1px solid rgba(142, 197, 252, 0.3)'
                            }}
                          >
                            {userData.username}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {/* <div style={{
                    background: 'rgba(224, 195, 252, 0.1)',
                    borderRadius: '10px',
                    padding: '15px',
                    border: '1px solid rgba(224, 195, 252, 0.2)',
                    marginTop: '20px'
                  }}>
                    <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>
                      🤖 Algorithm Info
                    </h4>
                    <p style={{ 
                      fontSize: '12px', 
                      color: 'rgba(255, 255, 255, 0.7)',
                      lineHeight: '1.4'
                    }}>
                      Communities detected using Depth-First Search (DFS) component detection algorithm on the friendship graph
                    </p>
                  </div> */}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Friends;