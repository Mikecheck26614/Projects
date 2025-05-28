import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [data, setData] = useState({ welcome: '', roadmaps: [], score: 0, achievements: [], completion: 0 });
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const profileRes = await axios.get('http://localhost:3000/api/profile', config);
        setDarkMode(profileRes.data.darkMode || false);
        const response = await axios.get('http://localhost:3000/api/dashboard', config);
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Dashboard fetch error:', err.message);
        setError('Failed to load dashboard.');
        axios.post('http://localhost:3000/api/logs', {
          error: err.message,
          stack: err.stack,
          url: '/dashboard',
          timestamp: new Date().toISOString()
        });
      }
    };
    if (token) fetchData();
  }, [token]);

  const toggleDarkMode = async () => {
    try {
      const newDarkMode = !darkMode;
      await axios.post(
        'http://localhost:3000/api/profile',
        { darkMode: newDarkMode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDarkMode(newDarkMode);
      document.documentElement.classList.toggle('dark', newDarkMode);
    } catch (err) {
      console.error('Dark mode toggle error:', err.message);
      setError('Failed to toggle dark mode.');
      axios.post('http://localhost:3000/api/logs', {
        error: err.message,
        stack: err.stack,
        url: '/dashboard',
        timestamp: new Date().toISOString()
      });
    }
  };

  if (!token) {
    return (
      <div className="text-center mt-10">
        Please <Link to="/login" className="text-primary-blue">log in</Link> to view your dashboard!
      </div>
    );
  }

  return (
    <div
      className={`max-w-6xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg animate-slide-in ${darkMode ? 'dark:bg-gray-800 dark:text-white' : ''}`}
      role="region"
      aria-label="User dashboard"
    >
      <h2 className="text-2xl font-bold mb-4 text-primary-blue dark:text-white">{data.welcome}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <button
        onClick={toggleDarkMode}
        className="mb-4 bg-primary-yellow text-primary-blue px-4 py-2 rounded hover:bg-yellow-600"
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section aria-labelledby="roadmaps-heading">
          <h3 id="roadmaps-heading" className="text-xl font-semibold mb-2">Recent Roadmaps</h3>
          <ul className="space-y-2">
            {data.roadmaps.map((roadmap) => (
              <li key={roadmap.id} className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
                <Link to={`/roadmap/${roadmap.id}`} className="text-primary-blue dark:text-blue-400 hover:underline">
                  {roadmap.title}
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-300">Status: {roadmap.status}</p>
              </li>
            ))}
          </ul>
          <Link to="/roadmap" className="mt-2 inline-block text-primary-blue dark:text-blue-400 hover:underline">
            View All Roadmaps
          </Link>
        </section>
        <section aria-labelledby="stats-heading">
          <h3 id="stats-heading" className="text-xl font-semibold mb-2">Stats</h3>
          <p>Progress Score: {data.score}/100</p>
          <p>Profile Completion: {Math.round(data.completion)}%</p>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
              <div
                className="bg-primary-blue h-2.5 rounded-full"
                style={{ width: `${data.completion}%` }}
              ></div>
            </div>
          </div>
        </section>
        <section aria-labelledby="achievements-heading">
          <h3 id="achievements-heading" className="text-xl font-semibold mb-2">Achievements</h3>
          <ul className="space-y-2">
            {data.achievements.map((achievement, i) => (
              <li key={i} className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded">
                {achievement.name}: {achievement.description}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="mt-6">
        <Link
          to="/profile"
          className="bg-primary-blue text-white px-4 py-2 rounded hover:bg-blue-700"
          aria-label="View profile"
        >
          Update Profile
        </Link>
        <Link
          to="/report"
          className="ml-4 bg-primary-yellow text-primary-blue px-4 py-2 rounded hover:bg-yellow-600"
          aria-label="View progress report"
        >
          View Report
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;