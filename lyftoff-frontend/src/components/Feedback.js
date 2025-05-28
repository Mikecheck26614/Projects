import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Feedback() {
  const [formData, setFormData] = useState({ message: '', rating: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:3000/api/feedback',
        { message: formData.message, rating: formData.rating ? parseInt(formData.rating) : undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Feedback submitted successfully!');
      setFormData({ message: '', rating: '' });
      setError(null);
    } catch (err) {
      console.error('Feedback error:', err.message);
      setError('Failed to submit feedback.');
      axios.post('http://localhost:3000/api/logs', {
        error: err.message,
        stack: err.stack,
        url: '/feedback',
        timestamp: new Date().toISOString()
      });
    }
  };

  if (!token) {
    return (
      <div className="text-center mt-10">
        Please <Link to="/login" className="text-primary-blue">log in</Link> to submit feedback!
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg animate-slide-in">
      <h2 className="text-2xl font-bold mb-4 text-primary-blue dark:text-white">Submit Feedback</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="message" className="block text-gray-700 dark:text-gray-200">Your Feedback</label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-blue dark:bg-gray-700 dark:text-white"
            required
            rows="5"
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="rating" className="block text-gray-700 dark:text-gray-200">Rating (1-5)</label>
          <input
            id="rating"
            type="number"
            min="1"
            max="5"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-blue dark:bg-gray-700 dark:text-white"
            aria-describedby="rating-desc"
          />
          <p id="rating-desc" className="text-sm text-gray-500 dark:text-gray-400">Optional: Rate your experience.</p>
        </div>
        <button
          type="submit"
          className="bg-primary-blue text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          aria-label="Submit feedback"
        >
          Submit
        </button>
      </form>
      <Link to="/dashboard" className="mt-4 inline-block text-primary-blue dark:text-blue-400 hover:underline">
        Back to Dashboard
      </Link>
    </div>
  );
}

export default Feedback;