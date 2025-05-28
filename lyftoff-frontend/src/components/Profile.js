import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function Profile() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    academicLevel: '',
    interests: '',
    bio: '',
    longTermGoal: '',
    shortTermGoals: [''],
    achievements: [''],
    notifications: true,
    avatarUrl: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setError('Please log in to view your profile.');
        return;
      }
      try {
        const response = await axios.get('http://localhost:3000/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Profile fetched:', response.data);
        setFormData(prev => ({
          ...prev,
          ...response.data,
          shortTermGoals: response.data.shortTermGoals?.length ? response.data.shortTermGoals : [''],
          achievements: response.data.achievements?.length ? response.data.achievements : [''],
          notifications: response.data.notifications ?? true,
          avatarUrl: response.data.avatarUrl || ''
        }));
        setError(null);
      } catch (err) {
        console.error('Profile fetch error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError('Failed to load profile. Is the server running?');
        if (navigator.serviceWorker) {
          navigator.serviceWorker.controller?.postMessage({ type: 'QUEUE_PROFILE', data: formData });
        }
      }
    };
    fetchProfile();
  }, [token]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleBioChange = (value) => setFormData({ ...formData, bio: value });
  const handleToggle = (e) => setFormData({ ...formData, [e.target.name]: e.target.checked });
  const addGoal = () => setFormData({ ...formData, shortTermGoals: [...formData.shortTermGoals, ''] });
  const updateGoal = (i, value) => {
    const newGoals = [...formData.shortTermGoals];
    newGoals[i] = value;
    setFormData({ ...formData, shortTermGoals: newGoals });
  };
  const addAchievement = () => setFormData({ ...formData, achievements: [...formData.achievements, ''] });
  const updateAchievement = (i, value) => {
    const newAchievements = [...formData.achievements];
    newAchievements[i] = value;
    setFormData({ ...formData, achievements: newAchievements });
  };
  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('avatar', file);
    try {
      const response = await axios.post('http://localhost:3000/api/profile/avatar', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData({ ...formData, avatarUrl: response.data.avatarUrl });
      setMessage('Avatar uploaded!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Avatar upload error:', err.response?.data || err.message);
      setMessage('Failed to upload avatar.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setMessage('Please log in to save your profile.');
      return;
    }
    try {
      const payload = {
        ...formData,
        shortTermGoals: formData.shortTermGoals.filter(g => g),
        achievements: formData.achievements.filter(a => a)
      };
      await axios.post('http://localhost:3000/api/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Profile updated!');
      setTimeout(() => setMessage(''), 3000);
      setError(null);
    } catch (err) {
      console.error('Profile save error:', err.response?.data || err.message);
      setMessage('Failed to update profile.');
      if (navigator.serviceWorker) {
        navigator.serviceWorker.controller?.postMessage({ type: 'QUEUE_PROFILE', data: formData });
      }
    }
  };

  const templates = {
    'high-school': 'I’m a high school student passionate about [interest]...',
    'university': 'I’m a university student studying [major]...',
    'professional': 'I’m a professional with expertise in [skill]...'
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-primary-blue">Your Profile</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {message && <p className="text-primary-yellow mb-4 text-center">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-blue"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-blue"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Academic Level</label>
          <select
            name="academicLevel"
            value={formData.academicLevel}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-blue"
            required
          >
            <option value="">Select...</option>
            <option value="high-school">High School</option>
            <option value="university">University</option>
            <option value="professional">Professional</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700">Interests</label>
          <input
            type="text"
            name="interests"
            value={formData.interests}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-blue"
          />
        </div>
        <div>
          <label className="block text-gray-700">Bio</label>
          <ReactQuill
            value={formData.bio}
            onChange={handleBioChange}
            className="bg-white rounded"
            modules={{ toolbar: [['bold', 'italic', 'underline'], ['link'], ['clean']] }}
          />
          <button
            type="button"
            onClick={() => setFormData({ ...formData, bio: templates[formData.academicLevel || 'high-school'] })}
            className="mt-2 text-primary-blue hover:underline focus:outline-none"
          >
            Use {formData.academicLevel || 'High School'} Template
          </button>
        </div>
        <div>
          <label className="block text-gray-700">Avatar</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatar}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-blue"
          />
          {formData.avatarUrl && (
            <img src={formData.avatarUrl} alt="Avatar" className="mt-2 w-16 h-16 rounded-full" />
          )}
        </div>
        <div>
          <label className="block text-gray-700">Long-Term Goal</label>
          <input
            type="text"
            name="longTermGoal"
            value={formData.longTermGoal}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-blue"
          />
        </div>
        <div>
          <label className="block text-gray-700">Short-Term Goals</label>
          {formData.shortTermGoals.map((g, i) => (
            <input
              key={i}
              type="text"
              value={g}
              onChange={(e) => updateGoal(i, e.target.value)}
              className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-primary-blue"
            />
          ))}
          <button type="button" onClick={addGoal} className="text-primary-blue hover:underline focus:outline-none">
            + Add Goal
          </button>
        </div>
        <div>
          <label className="block text-gray-700">Achievements</label>
          {formData.achievements.map((a, i) => (
            <input
              key={i}
              type="text"
              value={a}
              onChange={(e) => updateAchievement(i, e.target.value)}
              className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-primary-blue"
            />
          ))}
          <button type="button" onClick={addAchievement} className="text-primary-blue hover:underline focus:outline-none">
            + Add Achievement
          </button>
        </div>
        <div>
          <label className="block text-gray-700">Notifications</label>
          <input
            type="checkbox"
            name="notifications"
            checked={formData.notifications}
            onChange={handleToggle}
            className="p-2 focus:ring-2 focus:ring-primary-blue"
          />
          <span className="ml-2 text-gray-700">Enable Notifications</span>
        </div>
        <button type="submit" className="bg-primary-blue text-white p-2 rounded hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-primary-blue">
          Save
        </button>
      </form>
    </div>
  );
}

export default Profile;