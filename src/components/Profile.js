import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from './Navbar';
import Post from './Post';
import ApiService from '../services/ApiService';

function Profile({ user, onLogout }) {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const userId = storedUser?.id;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', location: '' });
  const [connectionPath, setConnectionPath] = useState(null);
  const [loadingConnection, setLoadingConnection] = useState(false);

  const isOwnProfile = !userId || userId === user?.id;

  // useEffect(() => {
  //   const profileUserId = userId || user?.id;
  //   if (profileUserId) {
  //     loadProfile(profileUserId);
  //   }
  // }, [userId, user]);

  useEffect(() => {
  if (!userId && !user) return; // wait for user to be loaded if it's own profile
  const profileUserId = userId || user?.id;
  console.log(profileUserId)
  loadProfile(profileUserId);
}, [userId, user]);


  const loadProfile = async (profileUserId) => {
    if (!profileUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let profileData;

      if (isOwnProfile) {
        profileData = user;
        setProfile(user);
        setEditForm({
          bio: user?.profile?.bio || '',
          location: user?.profile?.location || ''
        });

        try {
          const freshData = await ApiService.getUserProfile(user.id);
          profileData = { ...user, ...freshData };
          setProfile(profileData);
          setEditForm({
            bio: profileData.profile?.bio || '',
            location: profileData.profile?.location || ''
          });
        } catch {
          console.log('Using cached user data for own profile');
        }
      } else {
        profileData = await ApiService.getUserProfile(profileUserId);
        setProfile(profileData);
        loadConnectionPath(profileUserId);
      }

      try {
        const postsData = await ApiService.getUserPosts(profileUserId);
        setPosts(postsData.posts || []);

      } catch (error) {
        console.error('Error loading posts:', error);
        setPosts([]);
      }

    } catch (error) {
      console.error('Error loading profile:', error);
      if (isOwnProfile && user) {
        setProfile(user);
        setEditForm({
          bio: user.profile?.bio || '',
          location: user.profile?.location || ''
        });

        try {
          const postsData = await ApiService.getUserPosts(user.id);
          setPosts(postsData.posts || []);
        } catch (postError) {
          console.error('Error loading posts:', postError);
          setPosts([]);
        }
      } else {
        setProfile(null);
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadConnectionPath = async (targetUserId) => {
    if (!user || !user.id || targetUserId === user.id) return;
    try {
      setLoadingConnection(true);
      const pathData = await ApiService.getConnectionPath(targetUserId);
      setConnectionPath(pathData);
    } catch (error) {
      console.error('Error loading connection path:', error);
      setConnectionPath(null);
    } finally {
      setLoadingConnection(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await ApiService.updateProfile(editForm.bio, editForm.location);
      setProfile(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          bio: editForm.bio,
          location: editForm.location
        }
      }));
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? {
        ...updatedPost,
        isShared: post.isShared,
        sharedBy: post.sharedBy,
        sharedAt: post.sharedAt,
        postType: post.postType
      } : post
    ));
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  // Fallback while user data is loading (esp. after refresh)
  if (!user && !userId) {
    return (
      <div>
        <Navbar user={user} onLogout={onLogout} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div>
        <Navbar user={user} onLogout={onLogout} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile && !isOwnProfile) {
    return (
      <div>
        <Navbar user={user} onLogout={onLogout} />
        <div className="main-container">
          <div className="glass-container text-center">
            <h2>Profile not found</h2>
            <p>The user profile could not be loaded.</p>
          </div>
        </div>
      </div>
    );
  }

  const displayProfile = profile || user;

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />

      <div className="main-container" style={{ gridTemplateColumns: '1fr' }}>
        <div className="glass-container">
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8EC5FC 0%, #E0C3FC 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  marginRight: '30px'
                }}
              >
                {getInitials(displayProfile.username)}
              </div>

              <div style={{ flex: 1 }}>
                <h1 style={{ marginBottom: '10px' }}>{displayProfile.username}</h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '10px' }}>
                  {displayProfile.email}
                </p>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                  Member since {formatDate(displayProfile.createdAt)}
                </p>

                <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                  <div>
                    <strong>{displayProfile.friends?.length || 0}</strong>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', marginLeft: '5px' }}>
                      Friends
                    </span>
                  </div>
                  <div>
                    <strong>{posts.length}</strong>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', marginLeft: '5px' }}>
                      Posts
                    </span>
                  </div>
                </div>
              </div>

              {isOwnProfile && (
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="gradient-button"
                >
                  {editMode ? 'Cancel' : 'Edit Profile'}
                </button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    className="form-input textarea"
                    placeholder="Tell us about yourself..."
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    maxLength="500"
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Where are you from?"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    maxLength="100"
                  />
                </div>
                <button type="submit" className="gradient-button">Save Changes</button>
              </form>
            ) : (
              <div>
                {displayProfile.profile?.bio && (
                  <div style={{ marginBottom: '15px' }}>
                    <h4 style={{ marginBottom: '8px' }}>Bio</h4>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{displayProfile.profile.bio}</p>
                  </div>
                )}
                {displayProfile.profile?.location && (
                  <div style={{ marginBottom: '15px' }}>
                    <h4 style={{ marginBottom: '8px' }}>Location</h4>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>📍 {displayProfile.profile.location}</p>
                  </div>
                )}
                {!displayProfile.profile?.bio && !displayProfile.profile?.location && (
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
                    {isOwnProfile
                      ? 'Add some information about yourself!'
                      : "This user hasn't added any profile information yet."}
                  </p>
                )}
              </div>
            )}

            {!isOwnProfile && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h4 style={{ marginBottom: '15px' }}>🔗 Connection Path</h4>
                {loadingConnection ? (
                  <div className="loading-container" style={{ padding: '10px' }}>
                    <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                    <span style={{ fontSize: '14px' }}>Finding connection...</span>
                  </div>
                ) : connectionPath ? (
                  connectionPath.connected ? (
                    <div>
                      <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        Connected via {connectionPath.distance} degree{connectionPath.distance !== 1 ? 's' : ''} of separation
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {connectionPath.path.map((pathUser, index) => (
                          <React.Fragment key={pathUser._id}>
                            <div style={{
                              background: 'rgba(142, 197, 252, 0.2)',
                              borderRadius: '15px',
                              padding: '5px 12px',
                              fontSize: '12px',
                              border: '1px solid rgba(142, 197, 252, 0.3)'
                            }}>
                              {pathUser.username}
                            </div>
                            {index < connectionPath.path.length - 1 && (
                              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      No connection path found (not in same network component)
                    </p>
                  )
                ) : null}
              </div>
            )}
          </div>

          {/* Posts */}
          <div className="glass-card">
            <h2 style={{ marginBottom: '20px' }}>
              {isOwnProfile ? 'Your Posts' : `${displayProfile.username}'s Posts`}
            </h2>
            {posts.length === 0 ? (
              <div className="text-center" style={{ padding: '40px' }}>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {isOwnProfile
                    ? "You haven't posted anything yet"
                    : "This user hasn't posted anything yet"}
                </p>
              </div>
            ) : (
              posts.map(post => (
                <Post
                  key={post._id}
                  post={post}
                  currentUser={storedUser}
                  onUpdate={handlePostUpdate}
                  onDelete={handlePostDelete}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
