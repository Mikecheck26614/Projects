import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';

const ProfileOverview = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    academicLevel: '',
    bio: '',
    interests: '',
    longTermGoal: '',
  });
  const [socket, setSocket] = useState(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
      setFormData({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        academicLevel: response.data.academicLevel || '',
        bio: response.data.bio || '',
        interests: response.data.interests || '',
        longTermGoal: response.data.longTermGoal || '',
      });
      localStorage.setItem('userId', response.data.userId); // Store userId
      return response.data.userId;
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      return null;
    }
  };

  useEffect(() => {
    // Initialize WebSocket
    const newSocket = io('http://localhost:3000', {
      path: '/ws',
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket'],
    });

    setSocket(newSocket);

    // Fetch profile and join room
    fetchProfile().then(userId => {
      if (userId && newSocket.connected) {
        newSocket.emit('join', `user_${userId}`);
        console.log(`Joined room: user_${userId}`);
      }
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id);
      const userId = localStorage.getItem('userId');
      if (userId) {
        newSocket.emit('join', `user_${userId}`);
        console.log(`Joined room: user_${userId}`);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket error:', error.message);
      toast.error('Failed to connect to real-time updates');
    });

    newSocket.on('profile_update', (updatedProfile) => {
      setProfile(updatedProfile);
      toast.info('Profile updated in real-time');
    });

    // Cleanup
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/api/profile', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditMode(false);
      await fetchProfile();
      toast.success('Profile updated successfully');
      // Emit WebSocket update
      if (socket) {
        socket.emit('profile_update', { userId: localStorage.getItem('userId'), ...response.data });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const avatarFormData = new FormData();
    avatarFormData.append('avatar', file);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/profile/avatar', avatarFormData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      await fetchProfile();
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  if (!profile) return <div className="text-center text-gray-600">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">Profile Overview</h2>
      {profile.prompts?.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-100 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">Complete Your Profile</h3>
          {profile.prompts.map((prompt, index) => (
            <p key={index} className="text-yellow-700">{prompt.message}</p>
          ))}
        </div>
      )}
      <div className="flex items-center mb-6">
        <img
          src={profile.avatarUrl || '/default-avatar.png'}
          alt="Avatar"
          className="w-24 h-24 rounded-full mr-4"
        />
        {editMode && (
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="text-sm text-gray-600"
          />
        )}
      </div>
      {editMode ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Level</label>
            <select
              name="academicLevel"
              value={formData.academicLevel}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select</option>
              <option value="high-school">High School</option>
              <option value="university">University</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Interests</label>
            <input
              type="text"
              name="interests"
              value={formData.interests}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Long-Term Goal</label>
            <input
              type="text"
              name="longTermGoal"
              value={formData.longTermGoal}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-base"><strong>Name:</strong> {profile.firstName || 'Not set'} {profile.lastName || ''}</p>
          <p className="text-base"><strong>Stage:</strong> {profile.academicLevel === 'high-school' ? 'High School' : profile.academicLevel === 'university' ? 'University' : profile.academicLevel === 'professional' ? 'Professional' : 'Not set'}</p>
          <p className="text-base"><strong>Email:</strong> {profile.email || 'Not set'}</p>
          <p className="text-base"><strong>Bio:</strong> {profile.bio || 'No bio yet'}</p>
          <p className="text-base"><strong>Interests:</strong> {profile.interests || 'None listed'}</p>
          <p className="text-base"><strong>Long-Term Goal:</strong> {profile.longTermGoal || 'Not set'}</p>
          <p className="text-base"><strong>Short-Term Goals:</strong> {Array.isArray(profile.shortTermGoals) && profile.shortTermGoals.length ? profile.shortTermGoals.join(', ') : 'None'}</p>
          <p className="text-base"><strong>Achievements:</strong> {Array.isArray(profile.achievements) && profile.achievements.length ? profile.achievements.map(a => a.name || a).join(', ') : 'None'}</p>
          <p className="text-base"><strong>Profile Completion:</strong> {Math.round(profile.completion) || 0}%</p>
          <div className="flex space-x-4">
            <button
              onClick={() => setEditMode(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Edit Profile
            </button>
            <Link
              to="/report"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              View Report
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileOverview;