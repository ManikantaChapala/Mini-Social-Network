import axios from 'axios';

const API_BASE_URL = 'https://msmbackend.onrender.com/api';

class ApiService {
  // Posts
  static async createPost(content, visibility = 'public', hashtags = []) {
    try {
      const response = await axios.post(`${API_BASE_URL}/posts`, {
        content,
        visibility,
        hashtags
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create post');
    }
  }

  static async getFeed(page = 1, limit = 20) {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts/feed`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get feed');
    }
  }

  static async getUserPosts(userId, page = 1, limit = 20) {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts/user/${userId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get user posts');
    }
  }

  static async likePost(postId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to like post');
    }
  }

  static async addComment(postId, content, parentCommentId = null) {
    try {
      const response = await axios.post(`${API_BASE_URL}/posts/${postId}/comment`, {
        content,
        parentCommentId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add comment');
    }
  }

  static async sharePost(postId, content = '') {
    try {
      const response = await axios.post(`${API_BASE_URL}/posts/${postId}/share`, {
        content
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to share post');
    }
  }

  static async deletePost(postId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/posts/${postId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete post');
    }
  }

  static async getTrendingPosts(limit = 10) {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts/trending`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get trending posts');
    }
  }

  static async searchPosts(query, hashtag = null) {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts/search`, {
        params: { q: query, hashtag }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search posts');
    }
  }

  // Users
  static async getUsers(search = '') {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, {
        params: { search }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get users');
    }
  }

  static async getUserProfile(userId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get user profile');
    }
  }

  static async updateProfile(bio, location) {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/profile`, {
        bio,
        location
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  static async getFriendSuggestions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/suggestions/friends`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get friend suggestions');
    }
  }

  static async getConnectionPath(targetUserId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/connection/${targetUserId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get connection path');
    }
  }

  // Friends
  static async sendFriendRequest(userId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/friends/request/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send friend request');
    }
  }

  static async acceptFriendRequest(userId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/friends/accept/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to accept friend request');
    }
  }

  static async rejectFriendRequest(userId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/friends/reject/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reject friend request');
    }
  }

  static async removeFriend(userId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/friends/remove/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove friend');
    }
  }

  static async getFriendRequests() {
    try {
      const response = await axios.get(`${API_BASE_URL}/friends/requests`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get friend requests');
    }
  }

  static async getFriends() {
    try {
      const response = await axios.get(`${API_BASE_URL}/friends`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get friends');
    }
  }

  static async getCommunities() {
    try {
      const response = await axios.get(`${API_BASE_URL}/friends/communities`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get communities');
    }
  }
}

export default ApiService;