import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProfileGoals = () => {
  const [formData, setFormData] = useState({ longTermGoal: '', shortTermGoals: [''] });
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get('http://localhost:3000/api/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setFormData({ longTermGoal: res.data.longTermGoal || '', shortTermGoals: res.data.shortTermGoals || [''] }));
  }, [token]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const addGoal = () => setFormData({ ...formData, shortTermGoals: [...formData.shortTermGoals, ''] });
  const updateGoal = (i, value) => {
    const newGoals = [...formData.shortTermGoals];
    newGoals[i] = value;
    setFormData({ ...formData, shortTermGoals: newGoals });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/profile/goals', formData, { headers: { Authorization: `Bearer ${token}` } });
      window.location.href = '/profile';
    } catch (err) {
      console.error('Goals update error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-primary-blue mb-4">Set Goals</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700">Long-Term Goal</label>
          <input name="longTermGoal" value={formData.longTermGoal} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-gray-700">Short-Term Goals</label>
          {formData.shortTermGoals.map((g, i) => (
            <input
              key={i}
              value={g}
              onChange={(e) => updateGoal(i, e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
          ))}
          <button type="button" onClick={addGoal} className="text-primary-blue hover:underline">+ Add Goal</button>
        </div>
        <button type="submit" className="bg-primary-blue text-white p-2 rounded hover:bg-blue-700 transition-colors">Save Goals</button>
      </div>
    </form>
  );
};

export default ProfileGoals;