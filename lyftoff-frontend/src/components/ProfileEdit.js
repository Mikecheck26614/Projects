import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProfileEdit = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phoneNumber: '', address: '', academicLevel: ''
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get('http://localhost:3000/api/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setFormData(prev => ({ ...prev, ...res.data })));
  }, [token]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/profile', formData, { headers: { Authorization: `Bearer ${token}` } });
      window.location.href = '/profile';
    } catch (err) {
      console.error('Profile edit error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-primary-blue mb-4">Edit Profile</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700">First Name</label>
          <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label className="block text-gray-700">Last Name</label>
          <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label className="block text-gray-700">Email</label>
          <input name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-gray-700">Phone Number</label>
          <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-gray-700">Address</label>
          <input name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-gray-700">Academic Level</label>
          <select name="academicLevel" value={formData.academicLevel} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="">Select...</option>
            <option value="high-school">High School</option>
            <option value="university">University</option>
            <option value="professional">Professional</option>
          </select>
        </div>
        <button type="submit" className="bg-primary-blue text-white p-2 rounded hover:bg-blue-700 transition-colors">Save</button>
      </div>
    </form>
  );
};

export default ProfileEdit;