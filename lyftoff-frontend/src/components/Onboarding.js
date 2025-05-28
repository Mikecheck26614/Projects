import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    academicLevel: '',
    longTermGoal: '',
    interests: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        academicLevel: formData.academicLevel,
        longTermGoal: formData.longTermGoal,
        interests: formData.interests,
        onboarding: JSON.stringify({ completed: true }),
        achievements: JSON.stringify(['Welcome Badge'])
      };
      await axios.post('http://localhost:3000/api/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Onboarding complete! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to save onboarding');
    }
  };

  if (!token) return <div className="text-center mt-10">Please <Link to="/login" className="text-primary-blue">log in</Link> first!</div>;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-fade-in">
            <h3 className="text-xl font-semibold text-primary-blue mb-4">Step 1: Your Academic Level</h3>
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
            <button
              onClick={nextStep}
              disabled={!formData.academicLevel}
              className="mt-4 bg-primary-blue text-white p-2 rounded hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-primary-blue disabled:opacity-50"
            >
              Next
            </button>
          </div>
        );
      case 2:
        return (
          <div className="animate-fade-in">
            <h3 className="text-xl font-semibold text-primary-blue mb-4">Step 2: Your Long-Term Goal</h3>
            <input
              type="text"
              name="longTermGoal"
              value={formData.longTermGoal}
              onChange={handleChange}
              placeholder="e.g., Become a Software Engineer"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-blue"
              required
            />
            <div className="flex gap-4 mt-4">
              <button
                onClick={prevStep}
                className="bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400 transition-colors focus:ring-2 focus:ring-gray-300"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.longTermGoal}
                className="bg-primary-blue text-white p-2 rounded hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-primary-blue disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-fade-in">
            <h3 className="text-xl font-semibold text-primary-blue mb-4">Step 3: Your Interests</h3>
            <input
              type="text"
              name="interests"
              value={formData.interests}
              onChange={handleChange}
              placeholder="e.g., coding, music, sports"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-blue"
              required
            />
            <div className="flex gap-4 mt-4">
              <button
                onClick={prevStep}
                className="bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400 transition-colors focus:ring-2 focus:ring-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.interests}
                className="bg-primary-blue text-white p-2 rounded hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-primary-blue disabled:opacity-50"
              >
                Finish
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-primary-blue">Welcome to LyftOff!</h2>
      <div className="flex justify-center mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-3 h-3 rounded-full mx-1 ${s <= step ? 'bg-primary-blue' : 'bg-light-gray'}`}
          />
        ))}
      </div>
      <p className="text-center mb-6 text-gray-700">Step {step} of 3</p>
      {message && <p className="mb-4 text-center text-primary-yellow">{message}</p>}
      {renderStep()}
    </div>
  );
}

export default Onboarding;